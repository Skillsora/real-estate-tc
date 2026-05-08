#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { z } from "zod";
import { store } from "./store.js";
import { EXPECTED_DOCS, expectedDocsForState, type Phase } from "./expected.js";

const server = new McpServer({
  name: "skillsora-escrow-tracker",
  version: "0.1.0",
});

const PhaseEnum = z.enum([
  "intake",
  "under_contract",
  "inspection",
  "appraisal",
  "closing_prep",
  "closing_day",
  "post_close",
]);

function sha256OfString(input: string): string {
  return createHash("sha256").update(input, "utf-8").digest("hex");
}

function sha256OfFile(path: string): string {
  const buf = readFileSync(path);
  return createHash("sha256").update(buf).digest("hex");
}

server.tool(
  "register_document",
  "Register a received escrow document for a transaction file. Computes SHA256 of attached file if provided. Use the docCode from `list_expected_documents` for consistent classification, or 'custom' for ad-hoc docs.",
  {
    fileCode: z.string().min(1),
    docCode: z.string().min(1).describe("Code from list_expected_documents or 'custom'"),
    label: z.string().min(1),
    phase: PhaseEnum,
    source: z
      .string()
      .min(1)
      .describe("Where this document came from: lender, seller, agent, escrow, attorney, etc."),
    attachedPath: z
      .string()
      .optional()
      .describe(
        "Optional absolute path to a local file to hash. If provided, SHA256 is computed and stored.",
      ),
    inlineContent: z
      .string()
      .optional()
      .describe("Optional raw content to hash instead of a file (e.g. email body)"),
    notes: z.string().optional(),
  },
  async ({
    fileCode,
    docCode,
    label,
    phase,
    source,
    attachedPath,
    inlineContent,
    notes,
  }) => {
    let sha256: string | null = null;

    if (attachedPath) {
      if (!existsSync(attachedPath)) {
        throw new Error(`Attached file not found at ${attachedPath}`);
      }
      sha256 = sha256OfFile(attachedPath);
    } else if (inlineContent) {
      sha256 = sha256OfString(inlineContent);
    }

    const doc = store.insertDocument({
      fileCode,
      docCode,
      label,
      phase,
      source,
      sha256,
      attachedPath: attachedPath ?? null,
      notes: notes ?? null,
    });

    const sha = sha256 ? `\nSHA256: ${sha256}` : "";
    return {
      content: [
        {
          type: "text",
          text: `Document '${label}' registered for ${fileCode} (id ${doc.id}, phase ${phase}, source ${source}).${sha}`,
        },
      ],
    };
  },
);

server.tool(
  "list_documents",
  "List all documents registered for a transaction file, ordered by receivedAt.",
  {
    fileCode: z.string().min(1),
  },
  async ({ fileCode }) => {
    const docs = store.listForFile(fileCode);
    if (docs.length === 0) {
      return {
        content: [{ type: "text", text: `No documents registered for ${fileCode}.` }],
      };
    }
    const lines = docs.map(
      (d) =>
        `- [${d.phase}] ${d.label} (${d.docCode}) :: source ${d.source}, received ${d.receivedAt}${d.sha256 ? `, sha256 ${d.sha256.slice(0, 12)}...` : ""}`,
    );
    return {
      content: [
        {
          type: "text",
          text: [`${docs.length} document(s) for ${fileCode}:`, "", ...lines].join("\n"),
        },
      ],
    };
  },
);

server.tool(
  "list_expected_documents",
  "List the expected document checklist for a transaction. Filter by state (some docs are state-specific) and optionally by phase.",
  {
    state: z.string().length(2).describe("Two-letter state code"),
    phase: PhaseEnum.optional(),
  },
  async ({ state, phase }) => {
    let expected = expectedDocsForState(state);
    if (phase) expected = expected.filter((d) => d.phase === phase);

    const lines = expected.map(
      (d) =>
        `- [${d.phase}] ${d.code} :: ${d.label}${d.stateSpecific ? ` [state-specific: ${d.stateSpecific.join(",")}]` : ""}`,
    );

    return {
      content: [
        {
          type: "text",
          text: [
            `${expected.length} expected document(s) for ${state}${phase ? ` in phase ${phase}` : ""}:`,
            "",
            ...lines,
          ].join("\n"),
        },
      ],
    };
  },
);

server.tool(
  "list_missing_documents",
  "Compare registered documents against the expected checklist for a state and report what is still missing.",
  {
    fileCode: z.string().min(1),
    state: z.string().length(2),
  },
  async ({ fileCode, state }) => {
    const registered = store.listForFile(fileCode);
    const registeredCodes = new Set(registered.map((d) => d.docCode));
    const expected = expectedDocsForState(state);
    const missing = expected.filter((e) => !registeredCodes.has(e.code));

    if (missing.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `${fileCode}: all ${expected.length} expected documents registered for state ${state}. Audit-ready.`,
          },
        ],
      };
    }

    const byPhase = missing.reduce<Record<string, typeof missing>>((acc, d) => {
      (acc[d.phase] ??= []).push(d);
      return acc;
    }, {});

    const sections = (Object.entries(byPhase) as Array<[Phase, typeof missing]>)
      .map(([phase, docs]) =>
        [
          `## ${phase} (${docs.length} missing)`,
          ...docs.map((d) => `- ${d.code} :: ${d.label}${d.stateSpecific ? ` [state-specific: ${d.stateSpecific.join(",")}]` : ""}`),
        ].join("\n"),
      )
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: [
            `${missing.length} of ${expected.length} expected document(s) still missing for ${fileCode} (${state}).`,
            "",
            sections,
          ].join("\n"),
        },
      ],
    };
  },
);

server.tool(
  "compute_sha256",
  "Compute SHA256 of a local file or an inline string. Useful for verifying that an emailed document matches a previously registered version.",
  {
    path: z.string().optional(),
    content: z.string().optional(),
  },
  async ({ path, content }) => {
    if (!path && !content) {
      throw new Error("Provide either 'path' or 'content'.");
    }
    const sha = path ? sha256OfFile(path) : sha256OfString(content!);
    return {
      content: [{ type: "text", text: `sha256: ${sha}` }],
    };
  },
);

server.tool(
  "generate_audit_trail",
  "Generate a Markdown audit trail of all registered documents for a transaction file, with SHA256 hashes and timestamps. Suitable for the post-closing file archive.",
  {
    fileCode: z.string().min(1),
  },
  async ({ fileCode }) => {
    const docs = store.listForFile(fileCode);
    if (docs.length === 0) {
      return {
        content: [{ type: "text", text: `No documents registered for ${fileCode}.` }],
      };
    }

    const lines = docs.map((d) => {
      const sha = d.sha256 ? d.sha256 : "(no hash)";
      const path = d.attachedPath ? d.attachedPath : "(no attached file)";
      const notes = d.notes ? `  Notes: ${d.notes}\n` : "";
      return [
        `## ${d.id}: ${d.label}`,
        ``,
        `- Doc code: ${d.docCode}`,
        `- Phase: ${d.phase}`,
        `- Source: ${d.source}`,
        `- Received at: ${d.receivedAt}`,
        `- File path: ${path}`,
        `- SHA256: ${sha}`,
        notes,
      ].join("\n");
    });

    const md = [
      `# Audit trail for ${fileCode}`,
      ``,
      `Generated: ${new Date().toISOString()}`,
      `Documents: ${docs.length}`,
      `Tool: skillsora-escrow-tracker`,
      ``,
      lines.join("\n"),
    ].join("\n");

    return { content: [{ type: "text", text: md }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
