"use client";

// Follow-up storage, behind ONE hook (useFollowUps) so the board doesn't care where data lives.
//   Demo mode: the browser's localStorage (AC-07: survives refresh).
//   Live mode: Supabase Postgres, through RLS, via the save_follow_up() database function.
//
// Known limitation of demo mode (documented in the README): on a shared school computer,
// anyone using the same browser can see these notes. Live mode fixes this.
//
// Both stores plug into React's useSyncExternalStore, so every component sees the same data
// and the server render (which has neither localStorage nor a session) never mismatches.

import { useSyncExternalStore } from "react";
import type { FollowUp, FollowUpEvent, FollowUpMap, FollowUpStatus } from "./followUps";
import { isDemoMode } from "./mode";
import { getBrowserSupabase } from "./supabase/client";

export interface FollowUpState {
  followUps: FollowUpMap;
  ready: boolean; // false until saved follow-ups are loaded
  loadError: boolean;
}

interface FollowUpStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => FollowUpState;
  save: (studentId: string, followUp: FollowUp) => Promise<boolean>; // false = not saved
}

const SERVER_STATE: FollowUpState = { followUps: {}, ready: false, loadError: false };

// Shared listener plumbing for both stores.
function createListeners() {
  const listeners = new Set<() => void>();
  return {
    add: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    notify: () => listeners.forEach((l) => l()),
  };
}

// ---------------------------------------------------------------------------
// Demo store: localStorage
// ---------------------------------------------------------------------------
const STORAGE_KEY = "sa-wellbeing-followups-v1";

function createDemoStore(): FollowUpStore {
  const listeners = createListeners();
  let state: FollowUpState | null = null; // same object until something changes = no extra renders

  const read = (): FollowUpState => {
    if (state) return state;
    let followUps: FollowUpMap = {};
    try {
      followUps = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as FollowUpMap;
    } catch {
      // storage blocked or corrupted: start empty rather than crash
    }
    state = { followUps, ready: true, loadError: false };
    return state;
  };

  return {
    subscribe(listener) {
      const remove = listeners.add(listener);
      // Another tab changed the data: re-read.
      const onStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) {
          state = null;
          listener();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        remove();
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot: read,
    async save(studentId, followUp) {
      const followUps = { ...read().followUps, [studentId]: followUp };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(followUps));
      } catch {
        return false; // e.g. private mode or storage full; the UI shows "Couldn't save"
      }
      state = { followUps, ready: true, loadError: false };
      listeners.notify();
      return true;
    },
  };
}

// ---------------------------------------------------------------------------
// Live store: Supabase (RLS decides what this counsellor can read and write)
// ---------------------------------------------------------------------------
interface FollowUpRow {
  student_id: string;
  status: FollowUpStatus;
  note: string;
  updated_at: string;
}
interface EventRow {
  student_id: string;
  old_status: FollowUpStatus | null;
  new_status: FollowUpStatus;
  note: string;
  changed_at: string;
}

function createLiveStore(): FollowUpStore {
  const listeners = createListeners();
  let state: FollowUpState = SERVER_STATE;
  let loading = false;

  const setState = (next: FollowUpState) => {
    state = next;
    listeners.notify();
  };

  async function load() {
    loading = true;
    const supabase = getBrowserSupabase();
    const [followUpsRes, eventsRes] = await Promise.all([
      supabase.from("follow_ups").select("student_id, status, note, updated_at"),
      supabase.from("follow_up_events").select("student_id, old_status, new_status, note, changed_at").order("changed_at"),
    ]);
    if (followUpsRes.error || eventsRes.error) {
      setState({ followUps: {}, ready: false, loadError: true });
      return;
    }
    const history = new Map<string, FollowUpEvent[]>();
    for (const e of eventsRes.data as EventRow[]) {
      const list = history.get(e.student_id) ?? [];
      list.push({ from: e.old_status, to: e.new_status, note: e.note, at: e.changed_at });
      history.set(e.student_id, list);
    }
    const followUps: FollowUpMap = {};
    for (const f of followUpsRes.data as FollowUpRow[]) {
      followUps[f.student_id] = { status: f.status, note: f.note, updatedAt: f.updated_at, history: history.get(f.student_id) ?? [] };
    }
    setState({ followUps, ready: true, loadError: false });
  }

  return {
    subscribe(listener) {
      const remove = listeners.add(listener);
      if (!loading) void load();
      return remove;
    },
    getSnapshot: () => state,
    async save(studentId, followUp) {
      const before = state;
      const previous = before.followUps[studentId];
      // Optimistic: show the change at once, undo it if the database says no.
      setState({ ...before, followUps: { ...before.followUps, [studentId]: followUp } });
      const statusChanged = previous?.status !== followUp.status;
      const { error } = await getBrowserSupabase().rpc("save_follow_up", {
        p_student_id: studentId,
        p_status: followUp.status,
        p_note: followUp.note,
        p_event_note: statusChanged ? (followUp.history.at(-1)?.note ?? "") : "",
      });
      if (error) {
        setState(before);
        return false;
      }
      return true;
    },
  };
}

// Chosen once: the mode can't change while the page is open.
let store: FollowUpStore | null = null;
const getStore = () => (store ??= isDemoMode() ? createDemoStore() : createLiveStore());

const subscribe = (listener: () => void) => getStore().subscribe(listener);
const getSnapshot = () => getStore().getSnapshot();
const getServerSnapshot = () => SERVER_STATE;
const save = (studentId: string, followUp: FollowUp) => getStore().save(studentId, followUp);

/** The one hook the board uses for follow-ups, in both modes. */
export function useFollowUps() {
  const { followUps, ready, loadError } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { followUps, ready, loadError, save };
}
