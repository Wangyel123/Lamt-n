"use client";

// DEMO-MODE student sign-in: which demo student is "signed in" in this browser.
// Live mode uses a real anonymous Supabase session instead (lib/studentAuth.ts).

import { useSyncExternalStore } from "react";

const KEY = "sa-demo-student-v1";
const listeners = new Set<() => void>();
let cached: string | null | undefined;

function read(): string | null {
  if (cached !== undefined) return cached;
  try {
    cached = window.localStorage.getItem(KEY);
  } catch {
    cached = null;
  }
  return cached;
}

function write(studentId: string | null) {
  try {
    if (studentId) window.localStorage.setItem(KEY, studentId);
    else window.localStorage.removeItem(KEY);
  } catch {
    // storage blocked: the session just won't survive a refresh
  }
  cached = studentId;
  listeners.forEach((l) => l());
}

export const signInDemoStudent = (studentId: string) => write(studentId);
export const signOutDemoStudent = () => write(null);

const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));

/** The signed-in demo student's id, or null. `undefined` during the server render. */
export function useDemoStudent(): string | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}
