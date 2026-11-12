-- 004: a student's code becomes their key for the school year, protected by a PIN they choose.
--
-- Before: a code worked ONCE. After "Leave" or 10 idle minutes the student needed a NEW code from
-- the counsellor every time. Now:
--   * First time: code + a 4-digit PIN the student chooses. The code must be unused and within 14 days.
--   * After that: the same code + the same PIN, any time, for 365 days. No counsellor needed.
--   * Forgot the PIN, lost the slip, or a lost phone: the counsellor makes a new code. That revokes the
--     old one AND signs out every device that used it (trigger below).
-- Guessing: a PIN is only tried against a code someone already has (887 million codes). After 5 wrong
-- PINs the code waits 15 minutes; after 10 it is locked until the counsellor makes a new one.
-- PINs are stored only as bcrypt hashes, in a table nobody can read (only sign_in_with_code touches it).
--
-- Safe to run more than once. Run it in the Supabase SQL Editor after 001, 002 and 003.

create extension if not exists pgcrypto with schema extensions;

-- What the counsellor may see about a key (never the PIN).
alter table public.access_codes
  add column if not exists pin_set_at timestamptz null,
  add column if not exists key_expires_at timestamptz null,
  add column if not exists locked_at timestamptz null;

-- Which code each signed-in device used, so revoking a code can sign those devices out.
alter table public.student_accounts
  add column if not exists via_code text null references public.access_codes (code) on delete cascade;
create index if not exists student_accounts_via_code_idx on public.student_accounts (via_code);

-- The PIN hashes. RLS on with NO policies, and no grants: only the function below reads or writes it.
create table if not exists public.code_pins (
  code text primary key references public.access_codes (code) on delete cascade,
  pin_hash text not null,
  failures int not null default 0,
  retry_after timestamptz null
);
alter table public.code_pins enable row level security;
revoke all on public.code_pins from anon, authenticated;

-- The old one-time sign-in is replaced: no way in without a PIN any more.
drop function if exists public.redeem_access_code(text);

/**
 * Student sign-in with code + PIN. Returns a status word, never data:
 *   ok_new (PIN just set) · ok · bad_pin (not 4 digits) · weak_pin (e.g. 1234, 1111)
 *   invalid_code (unknown, used without a PIN, expired, revoked, OR wrong PIN: one answer, no probing)
 *   try_later (5 wrong PINs: wait 15 minutes) · locked (10 wrong PINs) · too_many_attempts · not_anonymous
 */
create or replace function public.sign_in_with_code(p_code text, p_pin text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code public.access_codes;
  v_pin public.code_pins;
begin
  -- Only an anonymous sign-in may use a student code: never a counsellor's or supervisor's account.
  if v_uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is not true then
    return 'not_anonymous';
  end if;

  -- Slow down guessing codes: at most 10 failed tries per sign-in per hour.
  if (select count(*) from public.code_attempts a where a.auth_uid = v_uid and a.attempted_at > now() - interval '1 hour') >= 10 then
    return 'too_many_attempts';
  end if;

  if p_pin is null or p_pin !~ '^[0-9]{4}$' then
    return 'bad_pin';
  end if;

  select * into v_code from public.access_codes c where c.code = upper(trim(p_code)) for update;
  if v_code.code is null or v_code.revoked_at is not null then
    insert into public.code_attempts (auth_uid) values (v_uid);
    return 'invalid_code';
  end if;

  select * into v_pin from public.code_pins p where p.code = v_code.code for update;

  -- First time: the code must be fresh. The student's PIN becomes the key's second half.
  if v_pin.code is null then
    if v_code.used_at is not null or v_code.expires_at <= now() then
      insert into public.code_attempts (auth_uid) values (v_uid);
      return 'invalid_code';
    end if;
    if p_pin ~ '^(\d)\1{3}$' or p_pin = any (array['0123','1234','2345','3456','4567','5678','6789','3210','4321','5432','6543','7654','8765','9876']) then
      return 'weak_pin';
    end if;
    insert into public.code_pins (code, pin_hash) values (v_code.code, extensions.crypt(p_pin, extensions.gen_salt('bf', 8)));
    update public.access_codes
      set used_at = now(), used_by = v_uid, pin_set_at = now(), key_expires_at = now() + interval '365 days'
      where code = v_code.code;
    insert into public.student_accounts (auth_uid, student_id, via_code) values (v_uid, v_code.student_id, v_code.code)
      on conflict (auth_uid) do update set student_id = excluded.student_id, via_code = excluded.via_code, linked_at = now();
    return 'ok_new';
  end if;

  -- Returning: same code + same PIN.
  if v_code.key_expires_at is not null and v_code.key_expires_at <= now() then
    insert into public.code_attempts (auth_uid) values (v_uid);
    return 'invalid_code';
  end if;
  if v_code.locked_at is not null then
    return 'locked';
  end if;
  if v_pin.retry_after is not null and v_pin.retry_after > now() then
    return 'try_later';
  end if;

  if v_pin.pin_hash = extensions.crypt(p_pin, v_pin.pin_hash) then
    update public.code_pins set failures = 0, retry_after = null where code = v_code.code;
    insert into public.student_accounts (auth_uid, student_id, via_code) values (v_uid, v_code.student_id, v_code.code)
      on conflict (auth_uid) do update set student_id = excluded.student_id, via_code = excluded.via_code, linked_at = now();
    return 'ok';
  end if;

  -- Wrong PIN.
  update public.code_pins
    set failures = failures + 1,
        retry_after = case when failures + 1 = 5 then now() + interval '15 minutes' else retry_after end
    where code = v_code.code;
  if v_pin.failures + 1 >= 10 then
    update public.access_codes set locked_at = now() where code = v_code.code;
  end if;
  insert into public.code_attempts (auth_uid) values (v_uid);
  return 'invalid_code';
end;
$$;
revoke all on function public.sign_in_with_code(text, text) from public, anon;
grant execute on function public.sign_in_with_code(text, text) to authenticated;

-- Revoking a code signs out every device that used it (a lost phone, a shared slip).
create or replace function public.sign_out_revoked_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.revoked_at is not null and old.revoked_at is null then
    delete from public.student_accounts where via_code = new.code;
  end if;
  return new;
end;
$$;
revoke all on function public.sign_out_revoked_code() from public, anon, authenticated;

drop trigger if exists access_codes_sign_out_on_revoke on public.access_codes;
create trigger access_codes_sign_out_on_revoke
  after update of revoked_at on public.access_codes
  for each row execute function public.sign_out_revoked_code();
