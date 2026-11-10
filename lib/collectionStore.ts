"use client";

// ONE storage pattern for every Phase 2 table (interventions, messages, check-ins, journal...).
//   Demo mode: a list in the browser's localStorage (works with no setup).
//   Live mode: a Supabase table, read and written as the signed-in user, so Row Level Security
//              decides what each person may see (a counsellor: their school; a student: only
//              their own rows; a supervisor: nothing).
// Same idea as followUpStore.ts, made generic so each feature only describes its columns.

import { useSyncExternalStore } from "react";
import { isDemoMode } from "./mode";
import { getBrowserSupabase } from "./supabase/client";

export interface CollectionState<T> {
  items: T[];
  ready: boolean;
  loadError: boolean;
}

export interface CollectionConfig<T extends { id: string }> {
  key: string; // localStorage key (demo mode)
  table: string; // Supabase table (live mode)
  columns: string; // columns to read (live mode)
  fromRow: (row: Record<string, unknown>) => T;
  toRow: (item: T) => Record<string, unknown>; // what to write; leave out columns the database sets
  // Live updates send ONLY these columns (some tables allow changing just one column, e.g. a
  // counsellor may mark a message read but never edit its words). Defaults to toRow.
  patchRow?: (patch: Partial<T>) => Record<string, unknown>;
  pollMs?: number; // live mode: re-read every N ms while someone is looking (e.g. messages)
}

export interface Collection<T extends { id: string }> {
  use: () => CollectionState<T>;
  add: (item: T) => Promise<boolean>; // false = not saved
  update: (id: string, patch: Partial<T>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

const EMPTY = { items: [], ready: false, loadError: false };

export function createCollection<T extends { id: string }>(cfg: CollectionConfig<T>): Collection<T> {
  const listeners = new Set<() => void>();
  let state: CollectionState<T> = EMPTY;
  let started = false;
  let poll: ReturnType<typeof setInterval> | undefined;
  const set = (next: CollectionState<T>) => {
    state = next;
    listeners.forEach((l) => l());
  };

  // ---- demo: localStorage ------------------------------------------------
  const readDemo = (): T[] => {
    try {
      return JSON.parse(window.localStorage.getItem(cfg.key) ?? "[]") as T[];
    } catch {
      return [];
    }
  };
  const writeDemo = (items: T[]) => {
    try {
      window.localStorage.setItem(cfg.key, JSON.stringify(items));
    } catch {
      return false;
    }
    set({ items, ready: true, loadError: false });
    return true;
  };

  // ---- live: Supabase -----------------------------------------------------
  async function loadLive() {
    const { data, error } = await getBrowserSupabase().from(cfg.table).select(cfg.columns);
    if (error) set({ items: [], ready: false, loadError: true });
    else set({ items: (data as unknown as Record<string, unknown>[]).map(cfg.fromRow), ready: true, loadError: false });
  }

  function start() {
    if (started) return;
    started = true;
    if (isDemoMode()) {
      set({ items: readDemo(), ready: true, loadError: false });
      // Another tab (e.g. the demo student) changed the data: re-read.
      window.addEventListener("storage", (e) => {
        if (e.key === cfg.key) set({ items: readDemo(), ready: true, loadError: false });
      });
    } else {
      void loadLive();
      if (cfg.pollMs) poll = setInterval(() => void loadLive(), cfg.pollMs);
    }
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    start();
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && poll) {
        clearInterval(poll);
        poll = undefined;
        started = false;
      }
    };
  };

  return {
    use: () => useSyncExternalStore(subscribe, () => state, () => EMPTY as CollectionState<T>),
    async add(item) {
      if (isDemoMode()) return writeDemo([...readDemo(), item]);
      const { error } = await getBrowserSupabase().from(cfg.table).insert(cfg.toRow(item));
      if (!error) await loadLive();
      return !error;
    },
    async update(id, patch) {
      if (isDemoMode()) return writeDemo(readDemo().map((x) => (x.id === id ? { ...x, ...patch } : x)));
      const current = state.items.find((x) => x.id === id);
      if (!current) return false;
      const row = cfg.patchRow ? cfg.patchRow(patch) : cfg.toRow({ ...current, ...patch });
      const { error } = await getBrowserSupabase().from(cfg.table).update(row).eq("id", id);
      if (!error) await loadLive();
      return !error;
    },
    async remove(id) {
      if (isDemoMode()) return writeDemo(readDemo().filter((x) => x.id !== id));
      const { error } = await getBrowserSupabase().from(cfg.table).delete().eq("id", id);
      if (!error) await loadLive();
      return !error;
    },
  };
}

/** A new id for a record (the database accepts ids made in the browser). */
export const newId = () => crypto.randomUUID();
