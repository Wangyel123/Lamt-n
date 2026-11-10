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

## Colour

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--bg` | `#F2F2F7` | Page (Apple's grouped background) | text 15.3:1 |
| `--surface` | `#FFFFFF` | Lists and cards | text 17.0:1 |
| `--text` / `--text-muted` | `#1C1C1E` / `#636366` | Primary / secondary text | muted 6.0:1 on white, 5.4:1 on page |
| `--primary` | `#1F6F78` | The one accent: actions, links, focus ring | 5.8:1 with white either way |
| `--urgent` | `#B42318` | Urgent only (solid badge, red edge) | white on it 6.57:1 |
| `--high` / `--high-ink` | `#DC6803` / `#93370D` | High marks / High text | ink 7.5:1 |
| `--review` / ink | `#6941C6` / `#5925DC` | Review | ink 7.7:1 |
| `--none` / ink | `#667085` / `#475467` | No concerns: neutral grey on purpose (not "good" or "bad" about a child) | ink 7.7:1 |

- **A real flaw, found by measurement:** the build prompt's High colour (`#B54708`) was almost identical to Urgent red (OKLab ΔE 6.1 with full colour vision, 3.9 for red-green colour-blindness; 15 is the floor). High became `#DC6803` (ΔE 16). Checked with a palette validator, not by eye.
- **Visual weight follows urgency:** Urgent is the *only* solid badge. Other priorities are soft tinted pills.
- **Never colour alone** (WCAG 1.4.1): every priority also has its own icon and word; Urgent also has its own group heading, position and red edge.
- **Colour-blind simulation** (Chrome: deuteranopia, protanopia, tritanopia, full greyscale): Urgent stays unmistakable in all four.

## Type and layout

- **System font** (SF Pro on Apple devices, the platform font elsewhere): familiar, highly legible, nothing to download. *(Changed from Atkinson Hyperlegible in the redesign, to match the Apple look users asked for. Atkinson remains a good choice for low-vision users.)*
- 17 px body (Apple's reading size), 34 px large titles, 13 px footnotes; tabular numbers in counts so columns line up.
- Line length about 65 characters for paragraphs; one rounded radius family; generous spacing between groups, tighter within them.
- The only translucent "glass" is the top bar (Apple: glass belongs on the floating navigation layer, never on content).

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
- **No student login.** Students as young as class IV, shared devices, and the need for them to feel safe point to one-time survey codes, not accounts (next step).

## For the future student survey (not built)

Trauma-informed: say plainly who sees the answers and the honest limits ("If you tell us you might be in danger, your counsellor will talk with you"). One question per screen with progress, "Prefer not to say" everywhere, a gentle lead-in before the feelings questions, no red and no scores shown to students, a kind ending with a helpline (`TODO(confirm helpline with CECD)`; never an invented number), and nothing left on a shared device afterwards.
