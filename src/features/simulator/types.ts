import { ConversionType } from "@/src/calculator/types";

export type SalaryPathModeUI = "CONSTANT_GROWTH" | "WAGE_PEAK" | "STEP_UP";

export interface SimulatorFormValues {
  currentSalary: string;
  currentYearsOfService: string;
  remainingYearsOfService: string;
  salaryGrowthRate: string;
  dcReturnRate: string;
  dcVolatility: string;
  conversionMethod: ConversionType;
  customTransferAmount: string;
  portfolioPresetId: string;
  salaryPathMode: SalaryPathModeUI;
  peakStartYear: string;
  peakCutRate: string;
  peakPostGrowthRate: string;
  stepUpYear: string;
  stepUpRate: string;
  dbAverageSalary: string;
  showAfterTax: boolean;
  showPresentValue: boolean;
  inflationRate: string;
}

export type FieldErrors = Partial<Record<keyof SimulatorFormValues, string>>;
