"use client";

import { translate, type LabelKey } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

/**
 * A translated UI label. Usable from server components too: <T k="board.title" />.
 * Dzongkha text gets lang="dz", which switches to the Tibetan-script font and taller
 * line height (globals.css) and tells screen readers which language to speak.
 */
export function T({ k, vars }: { k: LabelKey; vars?: Record<string, string | number> }) {
  const { text, isDzongkha } = translate(useLang(), k, vars);
  return isDzongkha ? <span lang="dz">{text}</span> : <>{text}</>;
}
