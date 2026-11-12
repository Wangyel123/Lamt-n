import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { ClassCodes } from "@/components/ClassCodes";
import { LoadingState } from "@/components/LoadingState";
import { TopBar } from "@/components/TopBar";
import { requireRole } from "@/lib/auth";
import { isEnabled } from "@/lib/features";
import { loadStudentsForCounsellor, loadStudentsFromCsv } from "@/lib/loadStudents";
import { isDemoMode } from "@/lib/mode";
import { ui } from "@/lib/ui";

export const metadata: Metadata = { title: "Codes for a class · Lamtön" };

// One job per class per year: make every student's code at once and print a sheet of slips.
export default function ClassCodesPage() {
  if (!isEnabled("studentPortal")) notFound();
  return (
    <Suspense fallback={<LoadingState label="Loading students…" />}>
      <ClassCodesContent />
    </Suspense>
  );
}

async function ClassCodesContent() {
  const demo = isDemoMode();
  const profile = demo ? null : await requireRole("counsellor");
  const { students } = demo ? await loadStudentsFromCsv() : await loadStudentsForCounsellor();
  // Only what this page needs: never answers or comments.
  const roster = students.map((s) => ({ studentId: s.studentId, school: s.school, className: s.className }));

  return (
    <>
      <div className="print:hidden">
        <TopBar profile={profile} />
      </div>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl space-y-6 px-5 py-10 outline-none print:max-w-none print:p-0">
        <div className="space-y-3 print:hidden">
          <Link href="/counsellor" className={`${ui.ghost} -ml-3`}>
            <ArrowLeft aria-hidden size={16} /> Students to see
          </Link>
          <header>
            <h1 className={ui.pageTitle}>Codes for a class</h1>
            <p className="mt-1 max-w-2xl text-[14px] text-text-muted">
              Make a code for every student in a class, then print one sheet of slips and hand them out. Each student chooses their own
              4-number PIN the first time; after that their code and PIN work all year, so you only do this once.
            </p>
          </header>
        </div>
        <ClassCodes roster={roster} />
      </main>
    </>
  );
}
