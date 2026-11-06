import "server-only";
import { db } from "./db";
import type { CurrentUser } from "./auth";

/** Can this user read the full (paid) content of a guide? */
export async function canReadGuide(user: CurrentUser | null, guide: { id: string; roamerUserId: string }) {
  if (!user) return false;
  if (user.id === guide.roamerUserId || user.roles.includes("ADMIN")) return true;
  const p = await db.guidePurchase.findUnique({ where: { guideId_userId: { guideId: guide.id, userId: user.id } }, include: { payment: true } });
  return !!p && (!p.payment || p.payment.status === "SUCCEEDED");
}
