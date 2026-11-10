-- Phase 2, Step 2 (K-01): students sign in with a one-time code. No names, no passwords.
-- Run once in the Supabase SQL Editor, after 001_init.sql.
-- ALSO REQUIRED: Authentication → Sign In / Providers → turn on "Allow anonymous sign-ins".
--
-- How it works:
--   1. A counsellor creates a code for one student (access_codes). It lasts 14 days and works once.
--   2. The student's browser signs in ANONYMOUSLY (a Supabase user with no email or name).
--   3. redeem_access_code(code) checks the code and links that anonymous user to the student
--      (student_accounts). Later tables (messages, journal...) use this link for their privacy rules.
-- Students can never read access_codes, students, follow-ups or anything counsellor-only.

create table public.access_codes (
  code text primary key check (code ~ '^[A-HJ-KM-NP-Z2-9]{2}-[A-HJ-KM-NP-Z2-9]{4}$'),
  student_id text not null references public.students (student_id) on delete cascade,
  created_by uuid null references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_at timestamptz null,
  used_by uuid null references auth.users (id) on delete set null,
  revoked_at timestamptz null
);
create index access_codes_student_idx on public.access_codes (student_id, created_at);

-- Which anonymous sign-in belongs to which student. One student can have several over time
-- (each new code = a new sign-in, e.g. after "Leave" on a shared computer); data stays with the student.
create table public.student_accounts (
  auth_uid uuid primary key references auth.users (id) on delete cascade,
  student_id text not null references public.students (student_id) on delete cascade,
  linked_at timestamptz not null default now()
);
create index student_accounts_student_idx on public.student_accounts (student_id);

-- Failed code attempts, to slow down anyone guessing codes (31^6 ≈ 887 million possibilities).
create table public.code_attempts (
  id bigint generated always as identity primary key,
  auth_uid uuid not null,
  attempted_at timestamptz not null default now()
);
create index code_attempts_uid_idx on public.code_attempts (auth_uid, attempted_at);

alter table public.access_codes enable row level security;
alter table public.student_accounts enable row level security;
alter table public.code_attempts enable row level security; -- no policies: only the function below writes here
revoke all on public.access_codes, public.student_accounts, public.code_attempts from anon;

-- Counsellors manage codes for the students they can see (same rule as follow-ups).
create policy "counsellors read codes" on public.access_codes
  for select to authenticated using (public.can_see_student(student_id));
create policy "counsellors create codes" on public.access_codes
  for insert to authenticated
  with check (public.can_see_student(student_id) and created_by = (select auth.uid()) and used_at is null and revoked_at is null);
create policy "counsellors revoke codes" on public.access_codes
  for update to authenticated using (public.can_see_student(student_id)) with check (public.can_see_student(student_id));
revoke delete on public.access_codes from authenticated;

-- A student can see only their own link (to know they're signed in). Nobody inserts directly.
create policy "student reads own link" on public.student_accounts
  for select to authenticated using (auth_uid = (select auth.uid()));

/** The student id of the signed-in student, or null. Used by later privacy rules. */
create function public.current_student_id()
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

/**
 * Redeems a code for the signed-in ANONYMOUS user.
 * Returns 'ok', or a reason: 'invalid_code' (deliberately vague, so nobody can probe which codes
 * exist), 'too_many_attempts' or 'not_anonymous'.
 * It RETURNS a reason instead of raising an error on purpose: an error would roll back the whole
 * call, including the record of the failed attempt, and the guessing limit would never count.
 * SECURITY DEFINER because students may not read access_codes; every check is done here.
 */
create function public.redeem_access_code(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code public.access_codes;
begin
  -- Only an anonymous sign-in may redeem: never a counsellor's or supervisor's account.
  if v_uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is not true then
    return 'not_anonymous';
  end if;

  -- Slow down guessing: at most 10 failed tries per sign-in per hour.
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
