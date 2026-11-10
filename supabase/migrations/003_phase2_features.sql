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
