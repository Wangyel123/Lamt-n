"use client";

import { ChevronRight } from "lucide-react";
import { useId } from "react";
import { FLAG_LEVELS, LEVEL_NAME, levelMeaning } from "@/lib/flags";
import type { DataReport } from "@/lib/parseCsv";
import { LevelIcon } from "./FlagBadge";
import { Switch } from "./Switch";

interface Props {
  useExtraRules: boolean;
  extraFlaggedCount: number;
  onToggleExtraRules: (on: boolean) => void;
  report: DataReport;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// "About this list": everything a counsellor might want to understand, but not on every glance.
// Kept at the bottom (progressive disclosure) and written in plain words.
export function AboutList({ useExtraRules, extraFlaggedCount, onToggleExtraRules, report }: Props) {
  const helpId = useId();
  const unreadable = report.missing.length + report.invalid.length + report.problems.length + report.duplicates.length;

  return (
    <section aria-labelledby="about-heading" className="space-y-2">
      <h2 id="about-heading" className="px-4 text-[13px] font-medium tracking-wide text-text-muted uppercase">
        About this list
      </h2>
      <div className="divide-y divide-separator overflow-hidden rounded-2xl bg-surface">
        {/* AC-08: our extra checks, switchable so reviewers can compare with the basic rules */}
        <div className="flex items-start justify-between gap-4 p-4">
          <div>
            <p className="font-medium">Also flag students the basic rules miss</p>
            <p id={helpId} className="mt-0.5 max-w-prose text-[15px] text-text-muted">
              Recommended. Students who skipped the self-harm question become High. Students whose comment uses
              worrying words become Review. This raises {extraFlaggedCount} students.
            </p>
          </div>
          <Switch checked={useExtraRules} onChange={onToggleExtraRules} label="Also flag students the basic rules miss" describedBy={helpId} />
        </div>

        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 p-4 font-medium">
            How students are sorted
            <ChevronRight aria-hidden size={18} className="text-border transition-transform group-open:rotate-90" />
          </summary>
          <ul className="space-y-3 px-4 pb-4">
            {FLAG_LEVELS.map((level) => (
              <li key={level} className="flex items-start gap-3">
                <LevelIcon level={level} />
                <span>
                  <span className="font-medium">{LEVEL_NAME[level]}</span>
                  <span className="block text-[15px] text-text-muted">{levelMeaning(level, useExtraRules)}</span>
                </span>
              </li>
            ))}
            <li className="text-[15px] text-text-muted">
              If a student matches more than one group, they go in the most urgent one. Every reason is still listed.
            </li>
          </ul>
        </details>

        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 p-4 font-medium">
            <span>
              Survey answers
              <span className="block text-[15px] font-normal text-text-muted">
                {plural(report.total, "survey", "surveys")} read
                {unreadable > 0 && ` · ${plural(unreadable, "needs", "need")} a look`}
                {report.fixed.length > 0 && ` · ${plural(report.fixed.length, "answer", "answers")} tidied up`}
              </span>
            </span>
            <ChevronRight aria-hidden size={18} className="shrink-0 text-border transition-transform group-open:rotate-90" />
          </summary>
          <div className="max-w-prose space-y-2 px-4 pb-4 text-[15px] text-text-muted">
            {report.missing.map((m) => (
              <p key={`${m.studentId}-${m.field}`}>
                <strong className="font-medium text-text">{m.studentId}</strong> left the {m.field} question blank. We don&apos;t
                guess an answer, so please check with them.
              </p>
            ))}
            {report.invalid.map((m) => (
              <p key={`${m.studentId}-${m.field}`}>
                <strong className="font-medium text-text">{m.studentId}</strong>: the {m.field} answer couldn&apos;t be read.
              </p>
            ))}
            {report.fixed.map((f) => (
              <p key={`${f.studentId}-${f.field}`}>
                <strong className="font-medium text-text">{f.studentId}</strong>: &ldquo;{f.from}&rdquo; was read as &ldquo;{f.to}&rdquo;
                ({f.field} question).
              </p>
            ))}
            {report.problems.map((p) => (
              <p key={`${p.studentId}-${p.message}`}>
                <strong className="font-medium text-text">{p.studentId}</strong>: please check this survey by hand ({p.message}).
              </p>
            ))}
            {report.duplicates.length > 0 && <p>The same student ID appears more than once: {report.duplicates.join(", ")}.</p>}
            {unreadable === 0 && report.fixed.length === 0 && <p>Every answer was read without problems.</p>}
          </div>
        </details>
      </div>
    </section>
  );
}
