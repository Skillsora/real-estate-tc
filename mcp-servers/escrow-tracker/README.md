# escrow-tracker (MCP)

Local document tracker with SHA256 audit trail for US real estate transactions. Registers received documents, lists what is still missing per state, and produces a Markdown audit trail at closing for the file archive.

## Tools

| Tool | Purpose |
|------|---------|
| `register_document` | Register a received doc (file path or inline content), compute SHA256 |
| `list_documents` | List all registered docs for a transaction, ordered by receivedAt |
| `list_expected_documents` | Show the expected doc checklist by state, optionally filtered by phase |
| `list_missing_documents` | Diff registered vs expected, grouped by phase |
| `compute_sha256` | Verify a doc matches a previously registered version |
| `generate_audit_trail` | Markdown audit trail for the post-closing archive |

## Storage

Local JSON file at `dist/data/escrow.json` (override with `SKILLSORA_ESCROW_DB` env var). Atomic writes via tmp file rename. Zero network calls.

## Install

```bash
npm install
npm run build --workspaces
```

```bash
claude mcp add skillsora-escrow-tracker -- node /absolute/path/to/dist/index.js
```

## Expected document codes

The bundle ships an opinionated set of doc codes covering federal-standard docs (purchase_agreement, earnest_money_receipt, lead_paint_disclosure, closing_disclosure, etc.) plus state-specific docs (CA: tds, nhd. AZ: spds. TX: t47_affidavit. PA: coal_notice. FL/GA/AZ/TX: termite_letter).

For ad-hoc documents not in the canonical list, pass `docCode: "custom"`.

## License

MIT (see top-level LICENSE).
