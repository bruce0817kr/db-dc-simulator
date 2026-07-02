import { ConversionType } from "@/src/calculator/types";

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
}

export type FieldErrors = Partial<Record<keyof SimulatorFormValues, string>>;
