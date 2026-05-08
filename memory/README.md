# Memory pack

Closing checklist library. Two tiers:

- **Public (this repo)**: 10 state demo checklists in `state-checklists/{state-code}.json` (CA, TX, FL, NY, IL, AZ, GA, NC, OH, PA, in order of state population)
- **Premium (Skillsora purchase)**: 200 state-by-state and transaction-type checklists, delivered separately as a ZIP after purchase. Drops into `state-checklists/full/` (gitignored)

## Sources

Demo checklists synthesized from publicly available state real estate commission documentation, MLS standard forms, and the TC standard of practice. They are starting points, not legal advice. Verify state-specific requirements with the local commission and the brokerage compliance team before using on a live transaction.

## Schema

See [`schema.ts`](./schema.ts) for the canonical zod schema. Each checklist file is a JSON document validated against `ChecklistSchema`.

## Phases

Every task is tagged with a phase. Order:

1. `intake` — pre-contract paperwork, party info collection
2. `under_contract` — executed P&S, earnest money, opening escrow
3. `inspection` — inspection contingency window
4. `appraisal` — lender ordering, value disputes
5. `closing_prep` — 14 days before closing
6. `closing_day` — signing, recording, funding
7. `post_close` — commission disbursement, file archive, NPS

## Adding a new checklist

1. Drop the JSON in `state-checklists/{state-code}.json` (lowercase 2-letter code)
2. Add the entry to `index.json`
3. Run `npm run validate-memory` from the bundle root
