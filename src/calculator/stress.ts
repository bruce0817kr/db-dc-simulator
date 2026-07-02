import { SimulationInput } from "./types";
import { calculateDbAmount } from "./db";
import { calculateDcAmount } from "./dc";

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
  } = base;

  const transferAmount =
    conversionType === "CUSTOM_TRANSFER_AMOUNT" ? customTransferAmount : undefined;

  const baseDcAmount = calculateDcAmount(
    currentSalary,
    wageGrowthRate,
    currentServiceYears,
    remainingServiceYears,
    dcReturnRate,
    transferAmount
  );

  const dbAmount = calculateDbAmount(
    currentSalary,
    wageGrowthRate,
    currentServiceYears,
    remainingServiceYears
  );

  return dropRates.map((dropRate) => {
    const stressedDcAmount = baseDcAmount * (1 - riskyAssetWeight * dropRate);
    const differenceVsDb = stressedDcAmount - dbAmount;
    return { dropRate, stressedDcAmount, differenceVsDb };
  });
}
