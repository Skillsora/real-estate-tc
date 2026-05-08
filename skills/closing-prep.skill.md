---
name: closing-prep
description: Run the 14-days-before-closing checklist. Verify Closing Disclosure delivery, lender clear-to-close, insurance binder, HOA estoppel, wire instructions, final walkthrough, key handover plan. Surface anything that puts closing at risk.
when_to_use: When a transaction enters the closing_prep phase (typically 10 to 14 days before scheduled closing), or when the TC asks "are we ready to close on file X" or "run the closing prep".
---

# Closing Prep

The 14-day window before closing is where deals die from things that should have been handled. This skill is the systematic check: nothing critical missing, no last-minute surprises, every party knows what they owe and by when.

## Inputs to gather

- Transaction file code
- Today's date

## Steps

1. **Confirm we are in the right window.** Pull the closing date from `deadline-chaser.list_upcoming` or `escrow-tracker.list_documents`. If closing is more than 21 days away, tell the TC closing-prep is early; offer to run it again later. If closing is in 5 days or less, escalate severity throughout.

2. **Verify the lender clear-to-close.** Call `escrow-tracker.list_documents` and look for a recent doc with `docCode: "closing_disclosure"`. The CD must be delivered to the buyer at least 3 business days before closing for any TRID-covered transaction.
   - If CD is registered: verify the date in `notes` or attached path metadata, confirm the 3-day window is satisfied.
   - If CD is not registered: P0 chase the lender now.

3. **Verify wire instructions are confirmed.** Look for `docCode: "wire_instructions_verified"`. Wire fraud is the #1 closing risk. If not registered, generate a urgent-tone reminder for the buyer to verbally confirm wire instructions with the title company by phone (not email reply).

4. **Verify insurance binder.** Look for `docCode: "homeowner_insurance"`. If financed and missing, P0 chase the buyer.

5. **Verify HOA estoppel (if HOA property).** Look for `docCode: "hoa_docs"`. HOA estoppels can take 7 to 10 business days; if closing is in 7 days and not in hand, P0 chase the title company or HOA management.

6. **Check state-specific closing-prep items.**
   - CA: water heater anchoring + smoke/CO detectors confirmed; FIRPTA affidavit collected
   - FL: hurricane and flood insurance binder if applicable
   - TX: title commitment and survey accepted
   - NY: mansion tax computed; transfer tax forms filed
   - IL: real estate transfer tax stamps purchased; survey
   - PA: realty transfer tax forms prepared; coal notice if applicable
   - NC: closing scheduled at attorney office; DD already passed
   - GA: closing scheduled at attorney office; HOA fees prorated

7. **Confirm final walkthrough is scheduled.** It must happen within 24 hours of closing. If not on the calendar, ask the TC to schedule with the buyer agent now.

8. **Confirm closing logistics.** Time, place (in-person or remote notary), who is signing on each side, who is delivering keys, who handles the wire on closing day.

9. **Run a critical-path readiness summary.** Output a clear ready-or-not block.

## Output format

```
# Closing Prep: 1234-MAIN (123 Maple St, CA)
Closing: 2026-06-12 (in 12 days)
Status: NOT READY (3 P0 items)

## Critical path
✓ Lender clear-to-close received 2026-05-30
✓ CD delivered to buyer 2026-06-09 (3-day rule satisfied)
✗ Wire instructions verified [P0 — chase buyer today, urgent SMS]
✗ Homeowner insurance binder [P0 — chase buyer today, firm email]
✗ Final walkthrough scheduled [P0 — schedule with buyer agent today]
✓ HOA estoppel received 2026-06-02

## State-specific (CA)
✓ Smoke/CO detector cert
✗ Water heater anchoring confirmation [P1 — confirm with seller this week]
✓ FIRPTA affidavit collected

## Closing logistics
- Date: 2026-06-12 at 10:00 AM PT
- Place: Pacific Title Company, Long Beach
- Buyer: in-person | Seller: remote notary (RON via Notarize)
- Keys: handed at closing by listing agent
- Wire: buyer wires by 2026-06-11 5 PM PT

## Recommended actions today
1. Call buyer to verbally confirm wire instructions (record in notes)
2. Email buyer for insurance binder, firm tone, today
3. Email buyer agent to schedule walkthrough for 2026-06-11
```

## Edge cases

- **TRID-exempt transaction (cash, certain commercial).** Skip the 3-day CD rule. Use the settlement statement timing instead.
- **Remote closing / RON.** Confirm the notary is licensed in the state where the property sits (some states still require in-person).
- **Closing on a Friday.** Funding may not occur until Monday. Verify with the lender; warn the seller if proceeds are needed for a relocation.
- **Closing during a federal holiday week.** Recording offices may be closed; deed recording can slip.

## Anti-patterns

- Do not mark items as ready unless there is a registered document or explicit confirmation. Verbal "yeah we got that" is not closure.
- Do not skip wire-fraud verification because it feels paranoid. Wire fraud takes the entire purchase price; nothing else on the list is more important.
- Do not assume the buyer will handle insurance on their own. Many first-time buyers do not realize they need to bind it before closing.
