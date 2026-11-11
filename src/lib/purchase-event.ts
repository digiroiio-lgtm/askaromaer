import "server-only";
import { db } from "./db";

/** GA4 purchase params for a succeeded payment owned by the user (null otherwise). */
export async function purchaseParams(paymentId: string | undefined, userId: string) {
  if (!paymentId || paymentId === "1") return null;
  const p = await db.payment.findFirst({ where: { id: paymentId, userId, status: "SUCCEEDED" } });
  if (!p) return null;
  return { transaction_id: p.id, value: p.amountCents / 100, currency: p.currency, item_type: p.purpose === "GUIDE" ? "guide" : "booking" };
}
