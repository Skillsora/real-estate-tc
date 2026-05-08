---
name: post-close
description: Run the post-closing workflow. Confirm recording, commission disbursement, file archive integrity (with SHA256 audit trail), and trigger the client NPS survey + brokerage compliance handoff.
when_to_use: Within 24 to 72 hours after closing day, when the deed has been signed and funds disbursed. Trigger on phrases like "close out the file", "post-close on 1234-MAIN", or "wrap this transaction".
---

# Post-Close

Post-closing is where TC reputation is built or quietly burned. The signing is done; what is left is the cleanup that makes the broker trust you, the client refer you, and the compliance audit pass without flags.

## Inputs to gather

- Transaction file code
- Closing date (default: today minus 1 if not provided)
- TC name

## Steps

1. **Confirm recording.** Look for `docCode: "recording_confirmation"` in `escrow-tracker.list_documents`. If absent, follow up with the title company or attorney. Recording typically lands within 1 to 5 business days of closing depending on the county.

2. **Confirm commission disbursement.** Look for `docCode: "commission_disbursement"`. If absent, follow up with the title company or attorney. Confirm both sides of commission have been paid to the brokerages (not personally to agents in most states).

3. **Run the file archive integrity check.**
   - Call `escrow-tracker.list_missing_documents` for the file's state. Anything still missing is now an audit risk.
   - Call `escrow-tracker.generate_audit_trail`. This produces the Markdown audit report with SHA256 hashes of every registered document.
   - Save the audit report to the brokerage's compliance folder (TC takes this manual step; you produce the artifact).

4. **Mark all open deadlines as completed or waived.** Any deadline still in `open` status post-closing is a sign of incomplete tracking, not actual incomplete work. Update via `deadline-chaser.update_deadline_status`.

5. **Generate the client NPS survey email.** Use `deadline-chaser.generate_followup_template` with `tone: "soft"` and `channel: "email"`, recipient = buyer (or seller if TC works listing side). Customize the template subject line to "Quick favor: 30 seconds on how the closing went?" and link to the brokerage's NPS form. Stage for TC review.

6. **Brokerage compliance handoff.** Output a one-page summary (markdown) suitable for forwarding to the broker-in-charge:
   - Property, parties, dates, sale price
   - Audit trail attached (reference the saved file)
   - Any items that were waived rather than completed (with reasons)
   - Confirmation that all funds disbursed, all docs recorded
   - Confirmation that the client survey was sent

## Output format

```
# Post-Close: 1234-MAIN (123 Maple St, CA)
Closing: 2026-06-12 | Recorded: 2026-06-13
Status: ARCHIVED

## Confirmations
✓ Recording confirmed 2026-06-13 (LA County)
✓ Commission disbursed to Pacific Realty (listing) and Sunset Homes (buyer side) on 2026-06-13
✓ All 18 expected docs registered, audit trail generated
✓ All deadlines closed (16 completed, 2 waived: termite (not required by buyer), survey (waived per addendum))

## Audit artifact
- Saved to: ./archive/1234-MAIN/audit_trail.md
- 18 documents, SHA256 hashes locked
- Generated 2026-06-14T09:12:00Z

## Client NPS
- Email staged to buyer Mike Rivera (mike@example.com)
- Tone: soft, channel: email
- Pending TC review and send

## Compliance handoff
- One-pager ready for broker review
- Flag: termite waiver should be re-signed by buyer if state audit asks
```

## Edge cases

- **Recording delayed past 7 business days.** Some counties run slow (NYC ACRIS, parts of LA). Note the expected window and check back; do not panic at day 6.
- **Commission held back.** If the brokerage withholds part of the commission for compliance review, note in the summary and do not mark fully disbursed.
- **Client refused NPS or is hostile.** Skip the survey, note in the summary why, and move on. Do not force.
- **Late-arriving doc post-close.** If a doc shows up after archive (rare: a corrected HUD, a recorded copy of a release of lien), register it via `escrow-tracker.register_document` and regenerate the audit trail. Note the amendment timestamp.

## Anti-patterns

- Do not close out a file with deadlines still in `open` status. It looks like dropped work in compliance review even when nothing was actually dropped.
- Do not promise recording timing the title company never confirmed. "Recorded" is a binary state, not an estimate.
- Do not send the NPS email same-day as closing. Wait at least 48 hours so the client is in the new house and feeling the win.
