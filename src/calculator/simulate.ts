import { SimulationInput, SimulationResult } from "./types";
import { calculateDbAmount } from "./db";
import { calculateDcAmount } from "./dc";
import { findBreakevenReturnRate } from "./breakeven";
import { buildSalaryPath } from "./salary-path";

export function simulate(input: SimulationInput): SimulationResult {
  const {
    currentSalary,
    currentServiceYears,
    remainingServiceYears,
    wageGrowthRate,
    dcReturnRate,
    conversionType,
    customTransferAmount,
    salaryPathConfig,
    dbAverageSalaryOverride,
  } = input;

  const transferAmount =
    conversionType === "CUSTOM_TRANSFER_AMOUNT" ? customTransferAmount : undefined;

  const n = remainingServiceYears;

  const salaryPath = salaryPathConfig !== undefined && n > 0
    ? buildSalaryPath(currentSalary, wageGrowthRate, n, salaryPathConfig)
    : undefined;

  const finalYearSalary = salaryPath !== undefined && salaryPath.length > 0
    ? salaryPath[n - 1]
    : undefined;

  let dbAmount: number;
  if (dbAverageSalaryOverride !== undefined) {
    dbAmount = (dbAverageSalaryOverride / 12) * (currentServiceYears + n);
  } else {
    dbAmount = calculateDbAmount(
      currentSalary,
      wageGrowthRate,
      currentServiceYears,
      n,
      finalYearSalary
    );
  }

  const dcAmount = calculateDcAmount(
    currentSalary,
    wageGrowthRate,
    currentServiceYears,
    n,
    dcReturnRate,
    transferAmount,
    salaryPath
  );

  const breakevenReturnRate = findBreakevenReturnRate(
    currentSalary,
    wageGrowthRate,
    currentServiceYears,
    n,
    transferAmount,
    salaryPath,
    dbAverageSalaryOverride ?? finalYearSalary
  );

  return {
    dbAmount,
    dcAmount,
    difference: dcAmount - dbAmount,
    breakevenReturnRate,
  };
}
