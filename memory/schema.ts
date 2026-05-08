import { z } from "zod";

export const PhaseSchema = z.enum([
  "intake",
  "under_contract",
  "inspection",
  "appraisal",
  "closing_prep",
  "closing_day",
  "post_close",
]);

export const PartySchema = z.enum([
  "tc",
  "agent",
  "buyer",
  "seller",
  "lender",
  "escrow",
  "title_co",
  "inspector",
  "appraiser",
  "attorney",
  "hoa",
]);

export const AnchorSchema = z.enum([
  "contract_signed",
  "closing_date",
  "inspection_complete",
  "loan_approved",
  "earnest_money_due",
]);

export const TransactionTypeSchema = z.enum([
  "residential",
  "commercial",
  "new_build",
  "short_sale",
]);

export const TaskSchema = z.object({
  id: z.string().regex(/^task-\d{3}$/),
  title: z.string().min(3),
  description: z.string().optional(),
  phase: PhaseSchema,
  responsibleParty: PartySchema,
  dueOffset: z
    .object({
      days: z.number().int(),
      anchor: AnchorSchema,
    })
    .optional(),
  stateSpecific: z.boolean().default(false),
  notes: z.string().optional(),
});

export const ChecklistSchema = z.object({
  state: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/),
  stateName: z.string(),
  transactionType: TransactionTypeSchema,
  version: z.string(),
  source: z.string(),
  lastUpdated: z.string(),
  items: z.array(TaskSchema).min(1),
});

export const IndexEntrySchema = z.object({
  state: z.string().length(2),
  stateName: z.string(),
  transactionType: TransactionTypeSchema,
  itemCount: z.number().int().positive(),
  file: z.string(),
});

export const IndexSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  tier: z.enum(["demo", "premium"]),
  entries: z.array(IndexEntrySchema),
});

export type Phase = z.infer<typeof PhaseSchema>;
export type Party = z.infer<typeof PartySchema>;
export type Anchor = z.infer<typeof AnchorSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Checklist = z.infer<typeof ChecklistSchema>;
export type IndexEntry = z.infer<typeof IndexEntrySchema>;
export type Index = z.infer<typeof IndexSchema>;
