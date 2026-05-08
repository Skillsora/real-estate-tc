---
name: contingency-timeline
description: Build a visual timeline of all contingency periods for a transaction (loan, inspection, appraisal, title, due diligence, option, attorney review). Surface conflicts, blockers, and the critical path to closing.
when_to_use: After intake, before the first major review with the buyer or seller, when the TC asks "what does this transaction look like on a timeline", or when a deadline shifts and the TC wants to see the downstream impact.
---

# Contingency Timeline

A timeline view answers the only question that matters in week 1: "what happens when, and what blocks what". This skill renders the contingencies of a transaction as an ordered timeline with critical-path tagging.

## Inputs to gather

- Transaction file code
- Optional: a hypothetical change to a date (for what-if scenarios)

## Steps

1. **Pull the transaction.** Call `deadline-chaser.list_upcoming` with `windowDays: 90` and `includeOverdue: true` for a wide view.

2. **Pull the state checklist.** Call `closing-checklist.compute_due_dates` for the file's state and dates. This gives you state-specific milestones that the TC may not have explicitly tracked as deadlines.

3. **Merge into a single timeline.** Combine deadline-chaser deadlines and computed checklist due dates. Deduplicate when both reference the same event (e.g. inspection ends).

4. **Tag the critical path.** A deadline is on the critical path if missing it forces a closing delay or termination. Examples:
   - Loan approval (financed deal): critical
   - Appraisal report (financed deal): critical
   - Inspection objection / DD termination window: critical
   - HOA estoppel (HOA property in FL or AZ): critical
   - Closing Disclosure 3-day rule: critical
   - Title commitment: critical
   - Buyer insurance binder: critical
   - Termite letter (FL/GA/AZ/TX): conditional (some lenders require, some do not)

5. **Surface conflicts and risks.** Flag situations like:
   - DD ends before inspection report typically arrives (NC, default DD too short)
   - Loan approval scheduled after CD must be delivered
   - Closing scheduled on a weekend or holiday
   - HOA estoppel ordered too late to receive in time
   - Two contingencies expire on the same day with the same responsible party

6. **Render the timeline.** A clean ASCII or Markdown timeline, ordered by date, with one line per event. Use these symbols:
   - `*` critical path
   - `!` flagged risk
   - `[done]` completed
   - `[overdue]` overdue
   - `[scheduled]` future

## Output format

```
# Timeline for 1234-MAIN (123 Maple St, CA, residential)
Contract signed: 2026-04-28 | Closing: 2026-06-12 (35d)

2026-04-28  [done]      * Earnest money deposit (3d window)
2026-05-01  [done]        Open escrow
2026-05-05  [scheduled] * Disclosure delivery deadline (TDS, NHD, AVID)
2026-05-08  [overdue]   * Inspection complete (was 2026-05-05) !
2026-05-12  [scheduled] * Inspection contingency removal
2026-05-19  [scheduled] * Loan approval deadline
2026-05-22  [scheduled] * Appraisal report due
2026-06-09  [scheduled] * CD delivered to buyer (3-day rule)
2026-06-11  [scheduled]   Final walkthrough
2026-06-12  [scheduled] * CLOSING

## Risks flagged
- Inspection complete is 3d overdue. Loan approval timeline is now tight.
- 2026-06-09 CD delivery requires lender clear-to-close by 2026-06-04. Currently no deadline tracked.
```

## Edge cases

- **Cash deal.** Skip loan, appraisal, and CD timing. Critical path becomes title + inspection + closing only.
- **Date shift requested.** If the TC asks "what if closing slips to X", recompute and re-flag risks. Highlight which deadlines now collide.
- **Multi-property or 1031 exchange.** Coordinate timelines across the linked transactions and flag if the buyer's identification or replacement deadlines are upstream blockers.

## Anti-patterns

- Do not show every checklist task as a timeline event. Reserve the timeline for items that have a date and matter to the close.
- Do not promise a timeline is correct without flagging which dates are user-provided vs computed from defaults. Every assumption should be visible.
