import test from "node:test";
import assert from "node:assert/strict";
import { orderSchema, shouldSendReminder } from "./invoice_domain.ts";

test("Monday orders enter the volunteer reminder path", () => {
  const order = orderSchema.parse({ donorName: "Amina", donorEmail: "amina@example.org", campaign: "River restoration", items: [{ description: "Donation", amount: 25 }] });
  assert.equal(shouldSendReminder(order, new Date("2026-11-02T10:00:00Z")), true);
  assert.equal(shouldSendReminder(order, new Date("2026-11-03T10:00:00Z")), false);
});
