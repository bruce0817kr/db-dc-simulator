export function salaryAtYear(
  currentSalary: number,
  wageGrowthRate: number,
  year: number
): number {
  return currentSalary * Math.pow(1 + wageGrowthRate, year);
}

export function finalSalary(
  currentSalary: number,
  wageGrowthRate: number,
  remainingYears: number
): number {
  return salaryAtYear(currentSalary, wageGrowthRate, remainingYears);
}
