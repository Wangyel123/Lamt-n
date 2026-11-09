"use client";

import { useId } from "react";

interface Props {
  enabled: boolean;
  extraFlaggedCount: number; // how many students the extra rules raise
  onChange: (enabled: boolean) => void;
}

// AC-08: lets reviewers compare our proposed extra rules with the brief's pure baseline.
// A real switch (role="switch"), so screen readers announce "on/off".
export function RulesToggle({ enabled, extraFlaggedCount, onChange }: Props) {
  const descriptionId = useId();
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-start sm:gap-4">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-describedby={descriptionId}
        onClick={() => onChange(!enabled)}
        className="flex min-h-11 shrink-0 items-center gap-3 text-left font-bold"
      >
        <span
          aria-hidden
          className={`relative inline-block h-7 w-12 rounded-full transition-colors duration-150 ${enabled ? "bg-primary" : "bg-text-muted"}`}
        >
          <span
            className={`absolute top-1 size-5 rounded-full bg-white transition-transform duration-150 ${enabled ? "translate-x-6" : "translate-x-1"}`}
          />
        </span>
        <span>
          Use proposed extra rules (recommended)
          <span className="ml-2 text-sm font-normal text-text-muted">{enabled ? "On" : "Off"}</span>
        </span>
      </button>
      <p id={descriptionId} className="max-w-prose text-sm text-text-muted">
        Adds two checks the brief&apos;s rules miss: a skipped self-harm question (&ldquo;Prefer not to say&rdquo;)
        becomes at least High, and worrying words in a comment become at least Review.{" "}
        <strong className="text-text">
          {enabled
            ? `${extraFlaggedCount} students are raised by these rules.`
            : `Turn on to raise ${extraFlaggedCount} more students.`}
        </strong>
      </p>
    </div>
  );
}
