# Skills

Skill files (`.skill.md` format) for the Real Estate Transaction Coordinator workflow. Each skill is a self-contained instruction set that an AI agent loads on demand at runtime (Claude Code, Cursor, Aider, Continue, or any MCP-compatible host).

## Install

### Claude Code

Drop the `.skill.md` files into your skills directory:

```bash
cp skills/*.skill.md ~/.claude/skills/
```

Or symlink for live updates during dev:

```bash
ln -s "$PWD/skills" ~/.claude/skills/skillsora-real-estate-tc
```

### Cursor

Skills are referenced from `.cursorrules` or via Cursor's skill registry (see Cursor docs).

## Skills shipped

| Name | Trigger | Output |
|------|---------|--------|
| `intake-package` | New executed P&S | Wired transaction file with parties, dates, deadlines, expected docs |
| `doc-collection` | Daily chase round | Prioritized chase list with staged messages per recipient |
| `contingency-timeline` | Timeline review or what-if | Visual timeline with critical path and risks flagged |
| `closing-prep` | 14 days before closing | Ready-or-not report with P0 to P3 actions |
| `post-close` | 24 to 72h after closing | Archived file with audit trail and broker handoff |

## Skill chaining

The skills are designed to compose:

1. `intake-package` runs once per file at contract effective date.
2. `contingency-timeline` runs after intake and again whenever a date shifts.
3. `doc-collection` runs daily from contract through closing prep.
4. `closing-prep` runs at closing date minus 14 days, again at minus 7, again at minus 1.
5. `post-close` runs once, 24 to 72 hours after closing.

## Authoring conventions

- Frontmatter contains `name`, `description`, `when_to_use`
- Body is in English (US TC audience)
- No em-dashes
- Reference MCP tools by full name (`closing-checklist.get_checklist`, etc.) so the agent picks the right tool
- Anti-patterns section lists what NOT to do, framed by why
