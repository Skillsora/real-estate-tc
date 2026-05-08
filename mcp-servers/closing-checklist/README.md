# closing-checklist (MCP)

Model Context Protocol server that exposes US state-specific real estate closing checklists. Part of the Skillsora Real Estate TC bundle.

## Tools

| Tool | Purpose |
|------|---------|
| `list_states` | List every state checklist currently available, with item counts |
| `get_checklist` | Return a checklist for a state, optionally filtered by phase or responsible party |
| `compute_due_dates` | Compute absolute due dates given contract signed and closing dates |
| `export_checklist` | Export as Markdown or JSON for sharing or PDF generation |

## Install

### From source (bundle dev)

```bash
npm install
npm run build --workspaces
```

### Add to Claude Code

```bash
claude mcp add skillsora-closing-checklist -- node /absolute/path/to/dist/index.js
```

### Add to Cursor

In `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "skillsora-closing-checklist": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"]
    }
  }
}
```

## Memory pack location

By default the server reads checklists from `../../memory/` relative to the compiled `dist/` directory. Override with the `SKILLSORA_MEMORY_PATH` environment variable to point to the premium memory pack:

```bash
SKILLSORA_MEMORY_PATH=/path/to/skillsora-premium/memory node dist/index.js
```

## States included (demo tier)

CA, TX, FL, NY, IL, AZ, GA, NC, OH, PA. The premium tier ships 200 checklists covering all 50 states plus commercial, new-build, and short-sale variants.

## License

MIT (see top-level LICENSE).
