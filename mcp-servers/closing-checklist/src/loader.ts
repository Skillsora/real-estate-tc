import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ChecklistSchema,
  IndexSchema,
  type Checklist,
  type ChecklistIndex,
  type TransactionType,
} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const memoryRootFromEnv = process.env.SKILLSORA_MEMORY_PATH;
const memoryRootFromBundle = resolve(__dirname, "../../../memory");

export const MEMORY_ROOT = memoryRootFromEnv ?? memoryRootFromBundle;

let cachedIndex: ChecklistIndex | null = null;

export async function loadIndex(): Promise<ChecklistIndex> {
  if (cachedIndex) return cachedIndex;
  const raw = await readFile(resolve(MEMORY_ROOT, "index.json"), "utf-8");
  cachedIndex = IndexSchema.parse(JSON.parse(raw));
  return cachedIndex;
}

export async function loadChecklist(
  state: string,
  transactionType: TransactionType,
): Promise<Checklist> {
  const index = await loadIndex();
  const stateUpper = state.toUpperCase();
  const entry = index.entries.find(
    (e) => e.state === stateUpper && e.transactionType === transactionType,
  );
  if (!entry) {
    const available = index.entries
      .map((e) => `${e.state} (${e.transactionType})`)
      .join(", ");
    throw new Error(
      `No checklist available for ${stateUpper} (${transactionType}). Available: ${available}`,
    );
  }
  const file = resolve(MEMORY_ROOT, entry.file);
  const raw = await readFile(file, "utf-8");
  return ChecklistSchema.parse(JSON.parse(raw));
}
