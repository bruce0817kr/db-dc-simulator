import { SimulationInput } from "./types";
import { calculateDbAmount } from "./db";
import { calculateDcAmount } from "./dc";
import { findBreakevenReturnRate } from "./breakeven";

export const TIE_THRESHOLD_KRW = 100_000;
export const DEFAULT_RETURN_RATES: number[] = [0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08];
export const DEFAULT_GROWTH_RATES: number[] = [0, 0.01, 0.02, 0.03, 0.04, 0.05];

export interface SensitivityPoint {
  salaryGrowthRate: number;
  dcReturnRate: number;
  dbExpectedAmount: number;
  dcExpectedAmount: number;
  difference: number;
  winner: "DB" | "DC" | "TIE";
}

export interface SensitivityMatrix {
  salaryGrowthRates: number[];
  dcReturnRates: number[];
  points: SensitivityPoint[];
}

export function buildSensitivityMatrix(
  base: SimulationInput,
  growthRates: number[] = DEFAULT_GROWTH_RATES,
  returnRates: number[] = DEFAULT_RETURN_RATES
): SensitivityMatrix {
  const { currentSalary, currentServiceYears, remainingServiceYears, conversionType, customTransferAmount } = base;
  const transferAmount = conversionType === "CUSTOM_TRANSFER_AMOUNT" ? customTransferAmount : undefined;

  const points: SensitivityPoint[] = [];

  for (const g of growthRates) {
    const dbExpectedAmount = calculateDbAmount(currentSalary, g, currentServiceYears, remainingServiceYears);
    for (const r of returnRates) {
      const dcExpectedAmount = calculateDcAmount(currentSalary, g, currentServiceYears, remainingServiceYears, r, transferAmount);
      const difference = dcExpectedAmount - dbExpectedAmount;
      const winner: "DB" | "DC" | "TIE" =
        Math.abs(difference) < TIE_THRESHOLD_KRW ? "TIE" : difference > 0 ? "DC" : "DB";
      points.push({ salaryGrowthRate: g, dcReturnRate: r, dbExpectedAmount, dcExpectedAmount, difference, winner });
    }
  }

  return { salaryGrowthRates: growthRates, dcReturnRates: returnRates, points };
}

export function buildBreakevenByGrowthRate(
  base: SimulationInput,
  growthRates: number[] = DEFAULT_GROWTH_RATES
): { salaryGrowthRate: number; dbExpectedAmount: number; breakevenReturnRate: number | null }[] {
  const { currentSalary, currentServiceYears, remainingServiceYears, conversionType, customTransferAmount } = base;
  const transferAmount = conversionType === "CUSTOM_TRANSFER_AMOUNT" ? customTransferAmount : undefined;

  return growthRates.map((g) => {
    const dbExpectedAmount = calculateDbAmount(currentSalary, g, currentServiceYears, remainingServiceYears);
    const breakevenReturnRate = findBreakevenReturnRate(currentSalary, g, currentServiceYears, remainingServiceYears, transferAmount);
    return { salaryGrowthRate: g, dbExpectedAmount, breakevenReturnRate };
  });
}
