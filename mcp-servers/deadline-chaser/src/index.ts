#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { store } from "./store.js";
import { renderTemplate } from "./templates.js";

const server = new McpServer({
  name: "skillsora-deadline-chaser",
  version: "0.1.0",
});

const ContingencyEnum = z.enum([
  "loan_approval",
  "inspection",
  "appraisal",
  "title",
  "due_diligence",
  "option_period",
  "attorney_review",
  "hoa_disclosure",
  "earnest_money",
  "other",
]);

const ToneEnum = z.enum(["soft", "firm", "urgent"]);
const ChannelEnum = z.enum(["email", "sms"]);
const StatusEnum = z.enum(["open", "completed", "missed", "waived"]);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

server.tool(
  "create_transaction",
  "Register a new transaction file. Returns the transaction id.",
  {
    fileCode: z.string().min(1).describe("Internal file code, e.g. 1234-MAIN"),
    state: z.string().length(2),
    propertyAddress: z.string().min(1),
    buyerName: z.string().min(1),
    sellerName: z.string().min(1),
    contractSignedDate: isoDate,
    closingDate: isoDate,
  },
  async (input) => {
    const tx = store.insertTransaction(input);
    return {
      content: [
        {
          type: "text",
          text: `Transaction ${tx.fileCode} created (id ${tx.id}). Closing scheduled ${tx.closingDate}.`,
        },
      ],
    };
  },
);

server.tool(
  "add_deadline",
  "Add a contingency deadline to a transaction.",
  {
    fileCode: z.string().min(1),
    contingency: ContingencyEnum,
    label: z.string().min(1).describe("Short human label"),
    dueDate: isoDate,
    notes: z.string().optional(),
  },
  async ({ fileCode, contingency, label, dueDate, notes }) => {
    const tx = store.findTransactionByFileCode(fileCode);
    if (!tx) {
      throw new Error(
        `Transaction ${fileCode} not found. Create it first with create_transaction.`,
      );
    }
    const deadline = store.insertDeadline({
      transactionId: tx.id,
      contingency,
      label,
      dueDate,
      notes: notes ?? null,
    });
    return {
      content: [
        {
          type: "text",
          text: `Deadline '${label}' added to ${fileCode}, due ${dueDate} (id ${deadline.id}).`,
        },
      ],
    };
  },
);

server.tool(
  "list_upcoming",
  "List upcoming open deadlines across all transactions, sorted by due date. Default window: next 14 days. Includes overdue items by default.",
  {
    windowDays: z.number().int().positive().default(14),
    includeOverdue: z.boolean().default(true),
  },
  async ({ windowDays, includeOverdue }) => {
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const future = new Date(today);
    future.setDate(today.getDate() + windowDays);
    const futureIso = future.toISOString().slice(0, 10);

    const rows = store.listOpenInWindow(todayIso, futureIso, includeOverdue);

    if (rows.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No open deadlines in the next ${windowDays} days.`,
          },
        ],
      };
    }

    const dayMs = 1000 * 60 * 60 * 24;
    const lines = rows.map((r) => {
      const due = new Date(r.dueDate);
      const diff = Math.round((due.getTime() - today.getTime()) / dayMs);
      const tag = diff < 0 ? `OVERDUE ${Math.abs(diff)}d` : `${diff}d`;
      return `[${tag}] ${r.dueDate} | id ${r.id} | ${r.transaction.fileCode} (${r.transaction.propertyAddress}) :: ${r.contingency} - ${r.label}`;
    });

    return {
      content: [
        {
          type: "text",
          text: [
            `${rows.length} open deadline(s) in window:`,
            "",
            ...lines,
          ].join("\n"),
        },
      ],
    };
  },
);

server.tool(
  "update_deadline_status",
  "Update the status of a deadline. Use this to mark a deadline completed, missed, or waived.",
  {
    deadlineId: z.number().int().positive(),
    status: StatusEnum,
    notes: z.string().optional(),
  },
  async ({ deadlineId, status, notes }) => {
    const ok = store.updateDeadlineStatus(deadlineId, status, notes ?? null);
    if (!ok) {
      throw new Error(`Deadline ${deadlineId} not found.`);
    }
    return {
      content: [
        {
          type: "text",
          text: `Deadline ${deadlineId} updated to status '${status}'.`,
        },
      ],
    };
  },
);

server.tool(
  "generate_followup_template",
  "Generate a follow-up email or SMS for a specific deadline. Pick tone based on overdue level: soft for advance reminders, firm for due-soon, urgent for overdue.",
  {
    deadlineId: z.number().int().positive(),
    channel: ChannelEnum,
    tone: ToneEnum,
    recipientName: z.string().min(1),
    tcName: z.string().min(1),
  },
  async ({ deadlineId, channel, tone, recipientName, tcName }) => {
    const deadline = store.getDeadline(deadlineId);
    if (!deadline) {
      throw new Error(`Deadline ${deadlineId} not found.`);
    }

    const today = new Date();
    const due = new Date(deadline.dueDate);
    const dayMs = 1000 * 60 * 60 * 24;
    const daysUntilDue = Math.max(
      0,
      Math.round((due.getTime() - today.getTime()) / dayMs),
    );
    const daysOverdue = Math.max(
      0,
      Math.round((today.getTime() - due.getTime()) / dayMs),
    );

    const rendered = renderTemplate(channel, tone, {
      recipientName,
      contingency: deadline.label,
      dueDate: deadline.dueDate,
      daysUntilDue,
      daysOverdue,
      fileCode: deadline.transaction.fileCode,
      propertyAddress: deadline.transaction.propertyAddress,
      tcName,
    });

    const text =
      channel === "email"
        ? `Subject: ${rendered.subject ?? ""}\n\n${rendered.body}`
        : rendered.body;

    return {
      content: [{ type: "text", text }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
