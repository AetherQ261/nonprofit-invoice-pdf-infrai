import { InfraiClient } from "./infrai_client.ts";
import { orderSchema, renderInvoice, shouldSendReminder } from "./invoice_domain.ts";

export async function issueReceipt(input: unknown, client = new InfraiClient()) {
  const order = orderSchema.parse(input);
  const pdf = await client.generatePdf(renderInvoice(order));
  const email = await client.sendEmail(order.donorEmail, `Receipt for ${order.campaign}`, `Your receipt is ready. PDF data: ${pdf.pdf}`);
  return { messageId: email.message_id, reminderDue: shouldSendReminder(order) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const recipient = process.env.INFRAI_DEMO_RECIPIENT;
  if (!recipient) throw new Error("INFRAI_DEMO_RECIPIENT is required");
  const order = { donorName: "Amina Lee", donorEmail: recipient, campaign: "River restoration", items: [{ description: "Community donation", amount: 125 }] };
  issueReceipt(order).then((result) => console.log(JSON.stringify(result))).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
