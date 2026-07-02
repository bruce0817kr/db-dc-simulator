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
  } = input;

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
    dcReturnRate
  );

  const breakevenReturnRate = findBreakevenReturnRate(
    currentSalary,
    wageGrowthRate,
    currentServiceYears,
    remainingServiceYears
  );

  return {
    dbAmount,
    dcAmount,
    difference: dcAmount - dbAmount,
    breakevenReturnRate,
  };
}
