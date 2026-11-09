"use client";

// The chosen UI language, remembered in this browser (a per-viewer convenience).
// Same useSyncExternalStore pattern as the follow-up store: the server always renders
// English, then the browser switches if the viewer picked Dzongkha.

import { useCallback, useSyncExternalStore } from "react";
import { translate, type LabelKey, type Lang } from "./i18n";

const KEY = "sa-wellbeing-lang";
const listeners = new Set<() => void>();

function read(): Lang {
  try {
    return window.localStorage.getItem(KEY) === "dz" ? "dz" : "en";
  } catch {
    return "en";
  }
}

export function setLang(lang: Lang) {
  try {
    window.localStorage.setItem(KEY, lang);
  } catch {
    // storage blocked: the switch still works until the page is reloaded
  }
  current = lang;
  listeners.forEach((l) => l());
}

let current: Lang | null = null;
const getSnapshot = () => (current ??= read());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getSnapshot, () => "en");
}

/** Hook for client components: t("filters.school") → "School" or its Dzongkha draft. */
export function useT() {
  const lang = useLang();
  return useCallback((key: LabelKey, vars?: Record<string, string | number>) => translate(lang, key, vars).text, [lang]);
}
