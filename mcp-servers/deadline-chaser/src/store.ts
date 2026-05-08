import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  renameSync,
} from "node:fs";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPathFromEnv = process.env.SKILLSORA_DEADLINE_DB;
const defaultDbPath = resolve(__dirname, "..", "data", "deadlines.json");

export const STORE_PATH = dbPathFromEnv ?? defaultDbPath;

export const TransactionSchema = z.object({
  id: z.number().int().positive(),
  fileCode: z.string(),
  state: z.string().length(2),
  propertyAddress: z.string(),
  buyerName: z.string(),
  sellerName: z.string(),
  contractSignedDate: z.string(),
  closingDate: z.string(),
  createdAt: z.string(),
});

export const DeadlineStatusSchema = z.enum([
  "open",
  "completed",
  "missed",
  "waived",
]);

export const DeadlineSchema = z.object({
  id: z.number().int().positive(),
  transactionId: z.number().int().positive(),
  contingency: z.string(),
  label: z.string(),
  dueDate: z.string(),
  status: DeadlineStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
  closedAt: z.string().nullable(),
});

export const StoreSchema = z.object({
  version: z.literal(1),
  nextTransactionId: z.number().int().nonnegative(),
  nextDeadlineId: z.number().int().nonnegative(),
  transactions: z.array(TransactionSchema),
  deadlines: z.array(DeadlineSchema),
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type Deadline = z.infer<typeof DeadlineSchema>;
export type DeadlineStatus = z.infer<typeof DeadlineStatusSchema>;
export type StoreState = z.infer<typeof StoreSchema>;

const empty: StoreState = {
  version: 1,
  nextTransactionId: 1,
  nextDeadlineId: 1,
  transactions: [],
  deadlines: [],
};

mkdirSync(dirname(STORE_PATH), { recursive: true });

function load(): StoreState {
  if (!existsSync(STORE_PATH)) {
    writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2), "utf-8");
    return structuredClone(empty);
  }
  const raw = readFileSync(STORE_PATH, "utf-8");
  return StoreSchema.parse(JSON.parse(raw));
}

function save(state: StoreState): void {
  const tmp = `${STORE_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
  renameSync(tmp, STORE_PATH);
}

export const store = {
  insertTransaction(
    input: Omit<Transaction, "id" | "createdAt">,
  ): Transaction {
    const state = load();
    if (state.transactions.find((t) => t.fileCode === input.fileCode)) {
      throw new Error(
        `Transaction with fileCode ${input.fileCode} already exists.`,
      );
    }
    const tx: Transaction = {
      id: state.nextTransactionId,
      ...input,
      createdAt: new Date().toISOString(),
    };
    state.transactions.push(tx);
    state.nextTransactionId += 1;
    save(state);
    return tx;
  },

  findTransactionByFileCode(fileCode: string): Transaction | undefined {
    return load().transactions.find((t) => t.fileCode === fileCode);
  },

  insertDeadline(
    input: Omit<Deadline, "id" | "createdAt" | "closedAt" | "status"> & {
      status?: DeadlineStatus;
    },
  ): Deadline {
    const state = load();
    const tx = state.transactions.find((t) => t.id === input.transactionId);
    if (!tx) {
      throw new Error(`Transaction id ${input.transactionId} not found.`);
    }
    const deadline: Deadline = {
      id: state.nextDeadlineId,
      transactionId: input.transactionId,
      contingency: input.contingency,
      label: input.label,
      dueDate: input.dueDate,
      status: input.status ?? "open",
      notes: input.notes ?? null,
      createdAt: new Date().toISOString(),
      closedAt: null,
    };
    state.deadlines.push(deadline);
    state.nextDeadlineId += 1;
    save(state);
    return deadline;
  },

  listOpenInWindow(
    todayIso: string,
    futureIso: string,
    includeOverdue: boolean,
  ): Array<Deadline & { transaction: Transaction }> {
    const state = load();
    const txMap = new Map(state.transactions.map((t) => [t.id, t]));
    return state.deadlines
      .filter((d) => d.status === "open")
      .filter((d) => d.dueDate <= futureIso)
      .filter((d) => (includeOverdue ? true : d.dueDate >= todayIso))
      .map((d) => ({ ...d, transaction: txMap.get(d.transactionId)! }))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },

  getDeadline(
    id: number,
  ): (Deadline & { transaction: Transaction }) | undefined {
    const state = load();
    const d = state.deadlines.find((x) => x.id === id);
    if (!d) return undefined;
    const tx = state.transactions.find((t) => t.id === d.transactionId);
    if (!tx) return undefined;
    return { ...d, transaction: tx };
  },

  updateDeadlineStatus(
    id: number,
    status: DeadlineStatus,
    notes: string | null,
  ): boolean {
    const state = load();
    const d = state.deadlines.find((x) => x.id === id);
    if (!d) return false;
    d.status = status;
    if (notes !== null) d.notes = notes;
    d.closedAt = status === "open" ? null : new Date().toISOString();
    save(state);
    return true;
  },
};
