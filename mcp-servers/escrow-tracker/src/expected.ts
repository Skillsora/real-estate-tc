export type Phase =
  | "intake"
  | "under_contract"
  | "inspection"
  | "appraisal"
  | "closing_prep"
  | "closing_day"
  | "post_close";

export interface ExpectedDoc {
  code: string;
  label: string;
  phase: Phase;
  stateSpecific?: string[];
}

export const EXPECTED_DOCS: ExpectedDoc[] = [
  {
    code: "purchase_agreement",
    label: "Fully executed purchase agreement",
    phase: "intake",
  },
  {
    code: "earnest_money_receipt",
    label: "Earnest money deposit receipt",
    phase: "intake",
  },
  {
    code: "title_commitment",
    label: "Title commitment",
    phase: "under_contract",
  },
  {
    code: "lead_paint_disclosure",
    label: "Lead-based paint disclosure (pre-1978 homes)",
    phase: "under_contract",
  },
  {
    code: "seller_property_disclosure",
    label: "Seller property disclosure",
    phase: "under_contract",
  },
  {
    code: "hoa_docs",
    label: "HOA documents and estoppel",
    phase: "under_contract",
  },
  {
    code: "tds",
    label: "Transfer Disclosure Statement (TDS)",
    phase: "under_contract",
    stateSpecific: ["CA"],
  },
  {
    code: "nhd",
    label: "Natural Hazard Disclosure (NHD)",
    phase: "under_contract",
    stateSpecific: ["CA"],
  },
  {
    code: "spds",
    label: "Seller Property Disclosure Statement (SPDS)",
    phase: "under_contract",
    stateSpecific: ["AZ"],
  },
  {
    code: "t47_affidavit",
    label: "T-47 Residential Real Property Affidavit",
    phase: "under_contract",
    stateSpecific: ["TX"],
  },
  {
    code: "coal_notice",
    label: "Coal Notice",
    phase: "under_contract",
    stateSpecific: ["PA"],
  },
  {
    code: "inspection_report",
    label: "Home inspection report",
    phase: "inspection",
  },
  {
    code: "inspection_response",
    label: "Inspection objection or acceptance addendum",
    phase: "inspection",
  },
  {
    code: "termite_letter",
    label: "Wood-destroying organism (termite) inspection letter",
    phase: "inspection",
    stateSpecific: ["FL", "GA", "AZ", "TX"],
  },
  {
    code: "appraisal_report",
    label: "Appraisal report",
    phase: "appraisal",
  },
  {
    code: "closing_disclosure",
    label: "Closing Disclosure (delivered 3 business days prior)",
    phase: "closing_prep",
  },
  {
    code: "homeowner_insurance",
    label: "Homeowner insurance binder",
    phase: "closing_prep",
  },
  {
    code: "wire_instructions_verified",
    label: "Wire instructions verified by phone",
    phase: "closing_prep",
  },
  {
    code: "final_walkthrough_confirmation",
    label: "Final walkthrough confirmation",
    phase: "closing_prep",
  },
  {
    code: "signed_deed",
    label: "Signed and notarized deed",
    phase: "closing_day",
  },
  {
    code: "settlement_statement",
    label: "Final settlement statement (HUD-1 / CD)",
    phase: "closing_day",
  },
  {
    code: "wire_confirmation",
    label: "Funding wire confirmation",
    phase: "closing_day",
  },
  {
    code: "recording_confirmation",
    label: "Recorded deed confirmation from county",
    phase: "post_close",
  },
  {
    code: "commission_disbursement",
    label: "Commission disbursement confirmation",
    phase: "post_close",
  },
];

export function expectedDocsForState(state: string): ExpectedDoc[] {
  const stateUpper = state.toUpperCase();
  return EXPECTED_DOCS.filter(
    (d) => !d.stateSpecific || d.stateSpecific.includes(stateUpper),
  );
}
