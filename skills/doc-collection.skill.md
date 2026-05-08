---
name: doc-collection
description: Run the recurring document chase loop. Identify missing docs for a transaction, prioritize by closing risk, and generate the right follow-up email or SMS in the right tone for each responsible party.
when_to_use: Daily or every other day during the under-contract phase. Trigger on phrases like "what docs are we still missing", "chase the lender", "follow up on the inspection report", or "morning chase round".
---

# Doc Collection

The chase loop is where TCs lose the most time. This skill turns the daily "who owes me what" into a prioritized list of follow-ups, each with a ready-to-send template in the right tone.

## Inputs to gather

- One or more transaction file codes (or "all open files")
- Today's date (default: now)
- TC name to sign the messages

## Steps

1. **Pull missing docs per file.** For each file code, call `escrow-tracker.list_missing_documents` with the state. This gives you what is still expected.

2. **Pull deadlines per file.** Call `deadline-chaser.list_upcoming` with `windowDays: 14` and `includeOverdue: true`. Cross-reference: a missing doc that is also blocking a deadline within 7 days is high priority.

3. **Prioritize.** Order chases by risk to closing date:
   - **P0 (today)**: missing docs blocking a deadline already past due
   - **P1 (today)**: missing docs blocking a deadline due in the next 3 days
   - **P2 (this week)**: missing docs in the closing_prep phase if closing is within 14 days
   - **P3 (later)**: everything else

4. **Pick tone.** Match `deadline-chaser.generate_followup_template` tone to risk level:
   - P0: `urgent`
   - P1: `firm`
   - P2 and P3: `soft`

5. **Pick channel.** Email by default. Switch to SMS only when:
   - Recipient has previously responded faster on SMS
   - The deadline is same-day or already overdue
   - The recipient is mobile-first (e.g. inspector, agent in the field)

6. **Generate the message.** For each chase, call `deadline-chaser.generate_followup_template` with the right `deadlineId`, `channel`, `tone`, `recipientName`, and `tcName`. Stage them; do not send them yet. The TC reviews before hitting send.

7. **Surface a chase plan.** Output one block per file, showing:
   - File code, property, days to close
   - Each chase: priority, recipient, channel, tone, due date, doc/deadline label
   - The generated message body (collapsible if you can render it)

## Output format

```
## File 1234-MAIN (123 Maple St, closing 2026-06-12, 18d)

P0 (URGENT, email): Inspector — inspection_report
  Subject: ...
  Body: ...

P1 (FIRM, email): Lender — appraisal_report
  Subject: ...
  Body: ...

P2 (SOFT, SMS): Buyer — wire_instructions_verified
  Body: ...
```

## Edge cases

- **Recipient has gone silent for 3+ rounds.** Escalate to the listing agent or broker-in-charge. Do not keep sending the same template.
- **Doc was provided but not registered.** Before generating a chase, ask the TC if they actually received the doc. If yes, register it via `escrow-tracker.register_document` and remove from the chase list.
- **Same recipient, multiple chases.** Bundle into a single email when professional (e.g. lender owing 3 docs). Keep separate when adversarial (buyer side chasing seller-side disclosure).
- **Holiday or weekend.** Push P2 and P3 chases to the next business day. P0 and P1 still go.

## Anti-patterns

- Do not send urgent-tone messages 3 days before due. It cries wolf and gets ignored when it actually matters.
- Do not chase the same recipient on email and SMS in the same hour for the same item. Pick one channel.
- Do not auto-send. Always stage for TC review. Tone errors kill relationships.
