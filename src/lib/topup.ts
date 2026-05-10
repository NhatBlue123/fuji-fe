export const VND_PER_FLOWER = 1000;

const TOPUP_PRICE_VND_THRESHOLD = 1000;

export function getTopupTransferAmountVnd(price: number): number {
  const amount = Number(price) || 0;
  if (amount <= 0) return 0;
  return amount >= TOPUP_PRICE_VND_THRESHOLD ? amount : amount * VND_PER_FLOWER;
}
