// K-01: one-time access codes for students. Pure functions, easy to test.
//
// Why codes instead of student accounts: students may be as young as class IV, often share
// school devices, and must never type their name. A counsellor prints a short code on a slip;
// the student types it once and is signed in anonymously.

/**
 * Letters and digits that can't be confused when read off paper: no 0/O, no 1/I/L.
 * 31 characters, so a 6-character code has 31^6 ≈ 887 million possibilities.
 */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6; // shown as XX-XXXX, e.g. GK-7Q4M
export const CODE_LIFETIME_DAYS = 14;
/** Shared-device safety: a signed-in student is signed out after this many idle minutes. */
export const STUDENT_IDLE_MINUTES = 10;

export interface AccessCode {
  code: string; // "GK-7Q4M"
  studentId: string;
  createdAt: string; // ISO timestamps
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
}

export type CodeStatus = "active" | "used" | "expired" | "revoked";

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
  const expires = new Date(now.getTime() + CODE_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
  return { code: generate(), studentId, createdAt: now.toISOString(), expiresAt: expires.toISOString(), usedAt: null, revokedAt: null };
}

/** Revoked beats used beats expired: the most decisive reason wins. */
export function codeStatus(code: AccessCode, now = new Date()): CodeStatus {
  if (code.revokedAt) return "revoked";
  if (code.usedAt) return "used";
  if (new Date(code.expiresAt) <= now) return "expired";
  return "active";
}

// What the STUDENT sees. Deliberately one message for every failure: it doesn't reveal whether a
// code exists (so nobody can probe for valid codes), and the advice is the same either way.
export const REDEEM_MESSAGES = {
  format: "That doesn't look like a code. Codes have 6 letters and numbers, like GK-7Q4M.",
  invalid: "This code doesn't work. It may have been used already or be too old. Please ask your counsellor for a new one.",
  tooMany: "Too many tries. Please wait a while, or ask your counsellor for help.",
  unavailable: "We couldn't sign you in right now. Please try again in a moment.",
} as const;

/** Checks a typed code against the known codes. Used by demo mode; live mode does the same in Postgres. */
export function checkRedeem(input: string, codes: AccessCode[], now = new Date()): { ok: true; code: AccessCode } | { ok: false; message: string } {
  const normalised = normaliseCode(input);
  if (!normalised) return { ok: false, message: REDEEM_MESSAGES.format };
  const found = codes.find((c) => c.code === normalised);
  if (!found || codeStatus(found, now) !== "active") return { ok: false, message: REDEEM_MESSAGES.invalid };
  return { ok: true, code: found };
}
