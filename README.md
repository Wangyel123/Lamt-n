# Student Wellbeing: Counsellor Flag Board

Helps school counsellors see which students may need support first, from the Situational Analysis (SA) survey, and track every follow-up. Supervisors see numbers by school, never a student's identity. **Synthetic data only.** It supports counsellors; it is not an emergency service and does not diagnose ([safeguarding](docs/SAFEGUARDING.md)).

**Live:** https://lamtoen.vercel.app · **Demo logins** (synthetic data, so passwords are shared here on purpose): `counsellor@demo.bt` / `Counsellor-Demo-2026` (all schools, demo only) · `counsellor.b@demo.bt` / same (School B only) · `supervisor@demo.bt` / `Supervisor-Demo-2026` (counts only). Students sign in with a one-time code from a counsellor.

## How to run

```bash
npm install && npm run dev      # demo mode: no setup → http://localhost:3000
npm test                        # 168 unit tests (rules, exact counts, privacy, codes, safeguarding logic)
```

**Live mode (Supabase):** 1) copy `.env.example` to `.env.local` (URL, publishable key, secret key) · 2) run `supabase/migrations/001_init.sql`, `002_student_access.sql` and `003_phase2_features.sql` in the SQL Editor, and turn on *Allow anonymous sign-ins* · 3) `npm run seed` · 4) `npm run dev`. `npm run verify:rls` proves the privacy rules by trying to break them. `npm run dev:demo` forces demo mode.

**Demo tour:** Counsellor → the board, a student's details (make a code, add what you did, timeline), *Inbox*, *Check-ins*. Then *I'm a student* → *Try as a demo student* → message the counsellor, write a private journal entry, try an activity, answer a check-in. Supervisor → headline numbers, heat map.

## Phase 2: inspired by Kooth and Panorama

From **Kooth** (UK, anonymous support for young people): anonymous code sign-in, "Talk to my counsellor" with a real person, self-care activities, a private journal and goals, an honest About page, and a pre-moderated peer board (built, switched off). From **Panorama Education** (US): interventions and caseload tracking, keyword "Needs reading" alerts, a supervisor heat map, and short check-ins between surveys. Four lessons shaped every decision: **anonymity by default**, **a human in the loop** (no AI talks to students; nothing automatic replaces the counsellor), **honesty** about what the tool is and isn't, and **being one part of a wider system**. Every feature can be switched off in `lib/features.ts`.

## What works and what doesn't

**Works:** all 9 acceptance criteria and the Phase 2 features ([trace](docs/AC_TRACE.md)); privacy enforced by the database, not just the screens; small numbers hidden on the server; Lighthouse accessibility 100; phone layouts.

**Limits:** live mode for Phase 2 needs migrations 002/003 and anonymous sign-ins turned on (the student and Phase 2 security checks skip until then). In demo mode everything is saved in the browser, so the supervisor's support and check-in tables stay empty there, and a shared school computer is a privacy risk (live mode fixes this). Keyword matching can miss things or match innocently. Each single number is protected; totals already implied by shown numbers can still be worked out. Codes work once, so a student needs a new code after leaving. Browser tests were run during development but aren't committed.

## Rules and assumptions

- **Baseline rules exactly as the brief** (`lib/flags.ts`); every condition met is shown as a reason. Messy answers are tidied (`often` → High for S-045); a blank answer is unknown, never "fine" (S-010); no row is dropped.
- **Gap I found (AC-08):** 7 of 8 students who chose "Prefer not to say" on self-harm get **no flag**. Extra rules (on by default): **E1** → at least High; **E2** worrying words in the comment → at least Review (S-023). 2/9/17/44 → 2/17/17/36. New keyword categories and check-ins only add reasons and "Needs reading"; they never change levels.
- **"<5" = both** a class under 5 *and* any count of 1–4 (stricter reading), plus hiding numbers that would let someone subtract back to a small one, checked by a brute-force test.

## How I used AI tools

> ✍️ **TODO (candidate to fill in honestly):** list every tool used.
> Known: **Claude Code** (Anthropic, Claude Opus 5.5) for planning, code, tests and docs, phase by phase from my build prompts; I reviewed and directed every step.
>
> **A prompt that worked:** _TODO_ · **A prompt that failed (and what I learned):** _TODO_

## What I'd build next

The **survey itself** inside the student space (one question per screen, same code sign-in). Per-school counsellor accounts. Verified Dzongkha with a native speaker. Encrypted counsellor notes. A referral pathway to health services. Offline support for rural schools. Rules and keyword lists tuned with CECD counsellors.

[Design](docs/DESIGN.md) · [Acceptance criteria → code](docs/AC_TRACE.md) · [Safeguarding](docs/SAFEGUARDING.md)
