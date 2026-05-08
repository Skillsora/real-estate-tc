<div align="center">

# Real Estate Transaction Coordinator AI Stack

**The first vertical AI bundle built for the 100,000+ Real Estate Transaction Coordinators in the United States.**

Stop chasing escrow docs, missing contingency deadlines, and rebuilding closing checklists from scratch on every deal.

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
[![Node 20+](https://img.shields.io/badge/node-20%2B-orange.svg)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/protocol-MCP-coral.svg)](https://modelcontextprotocol.io)
[![Skillsora](https://img.shields.io/badge/marketplace-Skillsora-1B1B5A.svg)](https://skillsora.digital)

[Marketplace](https://skillsora.digital/real-estate-tc) · [Pre-order Pro $99](https://skillsora.gumroad.com/l/cixxp) · [50 state pages](https://skillsora.digital/real-estate-tc/california) · [Contact](mailto:contact@skillsora.digital)

</div>

---

## Table of contents

- [Why this exists](#why-this-exists)
- [What ships in the box](#whats-in-the-box)
- [Quick start](#quick-start)
- [How TCs use it](#how-tcs-use-it)
- [State coverage](#state-coverage)
- [Architecture](#architecture)
- [Skillsora vs traditional TC software](#skillsora-vs-traditional-tc-software)
- [Pricing](#pricing)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## Why this exists

A US Transaction Coordinator typically runs 30 deals a year and loses **150 hours** to chase work: forwarding the same overdue inspection request, rebuilding the California disclosure checklist that already exists somewhere, drafting a third reminder email to the same lender.

Your TC software (Brokermint, Paperless Pipeline, Skyslope) handles document storage and brokerage admin. None of them ship the **AI agent layer** that automates the workflow on top.

Skillsora ships exactly that layer: local MCP servers, skill files that compose them, and a memory pack with the state-specific knowledge already encoded. You bring the LLM you already use. We bring the workflow.

---

## What's in the box

```
real-estate-tc/
├── mcp-servers/
│   ├── closing-checklist/    # State-specific closing checklists, 4 tools
│   ├── deadline-chaser/      # Contingency tracker + email/SMS templates, 5 tools
│   └── escrow-tracker/       # Document registry + SHA256 audit trail, 6 tools
├── skills/
│   ├── intake-package.skill.md      # Parse P&S, seed deal
│   ├── doc-collection.skill.md      # Daily chase loop
│   ├── contingency-timeline.skill.md # Visual timeline
│   ├── closing-prep.skill.md        # 14-day pre-close check
│   └── post-close.skill.md          # 24-72h post-close workflow
├── memory/
│   ├── schema.ts             # Zod validation
│   ├── index.json            # Master index
│   └── state-checklists/     # 10 demo states (CA, TX, FL, NY, IL, AZ, GA, NC, OH, PA)
└── AGENTS.md                 # Guidance for AI coding agents
```

### Three MCP servers, fifteen tools

| Server | Tools | Purpose |
|---|---|---|
| `closing-checklist` | `list_states`, `get_checklist`, `compute_due_dates`, `export_checklist` | State-specific checklists for 50 US states |
| `deadline-chaser` | `create_transaction`, `add_deadline`, `list_upcoming`, `update_deadline_status`, `generate_followup_template` | Contingency tracker with email/SMS templates |
| `escrow-tracker` | `register_document`, `list_documents`, `list_expected_documents`, `list_missing_documents`, `compute_sha256`, `generate_audit_trail` | Document registry with SHA256 audit trail |

### Five skill files

Each `.skill.md` chains MCP tools in deterministic sequences and encodes anti-patterns (do-not-spam rules, escalation logic, channel selection). Agent runtime loads them on demand.

### Memory pack

- **Lite tier** (this repo): 10 state checklists, 200 phase-tagged tasks total
- **Pro tier and above** (Skillsora purchase): 200 closing checklists across all 50 US states + 4 transaction types (residential, commercial, new-build, short-sale)

---

## Quick start

### Prerequisites

- Node.js 20 or higher
- One of: Claude Code, Cursor, Aider, Continue, or any MCP-compatible runtime

### Install

```bash
git clone https://github.com/Skillsora/real-estate-tc.git
cd real-estate-tc
npm install
npm run build
```

### Wire to Claude Code

```bash
# from the repo root
claude mcp add skillsora-closing-checklist -- node $(pwd)/mcp-servers/closing-checklist/dist/index.js
claude mcp add skillsora-deadline-chaser    -- node $(pwd)/mcp-servers/deadline-chaser/dist/index.js
claude mcp add skillsora-escrow-tracker     -- node $(pwd)/mcp-servers/escrow-tracker/dist/index.js
```

### Wire to Cursor

In `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "skillsora-closing-checklist": {
      "command": "node",
      "args": ["/absolute/path/to/real-estate-tc/mcp-servers/closing-checklist/dist/index.js"]
    },
    "skillsora-deadline-chaser": {
      "command": "node",
      "args": ["/absolute/path/to/real-estate-tc/mcp-servers/deadline-chaser/dist/index.js"]
    },
    "skillsora-escrow-tracker": {
      "command": "node",
      "args": ["/absolute/path/to/real-estate-tc/mcp-servers/escrow-tracker/dist/index.js"]
    }
  }
}
```

### Drop the skill files

```bash
cp skills/*.skill.md ~/.claude/skills/
```

---

## How TCs use it

### A residential closing in California

```
$ # 7:00 AM, new contract effective
$ # The intake-package skill parses the executed P&S
> mcp call closing-checklist get_checklist state="CA" transactionType="residential"
[phase: under_contract] Transfer Disclosure Statement (TDS) within 7 days
[phase: under_contract] Natural Hazard Disclosure (NHD) report
[phase: closing_prep]   Water heater anchoring + smoke/CO detector cert
... 17 more tasks across 7 phases

$ # 9:30 AM, daily chase round
> mcp call deadline-chaser list_upcoming windowDays=7
[OVERDUE 1d] inspection report :: 1234-MAIN
[3d]         loan approval     :: 5678-OAK
[6d]         appraisal report  :: 9012-PINE

$ # 4:30 PM, post-close on yesterday's deal
> mcp call escrow-tracker generate_audit_trail fileCode="5678-OAK"
# 18 documents, SHA256 hashes locked
# Markdown audit trail ready for brokerage compliance folder
```

---

## State coverage

The Lite tier (this repo) ships demo checklists for the 10 most populated US states:

| State | Population rank | Demo included |
|---|---|---|
| California | 1 | ✅ |
| Texas | 2 | ✅ |
| Florida | 3 | ✅ |
| New York | 4 | ✅ |
| Pennsylvania | 5 | ✅ |
| Illinois | 6 | ✅ |
| Ohio | 7 | ✅ |
| Georgia | 8 | ✅ |
| North Carolina | 9 | ✅ |
| Arizona | 14 | ✅ |

The Pro tier and above ship the full **200 closing checklists across all 50 US states**, including state-specific items like:

- **California**: TDS, NHD, Megan's Law, AVID, water heater anchoring, FIRPTA
- **Texas**: Option Period, T-47 Affidavit, MUD/PID disclosure, foundation inspection
- **Florida**: Wind mitigation, HOA estoppel, sinkhole disclosure, hurricane insurance
- **New York**: Attorney review, mansion tax, co-op board package, ACRIS recording
- **Illinois**: 5-business-day attorney approval period, Cook County transfer tax
- **Pennsylvania**: Coal Notice in coal-mining counties, Realty Transfer Tax
- **North Carolina**: Due Diligence Period structure (replaces inspection contingency)
- **Massachusetts**: Title V septic, Lead Paint Mandate, attorney closings

[See all 50 state pages on skillsora.digital →](https://skillsora.digital/real-estate-tc)

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Your AI runtime (Claude Code / Cursor / Aider)          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ skill files  │ │ skill files  │ │   skill files    │ │
│  │ (intake)     │ │ (chase)      │ │   (closing-prep) │ │
│  └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘ │
└─────────┼────────────────┼──────────────────┼───────────┘
          │                │                  │
          ▼                ▼                  ▼
   ┌──────────────────────────────────────────────────┐
   │    MCP servers (local Node.js processes)         │
   │  ┌────────────────┐ ┌──────────────────────────┐ │
   │  │ closing-       │ │ deadline-chaser          │ │
   │  │ checklist      │ │ (JSON storage)           │ │
   │  └───────┬────────┘ └──────────────────────────┘ │
   │          │          ┌──────────────────────────┐ │
   │          │          │ escrow-tracker           │ │
   │          │          │ (JSON + SHA256)          │ │
   │          ▼          └──────────────────────────┘ │
   │   ┌──────────────────────────────────────────┐   │
   │   │ Memory pack (Letta-compatible JSON)     │   │
   │   │  state-checklists/{state-code}.json     │   │
   │   └──────────────────────────────────────────┘   │
   └──────────────────────────────────────────────────┘
                    Local-first, zero third-party API
```

### Stack

- **Runtime**: Node.js 20 or higher
- **Language**: TypeScript strict ESM
- **Framework**: `@modelcontextprotocol/sdk` for the MCP servers
- **Validation**: `zod` on every tool input
- **Storage**: Local JSON files (no SQLite native build dependency)
- **Tests**: Vitest (next to source)

---

## Skillsora vs traditional TC software

|  | Skillsora | Brokermint, Paperless Pipeline, Skyslope |
|---|---|---|
| AI agent workflow | Yes, MCP plus skills | No native AI agent layer |
| State-specific knowledge | 200 checklists, 50 states | User builds checklists |
| Document storage and compliance | Audit trail only, no storage | Full storage and brokerage admin |
| Auto-chase missing docs | Templates by tone, never auto-sent | Manual reminders |
| Privacy | Local-first, zero third-party | Cloud-hosted |
| Pricing entry | $49 one-time | $30 to $80 per month |
| Integration | Runs alongside your existing stack | Standalone platform |

**Skillsora is complementary, not a replacement.**

---

## Pricing

| Tier | Price | Best for | Buy |
|---|---|---|---|
| Lite | $49 one-time | Solo TC trying it out | [Pre-order](https://skillsora.gumroad.com/l/ikpfle) |
| Pro | $99 one-time | Solo plus small brokerage (5 seats) | [Pre-order](https://skillsora.gumroad.com/l/cixxp) |
| Team | $499 one-time | Brokerage 5 to 50 agents | [Pre-order](https://skillsora.gumroad.com/l/nywfq) |
| Enterprise | $4,999 per year | Mid-size brokerages 50 to 500 agents | [Pre-order](https://skillsora.gumroad.com/l/ducqux) |
| White-label | $24,999 one-time | Big brokerages and franchises | [Contact sales](mailto:contact@skillsora.digital?subject=White-label%20inquiry) |

Pre-orders ship **2026-05-15**. The MIT-licensed code in this repository is already usable.

---

## FAQ

### Do I need Claude Code to use this bundle?
No. The bundle works with any MCP-compatible runtime: Claude Code, Cursor, Aider, Continue, and others. The skill files use the .skill.md format which is supported broadly.

### Is the bundle compliant with my state's closing requirements?
The premium memory pack ships with checklists synthesized from publicly available state real estate commission documentation, NAR standard forms, and MLS standard practice. They are starting points, not legal advice. Always verify state-specific requirements with your local commission.

### What is in the premium memory pack versus this open-source demo?
This repo ships 10 state checklists (Lite tier). The premium pack (Pro tier and above) ships 200 checklists across all 50 US states plus four transaction types: residential, commercial, new-build, and short-sale.

### Does this replace Brokermint, Paperless Pipeline, Skyslope?
No. Skillsora is complementary. Your TC software handles document storage, client portals, and brokerage admin. Skillsora adds the AI agent layer that automates the workflow on top.

### Is my client data sent to any third-party API?
No. The bundle is local-first. The MCP servers run on your machine, the memory pack is local JSON, and the LLM you use is whatever you configured in your runtime.

### Can I use this for commercial real estate?
The premium memory pack covers residential, commercial, new-build, and short-sale transaction types. The Lite demo only covers residential.

[More questions on the marketplace page →](https://skillsora.digital/real-estate-tc#faq)

---

## Contributing

PRs welcome on the open-source layer (MCP servers and skill files). Memory pack content is curated by Skillsora to maintain quality and consistency.

If you spot a bug or want to suggest a state-specific rule that should be encoded, [open an issue](https://github.com/Skillsora/real-estate-tc/issues).

For new vertical bundles (M&A advisor, CPA serving creators, healthcare compliance, legal ops), reach out: [contact@skillsora.digital](mailto:contact@skillsora.digital).

---

## License

The code in this repository is **MIT licensed** (see [LICENSE](LICENSE)).

The premium memory pack (200 state checklists in `memory/premium/`) and white-label assets are **proprietary**, shipped via Skillsora purchase delivery.

---

## Support

- **Issues**: [github.com/Skillsora/real-estate-tc/issues](https://github.com/Skillsora/real-estate-tc/issues)
- **Email**: [contact@skillsora.digital](mailto:contact@skillsora.digital)
- **Marketplace**: [skillsora.digital](https://skillsora.digital)

---

<div align="center">

**Built by [Skillsora](https://skillsora.digital), the vertical agent stack marketplace.**

If this saves you time, [pre-order Pro](https://skillsora.gumroad.com/l/cixxp) to support continued development and unlock the full 200-state memory pack.

</div>
