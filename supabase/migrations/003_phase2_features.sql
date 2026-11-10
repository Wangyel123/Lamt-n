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
