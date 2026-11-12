"use client";

// Where access codes are kept, behind ONE hook (useAccessCodes), same pattern as followUpStore.ts:
//   Demo mode: the browser's localStorage (so a "demo student" in the same browser can redeem).
//   Live mode: the Supabase table access_codes, through RLS (counsellors: their school only).

import { useSyncExternalStore } from "react";
import { messageFor, newAccessCode, normaliseCode, REDEEM_MESSAGES, signInWithCode, type AccessCode, type PinRecord } from "./accessCodes";
import { isDemoMode } from "./mode";
import { getBrowserSupabase } from "./supabase/client";

export interface CodeState {
  codes: AccessCode[];
  ready: boolean;
  loadError: boolean;
}

interface CodeStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => CodeState;
  create: (studentId: string) => Promise<AccessCode | null>; // null = couldn't save
  createMany: (studentIds: string[]) => Promise<number>; // how many were made (a class at once)
  revoke: (code: string) => Promise<boolean>;
}

const SERVER_STATE: CodeState = { codes: [], ready: false, loadError: false };

function listeners() {
  const set = new Set<() => void>();
  return { add: (l: () => void) => (set.add(l), () => set.delete(l)), notify: () => set.forEach((l) => l()) };
}

// ---------------------------------------------------------------------------
// Demo: localStorage
// ---------------------------------------------------------------------------
const DEMO_KEY = "sa-access-codes-v1";
const DEMO_PINS_KEY = "sa-code-pins-v1"; // demo only: PINs in this browser (live keeps bcrypt hashes in Postgres)

/** Codes saved before PINs existed lack the new fields: fill them in as null. */
const withKeyFields = (c: AccessCode): AccessCode => ({ ...c, pinSetAt: c.pinSetAt ?? null, keyExpiresAt: c.keyExpiresAt ?? null, lockedAt: c.lockedAt ?? null });

function readDemoCodes(): AccessCode[] {
  try {
    return (JSON.parse(window.localStorage.getItem(DEMO_KEY) ?? "[]") as AccessCode[]).map(withKeyFields);
  } catch {
    return [];
  }
}

function writeDemoCodes(codes: AccessCode[]): boolean {
  try {
    window.localStorage.setItem(DEMO_KEY, JSON.stringify(codes));
    return true;
  } catch {
    return false;
  }
}

function readDemoPins(): Record<string, PinRecord> {
  try {
    return JSON.parse(window.localStorage.getItem(DEMO_PINS_KEY) ?? "{}") as Record<string, PinRecord>;
  } catch {
    return {};
  }
}

function writeDemoPins(pins: Record<string, PinRecord>) {
  try {
    window.localStorage.setItem(DEMO_PINS_KEY, JSON.stringify(pins));
  } catch {
    // storage blocked: nothing to do in demo mode
  }
}

/** A new code replaces every other working one for the same student (one key at a time). */
const retireOthers = (codes: AccessCode[], studentIds: string[], now: string) =>
  codes.map((c) => (studentIds.includes(c.studentId) && !c.revokedAt ? { ...c, revokedAt: now } : c));

function createDemoStore(): CodeStore {
  const ls = listeners();
  let state: CodeState | null = null;
  const read = () => (state ??= { codes: readDemoCodes(), ready: true, loadError: false });
  const commit = (codes: AccessCode[]) => {
    if (!writeDemoCodes(codes)) return false;
    state = { codes, ready: true, loadError: false };
    ls.notify();
    return true;
  };
  return {
    subscribe: (l) => {
      const remove = ls.add(l);
      const onStorage = (e: StorageEvent) => {
        if (e.key === DEMO_KEY) {
          state = null;
          l();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        remove();
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot: read,
    async create(studentId) {
      const code = newAccessCode(studentId);
      return commit([...retireOthers(read().codes, [studentId], new Date().toISOString()), code]) ? code : null;
    },
    async createMany(studentIds) {
      const made = studentIds.map((id) => newAccessCode(id));
      return commit([...retireOthers(read().codes, studentIds, new Date().toISOString()), ...made]) ? made.length : 0;
    },
    async revoke(codeText) {
      const now = new Date().toISOString();
      return commit(read().codes.map((c) => (c.code === codeText ? { ...c, revokedAt: now } : c)));
    },
  };
}

/** Demo only: what the student page calls. Same rules as the database's sign_in_with_code. */
export function signInDemo(input: string, pin: string): { ok: true; studentId: string; isNew: boolean } | { ok: false; message: string } {
  const codes = readDemoCodes();
  const pins = readDemoPins();
  const out = signInWithCode(input, pin, codes, pins);
  if (out.pin) {
    const key = normaliseCode(input);
    if (key) writeDemoPins({ ...pins, [key]: out.pin });
  }
  if (out.code) {
    const updated = out.code;
    writeDemoCodes(codes.map((c) => (c.code === updated.code ? updated : c)));
    window.dispatchEvent(new StorageEvent("storage", { key: DEMO_KEY })); // refresh any open counsellor view
  }
  if (out.result === "format") return { ok: false, message: REDEEM_MESSAGES.format };
  const message = messageFor(out.result);
  return message === null ? { ok: true, studentId: out.studentId!, isNew: out.result === "ok_new" } : { ok: false, message };
}

/** Demo only: makes a fresh code for a student (used by "Try as a demo student"). */
export function createDemoCodeFor(studentId: string): AccessCode {
  const code = newAccessCode(studentId);
  writeDemoCodes([...retireOthers(readDemoCodes(), [studentId], new Date().toISOString()), code]);
  return code;
}

// ---------------------------------------------------------------------------
// Live: Supabase (RLS: counsellors see codes only for students they can see)
// ---------------------------------------------------------------------------
interface CodeRow {
  code: string;
  student_id: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  pin_set_at: string | null;
  key_expires_at: string | null;
  locked_at: string | null;
}
const fromRow = (r: CodeRow): AccessCode => ({
  code: r.code,
  studentId: r.student_id,
  createdAt: r.created_at,
  expiresAt: r.expires_at,
  usedAt: r.used_at,
  revokedAt: r.revoked_at,
  pinSetAt: r.pin_set_at,
  keyExpiresAt: r.key_expires_at,
  lockedAt: r.locked_at,
});
const COLUMNS = "code, student_id, created_at, expires_at, used_at, revoked_at, pin_set_at, key_expires_at, locked_at";

function createLiveStore(): CodeStore {
  const ls = listeners();
  let state: CodeState = SERVER_STATE;
  let loading = false;
  const set = (next: CodeState) => {
    state = next;
    ls.notify();
  };
  async function load() {
    loading = true;
    const { data, error } = await getBrowserSupabase().from("access_codes").select(COLUMNS);
    set(error ? { codes: [], ready: false, loadError: true } : { codes: (data as CodeRow[]).map(fromRow), ready: true, loadError: false });
  }
  return {
    subscribe: (l) => {
      const remove = ls.add(l);
      if (!loading) void load();
      return remove;
    },
    getSnapshot: () => state,
    async create(studentId) {
      const supabase = getBrowserSupabase();
      const now = new Date().toISOString();
      // Retire every other code first, so a student only ever has one key. Revoking also signs out
      // the devices that used it (a database trigger): this is how "forgot my PIN" or a lost phone is fixed.
      await supabase.from("access_codes").update({ revoked_at: now }).eq("student_id", studentId).is("revoked_at", null);
      for (let attempt = 0; attempt < 3; attempt++) {
        const code = newAccessCode(studentId);
        const { data: user } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("access_codes")
          .insert({ code: code.code, student_id: studentId, created_by: user.user?.id, expires_at: code.expiresAt });
        if (!error) {
          await load();
          return code;
        }
        if (error.code !== "23505") break; // 23505 = code already exists (astronomically rare): try another
      }
      return null;
    },
    async createMany(studentIds) {
      if (studentIds.length === 0) return 0;
      const supabase = getBrowserSupabase();
      const { data: user } = await supabase.auth.getUser();
      await supabase.from("access_codes").update({ revoked_at: new Date().toISOString() }).in("student_id", studentIds).is("revoked_at", null);
      const rows = studentIds.map((id) => {
        const c = newAccessCode(id);
        return { code: c.code, student_id: id, created_by: user.user?.id, expires_at: c.expiresAt };
      });
      const { error } = await supabase.from("access_codes").insert(rows);
      let made = error ? 0 : rows.length;
      // One clash in a batch (astronomically rare) fails the whole insert: fall back to one at a time.
      if (error?.code === "23505") for (const id of studentIds) if (await this.create(id)) made++;
      await load();
      return made;
    },
    async revoke(codeText) {
      const { error } = await getBrowserSupabase().from("access_codes").update({ revoked_at: new Date().toISOString() }).eq("code", codeText);
      if (!error) await load();
      return !error;
    },
  };
}

let store: CodeStore | null = null;
const getStore = () => (store ??= isDemoMode() ? createDemoStore() : createLiveStore());

export function useAccessCodes() {
  const state = useSyncExternalStore((l) => getStore().subscribe(l), () => getStore().getSnapshot(), () => SERVER_STATE);
  return {
    ...state,
    create: (id: string) => getStore().create(id),
    createMany: (ids: string[]) => getStore().createMany(ids),
    revoke: (code: string) => getStore().revoke(code),
  };
}
