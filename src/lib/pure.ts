/** Pure helpers (no server-only imports) so they can be unit tested */

/** Only allow relative, same-site redirect targets */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

export function splitAmount(amountCents: number, feePercent: number) {
  const platformFeeCents = Math.round((amountCents * feePercent) / 100);
  return { platformFeeCents, payeeEarningsCents: amountCents - platformFeeCents };
}
