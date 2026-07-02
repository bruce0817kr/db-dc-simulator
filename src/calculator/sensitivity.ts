import { SimulationInput } from "./types";
import { calculateDbAmount } from "./db";
import { calculateDcAmount } from "./dc";
import { findBreakevenReturnRate } from "./breakeven";
import { buildSalaryPath } from "./salary-path";

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
  const { currentSalary, currentServiceYears, remainingServiceYears, conversionType, customTransferAmount, salaryPathConfig, dbAverageSalaryOverride } = base;
  const transferAmount = conversionType === "CUSTOM_TRANSFER_AMOUNT" ? customTransferAmount : undefined;
  const n = remainingServiceYears;

  const points: SensitivityPoint[] = [];

  for (const g of growthRates) {
    const salaryPath = salaryPathConfig !== undefined && n > 0
      ? buildSalaryPath(currentSalary, g, n, salaryPathConfig)
      : undefined;
    const finalYearSalary = salaryPath !== undefined && salaryPath.length > 0
      ? salaryPath[n - 1]
      : undefined;

    let dbExpectedAmount: number;
    if (dbAverageSalaryOverride !== undefined) {
      dbExpectedAmount = (dbAverageSalaryOverride / 12) * (currentServiceYears + n);
    } else {
      dbExpectedAmount = calculateDbAmount(currentSalary, g, currentServiceYears, n, finalYearSalary);
    }

    for (const r of returnRates) {
      const dcExpectedAmount = calculateDcAmount(currentSalary, g, currentServiceYears, n, r, transferAmount, salaryPath);
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
  const { currentSalary, currentServiceYears, remainingServiceYears, conversionType, customTransferAmount, salaryPathConfig, dbAverageSalaryOverride } = base;
  const transferAmount = conversionType === "CUSTOM_TRANSFER_AMOUNT" ? customTransferAmount : undefined;
  const n = remainingServiceYears;

  return growthRates.map((g) => {
    const salaryPath = salaryPathConfig !== undefined && n > 0
      ? buildSalaryPath(currentSalary, g, n, salaryPathConfig)
      : undefined;
    const finalYearSalary = salaryPath !== undefined && salaryPath.length > 0
      ? salaryPath[n - 1]
      : undefined;

    let dbExpectedAmount: number;
    if (dbAverageSalaryOverride !== undefined) {
      dbExpectedAmount = (dbAverageSalaryOverride / 12) * (currentServiceYears + n);
    } else {
      dbExpectedAmount = calculateDbAmount(currentSalary, g, currentServiceYears, n, finalYearSalary);
    }

    const breakevenReturnRate = findBreakevenReturnRate(
      currentSalary, g, currentServiceYears, n, transferAmount, salaryPath,
      dbAverageSalaryOverride ?? finalYearSalary
    );
    return { salaryGrowthRate: g, dbExpectedAmount, breakevenReturnRate };
  });
}
