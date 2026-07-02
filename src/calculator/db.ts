import { finalSalary } from "./salary";

export function calculateDbAmount(
  currentSalary: number,
  wageGrowthRate: number,
  currentServiceYears: number,
  remainingServiceYears: number,
  finalYearSalary?: number
): number {
  const fs = finalYearSalary !== undefined
    ? finalYearSalary
    : finalSalary(currentSalary, wageGrowthRate, remainingServiceYears);
  return (fs / 12) * (currentServiceYears + remainingServiceYears);
}

export function calculateCurrentDbSettlement(
  currentSalary: number,
  currentServiceYears: number
): number {
  return (currentSalary / 12) * currentServiceYears;
}
