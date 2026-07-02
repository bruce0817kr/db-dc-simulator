import { SimulationInput, SimulationResult } from "./types";
import { calculateDbAmount } from "./db";
import { calculateDcAmount } from "./dc";
import { findBreakevenReturnRate } from "./breakeven";

export function simulate(input: SimulationInput): SimulationResult {
  const {
    currentSalary,
    currentServiceYears,
    remainingServiceYears,
    wageGrowthRate,
    dcReturnRate,
    conversionType,
    customTransferAmount,
  } = input;

  const transferAmount =
    conversionType === "CUSTOM_TRANSFER_AMOUNT" ? customTransferAmount : undefined;

  const dbAmount = calculateDbAmount(
    currentSalary,
    wageGrowthRate,
    currentServiceYears,
    remainingServiceYears
  );

  const dcAmount = calculateDcAmount(
    currentSalary,
    wageGrowthRate,
    currentServiceYears,
    remainingServiceYears,
    dcReturnRate,
    transferAmount
  );

  const breakevenReturnRate = findBreakevenReturnRate(
    currentSalary,
    wageGrowthRate,
    currentServiceYears,
    remainingServiceYears,
    transferAmount
  );

  return {
    dbAmount,
    dcAmount,
    difference: dcAmount - dbAmount,
    breakevenReturnRate,
  };
}
