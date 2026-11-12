// K-01: student codes. Pure functions, easy to test.
//
// Why codes instead of student accounts: students may be as young as class IV, often share
// school devices, and must never type their name. The system never stores a name, so only the
// counsellor knows which child is "S-012": the code carries that link to the child.
//
// A code is the student's key for the school year (migration 004):
//   * first time: code + a 4-digit PIN the student chooses (the code must be unused, within 14 days);
//   * after that: the same code + the same PIN, any time, for 365 days. No counsellor needed;
//   * forgot the PIN or lost the slip: the counsellor makes a new code (the old one stops working
//     and every device that used it is signed out).
// Live mode does all of this in Postgres (sign_in_with_code). signInWithCode below is the same
// logic for demo mode, and the tests pin it down.

/**
 * Letters and digits that can't be confused when read off paper: no 0/O, no 1/I/L.
 * 31 characters, so a 6-character code has 31^6 ≈ 887 million possibilities.
 */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6; // shown as XX-XXXX, e.g. GK-7Q4M
/** Days a new code has to be used for the first time. */
export const CODE_LIFETIME_DAYS = 14;
/** Days a code + PIN keeps working after the first sign-in (one school year). */
export const KEY_LIFETIME_DAYS = 365;
/** Shared-device safety: a signed-in student is signed out after this many idle minutes. */
export const STUDENT_IDLE_MINUTES = 10;
/** "This is my own phone": no idle sign-out for this many days. */
export const OWN_DEVICE_DAYS = 30;
/** After this many wrong PINs in a row the code waits PIN_WAIT_MINUTES… */
export const PIN_WAIT_AFTER = 5;
export const PIN_WAIT_MINUTES = 15;
/** …and after this many it is locked until the counsellor makes a new code. */
export const PIN_LOCK_AFTER = 10;

const DAY = 24 * 60 * 60 * 1000;

export interface AccessCode {
  code: string; // "GK-7Q4M"
  studentId: string;
  createdAt: string; // ISO timestamps
  expiresAt: string; // deadline for the FIRST sign-in
  usedAt: string | null; // first sign-in
  revokedAt: string | null;
  pinSetAt: string | null; // the student chose a PIN (null on codes from before PINs)
  keyExpiresAt: string | null; // code + PIN works until then
  lockedAt: string | null; // too many wrong PINs
}

/**
 * active: printed, not used yet · in_use: the student set a PIN and can come back any time
 * locked: too many wrong PINs · used: an old one-time code (before PINs) · expired · revoked
 */
export type CodeStatus = "active" | "in_use" | "locked" | "used" | "expired" | "revoked";

const format = (raw: string) => `${raw.slice(0, 2)}-${raw.slice(2)}`;

/**
 * A new random code. Uses the platform's secure random numbers and "rejection sampling":
 * bytes 248–255 are thrown away so every character is exactly equally likely (256 isn't a
 * multiple of 31, so plain `byte % 31` would favour some characters).
 */
export function generateCode(randomBytes: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const limit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length; // 248
  let raw = "";
  while (raw.length < CODE_LENGTH) {
    for (const byte of randomBytes(CODE_LENGTH * 2)) {
      if (byte < limit && raw.length < CODE_LENGTH) raw += CODE_ALPHABET[byte % CODE_ALPHABET.length];
    }
  }
  return format(raw);
}

/** Tidies what a student typed ("gk 7q4m" → "GK-7Q4M"). Returns null if it can't be a code. */
export function normaliseCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[\s-]/g, "");
  if (raw.length !== CODE_LENGTH) return null;
  if (![...raw].every((ch) => CODE_ALPHABET.includes(ch))) return null;
  return format(raw);
}

export function newAccessCode(studentId: string, now = new Date(), generate = generateCode): AccessCode {
  const expires = new Date(now.getTime() + CODE_LIFETIME_DAYS * DAY);
  return {
    code: generate(),
    studentId,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    usedAt: null,
    revokedAt: null,
    pinSetAt: null,
    keyExpiresAt: null,
    lockedAt: null,
  };
}

/** Revoked beats everything; then locked; then whether the key (or the fresh code) is still in date. */
export function codeStatus(code: AccessCode, now = new Date()): CodeStatus {
  if (code.revokedAt) return "revoked";
  if (code.lockedAt) return "locked";
  if (code.pinSetAt) return code.keyExpiresAt && new Date(code.keyExpiresAt) <= now ? "expired" : "in_use";
  if (code.usedAt) return "used";
  if (new Date(code.expiresAt) <= now) return "expired";
  return "active";
}

/** Can still get a student in: a fresh code or a key in use. */
export const isWorking = (status: CodeStatus) => status === "active" || status === "in_use";

/** A PIN is exactly 4 digits. */
export const isPinShaped = (pin: string) => /^[0-9]{4}$/.test(pin);

const SEQUENCES = "0123456789 9876543210";
/** Too easy to guess: all one digit (7777) or a run (1234, 4321). Same list as the database. */
export function isWeakPin(pin: string): boolean {
  if (!isPinShaped(pin)) return false;
  return /^(\d)\1{3}$/.test(pin) || SEQUENCES.includes(pin);
}

// What the STUDENT sees. A wrong PIN and a bad code get the SAME message: it doesn't reveal
// whether a code exists (so nobody can probe for valid codes).
export const REDEEM_MESSAGES = {
  format: "That doesn't look like a code. Codes have 6 letters and numbers, like GK-7Q4M.",
  pinFormat: "Your PIN is 4 numbers.",
  weakPin: "Please choose 4 numbers that are harder to guess (not 1234 or 1111).",
  invalid: "That code and PIN don't match. Check both and try again. If it still doesn't work, ask your counsellor for a new code.",
  tryLater: `Too many wrong PINs. Please wait ${PIN_WAIT_MINUTES} minutes, then try again.`,
  locked: "This code is locked after too many wrong PINs. Ask your counsellor for a new code.",
  tooMany: "Too many tries. Please wait a while, or ask your counsellor for help.",
  unavailable: "We couldn't sign you in right now. Please try again in a moment.",
} as const;

/** The database's answer (sign_in_with_code) → what the student reads. null = signed in. */
export function messageFor(result: string): string | null {
  switch (result) {
    case "ok":
    case "ok_new":
      return null;
    case "bad_pin":
      return REDEEM_MESSAGES.pinFormat;
    case "weak_pin":
      return REDEEM_MESSAGES.weakPin;
    case "try_later":
      return REDEEM_MESSAGES.tryLater;
    case "locked":
      return REDEEM_MESSAGES.locked;
    case "too_many_attempts":
      return REDEEM_MESSAGES.tooMany;
    case "invalid_code":
      return REDEEM_MESSAGES.invalid;
    default:
      return REDEEM_MESSAGES.unavailable;
  }
}

/** Demo mode only: the PIN kept beside a code in this browser. Live mode keeps a bcrypt hash in code_pins. */
export interface PinRecord {
  pin: string;
  failures: number;
  retryAfter: string | null;
}

export type SignInResult = "ok" | "ok_new" | "format" | "bad_pin" | "weak_pin" | "invalid_code" | "try_later" | "locked";

/**
 * Demo-mode copy of the database's sign_in_with_code. Pure: returns what to save, saves nothing.
 * `code` and `pin` in the result are the updated records to store (when they changed).
 */
export function signInWithCode(
  input: string,
  pin: string,
  codes: AccessCode[],
  pins: Record<string, PinRecord>,
  now = new Date(),
): { result: SignInResult; studentId?: string; code?: AccessCode; pin?: PinRecord } {
  const normalised = normaliseCode(input);
  if (!normalised) return { result: "format" };
  if (!isPinShaped(pin)) return { result: "bad_pin" };
  const found = codes.find((c) => c.code === normalised);
  if (!found || found.revokedAt) return { result: "invalid_code" };
  const saved = pins[found.code];

  if (!saved) {
    // First time: the code must be fresh.
    if (found.usedAt || new Date(found.expiresAt) <= now) return { result: "invalid_code" };
    if (isWeakPin(pin)) return { result: "weak_pin" };
    const at = now.toISOString();
    return {
      result: "ok_new",
      studentId: found.studentId,
      code: { ...found, usedAt: at, pinSetAt: at, keyExpiresAt: new Date(now.getTime() + KEY_LIFETIME_DAYS * DAY).toISOString() },
      pin: { pin, failures: 0, retryAfter: null },
    };
  }

  if (found.keyExpiresAt && new Date(found.keyExpiresAt) <= now) return { result: "invalid_code" };
  if (found.lockedAt) return { result: "locked" };
  if (saved.retryAfter && new Date(saved.retryAfter) > now) return { result: "try_later" };
  if (saved.pin === pin) return { result: "ok", studentId: found.studentId, pin: { ...saved, failures: 0, retryAfter: null } };

  const failures = saved.failures + 1;
  return {
    result: "invalid_code",
    pin: {
      ...saved,
      failures,
      retryAfter: failures === PIN_WAIT_AFTER ? new Date(now.getTime() + PIN_WAIT_MINUTES * 60 * 1000).toISOString() : saved.retryAfter,
    },
    code: failures >= PIN_LOCK_AFTER ? { ...found, lockedAt: now.toISOString() } : undefined,
  };
}

/** The words on a printed slip (single slip and whole-class sheet use the same lines). */
export const SLIP_LINES = {
  heading: "Your private code",
  firstTime: "First time: type this code and choose any 4 numbers as your PIN. Remember your PIN.",
  nextTime: "Next time: the same code and the same PIN.",
  private: "Keep this slip private. You never need to type your name.",
} as const;
