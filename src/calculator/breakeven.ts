import { calculateDcAmount } from "./dc";
import { calculateDbAmount } from "./db";

export function findBreakevenReturnRate(
  currentSalary: number,
  wageGrowthRate: number,
  currentServiceYears: number,
  remainingServiceYears: number,
  transferAmount?: number,
  salaryPath?: number[],
  finalYearSalary?: number
): number | null {
  const n = remainingServiceYears;
  if (n === 0) return null;

  const db = calculateDbAmount(
    currentSalary,
    wageGrowthRate,
    currentServiceYears,
    remainingServiceYears,
    finalYearSalary
  );

  const f = (r: number) =>
    calculateDcAmount(
      currentSalary,
      wageGrowthRate,
      currentServiceYears,
      remainingServiceYears,
      r,
      transferAmount,
      salaryPath
    ) - db;

  const lo = -0.99;
  const hi = 3.0;

  if (f(lo) * f(hi) > 0) return null;

  let a = lo;
  let b = hi;
  const tolerance = 1e-10;
  const maxIter = 200;

  for (let i = 0; i < maxIter; i++) {
    const mid = (a + b) / 2;
    const fMid = f(mid);
    if (Math.abs(fMid) < tolerance || (b - a) / 2 < tolerance) {
      return mid;
    }
    if (f(a) * fMid < 0) {
      b = mid;
    } else {
      a = mid;
    }
  }

  return (a + b) / 2;
}
