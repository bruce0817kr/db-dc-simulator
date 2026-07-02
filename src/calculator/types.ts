export type ConversionType = "TRANSFER_ALL_TO_DC";

export interface SimulationInput {
  currentSalary: number;
  currentServiceYears: number;
  remainingServiceYears: number;
  wageGrowthRate: number;
  dcReturnRate: number;
  // conversionType does not affect math in MVP; reserved for future conversion scenarios
  conversionType: ConversionType;
}

export interface SimulationResult {
  dbAmount: number;
  dcAmount: number;
  difference: number; // dcAmount - dbAmount
  breakevenReturnRate: number | null;
}
