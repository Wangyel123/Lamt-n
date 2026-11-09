"use client";

// DEMO-MODE follow-up storage: the browser's localStorage (AC-07: survives refresh).
//
// Known limitation (documented in the README): on a shared school computer,
// anyone using the same browser can see these notes. Live mode (Supabase) fixes this.
//
// We use React's useSyncExternalStore so every component sees the same data,
// and the server render (which has no localStorage) never mismatches the browser.

import { useCallback, useSyncExternalStore } from "react";
import type { FollowUp, FollowUpMap } from "./followUps";

const STORAGE_KEY = "sa-wellbeing-followups-v1";
const EMPTY: FollowUpMap = {};

let cache: FollowUpMap | null = null; // parsed once, then reused (same object = no extra renders)
const listeners = new Set<() => void>();

function read(): FollowUpMap {
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as FollowUpMap;
  } catch {
    cache = {}; // storage blocked or corrupted: start empty rather than crash
  }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the data: drop our cache and re-read.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Saves one student's follow-up. Returns false if the browser refused to store it. */
function saveDemo(studentId: string, followUp: FollowUp): boolean {
  const next = { ...read(), [studentId]: followUp };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false; // e.g. private mode or storage full; the UI shows "Couldn't save"
  }
  cache = next;
  listeners.forEach((l) => l());
  return true;
}

const subscribeNothing = () => () => {};

/**
 * The one hook the board uses for follow-ups.
 * `ready` is false during the server render, before saved statuses are known.
 * Phase 5 swaps the storage for Supabase in live mode behind this same hook.
 */
export function useFollowUps() {
  const followUps = useSyncExternalStore(subscribe, read, () => EMPTY);
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const save = useCallback(async (studentId: string, followUp: FollowUp) => saveDemo(studentId, followUp), []);
  return { followUps, ready, save };
}
