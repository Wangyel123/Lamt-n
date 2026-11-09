import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { DemoBanner } from "@/components/DemoBanner";
import { SupervisorTable } from "@/components/SupervisorTable";
import { loadStudentsFromCsv } from "@/lib/loadStudents";
import { isDemoMode } from "@/lib/mode";
import { MIN_GROUP_SIZE } from "@/lib/suppression";
import { buildSupervisorSummary } from "@/lib/supervisorSummary";

export const metadata: Metadata = { title: "Supervisor view · SA Wellbeing" };

// Server component. Student rows are loaded and counted HERE, on the server, and only
// the suppressed summary is rendered. The browser never receives any student-level data.
// (Phase 5: live mode checks the signed-in user is a supervisor.)
export default async function SupervisorPage() {
  const { students } = await loadStudentsFromCsv();
  const summary = buildSupervisorSummary(students);

  return (
    <>
      {isDemoMode() && <DemoBanner />}
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Supervisor view</h1>
          <p className="mt-2 flex max-w-prose items-start gap-2 rounded-lg border border-border bg-surface p-3">
            <ShieldCheck aria-hidden className="mt-0.5 shrink-0 text-primary" size={20} />
            <span>
              Counts only. No student can be identified from this page. Groups under {MIN_GROUP_SIZE} are hidden.
            </span>
          </p>
        </header>

        <SupervisorTable rows={summary.rows} />

        <section className="mt-4 max-w-prose space-y-1 text-sm text-text-muted">
          <h2 className="font-bold text-text">How to read this table</h2>
          <p>
            <strong className="text-text">&lt;{MIN_GROUP_SIZE}</strong> means between 1 and {MIN_GROUP_SIZE - 1}{" "}
            students, or a class with fewer than {MIN_GROUP_SIZE} students. The exact number is hidden so no child
            can be singled out.
          </p>
          <p>
            <strong className="text-text">hidden</strong> means a larger number was also hidden, because otherwise
            someone could subtract to work out a small one.
          </p>
          <p>
            Flag levels use the {summary.usesExtraRules ? "recommended rules (baseline plus proposed extra rules)" : "baseline rules"}.
          </p>
        </section>
      </main>
    </>
  );
}
