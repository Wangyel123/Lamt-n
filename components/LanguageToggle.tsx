"use client";

import { Languages } from "lucide-react";
import { useLang, setLang } from "@/lib/useLang";
import { T } from "./T";

// English ⇄ རྫོང་ཁ switch for UI labels. Shows an honest "draft" notice in Dzongkha mode.
export function LanguageToggle() {
  const lang = useLang();
  const next = lang === "en" ? "dz" : "en";
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setLang(next)}
        lang={next === "dz" ? "dz" : "en"}
        aria-label={next === "dz" ? "Switch labels to Dzongkha (draft)" : "Switch labels to English"}
        className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border bg-surface px-3 font-bold text-primary"
      >
        <Languages aria-hidden size={16} />
        <T k="lang.switchTo" />
      </button>
      {lang === "dz" && (
        <span role="note" className="text-xs text-text-muted">
          <T k="lang.notice" />
        </span>
      )}
    </span>
  );
}
