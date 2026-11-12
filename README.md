# Lamtön: Counsellor Flag Board

Helps school counsellors see which students to support first after the Situational Analysis survey, and track every follow-up. Supervisors see counts only, never identities. **Synthetic data only.** Not an emergency service or a diagnosis ([safeguarding](docs/SAFEGUARDING.md)). Anyone can get help at `/help` with no sign-in (PEMA Helpline 1098, free, 24/7).

**Live:** https://lamtoen.vercel.app · **Demo logins** (synthetic, shared on purpose): `counsellor@demo.bt` / `Counsellor-Demo-2026` (all schools) · `counsellor.b@demo.bt` / same (School B) · `supervisor@demo.bt` / `Supervisor-Demo-2026`.

## How to run

```bash
npm install && npm run dev   # demo mode, no setup → http://localhost:3000
npm test                     # 178 unit tests
```

Live mode: copy `.env.example` to `.env.local`, run `supabase/all_in_one.sql` in Supabase, turn on anonymous sign-ins, then `npm run seed`. `npm run verify:rls` tries 57 ways to break the privacy rules.

## What works and what doesn't

**Works:** all 9 acceptance criteria ([trace](docs/AC_TRACE.md)). Privacy is enforced by the database, not just the screens. Students sign in with a counsellor's code plus their own 4-digit PIN, valid all year. They can message their counsellor (always a real person), keep a journal and answer check-ins. Counsellors log what they did and print codes for a whole class. Supervisors get a heat map. Every extra feature can be switched off in `lib/features.ts`.

**Limits:** demo mode saves data in the browser only. Keyword alerts can miss things or misfire. Totals implied by other shown numbers could still be worked out. The survey itself is still loaded from the CSV.

## Rules and assumptions

- **Baseline rules exactly as the brief** (`lib/flags.ts`), with every reason shown. Messy answers are tidied, a blank counts as unknown (never "fine"), and no row is dropped.
- **Gap found (AC-08):** 7 of 8 students who chose "Prefer not to say" on self-harm got no flag. **E1** raises them to at least High; **E2** raises worrying comments to at least Review. Counts change from 2/9/17/44 to 2/17/17/36. Extra rules only raise flags, never lower them.
- **"<5"** applies to classes under 5 and to any count of 1–4, and also hides numbers that would let someone subtract back to a small group.

## How I used AI tools

**Tools:** Claude Code (Anthropic, Claude Opus 5.5) for planning, code, tests and docs. I wrote a
build prompt (`docs/BUILD_PROMPT.md`) that split the work into phases, Must items first, and made
Claude stop after each phase so I could run the app, review the changes and commit. I checked the
flag counts against the brief by hand, tested every screen myself, and made the product decisions
(the "Prefer not to say" rule, privacy by the database, code + PIN sign-in).

**A prompt that worked:** "Read docs/BUILD_PROMPT.md, the brief and the CSV. Then do Phase 0 only
and stop for my review." Small, reviewable steps meant I understood each part before the next one,
and the rules stayed in one file I can change live.

**A prompt that failed:** "The whole system looks totally AI generated, I want it smoother, cleaner
and more premium." It was too vague: the first redesign still felt generic and needed a second full
round. I learned to describe the look I want (calm, warm, fewer colours, real type) instead of only
what I dislike.


## What I'd build next

The survey itself in the student space, using the same code sign-in. A "worried about a student" referral for teachers. Same-day checks for Urgent students. Dzongkha checked by a native speaker. Offline use for rural schools. Rules tuned with CECD counsellors.

[Design](docs/DESIGN.md) · [Research](docs/RESEARCH.md) · [Safeguarding](docs/SAFEGUARDING.md) · [AC trace](docs/AC_TRACE.md)
