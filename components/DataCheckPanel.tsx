import { ClipboardCheck } from "lucide-react";
import type { DataReport } from "@/lib/parseCsv";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// A calm summary of what the parser found, so the counsellor can trust (and check) the data.
// Uses <details> so it is collapsed by default and works without JavaScript.
export function DataCheckPanel({ report }: { report: DataReport }) {
  const issueCount =
    report.missing.length + report.invalid.length + report.duplicates.length + report.problems.length;

  const parts = [
    plural(report.total, "student loaded", "students loaded"),
    plural(report.missing.length, "missing answer", "missing answers"),
    plural(report.fixed.length, "answer fixed for spelling/case", "answers fixed for spelling/case"),
  ];
  if (report.invalid.length) parts.push(plural(report.invalid.length, "unreadable answer", "unreadable answers"));
  if (report.duplicates.length) parts.push(plural(report.duplicates.length, "duplicate ID", "duplicate IDs"));
  if (report.problems.length) parts.push(plural(report.problems.length, "row needs checking", "rows need checking"));

  return (
    <details className="rounded-lg border border-border bg-surface px-4 py-3 text-sm">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2">
        <ClipboardCheck aria-hidden size={18} className="text-primary" />
        <span className="font-bold">Data check:</span>
        <span className="text-text-muted">{parts.join(" · ")}</span>
      </summary>
      <div className="mt-2 max-w-prose space-y-2 text-text-muted">
        {issueCount === 0 && report.fixed.length === 0 && <p>No problems found.</p>}
        {report.missing.length > 0 && (
          <p>
            <strong className="text-text">Missing answers</strong> (never treated as &ldquo;fine&rdquo;):{" "}
            {report.missing.map((m) => `${m.studentId} (${m.field})`).join(", ")}
          </p>
        )}
        {report.invalid.length > 0 && (
          <p>
            <strong className="text-text">Unreadable answers:</strong>{" "}
            {report.invalid.map((m) => `${m.studentId} (${m.field})`).join(", ")}
          </p>
        )}
        {report.fixed.length > 0 && (
          <p>
            <strong className="text-text">Fixed automatically:</strong>{" "}
            {report.fixed.map((f) => `${f.studentId} (${f.field}: “${f.from}” → “${f.to}”)`).join(", ")}
          </p>
        )}
        {report.duplicates.length > 0 && (
          <p>
            <strong className="text-text">Duplicate IDs (all copies kept):</strong> {report.duplicates.join(", ")}
          </p>
        )}
        {report.problems.length > 0 && (
          <p>
            <strong className="text-text">Rows to check manually:</strong>{" "}
            {report.problems.map((p) => `${p.studentId} (${p.message})`).join(", ")}
          </p>
        )}
      </div>
    </details>
  );
}
