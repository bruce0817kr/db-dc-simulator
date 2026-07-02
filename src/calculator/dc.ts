import { calculateCurrentDbSettlement } from "./db";
import { DEFAULT_RULE_SET } from "./rules";

export function calculateDcAmount(
  currentSalary: number,
  wageGrowthRate: number,
  currentServiceYears: number,
  remainingServiceYears: number,
  dcReturnRate: number,
  transferAmount?: number,
  salaryPath?: number[]
): number {
  const settlement =
    transferAmount !== undefined
      ? transferAmount
      : calculateCurrentDbSettlement(currentSalary, currentServiceYears);
  const n = remainingServiceYears;
  const r = dcReturnRate;
  const g = wageGrowthRate;

  let dcAmount = settlement * Math.pow(1 + r, n);

  for (let t = 1; t <= n; t++) {
    const salary = salaryPath !== undefined
      ? salaryPath[t - 1]
      : currentSalary * Math.pow(1 + g, t);
    const contribution = salary * DEFAULT_RULE_SET.dcContributionRate;
    dcAmount += contribution * Math.pow(1 + r, n - t);
  }

  return dcAmount;
}
