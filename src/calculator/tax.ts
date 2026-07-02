import {
  SERVICE_YEAR_DEDUCTION_BRACKETS,
  CONVERTED_SALARY_DEDUCTION_BRACKETS,
  INCOME_TAX_BRACKETS,
  LOCAL_INCOME_TAX_RATE,
} from "./tax-rules";

export interface RetirementTaxEstimate {
  incomeTax: number;
  localIncomeTax: number;
  totalTax: number;
  netAmount: number;
  effectiveRate: number;
}

export function estimateRetirementIncomeTax(
  grossAmount: number,
  serviceYears: number
): RetirementTaxEstimate {
  const bracket1 = SERVICE_YEAR_DEDUCTION_BRACKETS.find(
    (b) => serviceYears <= b.upperBound
  )!;
  const serviceYearDeduction =
    bracket1.base + (serviceYears - bracket1.baseYears) * bracket1.ratePerYear;
  const afterServiceDeduction = Math.max(0, grossAmount - serviceYearDeduction);

  const convertedSalary = (afterServiceDeduction / serviceYears) * 12;

  const bracket2 = CONVERTED_SALARY_DEDUCTION_BRACKETS.find(
    (b) => convertedSalary <= b.upperBound
  )!;
  const convertedSalaryDeduction =
    bracket2.base + (convertedSalary - bracket2.baseAmount) * bracket2.rate;
  const taxBase = Math.max(0, convertedSalary - convertedSalaryDeduction);

  const bracket3 = INCOME_TAX_BRACKETS.find((b) => taxBase <= b.upperBound)!;
  const convertedTax =
    taxBase * bracket3.rate - bracket3.progressiveDeduction;

  const incomeTax = (convertedTax / 12) * serviceYears;
  const localIncomeTax = incomeTax * LOCAL_INCOME_TAX_RATE;
  const totalTax = incomeTax + localIncomeTax;
  const netAmount = grossAmount - totalTax;
  const effectiveRate = grossAmount === 0 ? 0 : totalTax / grossAmount;

  return { incomeTax, localIncomeTax, totalTax, netAmount, effectiveRate };
}
