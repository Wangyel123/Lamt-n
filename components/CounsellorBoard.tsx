"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { buildRows, type BoardRow } from "@/lib/board";
import { countByLevel, flagStudent, FLAG_LEVELS, LEVEL_NAME, levelMeaning, type FlagLevel } from "@/lib/flags";
import { applyFilters, classOptions, EMPTY_FILTERS, hasActiveFilters, type Filters as FilterValues } from "@/lib/filters";
import { useFollowUps } from "@/lib/followUpStore";
import { changeNote, changeStatus, type FollowUpStatus } from "@/lib/followUps";
import type { DataReport, Student } from "@/lib/parseCsv";
import { overdueUrgentStudents, URGENT_CONTACT_WINDOW_HOURS } from "@/lib/interventions";
import { interventions } from "@/lib/stores";
import { AboutList } from "./AboutList";
import { AlertBanner } from "./AlertBanner";
import { CaseloadView } from "./CaseloadView";
import { LEVEL_STYLE } from "./FlagBadge";
import { FilterSheet } from "./FilterSheet";
import { ActiveFilters, FilterPickers, SearchField } from "./Filters";
import { StudentDrawer } from "./StudentDrawer";
import { StudentRow } from "./StudentRow";
import { SummaryCards } from "./SummaryCards";
import { WorkspaceTabs } from "./WorkspaceTabs";

interface Props {
  students: Student[];
  report: DataReport;
  flaggedSince: string; // when the survey was loaded: the start of the urgent-contact window
}

type Tab = "board" | "caseload";

export function CounsellorBoard({ students, report, flaggedSince }: Props) {
  const { followUps, ready, loadError, save } = useFollowUps();
  const [useExtraRules, setUseExtraRules] = useState(true); // default ON, as recommended
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [showNoConcerns, setShowNoConcerns] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("board");
  const logged = interventions.use();

  // Flags are computed here from lib/flags.ts on every change, never stored.
  const rows = useMemo(() => buildRows(students, followUps, { useExtraRules }), [students, followUps, useExtraRules]);
  const visible = applyFilters(rows, filters);
  // Tile counts follow every filter except priority itself, so a tile shows what you'd get by tapping it.
  const counts = countByLevel(applyFilters(rows, { ...filters, level: null }).map((r) => r.flag));
  const extraFlaggedCount = useMemo(
    () =>
      students.filter((s) => {
        const f = flagStudent(s, { useExtraRules: true });
        return f.level !== f.baselineLevel;
      }).length,
    [students],
  );
  // AC-03 safety net: Urgent students must never disappear silently behind a filter.
  const hiddenUrgent =
    rows.filter((r) => r.flag.level === "Urgent").length - visible.filter((r) => r.flag.level === "Urgent").length;
  const filtering = hasActiveFilters(filters);

  const schools = [...new Set(students.map((s) => s.school))].sort();
  const classes = classOptions(rows, filters.school);
  const selectedRow = rows.find((r) => r.student.studentId === selectedId) ?? null;

  const changeStatusFor = (row: BoardRow) => (to: FollowUpStatus, eventNote: string) =>
    save(row.student.studentId, changeStatus(row.followUp, to, eventNote));

  // P-01 safety net: Urgent students with no contact logged within the window. Worked out only once
  // the interventions have loaded, so it never flashes up wrongly.
  const overdue = logged.ready ? overdueUrgentStudents(rows, logged.items, new Date(flaggedSince)) : [];
  const openCount = rows.filter((r) => r.status === "not_started" || r.status === "in_progress").length;

  const groups = FLAG_LEVELS.map((level) => ({ level, rows: visible.filter((r) => r.flag.level === level) })).filter(
    (g) => g.rows.length > 0,
  );

  return (
    <div className="space-y-8">
      {loadError && (
        <p role="alert" className="rounded-2xl bg-urgent-tint p-4 font-medium text-urgent-ink">
          Couldn&apos;t load follow-ups. Please refresh the page. You can&apos;t change follow-ups until they load.
        </p>
      )}

      <AlertBanner
        title="Overdue: urgent, no contact logged"
        help={`No contact has been logged within ${URGENT_CONTACT_WINDOW_HOURS} hours of these students being flagged. Open a student and use "Add what you did".`}
        studentIds={overdue}
        onOpen={setSelectedId}
      />

      <WorkspaceTabs<Tab>
        tabs={[
          { key: "board", label: "Board" },
          { key: "caseload", label: "My caseload", count: openCount },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="space-y-8">
        {tab === "caseload" && (
          <CaseloadView
            rows={rows}
            interventions={logged.items}
            ready={ready}
            onOpen={setSelectedId}
            onStatusChange={changeStatusFor}
          />
        )}
        {tab === "board" && (
          <>
            <SummaryCards
              counts={counts}
              selected={filters.level}
              useExtraRules={useExtraRules}
              onSelect={(level) => setFilters({ ...filters, level })}
            />

            <div className="space-y-3">
              <div className="flex gap-2">
                <SearchField value={filters.search} onChange={(search) => setFilters({ ...filters, search })} />
                <div className="hidden sm:block">
                  <FilterPickers filters={filters} schools={schools} classes={classes} onChange={setFilters} />
                </div>
                <FilterSheet filters={filters} schools={schools} classes={classes} onChange={setFilters} />
              </div>
              <ActiveFilters filters={filters} onChange={setFilters} />
              <p role="status" aria-live="polite" className="px-1 text-[13px] text-text-muted">
                {filtering ? `${visible.length} of ${rows.length} students` : `${rows.length} students`}
                {!ready && !loadError && " · Loading follow-ups…"}
              </p>
            </div>

            {hiddenUrgent > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-urgent-tint p-4">
                <p className="font-medium text-urgent-ink">
                  {hiddenUrgent} urgent {hiddenUrgent === 1 ? "student is" : "students are"} hidden by your search or filters.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="min-h-11 rounded-full bg-primary px-5 font-semibold text-white"
                >
                  Show everyone
                </button>
              </div>
            )}

            {groups.length === 0 && (
              <div className="rounded-2xl bg-surface p-8 text-center">
                <p className="font-medium">No students match your search.</p>
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="mt-2 min-h-11 px-3 font-medium text-primary"
                >
                  Show everyone
                </button>
              </div>
            )}

            {/* One group per priority, most urgent first (AC-03: Urgent is always the top group). */}
            {groups.map(({ level, rows: groupRows }) => {
              // "No concerns" is folded away unless you're searching or filtering for someone in it.
              const folded = level === "None" && !showNoConcerns && !filtering;
              return (
                <PriorityGroup key={level} level={level} count={groupRows.length} meaning={levelMeaning(level, useExtraRules)}>
                  {folded ? (
                    <button
                      type="button"
                      onClick={() => setShowNoConcerns(true)}
                      className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-surface px-4 font-medium text-primary"
                    >
                      Show {groupRows.length} students with no concerns
                      <ChevronDown aria-hidden size={18} />
                    </button>
                  ) : (
                    <>
                      <ol className="divide-y divide-separator overflow-hidden rounded-2xl bg-surface">
                        {groupRows.map((row) => (
                          <StudentRow
                            key={row.student.studentId}
                            row={row}
                            ready={ready}
                            onOpen={() => setSelectedId(row.student.studentId)}
                            onStatusChange={changeStatusFor(row)}
                          />
                        ))}
                      </ol>
                      {level === "None" && !filtering && (
                        <button
                          type="button"
                          onClick={() => setShowNoConcerns(false)}
                          className="mt-1 min-h-11 px-4 text-[15px] font-medium text-primary"
                        >
                          Hide students with no concerns
                        </button>
                      )}
                    </>
                  )}
                </PriorityGroup>
              );
            })}

            <AboutList
              useExtraRules={useExtraRules}
              extraFlaggedCount={extraFlaggedCount}
              onToggleExtraRules={setUseExtraRules}
              report={report}
            />
          </>
        )}
      </div>

      <StudentDrawer
        row={selectedRow}
        ready={ready}
        useExtraRules={useExtraRules}
        onClose={() => setSelectedId(null)}
        onStatusChange={(to, note) => (selectedRow ? changeStatusFor(selectedRow)(to, note) : Promise.resolve(false))}
        onNoteSave={(note) =>
          selectedRow ? save(selectedRow.student.studentId, changeNote(selectedRow.followUp, note)) : Promise.resolve(false)
        }
      />
    </div>
  );
}

/** A section heading in Apple's grouped-list style: priority name, count, and what it means. */
function PriorityGroup({
  level,
  count,
  meaning,
  children,
}: {
  level: FlagLevel;
  count: number;
  meaning: string;
  children: React.ReactNode;
}) {
  const { icon: Icon, ink } = LEVEL_STYLE[level];
  const id = `group-${level}`;
  return (
    <section aria-labelledby={id} className="space-y-2">
      <div className="px-4">
        <h2 id={id} className={`flex items-center gap-2 text-[20px] font-semibold ${level === "Urgent" ? ink : ""}`}>
          <Icon aria-hidden size={20} strokeWidth={2.25} className={ink} />
          {LEVEL_NAME[level]}
          <span className="tabular font-normal text-text-muted">{count}</span>
        </h2>
        <p className="text-[15px] text-text-muted">{level === "Urgent" ? `${meaning}. See these students first.` : meaning}</p>
      </div>
      {children}
    </section>
  );
}
