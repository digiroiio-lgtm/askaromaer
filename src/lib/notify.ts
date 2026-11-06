import "server-only";
import { db } from "./db";

/** In-app notification. Email delivery is a Sprint 2 integration (e.g. Resend). */
export async function notify(userId: string, type: string, title: string, body: string, link?: string) {
  await db.notification.create({ data: { userId, type, title, body, link } });
}
