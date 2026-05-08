# Real Estate Transaction Coordinator AI Stack

The first vertical AI bundle built for Real Estate Transaction Coordinators in the United States. Stop chasing escrow docs, missing contingency deadlines, and rebuilding closing checklists from scratch on every deal.

This bundle is part of [Skillsora](https://skillsora.digital), the curated marketplace of vertical AI agent stacks for B2B operators.

## What you get

**3 MCP servers** (Model Context Protocol, runs locally with Claude Code or Cursor)
- `closing-checklist`: state-specific closing checklists for all 50 US states, by transaction type (residential, commercial, new-build, short-sale)
- `deadline-chaser`: contingency period tracker (loan, inspection, appraisal, title) with multi-channel alerts and email/SMS templates
- `escrow-tracker`: escrow document tracking (earnest money, P&S, addendums, disclosures) with SHA256 audit trail

**5 skill files** (`.skill.md` format, agent-compatible)
- `intake-package`: client intake workflow (P&S parsing, party identification, key dates extraction)
- `doc-collection`: automated follow-ups for missing documents (lender, agent, escrow, inspector)
- `contingency-timeline`: visual timeline of contingencies plus alerts
- `closing-prep`: 14-day pre-closing checklist (HUD-1, wire, walk-through, keys)
- `post-close`: post-closing workflow (recording, commission disbursement, file archive, NPS survey)

**Memory pack**
- 200 closing checklists sourced from state real estate commissions and standard MLS forms
- Letta-compatible JSON plus Markdown

## Pricing

| Tier | Price | Best for |
|------|-------|----------|
| Lite | 49 USD one-time | Solo TC trying it out |
| Pro | 99 USD one-time or 19 USD/month | Solo plus small brokerage |
| Team | 499 USD one-time or 99 USD/month | Brokerage 5 to 50 agents |
| Enterprise | 4 999 USD/year | Mid-size brokerages 50 to 500 agents |
| White-label | 24 999 USD one-time | Big brokerages and franchises |

[Buy on Skillsora](https://skillsora.digital/real-estate-tc)

## Quick install (Claude Code)

```bash
npx skillsora install real-estate-tc
```

This wires up the 3 MCP servers in your Claude Code config, drops the 5 skills into `~/.claude/skills/`, and indexes the memory pack.

## Manual install

See [docs/INSTALL.md](docs/INSTALL.md).

## Stack

- Node 20 plus, TypeScript strict
- `@modelcontextprotocol/sdk` for the MCP servers
- `zod` for runtime schema validation
- 0 third-party API in the runtime (everything runs locally on your machine)

## License

The code in this repository is MIT licensed. The premium memory pack (200 state checklists) and white-label assets are proprietary and shipped via Skillsora purchase delivery.

## Support

- Issues: [github.com/Skillsora/real-estate-tc/issues](https://github.com/Skillsora/real-estate-tc/issues)
- Email: contact@skillsora.digital
