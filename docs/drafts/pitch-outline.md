# Draft: 5-minute pitch outline (make it yours; rehearse with a timer)

**Before recording:** use `npm run dev:demo` (or the live site), and have a fresh browser so the board starts clean.

### 1. The problem: 0:00–0:30
"Every year, students answer the Situational Analysis. A counsellor gets a spreadsheet. The child who most needs help might be row 47. And reporting upward risks exposing children."

### 2. The gap I found: 0:30–1:15
"The brief's rules are a good start, but 7 of the 8 students who chose 'prefer not to say' on self-harm get no flag at all. And one student wrote 'Sometimes I don't want to go home', and the rules ignore comments."
**Show:** "About this list" → switch the extra checks off and on. Tiles go 2/9/17/44 → 2/17/17/36. "Extra checks only ever raise a level, and you can always compare with the basic rules."

### 3. Live demo, counsellor: 1:15–2:45
- The two Urgent students are first, in red, with the reason in plain words.
- Each tile explains what it means. Nobody has to guess what "Review" is.
- Set a High student to "In progress" → "Saved". Refresh: still there.
- Try to close an Urgent case → it asks for a note first. "Never a single accidental click."
- Open S-010: the sleep answer was blank. "We never guess 'fine'. It's marked so the counsellor can check."
- Search "s045": the typo "often" was still read correctly.

### 4. Supervisor and privacy: 2:45–3:45
- Switch role → Supervisor. "72 surveyed, 36 need follow-up." One bar per school.
- "School D has 8 students. Small numbers say 'under 5', and I also hide numbers that would let you subtract back to a small one. A test tries every possible combination to prove it."
- "In live mode, the database itself enforces this: a supervisor gets zero student rows even if they try." (Optional: show `npm run verify:rls`.)

### 5. Design for comfort and clarity: 3:45–4:30
- Plain words, calm grouped lists, Urgent the only loud thing on the page.
- "I measured colour contrast and colour-blind separation. The suggested High colour was nearly identical to Urgent, so I changed it."
- Works on a phone; keyboard and screen reader tested (axe: 0 issues).

### 6. What's next: 4:30–5:00
"Next: the student survey with one-time codes instead of logins, verified Dzongkha, and testing with two or three real counsellors. A smaller thing that works, built so the next pieces can stand on it."
