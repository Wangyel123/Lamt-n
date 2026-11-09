-- SA Wellbeing Counsellor Board: initial schema, privacy rules (RLS) and follow-up audit log.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
--
-- Privacy model:
--   * Counsellors can read students and follow-ups ONLY for their school (school = null means
--     all schools; demo account only).
--   * Supervisors have NO access to student rows at all. They see counts only, computed on the
--     server with the secret key and suppressed before reaching the browser.
--   * Not logged in (anon) = no access to anything.
--   * Flags are NOT stored: they are computed in TypeScript (lib/flags.ts), so a rule change
--     takes effect immediately.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('counsellor', 'supervisor')),
  school text null -- counsellors only; null = all schools (demo only)
);

create table public.students (
  student_id text primary key,
  school text not null,
  class text not null,
  q1_sleep_well smallint null check (q1_sleep_well between 1 and 4),
  q2_safe_at_home smallint null check (q2_safe_at_home between 1 and 4),
  q3_bullied text null check (q3_bullied in ('Never', 'Sometimes', 'Often')),
  q4_trusted_adult text null check (q4_trusted_adult in ('Yes', 'No')),
  q5_sad_most_days text null check (q5_sad_most_days in ('Yes', 'No')),
  q6_thoughts_of_self_harm text null check (q6_thoughts_of_self_harm in ('Yes', 'No', 'Prefer not to say')),
  q7_wants_counsellor text null check (q7_wants_counsellor in ('Yes', 'No')),
  comment text not null default '', -- free text: counsellors only
  data_issues text[] not null default '{}', -- e.g. "Missing answer: sleep" (null answers stay null)
  fixes text[] not null default '{}', -- automatic spelling/case fixes, for transparency
  data_check jsonb not null default '{}', -- structured version of the above, for the Data check panel
  imported_at timestamptz not null default now()
);

create table public.follow_ups (
  student_id text primary key references public.students (student_id) on delete cascade,
  status text not null check (status in ('not_started', 'in_progress', 'closed')),
  note text not null default '', -- the counsellor's private note
  updated_by uuid null references auth.users (id),
  updated_at timestamptz not null default now()
);

-- Append-only audit log: "track every follow-up" is a CECD goal.
create table public.follow_up_events (
  id bigint generated always as identity primary key,
  student_id text not null references public.students (student_id) on delete cascade,
  old_status text null, -- null = follow-up was just created
  new_status text not null check (new_status in ('not_started', 'in_progress', 'closed')),
  note text not null default '',
  changed_by uuid null references auth.users (id),
  changed_at timestamptz not null default now()
);

create index follow_up_events_student_idx on public.follow_up_events (student_id, changed_at);

-- ---------------------------------------------------------------------------
-- Helper functions for RLS.
-- SECURITY DEFINER so policies can read profiles without recursive RLS checks.
-- search_path is pinned to '' so nobody can hijack them with look-alike objects.
-- ---------------------------------------------------------------------------

create function public.can_see_school(p_school text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'counsellor'
      and (p.school is null or p.school = p_school)
  );
$$;

create function public.can_see_student(p_student_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.students s
    where s.student_id = p_student_id
      and public.can_see_school(s.school)
  );
$$;

revoke all on function public.can_see_school(text) from public, anon;
revoke all on function public.can_see_student(text) from public, anon;
grant execute on function public.can_see_school(text) to authenticated;
grant execute on function public.can_see_student(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security: ON for every table. No policy = no access.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.follow_ups enable row level security;
alter table public.follow_up_events enable row level security;

-- Not logged in: nothing at all (belt and braces on top of RLS).
revoke all on public.profiles, public.students, public.follow_ups, public.follow_up_events from anon;

-- Everyone can read their own profile (to know their role). Nobody can change roles from the app.
create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- Students: counsellors read their school's students. Supervisors match no policy → no rows.
-- Nobody writes students from the app; the seed script uses the secret key.
create policy "counsellors read their school's students" on public.students
  for select to authenticated
  using (public.can_see_school(school));

-- Follow-ups: counsellors read and write only for students they can see.
create policy "counsellors read follow-ups" on public.follow_ups
  for select to authenticated
  using (public.can_see_student(student_id));

create policy "counsellors create follow-ups" on public.follow_ups
  for insert to authenticated
  with check (public.can_see_student(student_id) and updated_by = (select auth.uid()));

create policy "counsellors update follow-ups" on public.follow_ups
  for update to authenticated
  using (public.can_see_student(student_id))
  with check (public.can_see_student(student_id) and updated_by = (select auth.uid()));

-- Audit log: read and append only. No update/delete policy, and the privileges are revoked too.
create policy "counsellors read follow-up history" on public.follow_up_events
  for select to authenticated
  using (public.can_see_student(student_id));

create policy "counsellors append follow-up history" on public.follow_up_events
  for insert to authenticated
  with check (public.can_see_student(student_id) and changed_by = (select auth.uid()));

revoke update, delete on public.follow_up_events from authenticated;
revoke delete on public.follow_ups from authenticated;

-- ---------------------------------------------------------------------------
-- save_follow_up: saves a follow-up AND logs the status change in one transaction,
-- so the audit log can't be skipped or get out of step.
-- SECURITY INVOKER: runs as the logged-in user, so all the RLS policies above still apply.
-- ---------------------------------------------------------------------------

create function public.save_follow_up(
  p_student_id text,
  p_status text,
  p_note text,
  p_event_note text default ''
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_old_status text;
begin
  select f.status into v_old_status from public.follow_ups f where f.student_id = p_student_id;

  insert into public.follow_ups (student_id, status, note, updated_by, updated_at)
  values (p_student_id, p_status, coalesce(p_note, ''), auth.uid(), now())
  on conflict (student_id) do update
    set status = excluded.status,
        note = excluded.note,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at;

  -- Only status changes go in the history (note edits just update the follow-up).
  if v_old_status is distinct from p_status then
    insert into public.follow_up_events (student_id, old_status, new_status, note, changed_by)
    values (p_student_id, v_old_status, p_status, coalesce(p_event_note, ''), auth.uid());
  end if;
end;
$$;

revoke all on function public.save_follow_up(text, text, text, text) from public, anon;
grant execute on function public.save_follow_up(text, text, text, text) to authenticated;
