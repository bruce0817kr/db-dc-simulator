export const TAX_RULE_YEAR = "2025";

export interface ServiceYearDeductionBracket {
  upperBound: number;
  base: number;
  ratePerYear: number;
  baseYears: number;
}

export const SERVICE_YEAR_DEDUCTION_BRACKETS: ServiceYearDeductionBracket[] = [
  { upperBound: 5, base: 0, ratePerYear: 1_000_000, baseYears: 0 },
  { upperBound: 10, base: 5_000_000, ratePerYear: 2_000_000, baseYears: 5 },
  { upperBound: 20, base: 15_000_000, ratePerYear: 2_500_000, baseYears: 10 },
  { upperBound: Infinity, base: 40_000_000, ratePerYear: 3_000_000, baseYears: 20 },
];

export interface ConvertedSalaryDeductionBracket {
  upperBound: number;
  base: number;
  rate: number;
  baseAmount: number;
}

export const CONVERTED_SALARY_DEDUCTION_BRACKETS: ConvertedSalaryDeductionBracket[] = [
  { upperBound: 8_000_000, base: 0, rate: 1.0, baseAmount: 0 },
  { upperBound: 70_000_000, base: 8_000_000, rate: 0.6, baseAmount: 8_000_000 },
  { upperBound: 100_000_000, base: 45_200_000, rate: 0.55, baseAmount: 70_000_000 },
  { upperBound: 300_000_000, base: 61_700_000, rate: 0.45, baseAmount: 100_000_000 },
  { upperBound: Infinity, base: 151_700_000, rate: 0.35, baseAmount: 300_000_000 },
];

export interface IncomeTaxBracket {
  upperBound: number;
  rate: number;
  progressiveDeduction: number;
}

export const INCOME_TAX_BRACKETS: IncomeTaxBracket[] = [
  { upperBound: 14_000_000, rate: 0.06, progressiveDeduction: 0 },
  { upperBound: 50_000_000, rate: 0.15, progressiveDeduction: 1_260_000 },
  { upperBound: 88_000_000, rate: 0.24, progressiveDeduction: 5_760_000 },
  { upperBound: 150_000_000, rate: 0.35, progressiveDeduction: 15_440_000 },
  { upperBound: 300_000_000, rate: 0.38, progressiveDeduction: 19_940_000 },
  { upperBound: 500_000_000, rate: 0.40, progressiveDeduction: 25_940_000 },
  { upperBound: 1_000_000_000, rate: 0.42, progressiveDeduction: 35_940_000 },
  { upperBound: Infinity, rate: 0.45, progressiveDeduction: 65_940_000 },
];

export const LOCAL_INCOME_TAX_RATE = 0.1;
