import { SimulationResult } from "@/src/calculator/types";
import { RetirementTaxEstimate, estimateRetirementIncomeTax } from "@/src/calculator/tax";
import { toPresentValue } from "@/src/calculator/present-value";

export interface DisplayOptions {
  afterTax: boolean;
  presentValue: boolean;
  inflationRate: number;
}

export interface DisplayAmounts {
  db: number;
  dc: number;
  difference: number;
  dbTax?: RetirementTaxEstimate;
  dcTax?: RetirementTaxEstimate;
  modeLabel: string;
}

export function buildDisplayAmounts(
  result: SimulationResult,
  totalServiceYears: number,
  remainingYears: number,
  options: DisplayOptions
): DisplayAmounts {
  const { afterTax, presentValue, inflationRate } = options;

  let db = result.dbAmount;
  let dc = result.dcAmount;
  let dbTax: RetirementTaxEstimate | undefined;
  let dcTax: RetirementTaxEstimate | undefined;

  if (afterTax) {
    dbTax = estimateRetirementIncomeTax(db, totalServiceYears);
    dcTax = estimateRetirementIncomeTax(dc, totalServiceYears);
    db = dbTax.netAmount;
    dc = dcTax.netAmount;
  }

  if (presentValue) {
    db = toPresentValue(db, inflationRate, remainingYears);
    dc = toPresentValue(dc, inflationRate, remainingYears);
  }

  const difference = dc - db;

  let modeLabel: string;
  if (afterTax && presentValue) {
    modeLabel = "(세후·현재가치)";
  } else if (afterTax) {
    modeLabel = "(세후)";
  } else if (presentValue) {
    modeLabel = "(현재가치)";
  } else {
    modeLabel = "";
  }

  return { db, dc, difference, dbTax, dcTax, modeLabel };
}
