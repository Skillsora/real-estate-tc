#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadChecklist, loadIndex } from "./loader.js";
import {
  PartySchema,
  PhaseSchema,
  TransactionTypeSchema,
  type Task,
} from "./types.js";

const server = new McpServer({
  name: "skillsora-closing-checklist",
  version: "0.1.0",
});

server.tool(
  "list_states",
  "List all US states with available closing checklists, including item count and transaction type.",
  {},
  async () => {
    const index = await loadIndex();
    const lines = index.entries.map(
      (e) =>
        `- ${e.state} (${e.stateName}, ${e.transactionType}): ${e.itemCount} items`,
    );
    const text = [
      `Skillsora Real Estate TC: ${index.entries.length} state checklists available (${index.tier} tier).`,
      "",
      ...lines,
      "",
      "Premium tier (200 checklists across all 50 states + commercial, new-build, short-sale) ships via Skillsora purchase.",
    ].join("\n");
    return { content: [{ type: "text", text }] };
  },
);

server.tool(
  "get_checklist",
  "Get the closing checklist for a US state. Optionally filter by phase or responsible party.",
  {
    state: z
      .string()
      .length(2)
      .describe("Two-letter state code, e.g. CA, TX, FL"),
    transactionType: TransactionTypeSchema.default("residential"),
    phase: PhaseSchema.optional().describe(
      "Optional phase filter (intake, under_contract, inspection, appraisal, closing_prep, closing_day, post_close)",
    ),
    responsibleParty: PartySchema.optional().describe(
      "Optional responsible party filter (tc, agent, buyer, seller, lender, escrow, title_co, inspector, appraiser, attorney, hoa)",
    ),
  },
  async ({ state, transactionType, phase, responsibleParty }) => {
    const checklist = await loadChecklist(state, transactionType);
    let items: Task[] = checklist.items;
    if (phase) items = items.filter((i) => i.phase === phase);
    if (responsibleParty)
      items = items.filter((i) => i.responsibleParty === responsibleParty);

    const lines = items.map((i) => {
      const due = i.dueOffset
        ? ` (due ${i.dueOffset.days >= 0 ? "+" : ""}${i.dueOffset.days}d from ${i.dueOffset.anchor})`
        : "";
      const tag = i.stateSpecific ? " [state-specific]" : "";
      return `- [${i.phase}] ${i.title}${due} :: ${i.responsibleParty}${tag}`;
    });

    const header = [
      `${checklist.stateName} (${checklist.state}) ${transactionType} closing checklist`,
      `Source: ${checklist.source}`,
      `Last updated: ${checklist.lastUpdated}`,
      `Items returned: ${items.length} of ${checklist.items.length}`,
      "",
    ].join("\n");

    return {
      content: [{ type: "text", text: header + lines.join("\n") }],
    };
  },
);

server.tool(
  "compute_due_dates",
  "Compute absolute due dates for a checklist given the contract signed date and the planned closing date. Anchors that are not provided produce a 'date not computed' note for the affected tasks.",
  {
    state: z.string().length(2),
    transactionType: TransactionTypeSchema.default("residential"),
    contractSignedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("ISO date YYYY-MM-DD"),
    closingDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("ISO date YYYY-MM-DD"),
    inspectionCompleteDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    loanApprovedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    earnestMoneyDueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  },
  async ({
    state,
    transactionType,
    contractSignedDate,
    closingDate,
    inspectionCompleteDate,
    loanApprovedDate,
    earnestMoneyDueDate,
  }) => {
    const checklist = await loadChecklist(state, transactionType);
    const anchors: Record<string, Date> = {
      contract_signed: new Date(contractSignedDate),
      closing_date: new Date(closingDate),
    };
    if (inspectionCompleteDate)
      anchors.inspection_complete = new Date(inspectionCompleteDate);
    if (loanApprovedDate) anchors.loan_approved = new Date(loanApprovedDate);
    if (earnestMoneyDueDate)
      anchors.earnest_money_due = new Date(earnestMoneyDueDate);

    const computed = checklist.items.map((task) => {
      if (!task.dueOffset) {
        return {
          date: "(no anchor)",
          task,
        };
      }
      const anchor = anchors[task.dueOffset.anchor];
      if (!anchor) {
        return {
          date: `(anchor ${task.dueOffset.anchor} not provided)`,
          task,
        };
      }
      const due = new Date(anchor);
      due.setUTCDate(due.getUTCDate() + task.dueOffset.days);
      return {
        date: due.toISOString().slice(0, 10),
        task,
      };
    });

    computed.sort((a, b) => {
      const aRank = a.date.startsWith("(") ? "9999-99-99" : a.date;
      const bRank = b.date.startsWith("(") ? "9999-99-99" : b.date;
      return aRank.localeCompare(bRank);
    });

    const lines = computed.map(
      ({ date, task }) =>
        `${date} | [${task.phase}] ${task.title} :: ${task.responsibleParty}${task.stateSpecific ? " [state-specific]" : ""}`,
    );

    const header = [
      `${checklist.stateName} ${transactionType} timeline`,
      `Contract signed: ${contractSignedDate}`,
      `Closing date: ${closingDate}`,
      "",
    ].join("\n");

    return {
      content: [{ type: "text", text: header + lines.join("\n") }],
    };
  },
);

server.tool(
  "export_checklist",
  "Export a checklist as Markdown or JSON, suitable for sharing with a client, importing into a project tracker, or generating a PDF.",
  {
    state: z.string().length(2),
    transactionType: TransactionTypeSchema.default("residential"),
    format: z.enum(["markdown", "json"]).default("markdown"),
  },
  async ({ state, transactionType, format }) => {
    const checklist = await loadChecklist(state, transactionType);

    if (format === "json") {
      return {
        content: [
          { type: "text", text: JSON.stringify(checklist, null, 2) },
        ],
      };
    }

    const sections = checklist.items
      .map((task) => {
        const dueLine = task.dueOffset
          ? `- Due: ${task.dueOffset.days >= 0 ? "+" : ""}${task.dueOffset.days} days from ${task.dueOffset.anchor}\n`
          : "";
        const stateLine = task.stateSpecific ? `- State-specific: yes\n` : "";
        const descLine = task.description ? `\n${task.description}\n` : "";
        const notesLine = task.notes ? `\nNotes: ${task.notes}\n` : "";
        return [
          `## ${task.id}: ${task.title}`,
          ``,
          `- Phase: ${task.phase}`,
          `- Responsible: ${task.responsibleParty}`,
          dueLine + stateLine,
          descLine,
          notesLine,
        ].join("\n");
      })
      .join("\n");

    const md = [
      `# ${checklist.stateName} ${transactionType} closing checklist`,
      ``,
      `- Source: ${checklist.source}`,
      `- Last updated: ${checklist.lastUpdated}`,
      `- Version: ${checklist.version}`,
      `- Items: ${checklist.items.length}`,
      ``,
      `Generated by Skillsora Real Estate TC bundle (https://skillsora.digital/real-estate-tc).`,
      ``,
      sections,
    ].join("\n");

    return { content: [{ type: "text", text: md }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
