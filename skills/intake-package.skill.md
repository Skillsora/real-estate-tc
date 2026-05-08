---
name: intake-package
description: Run the client intake workflow at the start of a real estate transaction. Parse the executed Purchase and Sale Agreement, identify all parties, extract key dates, set up the transaction file in the deadline tracker, and seed the closing checklist for the state.
when_to_use: When a Transaction Coordinator receives a fully executed P&S and needs to spin up a transaction file from scratch. Trigger this skill on phrases like "new file", "intake this transaction", "set up this deal", or when the user pastes a P&S contract.
---

# Intake Package

The first 24 hours after a contract is signed set the tone for the whole transaction. This skill turns a freshly executed P&S into a fully wired transaction file: parties identified, key dates locked, deadlines tracked, expected docs queued, and the state-specific closing checklist activated.

## Inputs to gather

- Fully executed Purchase and Sale Agreement (text, PDF excerpt, or pasted body)
- Property address, including state
- Buyer agent and brokerage
- Listing agent and brokerage
- Lender contact (if financed)
- Escrow or title company
- Internal file code (or generate one)

If any of these are missing, ask one targeted question at a time. Do not invent values.

## Steps

1. **Parse the P&S.** Pull buyer name, seller name, property address, contract effective date, closing date, earnest money amount, financing type (cash, conventional, FHA, VA, USDA), and any state-specific contingency periods (Texas Option Period, NC Due Diligence Period, IL attorney approval window, etc.).

2. **Confirm the state.** Use the property address or contract jurisdiction. State drives every downstream decision (TDS in CA, T-47 in TX, Coal Notice in PA, etc.).

3. **Pull the state checklist.** Call `closing-checklist.get_checklist` with the state code and `transactionType: "residential"`. Review the items flagged `state-specific` and surface them to the TC.

4. **Compute the timeline.** Call `closing-checklist.compute_due_dates` with the contract signed date and closing date. This produces the absolute due dates for every checklist item.

5. **Create the transaction in deadline-chaser.** Call `deadline-chaser.create_transaction` with the parsed values.

6. **Seed the contingency deadlines.** For each major contingency in the state checklist, call `deadline-chaser.add_deadline`. Map P&S contingencies to the canonical contingency codes:
   - Loan contingency to `loan_approval`
   - Inspection contingency to `inspection`
   - Appraisal contingency to `appraisal`
   - Title objection period to `title`
   - NC DD period to `due_diligence`
   - TX option period to `option_period`
   - IL or NY attorney review to `attorney_review`
   - HOA disclosure window to `hoa_disclosure`
   - Earnest money deposit deadline to `earnest_money`

7. **Register the contract itself.** Call `escrow-tracker.register_document` with `docCode: "purchase_agreement"`, the parties as source, and inline content of the contract text. This locks the SHA256.

8. **Surface what is missing.** Call `escrow-tracker.list_missing_documents` for the file and state. Present the missing docs grouped by phase, so the TC sees the doc-collection runway.

## Output

A short status block, in this order:

- File summary: file code, parties, address, state, closing date, days to close
- Top 3 state-specific items the TC must not forget
- Next 5 deadlines (with dates and responsible parties)
- Top 5 missing docs to chase

Keep it under 30 lines. The TC reads this on a phone between showings.

## Edge cases

- **Cash deal.** Skip loan_approval and appraisal contingencies entirely. Note in the summary.
- **Lease-back from seller.** Add a custom deadline for lease-back termination and flag it in the summary.
- **Co-op or NYC condo.** Flag that the board package is a 4 to 8 week critical path item and add an explicit deadline.
- **Multiple offers / backup contract.** Confirm with the TC which contract is primary before seeding deadlines.

## Anti-patterns

- Do not extract dates the contract does not explicitly state. If a date is ambiguous, ask. Wrong dates compound for 30+ days.
- Do not assume contingency days are calendar days. Read the contract; many states use business days.
- Do not seed every checklist item as a deadline. Reserve `deadline-chaser` for items that, if missed, kill or delay the closing.
