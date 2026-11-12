# Design rationale

**The single job of the counsellor screen:** help a busy counsellor decide *who to see first*, in seconds, and record what they did. **For the supervisor:** see patterns across schools without being able to identify any child.

**Honesty note.** The strongest evidence in UI design is for **contrast, legibility, consistency and lower cognitive load**. Claims that a colour *causes* an emotion are weaker and vary by culture. So colours were chosen first for accessibility and calm, and emotional associations are a modest, secondary consideration.

## What changed after the first version, and why

The first version worked but users found it confusing: engineer words ("flag level", "Review", "<5", "hidden", "proposed extra rules", "data check") and every element boxed at the same weight. It was redesigned using Apple's Human Interface Guidelines and *Refactoring UI*:

| Problem | Principle | Change |
|---|---|---|
| Words came from how the system works | *"Names come from what people control and recognise, not from how the system is built."* (Apple, Writing) | Every priority says what it means in plain words, taken from its rule ("Bullied often, or never feels safe at home"). "None" → "No concerns". Supervisor: "under 5" / "not shown", each explained in a sentence |
| Wall of equal-weight boxes | Hierarchy: de-emphasise the secondary (Refactoring UI); "has every element earned its place?" (Apple, Simplicity) | Students grouped by priority under headings; "No concerns" folded away; rules switch and data notes moved to "About this list" at the bottom |
| 72 rows × 3 status buttons | Hick's law; progressive disclosure | One small dropdown per row; the full segmented control lives in the detail sheet |
| Borders everywhere | "Too many borders → use two background colours or spacing" (Refactoring UI) | White grouped lists on a soft grey page, thin dividers instead of boxes |
| Supervisor saw a grid of hidden numbers first | Lead with the answer | Three headline numbers, then "need follow-up by school", then the detailed table |

## The Lamtön look (second redesign)

Feedback on the first redesign: "looks AI generated", "not a system I would want to log into". The causes were generic: an icon in a tinted square on every card, pill buttons, floating white cards on grey, bright teal, and uppercase labels. The second redesign aims for something closer to a well-made clinical or banking tool: calm, warm and precise.

- **Name and mark:** "Lamtön" (Dzongkha: guidance). The mark is a hand-drawn winding path to a point, in `components/Wordmark.tsx`, not an icon-set glyph.
- **One source of styles:** `lib/ui.ts` defines the buttons, fields, labels and panels, so every screen matches.
- **Panels, not floating cards:** white surfaces with a 1 px hairline edge on a warm paper background. Radii come from one family: 10 px controls, 14 px panels, 18 px student cards.
- **Priority is shown with a small dot and a word**, not coloured pills. Urgent alone gets red text, a ring on its dot and a red left edge on its row, so it is the only loud thing on the screen.
- **Counts sit in one segmented panel**; tabs are underlined; the top of the board is a single sentence saying what needs doing ("2 urgent students have no contact logged yet").
- **Supervisor heat map** uses one cypress-green ramp (light to dark), matching the accent, and every cell prints its number.

## Colour

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--bg` | `#F4F3EF` | Page: warm paper, not cold grey | text 15.9:1 |
| `--surface` | `#FFFFFF` | Panels and lists | text 17.6:1 |
| `--text` / `--text-muted` | `#16191D` / `#5B6067` | Primary / secondary text | muted 6.3:1 on white, 5.7:1 on page |
| `--border` | `#8C8880` | Field edges (non-text, needs 3:1) | 3.5:1 on white |
| `--primary` | `#234E45` | The one accent (deep cypress): actions, links, focus ring | white on it 9.3:1 |
| `--urgent` | `#B42318` | Urgent only: red text, dot ring, row edge | 6.6:1 on white |
| `--high` / `--high-ink` | `#DC6803` / `#93370D` | High dot / High text | ink 7.5:1 |
| `--review` / ink | `#6941C6` / `#5925DC` | Review | ink 7.7:1 |
| `--none` / ink | `#9A968E` / `#5B6067` | No concerns: neutral grey on purpose (not "good" or "bad" about a child) | ink 6.3:1 |
| `--student-bg` / `--student-accent` | `#EEF3EF` / `#2B5F4E` | Student area only | white on accent 7.4:1 |
| Heat ramp | `#EEF4F1` to `#2F5F53` | Supervisor heat map (5 steps) | dark text on step 4: 6.7:1; white on step 5: 7.3:1 |

- **A real flaw, found by measurement:** the build prompt's High colour (`#B54708`) was almost identical to Urgent red (OKLab ΔE 6.1 with full colour vision, 3.9 for red-green colour-blindness; 15 is the floor). High became `#DC6803` (ΔE 16). This was checked with a palette validator, not by eye.
- **Visual weight follows urgency:** only Urgent uses red text, a ringed dot and a row edge.
- **Never colour alone** (WCAG 1.4.1): every priority is written out as a word, and Urgent also has its own group heading, position and red edge.

## Type and layout

- **Geist** (sans and mono, loaded through `next/font`, so it is self-hosted with no layout shift). It is calm and exact, and the mono version is used for student IDs and access codes so they read like reference numbers.
- 15 px body on staff screens (dense working tool), 28 px page titles, 13 px notes; tabular numbers in counts. The student area uses 18 px text and 48 px targets.
- Paragraphs run to about 65 characters; spacing is generous between groups and tight within them.
- A focus ring shows for keyboard users everywhere, except on headings and `<main>`, which receive focus only from code (to move screen readers).

## Interaction

- **Error prevention:** closing an Urgent case needs a short note; the case isn't closed until it's confirmed.
- **Feedback:** "Saved" appears next to the control; errors say what to do ("Couldn't save. Try again.").
- **Safety net:** if a search or filter hides Urgent students, the board says how many, with one tap to show everyone.
- **Missing data is never "fine":** "Answer missing" on the row, and the detail sheet explains that blank answers count as unknown.

## Accessibility (measured)

- **axe-core: 0 violations** on every screen and state (home, board, Urgent-close confirmation, detail sheet, empty state, supervisor, phone filter sheet).
- **Lighthouse: accessibility 100 and best practices 100** on the home, counsellor and supervisor pages (re-measured after the redesign).
- Keyboard: skip link, visible 3 px focus ring, arrow keys in the segmented control, focus trapped in sheets and returned afterwards.
- Phones: no sideways scrolling at 360 px; every tap target ≥ 44 px; filters in a bottom sheet.
- Reduced motion respected; motion is limited to short colour/shadow transitions.

## Decisions made on purpose

- **Chart without a chart library.** The first chart library silently dropped labels for hidden numbers. A plain bar per school ("14 of 26 students") is clearer, server-rendered, and can't hint at a hidden value.
- **Dzongkha labels removed.** They were drafts nobody had verified; showing unverified translations to counsellors could mislead. Verified Dzongkha is on the "next" list.
- **No student login.** Students as young as class IV, shared devices, and the need for them to feel safe point to codes, not accounts: a code from the counsellor plus the student's own 4-number PIN, valid for the school year, so students come and go without asking the counsellor each time.

## For the future student survey (not built)

Trauma-informed: say plainly who sees the answers and the honest limits ("If you tell us you might be in danger, your counsellor will talk with you"). One question per screen with progress, "Prefer not to say" everywhere, a gentle lead-in before the feelings questions, no red and no scores shown to students, a kind ending with a helpline (`TODO(confirm helpline with CECD)`; never an invented number), and nothing left on a shared device afterwards.

## Phase 2 additions (choice → why)

| Choice | Why |
|---|---|
| **Student screens use their own palette** (soft sage `#EEF5F1`, green `#2E6B4F`), 18 px text, 48 px targets, **no red anywhere** (checked by a test) | Younger readers and a calm, non-alarming space; red is reserved for counsellor safety alerts |
| **At most 4 big tiles** on the student home; About is a small link | Hick's law: fewer, clearer choices |
| **"Get help now" is calm green, always in the header**, and lists real people first | It should feel safe to open, and the app is not an emergency service |
| **One question per screen** in check-ins, progress shown, every question skippable, faces always with words | Lower effort, visible end, choice and control (trauma-informed); never colour or icon alone |
| **Codes avoid look-alike characters** (no 0/O, 1/I/L) and are shown large in a monospace font | Read off paper by children; fewer typing mistakes |
| **Tabs (Board · Caseload · Inbox · Check-ins)** as underlined tabs; short labels on phones | Familiar pattern; every tab fits at 360 px; counts shown as numbers, not colour dots |
| **Safety banners are the only red on the counsellor's board**, with an icon, words and a button per student | Red keeps its meaning (alarm fatigue is real) and is never the only cue |
| **"Needs reading" chips are violet, not red** | Calls for reading, not panic; the counsellor decides what it means |
| **Heat map: one teal hue, light → dark, every cell prints its number; hidden cells are hatched grey** | Single-hue scales read in order and are colour-blind safe; a pattern + words mark hidden cells |
| **One shared `Switch`** with explicit knob positions | The first version's knob could render outside its track; one component means one fix everywhere |
| **Plain, fixed wording for every automatic message** to students | No AI talks to children; the words were written in advance and can be reviewed by CECD |
