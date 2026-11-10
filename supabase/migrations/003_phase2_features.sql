-- Phase 2 (Kooth- and Panorama-inspired features). Run once in the Supabase SQL Editor,
-- AFTER 001_init.sql and 002_student_access.sql.
--
-- Privacy model (same as before, extended):
--   * Counsellors: rows for students in their school (can_see_student), EXCEPT private journal entries.
--   * Students (anonymous sign-in linked by a code): ONLY their own rows (current_student_id()).
--   * Supervisors: NO row access to any of these tables. They see suppressed counts via the server.
--   * Not logged in: nothing.

-- ===========================================================================
-- P-01: interventions (what a counsellor did). Counsellors only.
-- ===========================================================================
create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students (student_id) on delete cascade,
  type text not null check (type in ('check_in_meeting', 'group_session', 'parent_contact', 'referral_external', 'classroom_support', 'other')),
  notes text not null default '',
  outcome text not null default 'n/a' check (outcome in ('improved', 'no_change', 'concern_increased', 'n/a')),
  follow_up_date date null,
  created_by uuid null references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index interventions_student_idx on public.interventions (student_id, created_at);

alter table public.interventions enable row level security;
revoke all on public.interventions from anon;
create policy "counsellors read interventions" on public.interventions
  for select to authenticated using (public.can_see_student(student_id));
create policy "counsellors log interventions" on public.interventions
  for insert to authenticated with check (public.can_see_student(student_id) and created_by = (select auth.uid()));
create policy "counsellors edit interventions" on public.interventions
  for update to authenticated using (public.can_see_student(student_id)) with check (public.can_see_student(student_id));
revoke delete on public.interventions from authenticated; -- a record of support is never deleted from the app

-- ===========================================================================
-- P-02: "Needs reading" items a counsellor has marked as read (who + when). Counsellors only.
-- source_id says which text: 'survey:S-023', 'message:<uuid>', 'checkin:<uuid>', 'journal:<uuid>', 'post:<uuid>'.
-- ===========================================================================
create table public.text_reviews (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students (student_id) on delete cascade,
  source_id text not null unique,
  reviewed_by uuid null references auth.users (id) default auth.uid(),
  reviewed_at timestamptz not null default now()
);
create index text_reviews_student_idx on public.text_reviews (student_id);

alter table public.text_reviews enable row level security;
revoke all on public.text_reviews from anon;
create policy "counsellors read reviews" on public.text_reviews
  for select to authenticated using (public.can_see_student(student_id));
create policy "counsellors mark as read" on public.text_reviews
  for insert to authenticated with check (public.can_see_student(student_id) and reviewed_by = (select auth.uid()));
revoke update, delete on public.text_reviews from authenticated;

-- ===========================================================================
-- K-02: messages between a student and a HUMAN counsellor (one conversation per student).
-- ===========================================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students (student_id) on delete cascade,
  sender_role text not null check (sender_role in ('student', 'counsellor')),
  body text not null check (char_length(body) between 1 and 1000),
  sent_by uuid null references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  read_at timestamptz null
);
create index messages_student_idx on public.messages (student_id, created_at);

alter table public.messages enable row level security;
revoke all on public.messages from anon;

-- Students: their own conversation only, writing as "student", at most 30 messages an hour.
create policy "students read own messages" on public.messages
  for select to authenticated using (student_id = public.current_student_id());
create policy "students send messages" on public.messages
  for insert to authenticated
  with check (
    student_id = public.current_student_id()
    and sender_role = 'student'
    and (select count(*) from public.messages m
         where m.student_id = public.current_student_id() and m.sender_role = 'student'
           and m.created_at > now() - interval '1 hour') < 30
  );

-- Counsellors: their school's students, writing as "counsellor".
create policy "counsellors read messages" on public.messages
  for select to authenticated using (public.can_see_student(student_id));
create policy "counsellors reply" on public.messages
  for insert to authenticated with check (public.can_see_student(student_id) and sender_role = 'counsellor');
create policy "counsellors mark read" on public.messages
  for update to authenticated using (public.can_see_student(student_id)) with check (public.can_see_student(student_id));

-- Nobody can edit the words of a message or delete it; a counsellor can only mark it read.
revoke update, delete on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- ===========================================================================
-- P-04: check-ins (2–3 short questions sent to a school or class) and students' answers.
-- ===========================================================================
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  school text not null,
  class text null, -- null = the whole school
  questions text[] not null check (questions <@ array['feeling', 'worry', 'comment'] and cardinality(questions) between 1 and 3),
  created_by uuid null references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.checkin_responses (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins (id) on delete cascade,
  student_id text not null references public.students (student_id) on delete cascade,
  feeling smallint null check (feeling between 1 and 4),
  worry text null check (worry in ('Yes', 'No', 'Prefer not to say')),
  comment text not null default '' check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique (checkin_id, student_id) -- one answer per student per check-in
);
create index checkin_responses_student_idx on public.checkin_responses (student_id, created_at);

/** Is this check-in for the signed-in student's own school/class? (students can't read the students table) */
create function public.checkin_is_for_me(p_school text, p_class text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.students s
    where s.student_id = public.current_student_id()
      and s.school = p_school and (p_class is null or s.class = p_class)
  );
$$;
revoke all on function public.checkin_is_for_me(text, text) from public, anon;
grant execute on function public.checkin_is_for_me(text, text) to authenticated;

alter table public.checkins enable row level security;
alter table public.checkin_responses enable row level security;
revoke all on public.checkins, public.checkin_responses from anon;

create policy "counsellors read check-ins" on public.checkins for select to authenticated using (public.can_see_school(school));
create policy "counsellors send check-ins" on public.checkins
  for insert to authenticated with check (public.can_see_school(school) and created_by = (select auth.uid()));
create policy "students see their check-ins" on public.checkins for select to authenticated using (public.checkin_is_for_me(school, class));

create policy "counsellors read answers" on public.checkin_responses for select to authenticated using (public.can_see_student(student_id));
create policy "students read own answers" on public.checkin_responses for select to authenticated using (student_id = public.current_student_id());
create policy "students answer their check-ins" on public.checkin_responses
  for insert to authenticated
  with check (
    student_id = public.current_student_id()
    and exists (select 1 from public.checkins c where c.id = checkin_id and public.checkin_is_for_me(c.school, c.class))
  );
revoke update, delete on public.checkins, public.checkin_responses from authenticated;

-- ===========================================================================
-- K-04: private journal and goals. PRIVATE BY DEFAULT.
-- A counsellor can read a journal entry ONLY if the student shared it. Goals are the student's alone.
-- ===========================================================================
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students (student_id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  mood smallint null check (mood between 1 and 4),
  shared boolean not null default false,
  created_at timestamptz not null default now()
);
create index journal_student_idx on public.journal_entries (student_id, created_at);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students (student_id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;
alter table public.goals enable row level security;
revoke all on public.journal_entries, public.goals from anon;

create policy "students read own journal" on public.journal_entries for select to authenticated using (student_id = public.current_student_id());
create policy "students write own journal" on public.journal_entries for insert to authenticated with check (student_id = public.current_student_id());
create policy "students share or unshare" on public.journal_entries
  for update to authenticated using (student_id = public.current_student_id()) with check (student_id = public.current_student_id());
-- The privacy promise, enforced by the database: shared entries only.
create policy "counsellors read SHARED entries only" on public.journal_entries
  for select to authenticated using (shared and public.can_see_student(student_id));
revoke update, delete on public.journal_entries from authenticated;
grant update (shared) on public.journal_entries to authenticated; -- the only thing that can change: share / unshare

create policy "students manage own goals" on public.goals
  for all to authenticated using (student_id = public.current_student_id()) with check (student_id = public.current_student_id());
revoke update on public.goals from authenticated;
grant update (done) on public.goals to authenticated;
