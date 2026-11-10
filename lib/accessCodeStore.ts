"use client";

// Where access codes are kept, behind ONE hook (useAccessCodes), same pattern as followUpStore.ts:
//   Demo mode: the browser's localStorage (so a "demo student" in the same browser can redeem).
//   Live mode: the Supabase table access_codes, through RLS (counsellors: their school only).

import { useSyncExternalStore } from "react";
import { checkRedeem, newAccessCode, type AccessCode } from "./accessCodes";
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

function readDemoCodes(): AccessCode[] {
  try {
    return JSON.parse(window.localStorage.getItem(DEMO_KEY) ?? "[]") as AccessCode[];
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
      // A new code replaces any active one for the same student (one working code at a time).
      const now = new Date().toISOString();
      const others = read().codes.map((c) => (c.studentId === studentId && !c.usedAt && !c.revokedAt ? { ...c, revokedAt: now } : c));
      const code = newAccessCode(studentId);
      return commit([...others, code]) ? code : null;
    },
    async revoke(codeText) {
      const now = new Date().toISOString();
      return commit(read().codes.map((c) => (c.code === codeText ? { ...c, revokedAt: now } : c)));
    },
  };
}

/** Demo only: what the student page calls. Marks the code used and returns the student id. */
export function redeemDemoCode(input: string): { ok: true; studentId: string } | { ok: false; message: string } {
  const codes = readDemoCodes();
  const result = checkRedeem(input, codes);
  if (!result.ok) return result;
  const now = new Date().toISOString();
  writeDemoCodes(codes.map((c) => (c.code === result.code.code ? { ...c, usedAt: now } : c)));
  window.dispatchEvent(new StorageEvent("storage", { key: DEMO_KEY })); // refresh any open counsellor view
  return { ok: true, studentId: result.code.studentId };
}

/** Demo only: makes a fresh code for a student (used by "Try as a demo student"). */
export function createDemoCodeFor(studentId: string): AccessCode {
  const code = newAccessCode(studentId);
  writeDemoCodes([...readDemoCodes(), code]);
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
}
const fromRow = (r: CodeRow): AccessCode => ({
  code: r.code,
  studentId: r.student_id,
  createdAt: r.created_at,
  expiresAt: r.expires_at,
  usedAt: r.used_at,
  revokedAt: r.revoked_at,
});

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
    const { data, error } = await getBrowserSupabase().from("access_codes").select("code, student_id, created_at, expires_at, used_at, revoked_at");
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
      // Retire any active code first, so a student only ever has one working code.
      await supabase.from("access_codes").update({ revoked_at: now }).eq("student_id", studentId).is("used_at", null).is("revoked_at", null);
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
  return { ...state, create: (id: string) => getStore().create(id), revoke: (code: string) => getStore().revoke(code) };
}
