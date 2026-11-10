import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/LoadingState";
import { CheckInRates } from "@/components/CheckInRates";
import { HeatMap } from "@/components/HeatMap";
import { InterventionCounts } from "@/components/InterventionCounts";
import { SupervisorChart } from "@/components/SupervisorChart";
import { SupervisorTable } from "@/components/SupervisorTable";
import { TopBar } from "@/components/TopBar";
import { requireRole } from "@/lib/auth";
import { loadCheckInsForAggregation, loadInterventionsForAggregation, loadStudentsForAggregation, loadStudentsFromCsv } from "@/lib/loadStudents";
import { isEnabled } from "@/lib/features";
import { isDemoMode } from "@/lib/mode";
import type { SafeCell } from "@/lib/suppression";
import { buildSupervisorSummary, checkInRateTable, followUpCell, interventionTable } from "@/lib/supervisorSummary";

export const metadata: Metadata = { title: "Schools overview · Student Wellbeing" };

export default function SupervisorPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading numbers…" />}>
      <SupervisorContent />
    </Suspense>
  );
}

const show = (cell: SafeCell) => (cell.kind === "count" ? String(cell.value) : cell.kind === "small" ? "Under 5" : "—");

// Server component. Students are counted HERE, on the server; only the suppressed summary is
// rendered. The browser never receives any student-level data.
async function SupervisorContent() {
  const demo = isDemoMode();
  // Live: check the role BEFORE touching any data (the loader uses the secret key).
  const profile = demo ? null : await requireRole("supervisor");
  const { students } = demo ? await loadStudentsFromCsv() : await loadStudentsForAggregation();
  const summary = buildSupervisorSummary(students);
  // P-01: support counts by school (live mode only; demo actions live in the counsellor's browser)
  const support = demo
    ? []
    : interventionTable(
        students.map((s) => ({ studentId: s.studentId, school: s.school })),
        await loadInterventionsForAggregation(),
      );
  // P-04: check-in response rates (live mode only)
  const checkInData = demo ? null : await loadCheckInsForAggregation();
  const rates = checkInData
    ? checkInRateTable(
        students.map((s) => ({ studentId: s.studentId, school: s.school, className: s.className })),
        checkInData.sent,
        checkInData.answeredBy,
      )
    : [];
  const all = summary.rows.find((r) => r.kind === "all")!;
  const schoolCount = summary.rows.filter((r) => r.kind === "school").length;

  return (
    <>
      <TopBar profile={profile} />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 outline-none">
        <header className="space-y-3 px-1">
          <h1 className="text-[34px] leading-tight font-bold tracking-tight">Schools overview</h1>
          <p className="flex max-w-prose items-start gap-2 text-text-muted">
            <ShieldCheck aria-hidden size={20} className="mt-0.5 shrink-0 text-primary" />
            Numbers only. No names or student IDs, and small numbers are hidden, so no child can be identified.
          </p>
        </header>

        {/* The headline first: three numbers a supervisor can repeat in a meeting */}
        <ul className="grid grid-cols-3 gap-3">
          {[
            { label: "Students surveyed", value: show(all.cells.Total) },
            { label: "Need follow-up", value: show(followUpCell(all)) },
            { label: "Schools", value: String(schoolCount) },
          ].map((tile) => (
            <li key={tile.label} className="rounded-2xl bg-surface p-4">
              <p className="tabular text-[28px] leading-tight font-bold sm:text-[34px]">{tile.value}</p>
              <p className="mt-1 text-[13px] text-text-muted sm:text-[15px]">{tile.label}</p>
            </li>
          ))}
        </ul>

        <SupervisorChart rows={summary.rows} />
        {/* P-03: the heat map gets only the already-suppressed rows (never raw counts) */}
        <HeatMap rows={summary.rows} />
        <details className="group">
          <summary className="min-h-11 cursor-pointer px-4 py-2 font-medium text-primary">See all the numbers as a table</summary>
          <div className="mt-2">
            <SupervisorTable rows={summary.rows} />
          </div>
        </details>
        <InterventionCounts rows={support} demo={demo} />
        {isEnabled("checkIns") && <CheckInRates rows={rates} demo={demo} />}

        <p className="px-1 text-[13px] text-text-muted">
          Priorities use the recommended rules, including the extra checks for skipped and worrying answers.
        </p>
      </main>
    </>
  );
}
