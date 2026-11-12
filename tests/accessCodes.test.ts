import { describe, expect, it } from "vitest";
import {
  CODE_ALPHABET,
  codeStatus,
  generateCode,
  isWeakPin,
  isWorking,
  messageFor,
  newAccessCode,
  normaliseCode,
  REDEEM_MESSAGES,
  signInWithCode,
  type AccessCode,
  type PinRecord,
} from "@/lib/accessCodes";

const NOW = new Date("2026-11-10T09:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const code = (overrides: Partial<AccessCode> = {}): AccessCode => ({ ...newAccessCode("S-012", NOW, () => "GK-7Q4M"), ...overrides });

describe("generating codes", () => {
  it("never uses characters that are easy to confuse on paper (0/O, 1/I/L)", () => {
    for (const ch of "0O1IL") expect(CODE_ALPHABET).not.toContain(ch);
    expect(CODE_ALPHABET).toHaveLength(31);
  });

  it("looks like XX-XXXX and only uses the safe alphabet", () => {
    for (let i = 0; i < 500; i++) {
      const c = generateCode();
      expect(c).toMatch(/^[A-Z2-9]{2}-[A-Z2-9]{4}$/);
      for (const ch of c.replace("-", "")) expect(CODE_ALPHABET).toContain(ch);
    }
  });

  it("is effectively unique (1,000 codes, no repeats)", () => {
    expect(new Set(Array.from({ length: 1000 }, () => generateCode())).size).toBe(1000);
  });

  it("throws away biased bytes (248–255) instead of skewing the alphabet", () => {
    // First batch is all 255s (all rejected), then all zeros → every character is the first letter.
    const batches = [new Uint8Array(12).fill(255), new Uint8Array(12).fill(0)];
    expect(generateCode(() => batches.shift() ?? new Uint8Array(12))).toBe("AA-AAAA");
  });
});

describe("tidying what a student types", () => {
  it("accepts lower case, spaces and a missing dash", () => {
    expect(normaliseCode("gk-7q4m")).toBe("GK-7Q4M");
    expect(normaliseCode(" GK 7Q4M ")).toBe("GK-7Q4M");
    expect(normaliseCode("gk7q4m")).toBe("GK-7Q4M");
  });

  it("rejects wrong lengths and confusable characters", () => {
    expect(normaliseCode("GK-7Q4")).toBeNull();
    expect(normaliseCode("GK-7Q4MM")).toBeNull();
    expect(normaliseCode("GO-7Q4M")).toBeNull(); // O is never used
    expect(normaliseCode("G0-7Q4M")).toBeNull(); // nor 0
  });
});

describe("expiry, first use and revocation", () => {
  it("a new code lasts 14 days", () => {
    const c = code();
    expect(new Date(c.expiresAt).getTime() - NOW.getTime()).toBe(14 * DAY);
    expect(codeStatus(c, NOW)).toBe("active");
    expect(codeStatus(c, new Date(NOW.getTime() + 14 * DAY))).toBe("expired");
  });

  it("an old code used without a PIN (before PINs existed) counts as used", () => {
    expect(codeStatus(code({ usedAt: NOW.toISOString() }), NOW)).toBe("used");
  });

  it("once a PIN is set it is 'in use' until the key's end date, and locked beats that", () => {
    const set = code({ usedAt: NOW.toISOString(), pinSetAt: NOW.toISOString(), keyExpiresAt: new Date(NOW.getTime() + 365 * DAY).toISOString() });
    expect(codeStatus(set, new Date(NOW.getTime() + 200 * DAY))).toBe("in_use");
    expect(codeStatus(set, new Date(NOW.getTime() + 365 * DAY))).toBe("expired");
    expect(codeStatus({ ...set, lockedAt: NOW.toISOString() }, NOW)).toBe("locked");
    expect(isWorking("in_use") && isWorking("active") && !isWorking("locked")).toBe(true);
  });

  it("can be revoked by the counsellor, and revoked wins over everything", () => {
    expect(codeStatus(code({ revokedAt: NOW.toISOString(), usedAt: NOW.toISOString() }), NOW)).toBe("revoked");
  });
});

describe("PINs", () => {
  it("rejects easy PINs (same as the database list)", () => {
    for (const p of ["0000", "7777", "1234", "4321", "6789", "3210"]) expect(isWeakPin(p)).toBe(true);
    for (const p of ["2580", "1357", "9024", "1122"]) expect(isWeakPin(p)).toBe(false);
  });
});

// Demo mode's copy of the database function sign_in_with_code (the SQL is tested the same way).
describe("signing in with code + PIN", () => {
  const fresh = () => code();
  const firstTime = () => signInWithCode("gk 7q4m", "2580", [fresh()], {}, NOW);

  it("first time: a fresh code + any good PIN signs in and sets up the key for 365 days", () => {
    const out = firstTime();
    expect(out.result).toBe("ok_new");
    expect(out.studentId).toBe("S-012");
    expect(out.pin).toEqual({ pin: "2580", failures: 0, retryAfter: null });
    expect(new Date(out.code!.keyExpiresAt!).getTime() - NOW.getTime()).toBe(365 * DAY);
    expect(codeStatus(out.code!, NOW)).toBe("in_use");
  });

  it("first time: a weak PIN is refused, and nothing is saved", () => {
    expect(signInWithCode("GK-7Q4M", "1234", [fresh()], {}, NOW)).toEqual({ result: "weak_pin" });
  });

  it("first time: an expired or revoked code doesn't work", () => {
    expect(signInWithCode("GK-7Q4M", "2580", [fresh()], {}, new Date(NOW.getTime() + 15 * DAY)).result).toBe("invalid_code");
    expect(signInWithCode("GK-7Q4M", "2580", [code({ revokedAt: NOW.toISOString() })], {}, NOW).result).toBe("invalid_code");
  });

  it("coming back: the same code and PIN work again, any number of times", () => {
    const setUp = firstTime();
    const pins = { "GK-7Q4M": setUp.pin! };
    const later = new Date(NOW.getTime() + 100 * DAY);
    for (let i = 0; i < 3; i++) expect(signInWithCode("GK-7Q4M", "2580", [setUp.code!], pins, later).result).toBe("ok");
  });

  it("a wrong PIN gets the SAME answer as a wrong code (nobody can probe for real codes)", () => {
    const setUp = firstTime();
    const wrongPin = signInWithCode("GK-7Q4M", "1111", [setUp.code!], { "GK-7Q4M": setUp.pin! }, NOW);
    const wrongCode = signInWithCode("HD-CDEF", "2580", [setUp.code!], { "GK-7Q4M": setUp.pin! }, NOW);
    expect(wrongPin.result).toBe("invalid_code");
    expect(wrongCode.result).toBe("invalid_code");
    expect(messageFor(wrongPin.result)).toBe(REDEEM_MESSAGES.invalid);
  });

  it("5 wrong PINs: wait 15 minutes (even the right PIN); 10: locked until a new code", () => {
    let c = firstTime().code!;
    let pin: PinRecord = { pin: "2580", failures: 0, retryAfter: null };
    const tryPin = (p: string, when: Date) => {
      const out = signInWithCode("GK-7Q4M", p, [c], { "GK-7Q4M": pin }, when);
      if (out.pin) pin = out.pin;
      if (out.code) c = out.code;
      return out.result;
    };
    for (let i = 0; i < 5; i++) tryPin("1111", NOW);
    expect(tryPin("2580", NOW)).toBe("try_later");
    const after = new Date(NOW.getTime() + 16 * 60 * 1000);
    for (let i = 0; i < 5; i++) tryPin("1111", after);
    expect(tryPin("2580", after)).toBe("locked");
    expect(codeStatus(c, after)).toBe("locked");
  });

  it("the right PIN resets the count of wrong ones", () => {
    const setUp = firstTime();
    const out = signInWithCode("GK-7Q4M", "2580", [setUp.code!], { "GK-7Q4M": { pin: "2580", failures: 3, retryAfter: null } }, NOW);
    expect(out.pin?.failures).toBe(0);
  });

  it("explains a code that can't be a code, or a PIN that isn't 4 numbers", () => {
    expect(signInWithCode("hello", "2580", [fresh()], {}, NOW).result).toBe("format");
    expect(signInWithCode("GK-7Q4M", "12", [fresh()], {}, NOW).result).toBe("bad_pin");
  });
});
