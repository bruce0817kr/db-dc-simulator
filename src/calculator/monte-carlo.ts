import { SimulationInput } from "./types";
import { calculateCurrentDbSettlement, calculateDbAmount } from "./db";
import { DEFAULT_RULE_SET } from "./rules";
import { salaryAtYear } from "./salary";
import { createNormalSampler } from "./random";
import { buildSalaryPath } from "./salary-path";

export interface MonteCarloInput {
  baseInput: SimulationInput;
  expectedReturnRate: number;
  volatility: number;
  iterations: number;
  seed?: number;
}

export interface MonteCarloResult {
  iterations: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  probabilityDcBeatsDb: number;
  worstCase: number;
  bestCase: number;
}

export function runMonteCarlo(input: MonteCarloInput): MonteCarloResult {
  const { baseInput, expectedReturnRate: mu, volatility: sigma, iterations, seed = 20260702 } = input;
  const {
    currentSalary,
    currentServiceYears,
    remainingServiceYears,
    wageGrowthRate,
    conversionType,
    customTransferAmount,
    salaryPathConfig,
    dbAverageSalaryOverride,
  } = baseInput;

  const n = remainingServiceYears;

  const salaryPath = salaryPathConfig !== undefined && n > 0
    ? buildSalaryPath(currentSalary, wageGrowthRate, n, salaryPathConfig)
    : undefined;

  const finalYearSalary = salaryPath !== undefined && salaryPath.length > 0
    ? salaryPath[n - 1]
    : undefined;

  let dbAmount: number;
  if (dbAverageSalaryOverride !== undefined) {
    dbAmount = (dbAverageSalaryOverride / 12) * (currentServiceYears + n);
  } else {
    dbAmount = calculateDbAmount(
      currentSalary,
      wageGrowthRate,
      currentServiceYears,
      n,
      finalYearSalary
    );
  }

  const initialBalance =
    conversionType === "CUSTOM_TRANSFER_AMOUNT" && customTransferAmount !== undefined
      ? customTransferAmount
      : calculateCurrentDbSettlement(currentSalary, currentServiceYears);

  const logMu = Math.log(1 + mu) - (sigma * sigma) / 2;

  const sampleNormal = createNormalSampler(seed);
  const results: number[] = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    let balance = initialBalance;
    for (let t = 1; t <= n; t++) {
      const z = sampleNormal();
      const multiplier = Math.exp(logMu + sigma * z);
      const salary = salaryPath !== undefined
        ? salaryPath[t - 1]
        : salaryAtYear(currentSalary, wageGrowthRate, t);
      const contribution = salary * DEFAULT_RULE_SET.dcContributionRate;
      balance = balance * multiplier + contribution;
    }
    results[i] = balance;
  }

  results.sort((a, b) => a - b);

  const numResults = iterations;
  function percentile(q: number): number {
    return results[Math.floor(q * (numResults - 1))];
  }

  const p5 = percentile(0.05);
  const p25 = percentile(0.25);
  const p50 = percentile(0.5);
  const p75 = percentile(0.75);
  const p95 = percentile(0.95);

  let dcBeatsDb = 0;
  for (let i = 0; i < numResults; i++) {
    if (results[i] > dbAmount) dcBeatsDb++;
  }

  return {
    iterations,
    p5,
    p25,
    p50,
    p75,
    p95,
    probabilityDcBeatsDb: dcBeatsDb / numResults,
    worstCase: results[0],
    bestCase: results[numResults - 1],
  };
}
