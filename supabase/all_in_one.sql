-- Lamtön: the WHOLE database in one script (001 + 002 + 003).
-- Safe to run more than once: it skips anything that already exists, so it works on a
-- brand-new Supabase project AND on one where 001 was already run. It never deletes data.
-- Supabase: SQL Editor -> New query -> paste everything -> Run.
-- Also: Authentication -> Sign In / Providers -> turn on "Allow anonymous sign-ins".
-- Then run `npm run seed` once to load the synthetic students and demo accounts.

-- ===================== 001_init.sql =====================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('counsellor', 'supervisor')),
  school text null
);

create table if not exists public.students (
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
  comment text not null default '',
  data_issues text[] not null default '{}',
  fixes text[] not null default '{}',
  data_check jsonb not null default '{}',
  imported_at timestamptz not null default now()
);

create table if not exists public.follow_ups (
  student_id text primary key references public.students (student_id) on delete cascade,
  status text not null check (status in ('not_started', 'in_progress', 'closed')),
  note text not null default '',
  updated_by uuid null references auth.users (id),
  updated_at timestamptz not null default now()
);

create table if not exists public.follow_up_events (
  id bigint generated always as identity primary key,
  student_id text not null references public.students (student_id) on delete cascade,
  old_status text null,
  new_status text not null check (new_status in ('not_started', 'in_progress', 'closed')),
  note text not null default '',
  changed_by uuid null references auth.users (id),
  changed_at timestamptz not null default now()
);

create index if not exists follow_up_events_student_idx on public.follow_up_events (student_id, changed_at);

create or replace function public.can_see_school(p_school text)
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

create or replace function public.can_see_student(p_student_id text)
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

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.follow_ups enable row level security;
alter table public.follow_up_events enable row level security;

revoke all on public.profiles, public.students, public.follow_ups, public.follow_up_events from anon;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "counsellors read their school's students" on public.students;
create policy "counsellors read their school's students" on public.students
  for select to authenticated
  using (public.can_see_school(school));

drop policy if exists "counsellors read follow-ups" on public.follow_ups;
create policy "counsellors read follow-ups" on public.follow_ups
  for select to authenticated
  using (public.can_see_student(student_id));

drop policy if exists "counsellors create follow-ups" on public.follow_ups;
create policy "counsellors create follow-ups" on public.follow_ups
  for insert to authenticated
  with check (public.can_see_student(student_id) and updated_by = (select auth.uid()));

drop policy if exists "counsellors update follow-ups" on public.follow_ups;
create policy "counsellors update follow-ups" on public.follow_ups
  for update to authenticated
  using (public.can_see_student(student_id))
  with check (public.can_see_student(student_id) and updated_by = (select auth.uid()));

drop policy if exists "counsellors read follow-up history" on public.follow_up_events;
create policy "counsellors read follow-up history" on public.follow_up_events
  for select to authenticated
  using (public.can_see_student(student_id));

drop policy if exists "counsellors append follow-up history" on public.follow_up_events;
create policy "counsellors append follow-up history" on public.follow_up_events
  for insert to authenticated
  with check (public.can_see_student(student_id) and changed_by = (select auth.uid()));

revoke update, delete on public.follow_up_events from authenticated;
revoke delete on public.follow_ups from authenticated;

create or replace function public.save_follow_up(
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

  if v_old_status is distinct from p_status then
    insert into public.follow_up_events (student_id, old_status, new_status, note, changed_by)
    values (p_student_id, v_old_status, p_status, coalesce(p_event_note, ''), auth.uid());
  end if;
end;
$$;

revoke all on function public.save_follow_up(text, text, text, text) from public, anon;
grant execute on function public.save_follow_up(text, text, text, text) to authenticated;

-- ===================== 002_student_access.sql =====================

create table if not exists public.access_codes (
  code text primary key check (code ~ '^[A-HJ-KM-NP-Z2-9]{2}-[A-HJ-KM-NP-Z2-9]{4}$'),
  student_id text not null references public.students (student_id) on delete cascade,
  created_by uuid null references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_at timestamptz null,
  used_by uuid null references auth.users (id) on delete set null,
  revoked_at timestamptz null
);
create index if not exists access_codes_student_idx on public.access_codes (student_id, created_at);

create table if not exists public.student_accounts (
  auth_uid uuid primary key references auth.users (id) on delete cascade,
  student_id text not null references public.students (student_id) on delete cascade,
  linked_at timestamptz not null default now()
);
create index if not exists student_accounts_student_idx on public.student_accounts (student_id);

create table if not exists public.code_attempts (
  id bigint generated always as identity primary key,
  auth_uid uuid not null,
  attempted_at timestamptz not null default now()
);
create index if not exists code_attempts_uid_idx on public.code_attempts (auth_uid, attempted_at);

alter table public.access_codes enable row level security;
alter table public.student_accounts enable row level security;
alter table public.code_attempts enable row level security;
revoke all on public.access_codes, public.student_accounts, public.code_attempts from anon;

drop policy if exists "counsellors read codes" on public.access_codes;
create policy "counsellors read codes" on public.access_codes
  for select to authenticated using (public.can_see_student(student_id));
drop policy if exists "counsellors create codes" on public.access_codes;
create policy "counsellors create codes" on public.access_codes
  for insert to authenticated
  with check (public.can_see_student(student_id) and created_by = (select auth.uid()) and used_at is null and revoked_at is null);
drop policy if exists "counsellors revoke codes" on public.access_codes;
create policy "counsellors revoke codes" on public.access_codes
  for update to authenticated using (public.can_see_student(student_id)) with check (public.can_see_student(student_id));
revoke delete on public.access_codes from authenticated;

drop policy if exists "student reads own link" on public.student_accounts;
create policy "student reads own link" on public.student_accounts
  for select to authenticated using (auth_uid = (select auth.uid()));

create or replace function public.current_student_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select sa.student_id from public.student_accounts sa where sa.auth_uid = auth.uid();
$$;
revoke all on function public.current_student_id() from public, anon;
grant execute on function public.current_student_id() to authenticated;

create or replace function public.redeem_access_code(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code public.access_codes;
begin
  if v_uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is not true then
    return 'not_anonymous';
  end if;

  if (select count(*) from public.code_attempts a where a.auth_uid = v_uid and a.attempted_at > now() - interval '1 hour') >= 10 then
    return 'too_many_attempts';
  end if;

  select * into v_code from public.access_codes c where c.code = upper(trim(p_code)) for update;

  if v_code.code is null or v_code.used_at is not null or v_code.revoked_at is not null or v_code.expires_at <= now() then
    insert into public.code_attempts (auth_uid) values (v_uid);
    return 'invalid_code';
  end if;

  update public.access_codes set used_at = now(), used_by = v_uid where code = v_code.code;
  insert into public.student_accounts (auth_uid, student_id) values (v_uid, v_code.student_id)
    on conflict (auth_uid) do update set student_id = excluded.student_id, linked_at = now();
  return 'ok';
end;
$$;
revoke all on function public.redeem_access_code(text) from public, anon;
grant execute on function public.redeem_access_code(text) to authenticated;

-- ===================== 003_phase2_features.sql =====================

create table if not exists public.interventions (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students (student_id) on delete cascade,
  type text not null check (type in ('check_in_meeting', 'group_session', 'parent_contact', 'referral_external', 'classroom_support', 'other')),
  notes text not null default '',
  outcome text not null default 'n/a' check (outcome in ('improved', 'no_change', 'concern_increased', 'n/a')),
  follow_up_date date null,
  created_by uuid null references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists interventions_student_idx on public.interventions (student_id, created_at);

alter table public.interventions enable row level security;
revoke all on public.interventions from anon;
drop policy if exists "counsellors read interventions" on public.interventions;
create policy "counsellors read interventions" on public.interventions
  for select to authenticated using (public.can_see_student(student_id));
drop policy if exists "counsellors log interventions" on public.interventions;
create policy "counsellors log interventions" on public.interventions
  for insert to authenticated with check (public.can_see_student(student_id) and created_by = (select auth.uid()));
drop policy if exists "counsellors edit interventions" on public.interventions;
create policy "counsellors edit interventions" on public.interventions
  for update to authenticated using (public.can_see_student(student_id)) with check (public.can_see_student(student_id));
revoke delete on public.interventions from authenticated;

create table if not exists public.text_reviews (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students (student_id) on delete cascade,
  source_id text not null unique,
  reviewed_by uuid null references auth.users (id) default auth.uid(),
  reviewed_at timestamptz not null default now()
);
create index if not exists text_reviews_student_idx on public.text_reviews (student_id);

alter table public.text_reviews enable row level security;
revoke all on public.text_reviews from anon;
drop policy if exists "counsellors read reviews" on public.text_reviews;
create policy "counsellors read reviews" on public.text_reviews
  for select to authenticated using (public.can_see_student(student_id));
drop policy if exists "counsellors mark as read" on public.text_reviews;
create policy "counsellors mark as read" on public.text_reviews
  for insert to authenticated with check (public.can_see_student(student_id) and reviewed_by = (select auth.uid()));
revoke update, delete on public.text_reviews from authenticated;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students (student_id) on delete cascade,
  sender_role text not null check (sender_role in ('student', 'counsellor')),
  body text not null check (char_length(body) between 1 and 1000),
  sent_by uuid null references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  read_at timestamptz null
);
create index if not exists messages_student_idx on public.messages (student_id, created_at);

alter table public.messages enable row level security;
revoke all on public.messages from anon;

drop policy if exists "students read own messages" on public.messages;
create policy "students read own messages" on public.messages
  for select to authenticated using (student_id = public.current_student_id());
drop policy if exists "students send messages" on public.messages;
create policy "students send messages" on public.messages
  for insert to authenticated
  with check (
    student_id = public.current_student_id()
    and sender_role = 'student'
    and (select count(*) from public.messages m
         where m.student_id = public.current_student_id() and m.sender_role = 'student'
           and m.created_at > now() - interval '1 hour') < 30
  );

drop policy if exists "counsellors read messages" on public.messages;
create policy "counsellors read messages" on public.messages
  for select to authenticated using (public.can_see_student(student_id));
drop policy if exists "counsellors reply" on public.messages;
create policy "counsellors reply" on public.messages
  for insert to authenticated with check (public.can_see_student(student_id) and sender_role = 'counsellor');
drop policy if exists "counsellors mark read" on public.messages;
create policy "counsellors mark read" on public.messages
  for update to authenticated using (public.can_see_student(student_id)) with check (public.can_see_student(student_id));

revoke update, delete on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  school text not null,
  class text null,
  questions text[] not null check (questions <@ array['feeling', 'worry', 'comment'] and cardinality(questions) between 1 and 3),
  created_by uuid null references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.checkin_responses (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins (id) on delete cascade,
  student_id text not null references public.students (student_id) on delete cascade,
  feeling smallint null check (feeling between 1 and 4),
  worry text null check (worry in ('Yes', 'No', 'Prefer not to say')),
  comment text not null default '' check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique (checkin_id, student_id)
);
create index if not exists checkin_responses_student_idx on public.checkin_responses (student_id, created_at);

create or replace function public.checkin_is_for_me(p_school text, p_class text)
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

drop policy if exists "counsellors read check-ins" on public.checkins;
create policy "counsellors read check-ins" on public.checkins for select to authenticated using (public.can_see_school(school));
drop policy if exists "counsellors send check-ins" on public.checkins;
create policy "counsellors send check-ins" on public.checkins
  for insert to authenticated with check (public.can_see_school(school) and created_by = (select auth.uid()));
drop policy if exists "students see their check-ins" on public.checkins;
create policy "students see their check-ins" on public.checkins for select to authenticated using (public.checkin_is_for_me(school, class));

drop policy if exists "counsellors read answers" on public.checkin_responses;
create policy "counsellors read answers" on public.checkin_responses for select to authenticated using (public.can_see_student(student_id));
drop policy if exists "students read own answers" on public.checkin_responses;
create policy "students read own answers" on public.checkin_responses for select to authenticated using (student_id = public.current_student_id());
drop policy if exists "students answer their check-ins" on public.checkin_responses;
create policy "students answer their check-ins" on public.checkin_responses
  for insert to authenticated
  with check (
    student_id = public.current_student_id()
    and exists (select 1 from public.checkins c where c.id = checkin_id and public.checkin_is_for_me(c.school, c.class))
  );
revoke update, delete on public.checkins, public.checkin_responses from authenticated;

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students (student_id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  mood smallint null check (mood between 1 and 4),
  shared boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists journal_student_idx on public.journal_entries (student_id, created_at);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students (student_id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;
alter table public.goals enable row level security;
revoke all on public.journal_entries, public.goals from anon;

drop policy if exists "students read own journal" on public.journal_entries;
create policy "students read own journal" on public.journal_entries for select to authenticated using (student_id = public.current_student_id());
drop policy if exists "students write own journal" on public.journal_entries;
create policy "students write own journal" on public.journal_entries for insert to authenticated with check (student_id = public.current_student_id());
drop policy if exists "students share or unshare" on public.journal_entries;
create policy "students share or unshare" on public.journal_entries
  for update to authenticated using (student_id = public.current_student_id()) with check (student_id = public.current_student_id());
drop policy if exists "counsellors read SHARED entries only" on public.journal_entries;
create policy "counsellors read SHARED entries only" on public.journal_entries
  for select to authenticated using (shared and public.can_see_student(student_id));
revoke update, delete on public.journal_entries from authenticated;
grant update (shared) on public.journal_entries to authenticated;

drop policy if exists "students manage own goals" on public.goals;
create policy "students manage own goals" on public.goals
  for all to authenticated using (student_id = public.current_student_id()) with check (student_id = public.current_student_id());
revoke update on public.goals from authenticated;
grant update (done) on public.goals to authenticated;

create table if not exists public.board_posts (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students (student_id) on delete cascade,
  topic text not null check (topic in ('Exam stress', 'Friendships', 'Things that help me')),
  body text not null check (char_length(body) between 1 and 500 and body !~* '(https?://|www\.)'),
  alias text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  moderated_by uuid null references auth.users (id),
  moderated_at timestamptz null
);
create index if not exists board_posts_status_idx on public.board_posts (status, created_at);

alter table public.board_posts enable row level security;
revoke all on public.board_posts from anon;

drop policy if exists "students post (always pending)" on public.board_posts;
create policy "students post (always pending)" on public.board_posts
  for insert to authenticated with check (student_id = public.current_student_id() and status = 'pending');
drop policy if exists "students read own posts" on public.board_posts;
create policy "students read own posts" on public.board_posts for select to authenticated using (student_id = public.current_student_id());
drop policy if exists "counsellors read queue" on public.board_posts;
create policy "counsellors read queue" on public.board_posts for select to authenticated using (public.can_see_student(student_id));
drop policy if exists "counsellors moderate" on public.board_posts;
create policy "counsellors moderate" on public.board_posts
  for update to authenticated using (public.can_see_student(student_id)) with check (public.can_see_student(student_id));
revoke update, delete on public.board_posts from authenticated;
grant update (status, moderated_at) on public.board_posts to authenticated;

create or replace function public.approved_board_posts()
returns table (id uuid, topic text, body text, alias text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id, p.topic, p.body, p.alias, p.created_at
  from public.board_posts p
  join public.students author on author.student_id = p.student_id
  join public.students me on me.student_id = public.current_student_id()
  where p.status = 'approved' and author.school = me.school
  order by p.created_at desc;
$$;
revoke all on function public.approved_board_posts() from public, anon;
grant execute on function public.approved_board_posts() to authenticated;
