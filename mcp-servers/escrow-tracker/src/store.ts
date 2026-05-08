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

const dbPathFromEnv = process.env.SKILLSORA_ESCROW_DB;
const defaultDbPath = resolve(__dirname, "..", "data", "escrow.json");

export const STORE_PATH = dbPathFromEnv ?? defaultDbPath;

export const DocumentSchema = z.object({
  id: z.number().int().positive(),
  fileCode: z.string(),
  docCode: z.string(),
  label: z.string(),
  phase: z.string(),
  source: z.string(),
  sha256: z.string().nullable(),
  attachedPath: z.string().nullable(),
  receivedAt: z.string(),
  notes: z.string().nullable(),
});

export const StoreSchema = z.object({
  version: z.literal(1),
  nextDocumentId: z.number().int().nonnegative(),
  documents: z.array(DocumentSchema),
});

export type EscrowDocument = z.infer<typeof DocumentSchema>;
export type StoreState = z.infer<typeof StoreSchema>;

const empty: StoreState = {
  version: 1,
  nextDocumentId: 1,
  documents: [],
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
  insertDocument(
    input: Omit<EscrowDocument, "id" | "receivedAt">,
  ): EscrowDocument {
    const state = load();
    const doc: EscrowDocument = {
      id: state.nextDocumentId,
      ...input,
      receivedAt: new Date().toISOString(),
    };
    state.documents.push(doc);
    state.nextDocumentId += 1;
    save(state);
    return doc;
  },

  listForFile(fileCode: string): EscrowDocument[] {
    return load()
      .documents.filter((d) => d.fileCode === fileCode)
      .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
  },
};
