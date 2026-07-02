import { SalaryPathConfig } from "./salary-path";

export type ConversionType = "TRANSFER_ALL_TO_DC" | "CUSTOM_TRANSFER_AMOUNT";

export interface SimulationInput {
  currentSalary: number;
  currentServiceYears: number;
  remainingServiceYears: number;
  wageGrowthRate: number;
  dcReturnRate: number;
  conversionType: ConversionType;
  customTransferAmount?: number;
  salaryPathConfig?: SalaryPathConfig;
  dbAverageSalaryOverride?: number;
}

export interface SimulationResult {
  dbAmount: number;
  dcAmount: number;
  difference: number; // dcAmount - dbAmount
  breakevenReturnRate: number | null;
}
