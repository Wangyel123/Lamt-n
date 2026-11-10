# Student Wellbeing: Counsellor Flag Board

Helps school counsellors see which students may need support first, from the Situational Analysis (SA) survey, and track every follow-up. Supervisors see numbers by school, never a student's identity. **Synthetic data only.**

**Live:** https://lamtoen.vercel.app · **Demo logins** (synthetic data, so passwords are shared here on purpose):

| Account | Password | Sees |
|---|---|---|
| `counsellor@demo.bt` | `Counsellor-Demo-2026` | All 72 students (demo only) |
| `counsellor.b@demo.bt` | `Counsellor-Demo-2026` | School B only (shows the per-school privacy rule) |
| `supervisor@demo.bt` | `Supervisor-Demo-2026` | Counts only |

## How to run

```bash
npm install && npm run dev      # demo mode: no setup, CSV + browser storage → http://localhost:3000
npm test                        # 103 unit tests (rules, exact counts, privacy suppression)
```

**Live mode (Supabase):** 1) copy `.env.example` to `.env.local` and fill in the URL, publishable key and secret key · 2) run `supabase/migrations/001_init.sql` in the Supabase SQL Editor · 3) `npm run seed` (loads the CSV, creates the demo accounts) · 4) `npm run dev`. `npm run verify:rls` proves the privacy rules by trying to break them (17 checks). `npm run dev:demo` forces demo mode.

## What works and what doesn't

**Works:** all 9 acceptance criteria ([trace](docs/AC_TRACE.md)). Every student flagged with every reason shown; Urgent always first; follow-ups saved (with an audit log in live mode); filters and search; supervisor counts with small numbers hidden on the server; login with row-level security; phone layout; Lighthouse accessibility 100.

**Doesn't / limits:** demo mode saves follow-ups in the browser, which is risky on a shared school computer (live mode fixes this). The comment check is a simple word match, not understanding. Small-number hiding protects each cell; someone can still work out combined totals that are already implied by shown numbers (e.g. School D: 8 students, 5 with no concerns). Closing an Urgent case needs a note in the app, but the database doesn't enforce it. No student survey yet (see below). Browser tests were run during development but aren't committed.

## Rules and assumptions

- **Baseline rules exactly as the brief** (`lib/flags.ts`): first match sets the level; every condition met is still shown as a reason.
- **Messy data:** answers are trimmed and case-insensitive (`often` → High for S-045). A blank answer is never treated as "fine": it counts as unknown and is shown as "Answer missing" (S-010). No row is ever dropped.
- **Gap I found (AC-08):** 7 of the 8 students who chose "Prefer not to say" on self-harm get **no flag** under the baseline. Extra rules, switchable and on by default: **E1** skipped self-harm → at least High (not Urgent: many students skip sensitive questions for privacy). **E2** worrying words in the comment → at least Review (catches S-023, "I don't want to go home"). Result: 2/9/17/44 → 2/17/17/36. Extra rules only ever raise a level.
- **"<5" means both** a class under 5 students *and* any count from 1 to 4 (the stricter reading, as the brief is ambiguous). Numbers that would let someone subtract back to a hidden one are hidden too ("not shown"). This is checked by an independent brute-force test.

## How I used AI tools

> ✍️ **TODO (candidate to fill in honestly):** list every tool used.
> Known: **Claude Code** (Anthropic, Claude Opus 5.5) for planning, code, tests and docs, working phase by phase from my build prompt; I reviewed and directed every phase.
>
> **A prompt that worked:** _TODO_
>
> **A prompt that failed (and what I learned):** _TODO_

## What I'd build next

The **student survey**, with one-time codes from the counsellor instead of logins (young students, shared devices). Per-school counsellor accounts for every school. Verified Dzongkha with a native speaker. Encrypted counsellor notes. A referral pathway and a reminder for Urgent cases not met within a day. Offline support for rural schools. Rules tuned with CECD counsellors.

**Design rationale:** [docs/DESIGN.md](docs/DESIGN.md) · **Acceptance criteria → code:** [docs/AC_TRACE.md](docs/AC_TRACE.md)
