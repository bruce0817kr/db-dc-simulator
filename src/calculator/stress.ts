import { SimulationInput } from "./types";
import { calculateDbAmount } from "./db";
import { calculateDcAmount } from "./dc";
import { buildSalaryPath } from "./salary-path";

export const DEFAULT_STRESS_DROP_RATES: number[] = [0.1, 0.2, 0.3, 0.4];

export interface StressScenario {
  dropRate: number;
  stressedDcAmount: number;
  differenceVsDb: number;
}

export function buildStressScenarios(
  base: SimulationInput,
  riskyAssetWeight: number,
  dropRates: number[] = DEFAULT_STRESS_DROP_RATES
): StressScenario[] {
  const {
    currentSalary,
    wageGrowthRate,
    currentServiceYears,
    remainingServiceYears,
    dcReturnRate,
    conversionType,
    customTransferAmount,
    salaryPathConfig,
    dbAverageSalaryOverride,
  } = base;

  const transferAmount =
    conversionType === "CUSTOM_TRANSFER_AMOUNT" ? customTransferAmount : undefined;

  const n = remainingServiceYears;

  const salaryPath = salaryPathConfig !== undefined && n > 0
    ? buildSalaryPath(currentSalary, wageGrowthRate, n, salaryPathConfig)
    : undefined;

  const finalYearSalary = salaryPath !== undefined && salaryPath.length > 0
    ? salaryPath[n - 1]
    : undefined;

  const baseDcAmount = calculateDcAmount(
    currentSalary,
    wageGrowthRate,
    currentServiceYears,
    n,
    dcReturnRate,
    transferAmount,
    salaryPath
  );

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

  return dropRates.map((dropRate) => {
    const stressedDcAmount = baseDcAmount * (1 - riskyAssetWeight * dropRate);
    const differenceVsDb = stressedDcAmount - dbAmount;
    return { dropRate, stressedDcAmount, differenceVsDb };
  });
}
