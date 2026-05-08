export type Tone = "soft" | "firm" | "urgent";
export type Channel = "email" | "sms";

export interface TemplateContext {
  recipientName: string;
  contingency: string;
  dueDate: string;
  daysUntilDue: number;
  daysOverdue: number;
  fileCode: string;
  propertyAddress: string;
  tcName: string;
}

const emailSubject = (ctx: TemplateContext, tone: Tone): string => {
  const overdue = ctx.daysOverdue > 0;
  if (tone === "soft") {
    return overdue
      ? `Quick check: ${ctx.contingency} for ${ctx.propertyAddress}`
      : `Reminder: ${ctx.contingency} due ${ctx.dueDate}`;
  }
  if (tone === "firm") {
    return overdue
      ? `Action needed: ${ctx.contingency} past due (${ctx.daysOverdue}d) for ${ctx.propertyAddress}`
      : `Action required: ${ctx.contingency} due ${ctx.dueDate} (${ctx.daysUntilDue}d)`;
  }
  return overdue
    ? `URGENT: ${ctx.contingency} past due ${ctx.daysOverdue} days, ${ctx.propertyAddress}`
    : `URGENT: ${ctx.contingency} due ${ctx.dueDate} (${ctx.daysUntilDue}d)`;
};

const emailBody = (ctx: TemplateContext, tone: Tone): string => {
  const overdue = ctx.daysOverdue > 0;
  const opener =
    tone === "soft"
      ? `Hi ${ctx.recipientName},\n\nJust circling back on the ${ctx.contingency} for ${ctx.propertyAddress} (file ${ctx.fileCode}).`
      : tone === "firm"
        ? `Hi ${ctx.recipientName},\n\nFollowing up on the ${ctx.contingency} for ${ctx.propertyAddress} (file ${ctx.fileCode}).`
        : `${ctx.recipientName},\n\nThe ${ctx.contingency} for ${ctx.propertyAddress} (file ${ctx.fileCode}) needs immediate attention.`;

  const status = overdue
    ? `This deadline was due ${ctx.dueDate}, ${ctx.daysOverdue} days ago.`
    : `This is due ${ctx.dueDate} (${ctx.daysUntilDue} days from today).`;

  const closer =
    tone === "soft"
      ? `Could you let me know where things stand when you have a minute?\n\nThanks,\n${ctx.tcName}`
      : tone === "firm"
        ? `Please confirm completion or let me know if there is a blocker by end of day.\n\nThanks,\n${ctx.tcName}`
        : `Please reply within 4 hours with status. If we miss this, it puts the closing on ${ctx.fileCode} at risk.\n\n${ctx.tcName}`;

  return [opener, "", status, "", closer].join("\n");
};

const smsBody = (ctx: TemplateContext, tone: Tone): string => {
  const overdue = ctx.daysOverdue > 0;
  if (tone === "soft") {
    return overdue
      ? `Hi ${ctx.recipientName}, quick check on ${ctx.contingency} for ${ctx.fileCode} (was due ${ctx.dueDate}). Where are we on it? Thanks. ${ctx.tcName}`
      : `Hi ${ctx.recipientName}, friendly reminder ${ctx.contingency} due ${ctx.dueDate} for ${ctx.fileCode}. Thanks. ${ctx.tcName}`;
  }
  if (tone === "firm") {
    return overdue
      ? `${ctx.recipientName}, ${ctx.contingency} for ${ctx.fileCode} is ${ctx.daysOverdue}d overdue. Please confirm by EOD. ${ctx.tcName}`
      : `${ctx.recipientName}, ${ctx.contingency} due ${ctx.dueDate} for ${ctx.fileCode}. Please confirm progress. ${ctx.tcName}`;
  }
  return overdue
    ? `URGENT: ${ctx.contingency} ${ctx.daysOverdue}d overdue on ${ctx.fileCode}. Reply within 4h. ${ctx.tcName}`
    : `URGENT: ${ctx.contingency} due ${ctx.dueDate} on ${ctx.fileCode}. Closing at risk. ${ctx.tcName}`;
};

export function renderTemplate(
  channel: Channel,
  tone: Tone,
  ctx: TemplateContext,
): { subject?: string; body: string } {
  if (channel === "email") {
    return { subject: emailSubject(ctx, tone), body: emailBody(ctx, tone) };
  }
  return { body: smsBody(ctx, tone) };
}
