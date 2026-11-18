import { z } from "zod";

export const orderSchema = z.object({
  donorName: z.string().min(1),
  donorEmail: z.string().email(),
  campaign: z.string().min(1),
  items: z.array(z.object({ description: z.string().min(1), amount: z.number().positive() })).min(1),
});

export type Order = z.infer<typeof orderSchema>;

export function renderInvoice(order: Order): string {
  const total = order.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2);
  const rows = order.items.map((item) => `<tr><td>${item.description}</td><td>$${item.amount.toFixed(2)}</td></tr>`).join("");
  return `<h1>Donation receipt</h1><p>Thank you, ${order.donorName}.</p><p>Campaign: ${order.campaign}</p><table>${rows}<tr><th>Total</th><th>$${total}</th></tr></table>`;
}

export function shouldSendReminder(order: Order, now = new Date()): boolean {
  return order.items.reduce((sum, item) => sum + item.amount, 0) === 0 || now.getUTCDay() === 1;
}
