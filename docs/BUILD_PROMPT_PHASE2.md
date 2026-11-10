# BUILD PROMPT — Phase 2: Kooth- and Panorama-inspired features

> **How to use this file**
> 1. Save it as `docs/BUILD_PROMPT_PHASE2.md` in your existing repo, next to `docs/BUILD_PROMPT.md`.
> 2. In Claude Code, say:
>    `Read docs/BUILD_PROMPT.md and docs/BUILD_PROMPT_PHASE2.md, then do Step 0 (audit) only and stop for my review.`
> 3. Then go step by step: `Do Step 1 and stop.`

---

## 0. Context and ground rules (read first)

You are continuing work on my existing **SA Wellbeing Platform** (Next.js App Router + TypeScript + Tailwind + Supabase + Vercel, with a demo mode that runs without Supabase). The original spec is `docs/BUILD_PROMPT.md`; everything in it still applies (design tokens, privacy rules, the "screening, not diagnosis" principle, one-file flag rules, phased work, tests). **Dzongkha labels were removed from scope. Do not add them.**

We are now adding features inspired by two real platforms:

- **Kooth (UK):** a free, anonymous, NHS-commissioned online wellbeing service for young people, with text-based support from qualified practitioners, self-care activities, journaling and goal-setting, and **pre-moderated** discussion boards. It positions itself as *one part of a wider support system, not a replacement* for school or health services.
- **Panorama Education (US):** student surveys plus staff dashboards, **counsellor caseload and intervention tracking**, a **multi-school heat-map view** for leaders, **detection of sensitive content in free-text responses** (abuse, bullying, violence), and **short student check-ins between survey windows**. Panorama states publicly that its survey is *not designed to identify students who need mental health treatment*. We take the same position: our flags are a screening aid, not a diagnosis.

Our lessons from them, which must shape every decision:
1. **Anonymity by default:** students never type their name.
2. **A human in the loop:** no AI talks to students, and no automated decision replaces the counsellor.
3. **Be honest about what the tool is and isn't:** it's not an emergency service and not a diagnosis.
4. **Part of a system:** the app supports the school counsellor and points to real-world help. It never replaces them.

### Hard rules
- **Protect the original Must items (AC-01 to AC-05).** Nothing in this phase may break them. Run the existing tests after every step.
- **Every new feature sits behind a feature flag** in `lib/features.ts` (e.g. `FEATURES.studentPortal`, `FEATURES.messaging`, `FEATURES.peerBoard`), so I can switch off anything unfinished before submission with a one-line change.
- **First inspect the existing code and adapt to it.** Reuse the existing components, design tokens, `lib/flags.ts`, `lib/suppression.ts`, Supabase clients and folder structure. Do not rewrite working code. If you think something should change, propose it and wait.
- **Synthetic data only.** All seeded messages, journals, posts and check-ins must be obviously fictional and harmless.
- **No AI-generated replies to students, ever.** Any automated text the student sees is fixed, pre-written copy.
- **Never invent helpline numbers.** Use `TODO(confirm with CECD)` placeholders.
- After each step: run lint, tests and `npm run build`, give me a 5-line summary I can explain in the interview, suggest a commit message, and **stop**.

---

## 1. Feature map (what we're borrowing and how it fits)

| ID | Feature | Inspired by | Who uses it | Priority |
|---|---|---|---|---|
| P-01 | **Interventions & caseload tracking** (log meetings/actions per student, see your caseload) | Panorama | Counsellor | **Core** |
| P-02 | **Sensitive free-text detection, upgraded** (categories: self-harm, abuse/violence, bullying, home safety) with "reviewed" tracking | Panorama | Counsellor | **Core** |
| P-03 | **Supervisor heat map** (school × flag level, suppressed) | Panorama | Supervisor | **Core** |
| P-04 | **Pulse check-ins** between surveys (2–3 short questions the counsellor sends to a class) | Panorama | Counsellor + Student | Should |
| K-01 | **Student portal with anonymous code access** | Kooth | Student | **Core** (other K features depend on it) |
| K-02 | **"Talk to my counsellor": async, private messaging** with a human counsellor | Kooth | Student + Counsellor | **Core** |
| K-03 | **Self-care activities library** (static, pre-written, safe content) | Kooth | Student | Should |
| K-04 | **Private journal & goals** (private by default; the student chooses what to share) | Kooth | Student | Should |
| K-05 | **"What this is / isn't" + "Get help now" page**, linked from every student screen | Kooth | Student | **Core** |
| K-06 | **Pre-moderated peer board** (posts go live only after counsellor approval) | Kooth | Student + Counsellor | **Could: last, and only if everything else is solid** |

Build order: **K-05 → K-01 → P-01 → P-02 → K-02 → P-03 → P-04 → K-03 → K-04 → K-06.**

---

## 2. Student access (K-01): anonymous, no names, no passwords

- The counsellor generates **one-time access codes** per student (e.g. `GK-7Q4M`, 6–8 chars, no confusable characters like 0/O, 1/I/l) from the counsellor board, printable as slips.
- The student goes to `/student`, enters the code and is signed in **anonymously**. Use Supabase `signInAnonymously()`, then a server-side RPC `redeem_access_code(code)` that links the anonymous `auth.uid()` to the `student_id` in a `student_accounts` table and marks the code as used.
- Codes expire (configurable, default 14 days) and can be revoked/regenerated by the counsellor.
- **Shared-device safety:** auto sign-out after 10 minutes idle, a visible "Leave / Sign out" button on every screen, and no browser-saved credentials.
- **Demo mode:** offer "Try as a demo student (S-0xx)" with data kept in `localStorage` and the existing demo banner.
- Students **never** see their flag level, reasons, or anything counsellor-only.

---

## 3. Feature specifications

### K-05 — "About this space" + "Get help now" (build first, it's small and sets the tone)
- `/student/about`, in plain language (reading level about class IV–V):
  - **What this is:** a private space to check in, talk to *your school counsellor* and try self-care activities.
  - **What it isn't:** not an emergency service, not a diagnosis, not a test, and nothing affects your marks.
  - **Who can see what:** a simple table: *Your messages → only your counsellor. Your journal → only you, unless you choose to share an entry. Board posts → read by a counsellor before anyone else sees them, and shown without your name.*
  - **Honest limits of confidentiality:** "If you tell us you might be in danger, your counsellor will talk with you to help keep you safe."
- A persistent **"Get help now"** button (calm teal, not red) in the student header that opens a sheet with: *talk to a trusted adult now*, your counsellor's office/hours, and helpline placeholders `TODO(confirm with CECD)`.

### P-01 — Interventions & caseload tracking
- New table `interventions`: `id, student_id, type (check_in_meeting | group_session | parent_contact | referral_external | classroom_support | other), notes, outcome (improved | no_change | concern_increased | n/a), follow_up_date, created_by, created_at`.
- In the student detail drawer: an "Add intervention" form (max 4 fields visible; progressive disclosure for the rest) and a **timeline** that combines follow-up status changes (existing audit log), interventions and messages metadata (not content).
- **"My caseload"** tab on the counsellor board: students with an open follow-up, sorted by flag level, then by **overdue follow-up date** (shown with an icon and text, not colour alone).
- **Urgent safety net:** an Urgent student with no intervention logged within a configurable window (default 24 h) shows an "Overdue: urgent, no contact logged" banner at the top of the board.
- Supervisor sees **only aggregate counts** of interventions by type per school (suppressed under 5), never notes.

### P-02 — Sensitive free-text detection (upgrade of extra rule E2)
- Move the keyword lists into `lib/sensitiveText.ts` with **categories**: `self_harm`, `abuse_violence`, `bullying`, `home_safety`, `distress`. Each category has its own editable list and a plain-language label ("May mention not feeling safe at home").
- It applies to: the survey `comment`, student **messages** (K-02), **check-in** free text (P-04), **journal entries the student has chosen to share** (K-04) and **board posts awaiting moderation** (K-06).
- **It never scans a private, unshared journal entry.** Scanning private writing would be surveillance and would break the trust promise on the About page. Add a test that proves this.
- Matches show a **"Needs reading"** chip with the category on the counsellor board. Counsellors can mark it "Reviewed" (stored, with who/when), so the chip clears and doesn't nag.
- A match in `self_harm` from a **message** raises an in-app alert for the counsellor (a banner plus a count badge). It does **not** change the survey-based flag level automatically; the counsellor decides. Document why: a human in the loop, and avoiding alarm fatigue.
- Clearly label it everywhere as "keyword matching: may miss things or match innocently. Always read in context."
- Unit tests: category matching, case-insensitivity, word boundaries (e.g. "hit" must not match "white" or "this"), and no scanning of private journals.

### P-03 — Supervisor heat map
- On `/supervisor`, add a **heat-map grid**: rows = schools (and expandable classes), columns = Urgent / High / Review / None, cell shade = **share of students** in that level.
- Use a **single-hue sequential scale** (light to dark teal from the existing palette), not red-to-green. Sequential single-hue scales are easier to read in order and safe for colour-blind viewers. **Every cell also prints its number** (or `<5`), so colour is never the only cue.
- Uses the **same server-side suppressed aggregates** as AC-05, including complementary suppression. Suppressed cells are shown hatched/grey with `<5`. Reuse `lib/suppression.ts`; don't duplicate logic.
- Optional toggle: counts vs percentages. Percentages for suppressed groups are also hidden.
- The test asserting no `S-` IDs in supervisor responses must still pass.

### K-02 — "Talk to my counsellor" (async messaging with a human)
- Tables: `conversations (id, student_id, status open|closed, created_at)` and `messages (id, conversation_id, sender_role student|counsellor, body, created_at, read_at)`.
- **Student side:** a simple chat screen with an empty-state message: "Your counsellor usually replies within [X] school days. If you need help right now, tap Get help now." Show **counsellor hours** and an auto-reply outside hours (fixed text, not AI).
- **Counsellor side:** an "Inbox" tab with unread count; conversations show the student ID, school, class and the current flag badge (counsellor-only context).
- **Safety:** messages pass through P-02. A `self_harm` or `abuse_violence` match shows the student a fixed, caring message immediately ("Thank you for telling us. Your counsellor will see this. If you are in danger now, please tell a trusted adult or use Get help now.") and alerts the counsellor.
- RLS: a student can read/write only their own conversation; counsellors only for students in their school; **supervisors: no access at all.**
- Realtime is optional (Supabase Realtime); polling every 20–30 s is acceptable and simpler to explain.
- Rate limit student messages lightly (e.g. 30/hour) to prevent spam on shared devices.

### P-04 — Pulse check-ins
- The counsellor creates a check-in for a school/class: 2–3 questions picked from a small, pre-approved bank (e.g. "How are you feeling this week?" on a 1–4 face scale; "Is anything worrying you?" Yes/No/Prefer not to say; an optional short comment).
- Students see it on their portal home ("Your counsellor sent a quick check-in: 1 minute"). It's optional and skippable.
- Responses appear in the student's detail timeline. Optional simple rule: a "1" on feeling or a "Yes" on worry adds a "Check-in: needs follow-up" reason **without** overriding the survey flag. Keep it in `lib/flags.ts` as a clearly labelled extra rule.
- Supervisor view: **response rates only** (suppressed), never answers.

### K-03 — Self-care activities library
- Static, pre-written content in `content/activities/*.md` (or a typed TS file): 6–8 short activities, e.g. box breathing, 5-4-3-2-1 grounding, a sleep wind-down routine, "write three good things", how to talk to a trusted adult, what to do if someone bullies you.
- Each activity takes 1–3 minutes, has numbered steps and a gentle illustration/icon, uses `prefers-reduced-motion`-safe animation (e.g. a breathing circle), and ends with "Want to talk about it? Message your counsellor".
- Mark content `TODO(review by CECD counsellor)`. No medical claims.

### K-04 — Private journal & goals
- `journal_entries (id, student_id, body, mood 1–4 nullable, shared boolean default false, created_at)` and `goals (id, student_id, title, done boolean, created_at)`.
- **Private by default.** A clear toggle per entry: "Share this entry with my counsellor". Shared entries appear in the counsellor timeline and pass through P-02; private entries are **never** readable by counsellors (enforce with RLS and test it).
- Goals: simple checklist with gentle encouragement copy. No streaks, no guilt, no badges.

### K-06 — Pre-moderated peer board (Could: last, behind a flag, default OFF)
- Students post short messages on a few topics ("Exam stress", "Friendships", "Things that help me"). Posts are **shown without names or IDs** (random friendly alias per post, e.g. "Blue Mountain").
- **Every post enters a moderation queue** (`status pending|approved|rejected`) and becomes visible only after a counsellor approves it (Kooth's model). P-02 matches are highlighted in the queue; a self-harm/abuse match is routed to the counsellor's private follow-up, not published.
- No direct messages between students, no images, no links.
- If time is short, **skip building it** and describe it in the README's "What I'd build next", with this design.

---

## 4. Database & security additions

- New migration `supabase/migrations/00X_phase2.sql` with all new tables, **RLS enabled on every table**, and policies:
  - Students: access **only their own rows** (via `student_accounts.auth_uid = auth.uid()`), and only the columns they need.
  - Counsellors: rows for students in their school (or all if `profiles.school is null`, demo only), **except private journal entries**.
  - Supervisors: **no row-level access** to any student-linked table; aggregates only via server routes that apply `lib/suppression.ts`.
- Indexes on `student_id`, `conversation_id`, `created_at`.
- Seed script extension: synthetic access codes, a few harmless sample messages/interventions/check-ins, the activities content, and **zero** real-looking disclosures beyond what's needed to demo P-02 (use mild, clearly fictional text).
- **RLS tests** (SQL or integration): a student cannot read another student's messages; a counsellor cannot read a private journal; a supervisor cannot select from `messages`, `interventions`, `journal_entries` or `students`.

---

## 5. Design (reuse the existing system; additions only)

- Reuse all tokens from `docs/DESIGN.md`. **Student screens use the student palette** (`--student-bg #EEF5F1`, `--student-accent #2E6B4F`): no red anywhere on student screens, ever.
- Student home: max **4 big tiles** (Hick's law): *Talk to my counsellor · Check-in (if one is waiting) · Self-care activities · My journal*. The *Get help now* button is always in the header.
- 18 px body text on student screens, tap targets ≥ 48 px, one main action per screen, a progress indicator wherever there are steps.
- The counsellor board gets new tabs, **Board · My caseload · Inbox · Moderation (if K-06 on)**, each with a count badge. Badges use text + number, not colour alone.
- The heat map uses a single-hue sequential teal scale with printed numbers (see P-03).
- Update `docs/DESIGN.md` with a short section explaining each new design decision and its reason, in the same "choice → why" style as before.

---

## 6. Tests to add (Vitest + RLS checks)
- `sensitiveText.test.ts`: categories, word boundaries, case, **no private journal scanning**.
- `interventions.test.ts`: the overdue-urgent logic.
- `suppression.test.ts`: heat-map cells reuse suppression; complementary suppression still holds; no IDs in output.
- `accessCodes.test.ts`: generation (no confusable chars), expiry, single use, revocation.
- RLS checks listed in section 4.
- **All original tests must still pass**, including the exact flag counts (baseline 2/9/17/44; with extra rules 2/17/17/36).

---

## 7. Documentation updates
- **README** (still about 1 page; move detail to `docs/`): add a "Phase 2: inspired by Kooth and Panorama" paragraph naming the two platforms and the four lessons in section 0. Add new demo steps (student code, inbox, heat map). Update "What works / what doesn't" honestly.
- `docs/AC_TRACE.md`: add rows for P-01…P-04 and K-01…K-06 with files and demo steps.
- `docs/SAFEGUARDING.md` (new, about 1 page): escalation flow (student message → keyword match → counsellor alert → logged intervention), what is never automated, private-journal guarantee, moderation policy, data retention placeholder `TODO(confirm with CECD)`, and the statement *"This tool supports school counsellors; it is not an emergency service and does not diagnose."*
- Add to the pitch outline: a 30-second segment, "What I learned from Kooth and Panorama, and what I deliberately did *not* copy" (no AI chat with children; private journals stay private; peer board only with pre-moderation).

---

## 8. Steps (stop after each)

- **Step 0: Audit (no code changes).** Read the codebase and summarise current structure, what works, test status, and any risks to AC-01…AC-05. Propose exact files you'll add or change for this phase. Wait for approval.
- **Step 1:** `lib/features.ts` + K-05 (About / Get help now) + student layout shell.
- **Step 2:** K-01 anonymous code access (Supabase + demo mode) + access code tests.
- **Step 3:** P-01 interventions, caseload tab, overdue-urgent banner + tests.
- **Step 4:** P-02 sensitive-text categories + "Reviewed" tracking + tests.
- **Step 5:** K-02 messaging (student + counsellor inbox) with safety responses + RLS tests.
- **Step 6:** P-03 supervisor heat map (reusing suppression) + tests.
- **Step 7:** P-04 pulse check-ins.
- **Step 8:** K-03 activities + K-04 journal & goals (private-by-default test).
- **Step 9 (optional):** K-06 pre-moderated board, behind a flag, default OFF.
- **Step 10:** Docs (README, AC_TRACE, DESIGN, SAFEGUARDING), accessibility pass (Lighthouse/axe ≥ 95 on new pages, keyboard, 360 px mobile), final `npm run build`.

## 9. Definition of done
- Original AC-01…AC-05 still pass; all old and new tests pass; build and lint are clean.
- Every new feature can be switched off in `lib/features.ts` without errors.
- A student can enter a code, read About, message their counsellor, do an activity and write a private journal entry, **without ever seeing a flag or typing a name**.
- A counsellor can see their caseload, log interventions, read messages, clear "Needs reading" chips, and (if on) moderate posts.
- A supervisor sees counts, heat map and response rates only, all suppressed, with no IDs anywhere.
- At the end, give me: a **2-minute explanation of Phase 2**, the **three most likely interview questions** about safeguarding and privacy with short answers, and **three likely live-change requests** with the exact file/line to change (e.g. add a keyword to a category; change the urgent overdue window from 24 h to 12 h; switch the peer board on).
