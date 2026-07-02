import { describe, it, expect } from "vitest";
import { buildExplanation } from "./explanation";
import { SimulationInput, SimulationResult } from "@/src/calculator/types";

const baseInput: SimulationInput = {
  currentSalary: 80_000_000,
  currentServiceYears: 10,
  remainingServiceYears: 15,
  wageGrowthRate: 0.03,
  dcReturnRate: 0.05,
  conversionType: "TRANSFER_ALL_TO_DC",
};

describe("buildExplanation", () => {
  it("DC winner → comparisonSentence mentions DC 유리", () => {
    const result: SimulationResult = {
      dbAmount: 100_000_000,
      dcAmount: 110_000_000,
      difference: 10_000_000,
      breakevenReturnRate: 0.03,
    };
    const { comparisonSentence } = buildExplanation(baseInput, result);
    expect(comparisonSentence).toContain("DC가 약");
    expect(comparisonSentence).toContain("5.0%");
  });

  it("DB winner → comparisonSentence mentions DB 유리", () => {
    const result: SimulationResult = {
      dbAmount: 110_000_000,
      dcAmount: 100_000_000,
      difference: -10_000_000,
      breakevenReturnRate: 0.06,
    };
    const { comparisonSentence } = buildExplanation(baseInput, result);
    expect(comparisonSentence).toContain("DB가 약");
  });

  it("TIE → comparisonSentence mentions 거의 비슷", () => {
    const result: SimulationResult = {
      dbAmount: 100_000_000,
      dcAmount: 100_050_000,
      difference: 50_000,
      breakevenReturnRate: 0.03,
    };
    const { comparisonSentence } = buildExplanation(baseInput, result);
    expect(comparisonSentence).toContain("거의 비슷");
  });

  it("breakevenReturnRate not null → breakevenSentence contains rate and 이상 운용", () => {
    const result: SimulationResult = {
      dbAmount: 100_000_000,
      dcAmount: 110_000_000,
      difference: 10_000_000,
      breakevenReturnRate: 0.034,
    };
    const { breakevenSentence } = buildExplanation(baseInput, result);
    expect(breakevenSentence).toContain("3.4%");
    expect(breakevenSentence).toContain("이상 운용해야");
  });

  it("breakevenReturnRate null → breakevenSentence says 계산할 수 없습니다", () => {
    const result: SimulationResult = {
      dbAmount: 100_000_000,
      dcAmount: 100_000_000,
      difference: 0,
      breakevenReturnRate: null,
    };
    const { breakevenSentence } = buildExplanation(baseInput, result);
    expect(breakevenSentence).toContain("계산할 수 없습니다");
  });
});
