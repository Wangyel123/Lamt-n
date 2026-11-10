# Acceptance criteria → code → how to demo

| ID | Criterion | Where it lives | Proof | How to demo |
|---|---|---|---|---|
| AC-01 | Loads the CSV, shows every student by ID, school, class | `lib/parseCsv.ts`, `lib/loadStudents.ts`, `components/StudentRow.tsx` | `tests/parseCsv.test.ts` (72 rows, no row ever dropped, messy input) | Open the counsellor board → tap "Show 36 students with no concerns" → all 72 listed |
| AC-02 | Flag level from the baseline rules, reason shown next to it | `lib/flags.ts` (`applyBaselineRules`, `flagStudent`), `components/Reasons.tsx` | `tests/flags.test.ts`: exact counts 2/9/17/44 and the exact Urgent and High IDs | Each row shows its reasons; the reason that set the level comes first in dark text |
| AC-03 | Urgent always at the top, visually unmistakable | `lib/board.ts` (sort), `components/CounsellorBoard.tsx` (Urgent group first; notice if a filter hides Urgent students), `components/FlagBadge.tsx` | `tests/board.test.ts` (Urgent first, even when closed) | Urgent group: first, red heading, solid red icons, red edge, the word "Urgent". Search "zzz": the board says 2 urgent students are hidden |
| AC-04 | Set follow-up: Not started / In progress / Closed | `lib/followUps.ts`, `components/StatusControl.tsx` | `tests/board.test.ts` (history, closing note rules) | Change a row's dropdown. Set an Urgent student to Closed: a note is required first |
| AC-05 | Supervisor view: counts by school and class, no IDs, groups under 5 hidden | `app/supervisor/page.tsx`, `lib/supervisorSummary.ts`, `lib/suppression.ts`, `app/api/supervisor/summary/route.ts` | `tests/suppression.test.ts`: the three rules, School D, an independent brute-force audit, "no student ID in the API response" | Switch role → Supervisor: "under 5" / "not shown" in the table |
| AC-06 | Filter or search by school, class or flag level | `lib/filters.ts`, `components/Filters.tsx`, `components/SummaryCards.tsx`, `components/FilterSheet.tsx` | `tests/filters.test.ts` | Tap the "High" tile; search "s045"; pick School D + Class XI |
| AC-07 | Statuses survive a refresh | Demo: `lib/followUpStore.ts` (localStorage). Live: `save_follow_up()` in `supabase/migrations/001_init.sql` | `npm run verify:rls` (writes and reads back as a counsellor) | Change a status → refresh → still there |
| AC-08 | One extra rule, explained | `lib/flags.ts` (`applyExtraRules`: E1, E2; E3 "Answer missing"), `components/AboutList.tsx` (switch) | `tests/flags.test.ts`: 2/17/17/36 and exactly 9 changes, only upwards | "About this list" → switch off → tiles go from 2/17/17/36 to 2/9/17/44 |
| AC-09 | Could: deployed, chart, Dzongkha, mobile | Deployed: https://lamtoen.vercel.app · Chart: `components/SupervisorChart.tsx` · Mobile: responsive layout + `components/FilterSheet.tsx` | Browser checks at 360 px: no sideways scrolling, all tap targets ≥ 44 px | Open on a phone. Dzongkha labels were built, then **removed by choice** (unverified translations would mislead; see DESIGN.md) |

## Privacy checks (live mode)

| Check | Proof |
|---|---|
| Row-level security on every table; supervisors can't read student rows | `npm run verify:rls` (supervisor sees 0 students, 0 follow-ups; can't save) |
| A counsellor sees only their school | `verify:rls` (School B counsellor sees exactly 23, all School B) |
| Secret key server-only | `lib/supabase/server.ts` (no `NEXT_PUBLIC_` prefix, never imported by client code) |
| Supervisor API returns suppressed counts only | `tests/suppression.test.ts` (no `S-` IDs); role checked before the secret-key query |
| Audit log can't be edited or deleted | `verify:rls` |
| Comments visible to counsellors only | Comments are only rendered in `components/StudentDrawer.tsx`; never in supervisor output |

## Phase 2 features (inspired by Kooth and Panorama)

Each feature can be switched off in `lib/features.ts`. Live mode needs `002_student_access.sql`, `003_phase2_features.sql` and anonymous sign-ins.

| ID | Feature | Where it lives | Proof | How to demo |
|---|---|---|---|---|
| K-05 | About this space + Get help now | `app/student/about/page.tsx`, `components/student/GetHelpSheet.tsx`, `app/student/layout.tsx` | browser checks: no red, 48 px targets, no invented numbers | *I'm a student* → *Get help now*; *About this space* |
| K-01 | Anonymous code sign-in | `lib/accessCodes.ts`, `components/AccessCodePanel.tsx`, `components/student/CodeForm.tsx`, `app/actions/student.ts`, migration 002 (`redeem_access_code`) | `tests/accessCodes.test.ts`; `verify:rls` student checks | Student's details → *Make a code* → *Print slip*; type it at `/student` |
| P-01 | Interventions, caseload, overdue-urgent banner | `lib/interventions.ts`, `lib/timeline.ts`, `components/InterventionForm.tsx`, `components/CaseloadView.tsx`, `components/InterventionCounts.tsx` | `tests/interventions.test.ts`; support table in `tests/suppression.test.ts` | Banner "Overdue: urgent, no contact logged" → open S-005 → *Add what you did*; *My caseload* tab |
| P-02 | "Needs reading" categories + reviewed | `lib/sensitiveText.ts`, `lib/readingQueue.ts`, `components/NeedsReading.tsx` | `tests/sensitiveText.test.ts` (word boundaries, **private journal never scanned**, counts unchanged) | S-023's row chip "Needs reading: safety at home" → open → *Mark as read* |
| K-02 | Talk to my counsellor (human) | `lib/messages.ts`, `components/student/StudentMessages.tsx`, `components/InboxView.tsx` | `tests/messages.test.ts`; `verify:rls` message checks | Student sends a message → counsellor *Inbox* → reply |
| P-03 | Supervisor heat map | `lib/heatmap.ts`, `components/HeatMap.tsx` (same suppressed rows as AC-05) | heat-map tests in `tests/suppression.test.ts` | Supervisor → *Where flags are concentrated*; *Numbers / Percent* |
| P-04 | Pulse check-ins | `lib/checkins.ts`, `components/CheckInsView.tsx`, `components/student/StudentCheckIn.tsx`, `checkInReasons` in `lib/flags.ts` | `tests/checkins.test.ts` (never changes levels; rates suppressed) | *Check-ins* tab → send to School A, Class VI → demo student answers |
| K-03 | Self-care activities | `lib/activities.ts`, `app/student/activities/` | `tests/journal.test.ts` (no medical claims) | *Self-care activities* → *Box breathing* |
| K-04 | Private journal + goals | `lib/journal.ts`, `components/student/StudentJournal.tsx` | `tests/journal.test.ts`; `verify:rls` (counsellor can't read a private entry) | Write an entry (private) and one shared → only the shared one appears in the counsellor's details |
| K-06 | Pre-moderated peer board (OFF) | `lib/peerBoard.ts`, `components/student/StudentBoard.tsx`, `components/ModerationView.tsx`, `approved_board_posts()` | `tests/peerBoard.test.ts` | Set `peerBoard: true` in `lib/features.ts` → student posts → *Moderation* tab |
