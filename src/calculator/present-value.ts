export function toPresentValue(
  amount: number,
  inflationRate: number,
  years: number
): number {
  return amount / Math.pow(1 + inflationRate, years);
}
