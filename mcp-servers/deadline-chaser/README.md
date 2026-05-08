# deadline-chaser (MCP)

Local SQLite-backed deadline tracker for US real estate transactions. Stores transactions and contingency deadlines, lists what is upcoming or overdue, and generates email and SMS follow-ups in three tones.

## Tools

| Tool | Purpose |
|------|---------|
| `create_transaction` | Register a transaction file (file code, state, addresses, parties, dates) |
| `add_deadline` | Attach a contingency deadline (loan, inspection, appraisal, title, DD, option period, attorney review, HOA, EM) |
| `list_upcoming` | List open deadlines in a window (default 14 days). Includes overdue items by default |
| `update_deadline_status` | Mark a deadline completed, missed, or waived |
| `generate_followup_template` | Generate an email or SMS in soft, firm, or urgent tone |

## Storage

Local SQLite database at `dist/data/deadlines.db` (override with `SKILLSORA_DEADLINE_DB` env var). Zero network calls. WAL mode enabled for concurrent reads.

## Install

```bash
npm install
npm run build --workspaces
```

```bash
claude mcp add skillsora-deadline-chaser -- node /absolute/path/to/dist/index.js
```

## Tone matrix (when to use which)

- **soft**: 7+ days before due, first reminder
- **firm**: 1 to 2 days before due, or 1 day overdue
- **urgent**: 3+ days overdue, or any deadline that puts closing at risk

## License

MIT (see top-level LICENSE).
