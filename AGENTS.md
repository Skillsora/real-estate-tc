# AGENTS.md

Guidance for AI coding agents (Cursor, GitHub Copilot, Aider, Continue, and other MCP-compatible runtimes) working in this repository.

## Project

Vertical AI bundle for Real Estate Transaction Coordinators (US). Part of the Skillsora marketplace.

## Stack

- Node 20+, TypeScript strict
- npm workspaces monorepo
- 3 MCP servers in `mcp-servers/` (built with `@modelcontextprotocol/sdk` and `zod`)
- 5 skill files in `skills/` (`.skill.md` format)
- Memory pack in `memory/` (Letta-compatible JSON + Markdown)
- 0 third-party API in the runtime: everything runs locally

## Conventions

- TypeScript strict mode, no `any`
- Validate every MCP tool input with `zod`
- Tests live next to source: `src/foo.ts` + `src/foo.test.ts` (Vitest)
- No comments unless the WHY is non-obvious
- Public-facing copy in English (US audience)

## Repo split

- This repo (public, MIT): code of MCP servers + skills + 10 demo state checklists
- Premium memory pack (proprietary): 200 state checklists shipped via Skillsora purchase, lives in `memory/premium/` (gitignored)

## Build

```bash
npm install
npm run build
```

## Add a new state checklist

1. Drop the JSON in `memory/state-checklists/{state-code}.json` (e.g. `tx.json`)
2. Update `memory/index.json`
3. Run `npm run test` to validate the schema
