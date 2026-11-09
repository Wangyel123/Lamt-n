# BUILD PROMPT — SA Wellbeing Platform: Counsellor Flag Board

> **How to use this file**
> 1. Create the repo, then put these files in it:
>    - `docs/Build_Challenge_Candidate_Brief.pdf` (the challenge brief)
>    - `data/SA_sample_dataset_SYNTHETIC.csv` (the synthetic dataset)
>    - `docs/BUILD_PROMPT.md` (this file)
> 2. Start Claude Code in the repo root and say:
>    `Read docs/BUILD_PROMPT.md, docs/Build_Challenge_Candidate_Brief.pdf and data/SA_sample_dataset_SYNTHETIC.csv. Then do Phase 0 only and stop for my review.`
> 3. Then go one phase at a time: `Do Phase 1 and stop.` and so on.

---

## 0. Your role and how to work with me

You are a senior full-stack engineer and UX designer pairing with me on a **one-day take-home build challenge** for the Pelsung Tech Wing (Bhutan). I am the candidate. In the interview I will have to **explain every line and make a small live change**, so:

- **Keep the code simple and readable over clever.** No unnecessary abstractions. Use plain TypeScript, small files and clear names.
- **Comment the "why", not the "what"**, especially in the flagging rules, the privacy logic and the supervisor suppression.
- **All flagging rules live in ONE file** (`lib/flags.ts`) so I can change a rule live in under a minute.
- **Work in phases (section 12).** After each phase: run the app, run tests, run `npm run build`, give me a 5-line summary of what changed and how to explain it, suggest a git commit message, then **stop and wait for me**.
- **Never invent facts.** If something is unknown (e.g. a Bhutan helpline number), leave a clearly marked `TODO(confirm with CECD)` placeholder.
- **The Must items come first.** The brief says: *"A smaller prototype that works beats a bigger one that breaks."* Do not start Should/Could items until all Musts pass.
- If a requirement here conflicts with the brief PDF, **the brief wins**. Tell me about the conflict.

---

## 1. The problem (summary of the brief)

Every year, students in many Bhutanese schools complete the **Situational Analysis (SA)** wellbeing survey. Only the school counsellor sees the answers and uses them to reach students who need help early. The Career Education & Counselling Division (CECD) of MoESD wants one platform that can: run the survey, flag students who may be at risk, track every follow-up, and show supervisors patterns across schools **without showing any student's identity**.

We are building the **first small piece**: a **Counsellor Flag Board**, plus a **Supervisor View**, plus (only if time allows) a gentle **Student Survey** page.

**Privacy rule (non-negotiable):** this is children's mental-health data. Use ONLY the synthetic dataset. Treat it as if it were real. Never paste real student data anywhere. Never log student rows to the console or to analytics.

---

## 2. Acceptance criteria (from the brief, all must be traceable in code and README)

| ID | Criterion | Priority |
|---|---|---|
| AC-01 | App loads the provided CSV and shows every student by ID, school and class (no names exist) | **Must** |
| AC-02 | Each student gets a flag level (Urgent, High, Review, None) using the baseline rules, and the **reason** is shown next to the flag | **Must** |
| AC-03 | Urgent students always appear at the top and are visually unmistakable | **Must** |
| AC-04 | Counsellor can set each flagged student's follow-up status: Not started / In progress / Closed | **Must** |
| AC-05 | Separate supervisor view: flag counts by school and class, **no student IDs**, any group with fewer than 5 students shown as `<5` | **Must** |
| AC-06 | Filter/search the counsellor list by school, class or flag level | Should |
| AC-07 | Follow-up statuses survive a page refresh | Should |
| AC-08 | Propose and implement one extra rule or improvement, explained in README | Should |
| AC-09 | Any of: public deployment, chart on supervisor view, Dzongkha labels, mobile-friendly layout | Could (we aim for **all four**) |

Add a small `docs/AC_TRACE.md` table mapping every AC to the files that implement it and how to demo it.

---

## 3. Tech stack (fixed)

- **Next.js** (latest stable, App Router, TypeScript, `src/` optional, ESLint)
- **Tailwind CSS** for styling, with design tokens from section 8 defined as CSS variables
- **Supabase**: Postgres for storage, Supabase Auth for login, Row Level Security (RLS) for privacy
- **Vercel** for deployment, **GitHub** for code (public repo)
- **papaparse** for CSV parsing
- **recharts** for the supervisor chart
- **lucide-react** for icons
- **Vitest** for unit tests of the flagging rules and the suppression logic
- Use `@supabase/ssr` for auth in the App Router
- Keep dependencies minimal. Before adding any other package, tell me why.

### "Runs with one command" (brief requirement)
Reviewers may NOT have Supabase credentials. So the app must have **two modes**:

1. **Demo mode** (no env vars set): reads `data/SA_sample_dataset_SYNTHETIC.csv` directly, stores follow-up statuses in `localStorage`, and offers a role switcher ("View as Counsellor / View as Supervisor") with a visible banner: *"Demo mode: synthetic data, saved only in this browser."*
2. **Live mode** (Supabase env vars present): real login, data in Supabase, statuses in Postgres.

`npm install && npm run dev` must work out of the box in demo mode. Provide `.env.example`. Put the mode switch in one place (`lib/mode.ts`). Both modes must use the **same** `lib/flags.ts` and `lib/suppression.ts`.

---

## 4. Data: loading, cleaning and data-quality reporting

The CSV has 72 students across 4 schools. Columns:
`student_id, school, class, q1_sleep_well (1–4), q2_safe_at_home (1–4), q3_bullied (Never/Sometimes/Often), q4_trusted_adult (Yes/No), q5_sad_most_days (Yes/No), q6_thoughts_of_self_harm (Yes/No/Prefer not to say), q7_wants_counsellor (Yes/No), comment (optional free text)`

The brief says the data is "not perfectly clean". I have already analysed it. Known issues (write tests for each):

| Student | Issue | Correct handling |
|---|---|---|
| **S-045** | `q3_bullied = "often"` (lowercase) | Normalise (trim + case-insensitive) → **High**. Exact string matching would wrongly give None. |
| **S-010** | `q1_sleep_well` is blank | Treat as **missing**, never as "fine". Show a "Missing answer: sleep" note so the counsellor can check. |
| **S-023** | Comment: *"Sometimes I don't want to go home"* | Baseline rules ignore comments → None. Our extra rule (AC-08) raises it. |
| S-016, S-027, S-029, S-047, S-051, S-052, S-055, S-058 | `q6 = "Prefer not to say"` | Baseline: 7 of these 8 get **None**. Our extra rule raises them (section 5.3). |

Requirements:
- `lib/parseCsv.ts`: parse, trim every field, normalise case for categorical answers, convert q1/q2 to numbers, mark invalid or blank values as `null` with a `dataIssues: string[]` list per student. **Never silently drop a row.** If a row is unparseable, keep it and flag it "Data problem: check manually".
- Show a small, calm **"Data check"** panel on the counsellor board: "72 students loaded · 1 missing answer · 1 answer fixed for spelling/case". Expandable to show which student IDs.
- Check for duplicate `student_id`s (none currently, but handle it).

---

## 5. Flagging rules (`lib/flags.ts`, the heart of the app)

### 5.1 Baseline rules (exactly as the brief states, AC-02)
Apply in order. **The first rule matched sets the flag level.**
1. **Urgent:** q6 = Yes
2. **High:** q3 = Often, OR q2 = 1
3. **Review:** any two of (q1 ≤ 2, q5 = Yes, q4 = No), OR q7 = Yes
4. **None:** everything else

### 5.2 Show ALL reasons, not just the first
The level comes from the first match, but the counsellor should see **every** condition the student meets, in plain, kind language, for example:
- q6 = Yes → "Said yes to thoughts of self-harm"
- q3 = Often → "Bullied often"
- q2 = 1 → "Never feels safe at home"
- q1 ≤ 2 → "Sleeps poorly"
- q5 = Yes → "Feels sad most days"
- q4 = No → "No trusted adult to talk to"
- q7 = Yes → "Asked to see the counsellor"

The primary reason (the one that set the level) appears first and in bold.

### 5.3 Extra rules (AC-08), clearly labelled as OUR proposal
Implement as a separate, clearly commented section with a **toggle on the counsellor board: "Use proposed extra rules (recommended)"**, default ON, so reviewers can compare against the pure baseline. The extra rules only **raise** a level, never lower it:
- **E1 — "Prefer not to say" on self-harm → at least High.** Reason: "Chose not to answer the self-harm question. Check in gently." Rationale: a skipped sensitive question is a signal; under the baseline, 7 of these 8 students vanish into None. It is not Urgent, because many students skip sensitive questions for privacy, not risk.
- **E2 — Comment keywords → at least Review.** A short, editable keyword list (`home, hit, hurt, scared, afraid, unsafe, alone, die, kill, beat`) matched case-insensitively. Reason: "Comment may need reading". Show the comment text on the student's detail panel (counsellor only). Clearly state that this is a crude screen, not language understanding.
- **E3 — Missing answer → "Needs check" badge** (not a level change): missing data is never treated as "fine".

### 5.4 Expected results (unit tests MUST assert these exact counts)
- **Baseline (with normalisation):** Urgent **2** (S-005, S-038) · High **9** (S-001, S-002, S-014, S-020, S-025, S-045, S-049, S-068, S-070) · Review **17** · None **44**
- **Baseline + extra rules:** Urgent **2** · High **17** · Review **17** · None **36**
  - Changes: S-016 Review→High; S-027, S-029, S-047, S-051, S-052, S-055, S-058 None→High; S-023 None→Review

Each rule function must be pure and testable. Include a test for every row in the table in section 4.

### 5.5 Screening, not diagnosis
Show a persistent, small line on the board: *"Flags are a screening aid to help you decide who to meet first. They are not a diagnosis. Your professional judgement comes first."*

---

## 6. Screens and user experience

### 6.1 Login (live mode) / Role chooser (demo mode)
- Calm, simple, one column. App name: **"SA Wellbeing — Counsellor Board"** (Dzongkha subtitle if available).
- Demo accounts seeded in Supabase (document them in the README): `counsellor@demo.bt` (all schools, demo only) and `supervisor@demo.bt`. Passwords only in README for the reviewers; this is synthetic data.

### 6.2 Counsellor Board (AC-01 to AC-04, AC-06, AC-07)
Layout (desktop):
- **Top:** summary strip with 4 count cards (Urgent / High / Review / None) that also act as filters.
- **Urgent section pinned at the very top**, always visible regardless of sort, with a distinct treatment (section 8.3). AC-03 means unmistakable by **position + colour + icon + text label + border weight**, never colour alone.
- **Filters:** school, class, flag level, follow-up status, plus a search box by student ID (AC-06). Show active filters as removable chips and a "Clear filters" button.
- **List:** one row/card per student: ID · School · Class · Flag badge · Reasons · Follow-up status control · "Needs check" badge if applicable.
- **Sort order:** Urgent → High → Review → None; within a level, Not started first, then In progress, then Closed; then by ID.
- **Follow-up status (AC-04):** a 3-option segmented control (Not started / In progress / Closed) only for flagged students (None students show "No follow-up needed" with an option to "Add follow-up anyway", because counsellors may know things the survey doesn't).
  - Optional short private note per student, plus a "last updated" time.
  - **Closing an Urgent case requires a short note** (one confirm step). It must not be a single accidental click.
  - Save optimistically, show a subtle "Saved ✓" confirmation, and handle errors kindly ("Couldn't save, try again").
- **Persistence (AC-07):** live mode uses the Supabase table `follow_ups`; demo mode uses `localStorage`. Both survive refresh.
- **Detail drawer** (click a student): all answers in plain language, all reasons, the comment, data issues, and follow-up history.
- **Empty states** are friendly: "No students match these filters."

Mobile (AC-09): the list becomes stacked cards, filters move into a bottom sheet, tap targets are ≥ 44×44 px, and there is no horizontal scrolling.

### 6.3 Supervisor View (AC-05, plus a chart for AC-09)
- **A completely separate route** (`/supervisor`) and role. Supervisors can never fetch student-level rows.
- Table: rows = school → class; columns = Urgent / High / Review / None / Total.
- **Small-group suppression (`lib/suppression.ts`):**
  - Any class (group) with **fewer than 5 students** shows `<5` in every cell for that group.
  - **Prevent back-calculation (complementary suppression):** if suppressing a class means a school total could reveal the hidden numbers by subtraction, also suppress the school-level breakdown, or the next-smallest class. Dataset facts: School A VIII has 3 students, School B XI has 4, School D XI has 2; **School D has only 8 students in total.**
  - Also suppress any non-zero cell under 5 where showing it could identify individuals. Explain the chosen interpretation in the README. The brief is ambiguous about whether "<5" means group size or cell count, so we take the stricter reading and say so.
  - Unit-test the suppression, including a test that no student ID ever appears in the supervisor API response.
- **Chart:** a stacked or grouped bar chart of flag levels per school, using the same suppressed numbers (never raw ones). Colour plus pattern/labels, never colour alone.
- **Where suppression happens:** on the **server** (a Next.js route handler / server component, or a Postgres function). The browser only ever receives already-aggregated, already-suppressed numbers.
- A line at the top: *"Counts only. No student can be identified from this page. Groups under 5 are hidden."*

### 6.4 Student Survey page (OPTIONAL, only after all Musts and Shoulds are done)
The brief's long-term platform "runs the survey". If time allows, build `/survey` to show how a student would answer, writing into the same schema (synthetic/demo only). See section 9 for the comfort design rules. If there's no time, describe it under "What I'd build next" in the README with a mock screenshot.

### 6.5 Dzongkha labels (AC-09)
- A simple English ⇄ རྫོང་ཁ toggle for **UI labels only** (headings, buttons, flag names, statuses) using a tiny dictionary file `lib/i18n.ts`.
- Mark Dzongkha strings as `TODO(verify with native speaker)`. **Do not machine-invent translations and present them as verified.**
- Font: load a Tibetan-script font that renders Dzongkha well. Check availability on Google Fonts / `next/font` first: **Jomolhari** (designed for Dzongkha) or **Noto Serif Tibetan** as fallback. Increase line-height for Tibetan script (stacked glyphs need more vertical room).

---

## 7. Supabase: schema, security and seeding

### 7.1 Tables (create `supabase/migrations/001_init.sql`)
- `profiles` (`id uuid` PK → `auth.users`, `role text check in ('counsellor','supervisor')`, `school text null` where null = all schools, demo only)
- `students` (`student_id text PK`, `school`, `class`, `q1`…`q7`, `comment`, `data_issues text[]`, `imported_at timestamptz`)
- `follow_ups` (`student_id text PK FK`, `status text check in ('not_started','in_progress','closed')`, `note text`, `updated_by uuid`, `updated_at timestamptz`)
- `follow_up_events` (append-only audit log: `id`, `student_id`, `old_status`, `new_status`, `note`, `changed_by`, `changed_at`). "Track every follow-up" is in the CECD goals.

### 7.2 Row Level Security (must be ON for every table)
- Counsellors: `select` on `students` and `select/insert/update` on `follow_ups` only for their school (or all if `school is null`).
- Supervisors: **no select on `students` or `follow_ups` at all.** They get counts only via a server route using the service role key **on the server**, which returns suppressed aggregates.
- The `SUPABASE_SERVICE_ROLE_KEY` must **never** be exposed to the client (no `NEXT_PUBLIC_` prefix). Add a comment warning.
- Comments (free text) are only visible to counsellors.

### 7.3 Seeding
- `npm run seed`: a script that reads the CSV, runs the same parser, upserts into `students`, and creates the demo users/profiles. It is idempotent.
- Flags are **computed in TypeScript** (`lib/flags.ts`), not stored, so changing a rule changes the board instantly (important for the live interview change).

### 7.4 Environment
`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server only, never expose
```

---

## 8. Visual design system, with the reason for every choice

Put all of this into `docs/DESIGN.md` (with the "why" for each choice) and implement it as CSS variables / Tailwind theme tokens in one place (`app/globals.css` + `tailwind.config`).

**Honesty note to include in DESIGN.md:** the strongest evidence in UI design is for **contrast, legibility, consistency and reducing cognitive load**. Claims that a specific colour causes a specific emotion are weaker and culturally variable. So we choose colours mainly for **accessibility and low arousal**, and treat emotional associations as a secondary, modest consideration. Saying this openly is more scientific than overclaiming.

### 8.1 Colour palette (all pairs checked against WCAG 2.2 AA; contrast ratios already computed)

| Token | Hex | Use | Contrast | Why |
|---|---|---|---|---|
| `--bg` | `#F7F6F2` | Page background (warm off-white) | text on it 13.56:1 | Pure white (#FFF) at full screen brightness causes more glare. A slightly warm off-white is gentler for long sessions while keeping strong contrast. |
| `--surface` | `#FFFFFF` | Cards, panels | — | Cards lift slightly off the background. Figure–ground separation (Gestalt) without heavy borders. |
| `--text` | `#1E2A32` | Body text (deep blue-grey) | 13.56:1 on bg | Very high contrast, but softer than pure black, which can cause "halation" (letters seeming to vibrate) on bright screens. |
| `--text-muted` | `#4A5866` | Secondary text | 6.75:1 on bg | Still passes AA 4.5:1 for normal text, so muted text never becomes unreadable. |
| `--primary` | `#1F6F78` | Buttons, links, focus (calm teal) | white on it 5.83:1 | Blue-green hues of **lower saturation** were rated more pleasant and less arousing in colour-emotion studies (e.g. Valdez & Mehrabian, 1994: saturation and brightness drive arousal more than hue). A calm, non-alarming base suits a sensitive topic. Teal is also distinct from every flag colour, so primary actions are never confused with risk. |
| `--urgent` | `#B42318` / tint `#FEF3F2` | Urgent badge (solid) / Urgent row background (tint) | 6.57:1 white-on-solid; 6.05:1 on tint | Red is a learned, near-universal "stop/danger" convention, needed for AC-03. Used **only** for Urgent so it keeps its meaning and avoids alarm fatigue. A dark red keeps white text readable. |
| `--high` | `#B54708` / text `#93370D` on tint `#FFFAEB` | High | 5.43:1 white-on-solid; 7.21:1 on tint | Amber/orange is a conventional "warning" step below red. Its lightness differs from red so it is distinguishable in greyscale and for colour-blind users. |
| `--review` | `#6941C6` / text `#5925DC` on tint `#F4F3FF` | Review | 6.62:1; 7.02:1 | Violet sits away from the red–green confusion axis, so it stays distinct for people with red–green colour-vision deficiency (roughly 1 in 12 males of Northern European descent; prevalence varies by population). |
| `--none` | `#475467` / text `#344054` on `#F2F4F7` | None | 7.69:1; 9.49:1 | Neutral grey says "no action needed" without implying "good" or "bad" about a child. |
| `--student-bg` | `#EEF5F1` | Student survey background (soft sage) | text 13.24:1 | Soft, desaturated green has natural/restful associations (modest evidence, see Attention Restoration Theory, Kaplan & Kaplan). Very low saturation = low arousal. No red anywhere on student screens. |
| `--student-accent` | `#2E6B4F` | Student buttons | white on it 6.3:1 | Calm, readable, encouraging. |

Rules:
- **Never use colour alone to carry meaning** (WCAG 1.4.1). Every flag also has an icon + text label (Urgent: `AlertOctagon`, High: `AlertTriangle`, Review: `Eye`/`MessageCircle`, None: `Minus`).
- Test with a colour-blindness simulator (Chrome DevTools → Rendering → Emulate vision deficiencies) and note the result in DESIGN.md.
- Optional dark mode only if time allows; not required.

### 8.2 Typography
- **Primary font: Atkinson Hyperlegible** (via `next/font/google`). *Why:* designed by the Braille Institute for maximum legibility, especially for low-vision readers. It deliberately makes easily confused characters distinct (I / l / 1, O / 0, B / 8). That matters for IDs like `S-001`, `S-010` and Roman-numeral classes like `XI` vs `XII`. Many users read English as a second language, and clear letterforms reduce reading effort.
- **Numbers in tables:** use `font-variant-numeric: tabular-nums` (if the font supports it; otherwise verify alignment) so counts line up in columns for easy comparison.
- **Dzongkha:** Jomolhari or Noto Serif Tibetan (section 6.5).
- **Sizes:** body 16 px minimum (counsellor), **18 px on student screens** (younger readers, from class IV). Headings use a modest scale (≈1.25 ratio) so hierarchy is clear without shouting.
- **Line height 1.5 for body** (WCAG 1.4.12 text spacing), 1.7+ for Dzongkha.
- **Line length 50–75 characters** for paragraphs. Widely cited readability range; longer lines make the eye lose its place.
- Sentence case everywhere (ALL CAPS is slower to read and feels like shouting), except perhaps the tiny "URGENT" badge.

### 8.3 Layout and interaction principles (cite these in DESIGN.md)
- **Visual hierarchy / pre-attentive processing:** Urgent rows use a 4 px left border, tinted background, icon, bold label and top position. Several pre-attentive cues together, so they are noticed in under a second without reading.
- **F-pattern / top-left scanning:** the most important info (Urgent, counts) sits top-left, where eye-tracking studies (Nielsen Norman Group) show people look first.
- **Hick's Law:** fewer choices = faster decisions. Only 3 follow-up statuses; filters hidden behind one button on mobile.
- **Fitts's Law:** large, close targets are faster and less error-prone. Buttons are ≥ 44×44 px (WCAG 2.5.8 sets 24 px as the AA minimum; Apple/Google guidance recommends 44–48), with enough spacing to prevent mis-taps.
- **Cognitive load (Sweller) & progressive disclosure:** the list shows only what's needed to decide who to see first; full answers live in the detail drawer.
- **Recognition over recall** (Nielsen's heuristics): reasons are shown as words, not codes like "q3".
- **Gestalt proximity & common region:** related controls grouped in cards.
- **Feedback & error prevention** (Nielsen): "Saved ✓" after changes; confirmation before closing an Urgent case.
- **Consistency:** the same colour and icon for a flag level everywhere (board, detail, supervisor chart).
- **Calm motion:** minimal animation (≤ 200 ms), and respect `prefers-reduced-motion`.
- **Accessibility:** semantic HTML, keyboard navigable, visible focus ring (teal, 3 px), ARIA labels on icon buttons, `lang` attribute switching for Dzongkha. Run Lighthouse and axe; target Accessibility ≥ 95.

---

## 9. Making students feel comfortable and safe sharing (survey page + all student-facing text)

Base this on **trauma-informed care principles** (SAMHSA's six principles: safety; trustworthiness & transparency; peer support; collaboration & mutuality; empowerment, voice & choice; cultural, historical & gender issues) and on survey-design research about sensitive questions.

1. **Transparency first (trust):** a short welcome screen in plain language (reading level about class IV–V):
   - Who sees your answers: *only your school counsellor.* Teachers, parents and classmates do not.
   - **Honest limits of confidentiality:** *"If you tell us you might be in danger, your counsellor will talk with you to help keep you safe."* Being honest about this is ethically required and builds more trust than false promises.
   - It is not a test. There are no right or wrong answers. Nothing affects your marks.
2. **Choice and control (empowerment):** every question has "Prefer not to say" or can be skipped; the student can go back and change answers; a visible "Take a break / finish later" option.
3. **One question per screen:** lowers cognitive load, works on phones, feels less overwhelming. Show progress ("3 of 7") so the end is in sight; uncertainty about length increases drop-out.
4. **Warm, non-judgemental wording:** e.g. "How often do you sleep well?" with friendly answer options. Keep the dataset's stored values exactly the same (1–4, Never/Sometimes/Often, etc.); only the **display** wording is softened.
5. **Visual answer scales for younger students:** simple, original (not copyrighted) face icons + words for the 1–4 scales. Large tap targets (≥ 48 px).
6. **Order questions gently:** keep the brief's order, but add a short, kind lead-in before the sensitive questions (q5, q6): *"The next questions are about feelings. Answer only if you're comfortable."*
7. **No red, no warnings, no scores shown to students.** Students never see their flag.
8. **A kind ending:** "Thank you for sharing. If you want to talk to someone, you can visit your counsellor any time," plus a help contact placeholder: `TODO(confirm helpline with CECD)`. **Do not invent phone numbers.**
9. **Privacy in practice:** no names collected, no tracking/analytics scripts, no third-party fonts at runtime beyond `next/font` (self-hosted at build time), and the session clears after submission on shared devices.
10. **Cultural fit:** Dzongkha toggle, culturally neutral imagery, respectful tone towards family (the comments mention grandparents and parents working abroad, so avoid assumptions about family structure).

---

## 10. Privacy & security checklist (verify each before deploy; list it in README)
- [ ] Only synthetic data anywhere (repo, Supabase, Vercel, screenshots, video).
- [ ] RLS enabled on all tables; supervisors cannot read student rows (test it).
- [ ] Service role key server-only.
- [ ] Supervisor API returns aggregates only, with suppression applied server-side; a test asserts no `S-` IDs in the response.
- [ ] No student data in `console.log`, error messages or analytics.
- [ ] Comments visible to counsellors only.
- [ ] Demo-mode banner visible.
- [ ] Known limitation documented: `localStorage` in demo mode on a shared school computer is a privacy risk; live mode fixes it.

---

## 11. Repository structure (suggested)
```
app/
  (auth)/login/page.tsx
  counsellor/page.tsx
  supervisor/page.tsx
  survey/page.tsx            # optional
  api/supervisor/summary/route.ts
components/                  # FlagBadge, StudentRow, StatusControl, Filters, SummaryCards, SupervisorTable, SupervisorChart, DemoBanner, LanguageToggle
lib/
  flags.ts                   # ALL rules here
  suppression.ts
  parseCsv.ts
  i18n.ts
  mode.ts
  supabase/{client,server}.ts
data/SA_sample_dataset_SYNTHETIC.csv
supabase/migrations/001_init.sql
scripts/seed.ts
tests/flags.test.ts
tests/suppression.test.ts
tests/parseCsv.test.ts
docs/DESIGN.md
docs/AC_TRACE.md
README.md
```

---

## 12. Phased plan (stop after each phase)

The day is short. I must post a progress update at **15:00** (what's done / what's next / what's blocking), so aim to finish Phase 3 by about 14:30.

- **Phase 0: Plan (≈10 min).** Read the brief + CSV. Confirm you understand. List any questions I should ask in the challenge channel (good questions score points). Scaffold the Next.js + Tailwind + Vitest project and the design tokens. Commit.
- **Phase 1: Data + rules (AC-01, AC-02).** `parseCsv.ts`, `flags.ts`, all unit tests with the exact counts in section 5.4. Tests must pass before UI work.
- **Phase 2: Counsellor board in demo mode (AC-01–AC-04, AC-07 via localStorage).** Urgent pinned and unmistakable, reasons shown, status control, data-check panel.
- **Phase 3: Supervisor view in demo mode (AC-05).** `suppression.ts` + tests (incl. complementary suppression and the no-IDs test), server-side aggregation route.
- **Phase 4: Filters/search (AC-06) + extra rules toggle (AC-08).**
- **Phase 5: Supabase live mode.** Migration, RLS, seed script, auth, roles, follow-ups in Postgres, audit log. Verify RLS by trying to read students as supervisor (must fail).
- **Phase 6: AC-09 extras.** Deploy to Vercel (env vars set there), supervisor chart, mobile layout pass, Dzongkha labels.
- **Phase 7: Polish & accessibility.** Lighthouse/axe, colour-blind simulation, keyboard pass, empty/error/loading states.
- **Phase 8 (optional): Student survey page** (section 9).
- **Phase 9: Docs.** README (max 1 page), DESIGN.md, AC_TRACE.md. Help me draft (but I will personalise) the idea sheet notes, the 150-word email and a 5-minute pitch outline (section 13).

---

## 13. Documents to produce

### README.md (brief limits it to ~1 page, so be concise)
1. What it is (2 lines) + live link + demo logins
2. How to run: `npm install && npm run dev` (demo mode) · live mode setup in 4 steps
3. What works / what does not (honest)
4. Rules & assumptions: baseline rules, normalisation, missing-data handling, extra rules E1–E3 and **why**, the "<5" interpretation and complementary suppression
5. How I used AI tools: list every tool (Claude Code, etc.) + **one prompt that worked and one that failed**. Leave clearly marked placeholders: **I will fill these in honestly myself.**
6. What I'd build next (e.g. survey runner, per-school counsellor accounts, counsellor notes encryption, verified Dzongkha translations, referral pathways, offline support for rural schools)
7. Link to `docs/DESIGN.md` for the design rationale

### Draft helpers (in `docs/drafts/`, for me to rewrite in my own words)
- `idea-sheet-notes.md`: users (counsellor, CECD supervisor, the student indirectly); top 3 pain points (who to see first; tracking who's been met; reporting upward without exposing identities); 5+ first-feature ideas (flag board, survey runner, follow-up tracker, supervisor dashboard, data-quality checker, referral log, reminder for overdue urgent cases); the pick and why; **one thing to challenge** (e.g. "Prefer not to say" falls through to None; "<5" ambiguity; flags must not become labels).
- `email-to-director.md`: **150 words exactly-ish, plain language, no jargon** (no "Next.js", "RLS", "CSV"). Focus on what it does for counsellors and children and how privacy is protected.
- `pitch-outline.md`: 5-minute flow: problem (30 s) → the gap I found ("Prefer not to say", 7 students missed) (45 s) → live demo counsellor board (90 s) → supervisor view & privacy (60 s) → design choices for comfort and accessibility (45 s) → what's next (30 s).

---

## 14. Definition of done
- All Must ACs pass and are demoable; Should ACs done; as many Could items as time allows.
- `npm run test` passes (exact counts from 5.4); `npm run build` passes with no type errors; `npm run lint` clean.
- Works in demo mode with zero configuration; works in live mode on Vercel.
- Lighthouse Accessibility ≥ 95 on counsellor and supervisor pages; usable on a 360 px-wide phone.
- No student ID reachable from the supervisor role (verified by test).
- I can explain every file. At the end, give me a **"How to explain this codebase in 2 minutes"** summary, plus 3 likely live-change requests and exactly where I'd make them (e.g. "make q2 = 2 also High" → `lib/flags.ts` line X; "change <5 to <10" → `lib/suppression.ts` constant; "add a new status" → enum + migration + StatusControl).
