# Safeguarding

> **This tool supports school counsellors; it is not an emergency service and does not diagnose.**

It follows four lessons from Kooth (UK) and Panorama Education (US): **anonymity by default**, **a human in the loop**, **honesty about what the tool is and isn't**, and **being one part of a wider system** of support (teachers, family, counsellor, health services).

## Escalation flow

```
Student writes (message, check-in comment, shared journal entry, board post)
        │
        ▼
Keyword check (lib/sensitiveText.ts) ── self-harm or violence/abuse? ──► Student sees a FIXED caring message at once:
        │                                                                 "Thank you for telling us. Your counsellor will see this.
        │                                                                  If you are in danger now, please tell a trusted adult
        │                                                                  or use Get help now."
        ▼
Counsellor's board: "Please read now" banner + "Needs reading" chip on the student's row
        │
        ▼
Counsellor reads the words in context → marks as read (who/when recorded)
        │
        ▼
Counsellor acts and logs it ("Add what you did": meeting, parent contact, referral…) → timeline
        │
        ▼
Safety net: an Urgent student with no contact logged within 24 h is shown at the top of the board
```

Survey answers follow the same idea: flags sort students for the counsellor; the counsellor decides.

## What is never automated

- **No AI ever talks to a student.** Every automatic sentence a student sees is fixed, pre-written text.
- **No automatic decision replaces the counsellor.** Keyword matches only say "needs reading"; they never change a student's flag level (the original survey rules are unchanged, so the brief's counts stay 2/17/17/36). Check-in answers add a reason; they never change the level either.
- **Nothing is published to other students without a counsellor's approval** (peer board).
- Keyword matching is labelled everywhere: *"may miss things or match innocently. Always read in context."*

## Students' privacy

- **No names, no passwords.** Students sign in with a one-time code from their counsellor (14 days, works once, revocable). The slip shows only the student ID.
- **Shared devices:** "Leave" on every screen; automatic sign-out after 10 minutes without activity.
- **Students never see flags, reasons or counsellor notes.** The database blocks it, not just the screens.
- **Private journal guarantee:** a journal entry is private unless the student turns on "Share this entry with my counsellor" for that entry. Private entries are **never** shown to counsellors (database rule) and **never** scanned for keywords (scanning private writing would be surveillance). Both are covered by tests.
- **Honest limit of confidentiality**, on the student's About page: *"If you tell us you might be in danger, your counsellor will talk with you to help keep you safe."*

## Supervisors

Supervisors see counts, a heat map, support given and check-in response rates, all **aggregated and suppressed on the server**: no names, no student IDs, no words, small numbers hidden ("under 5"), and numbers that would let someone subtract back to a small one hidden too ("not shown"). Supervisors have no access to any student-level table.

## Peer board moderation policy (switched off by default)

- Every post waits in a moderation queue; only a counsellor can approve it.
- Posts appear under a random friendly alias ("Blue Mountain"), never a name or ID.
- No links, no images, no messages between students.
- A post that may mention self-harm or abuse **cannot** be approved. The counsellor follows up privately with the student instead.

## Data retention

`TODO(confirm with CECD)`: how long survey answers, messages, journal entries and follow-up records are kept, who can delete them, and what happens at the end of the school year.

## Contacts

Counsellor office hours and the helpline shown under "Get help now" are placeholders: `TODO(confirm with CECD)`. No phone number has been invented.
