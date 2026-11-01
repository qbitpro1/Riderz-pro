import "server-only";

import { sql } from "@/lib/db/client";
import { newId } from "./security";
import type { StoreAction } from "./assistant/store";

/**
 * SALESMAN AI LOG: one row per customer question on a shop screen (table salesman_turns), so we
 * can see how the salesman sells: products shown and added, discounts, checkout, hand-offs to staff
 * and the AI cost (tokens; 0 in Basic mode). Orders placed after a chat carry its conversation id
 * (orders.salesman_conversation). Seller practice chats are not logged. Rows older than
 * SALESMAN_LOG_DAYS are deleted by housekeeping.
 */

export const SALESMAN_LOG_DAYS = 180;
export const CONVERSATION_ID = /^sc_[A-Za-z0-9_-]{8,40}$/;

const STAFF = /\b(staff|counter par|ask our)\b/i;

export async function logSalesmanTurn(t: {
  vendorId: string;
  conversationId: string;
  mode: "full" | "basic";
  question: string;
  reply: string;
  products: string[];
  actions: StoreAction[];
  usage?: { input: number; output: number };
}): Promise<void> {
  const added = t.actions.reduce((n, a) => n + (a.type === "add" ? a.qty : 0), 0);
  const offer = t.actions.find((a) => a.type === "offer");
  try {
    await sql(
      `INSERT INTO salesman_turns (id, vendor_id, conversation_id, mode, question, reply, shown, added, offer_pct, checkout, staff, input_tokens, output_tokens)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        newId("st"), t.vendorId, t.conversationId, t.mode, t.question.slice(0, 600), t.reply.slice(0, 2000),
        t.products.length, added, offer?.type === "offer" ? offer.offer.percent : null,
        t.actions.some((a) => a.type === "checkout"), STAFF.test(t.reply), t.usage?.input ?? 0, t.usage?.output ?? 0,
      ],
    );
  } catch (err) {
    // The log must never stop a sale.
    console.error("[salesman-log] not saved:", err instanceof Error ? err.message : err);
  }
}
