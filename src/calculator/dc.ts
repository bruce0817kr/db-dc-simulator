import { calculateCurrentDbSettlement } from "./db";

export function calculateDcAmount(
  currentSalary: number,
  wageGrowthRate: number,
  currentServiceYears: number,
  remainingServiceYears: number,
  dcReturnRate: number
): number {
  const settlement = calculateCurrentDbSettlement(currentSalary, currentServiceYears);
  const n = remainingServiceYears;
  const r = dcReturnRate;
  const g = wageGrowthRate;

  let dcAmount = settlement * Math.pow(1 + r, n);

  for (let t = 1; t <= n; t++) {
    const contribution = (currentSalary * Math.pow(1 + g, t)) / 12;
    dcAmount += contribution * Math.pow(1 + r, n - t);
  }

  return dcAmount;
}
