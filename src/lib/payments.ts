import "server-only";
import { db } from "./db";
import { platformFeePercent } from "./constants";

/**
 * Payment abstraction. Only the built-in "test" provider is implemented in Sprint 1.
 * A Stripe provider plugs in here: createCheckout() would create a Stripe Checkout Session and
 * confirmPayment() would be triggered by the Stripe webhook instead of the test confirm button.
 */
export function providerName(): "test" | "stripe" {
  return process.env.PAYMENT_PROVIDER === "stripe" && process.env.STRIPE_SECRET_KEY ? "stripe" : "test";
}

import { splitAmount } from "./pure";
export { splitAmount };

export async function createPendingPayment(input: {
  userId: string;
  purpose: "BOOKING" | "GUIDE";
  amountCents: number;
  currency: string;
  payeeRoamerId: string;
  bookingId?: string;
  guideId?: string;
}) {
  const setting = await db.platformSetting.findUnique({ where: { key: "platformFeePercent" } });
  const fee = setting ? Number(setting.value) : platformFeePercent();
  const split = splitAmount(input.amountCents, fee);
  return db.payment.create({
    data: {
      userId: input.userId,
      purpose: input.purpose,
      bookingId: input.bookingId,
      amountCents: input.amountCents,
      currency: input.currency,
      payeeRoamerId: input.payeeRoamerId,
      provider: providerName(),
      providerRef: input.guideId ? `guide:${input.guideId}` : null,
      ...split,
    },
  });
}
