// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildStressScenarios } from "./stress";
import { calculateDcAmount } from "./dc";
import { calculateDbAmount } from "./db";
import { SimulationInput } from "./types";

const BASE_INPUT: SimulationInput = {
  currentSalary: 60_000_000,
  currentServiceYears: 10,
  remainingServiceYears: 15,
  wageGrowthRate: 0.03,
  dcReturnRate: 0.05,
  conversionType: "TRANSFER_ALL_TO_DC",
};

describe("buildStressScenarios", () => {
  it("dropRates=[0] → stressedDc가 기준 calculateDcAmount와 동일", () => {
    const scenarios = buildStressScenarios(BASE_INPUT, 0.7, [0]);
    const baseDc = calculateDcAmount(
      BASE_INPUT.currentSalary,
      BASE_INPUT.wageGrowthRate,
      BASE_INPUT.currentServiceYears,
      BASE_INPUT.remainingServiceYears,
      BASE_INPUT.dcReturnRate
    );
    expect(scenarios).toHaveLength(1);
    expect(scenarios[0].stressedDcAmount).toBeCloseTo(baseDc, 0);
  });

  it("riskyAssetWeight=0 → 4시나리오 전부 기준 DC와 동일", () => {
    const scenarios = buildStressScenarios(BASE_INPUT, 0);
    const baseDc = calculateDcAmount(
      BASE_INPUT.currentSalary,
      BASE_INPUT.wageGrowthRate,
      BASE_INPUT.currentServiceYears,
      BASE_INPUT.remainingServiceYears,
      BASE_INPUT.dcReturnRate
    );
    expect(scenarios).toHaveLength(4);
    for (const s of scenarios) {
      expect(s.stressedDcAmount).toBeCloseTo(baseDc, 0);
    }
  });

  it("weight=1·drop=0.4 → 기준 DC×0.6", () => {
    const scenarios = buildStressScenarios(BASE_INPUT, 1, [0.4]);
    const baseDc = calculateDcAmount(
      BASE_INPUT.currentSalary,
      BASE_INPUT.wageGrowthRate,
      BASE_INPUT.currentServiceYears,
      BASE_INPUT.remainingServiceYears,
      BASE_INPUT.dcReturnRate
    );
    expect(scenarios[0].stressedDcAmount).toBeCloseTo(baseDc * 0.6, 0);
  });

  it("하락률 커질수록 stressedDc 단조 감소 (weight > 0)", () => {
    const scenarios = buildStressScenarios(BASE_INPUT, 0.7);
    for (let i = 1; i < scenarios.length; i++) {
      expect(scenarios[i].stressedDcAmount).toBeLessThan(scenarios[i - 1].stressedDcAmount);
    }
  });

  it("CUSTOM(customTransferAmount=0) 반영", () => {
    const customInput: SimulationInput = {
      ...BASE_INPUT,
      conversionType: "CUSTOM_TRANSFER_AMOUNT",
      customTransferAmount: 0,
    };
    const scenarios = buildStressScenarios(customInput, 0.5, [0]);
    const baseDc = calculateDcAmount(
      customInput.currentSalary,
      customInput.wageGrowthRate,
      customInput.currentServiceYears,
      customInput.remainingServiceYears,
      customInput.dcReturnRate,
      0
    );
    expect(scenarios[0].stressedDcAmount).toBeCloseTo(baseDc, 0);
  });

  it("differenceVsDb === stressedDc − calculateDbAmount", () => {
    const scenarios = buildStressScenarios(BASE_INPUT, 0.7);
    const dbAmount = calculateDbAmount(
      BASE_INPUT.currentSalary,
      BASE_INPUT.wageGrowthRate,
      BASE_INPUT.currentServiceYears,
      BASE_INPUT.remainingServiceYears
    );
    for (const s of scenarios) {
      expect(s.differenceVsDb).toBeCloseTo(s.stressedDcAmount - dbAmount, 0);
    }
  });
});

describe("buildStressScenarios + salaryPathConfig", () => {
  it("WAGE_PEAK base로 buildStressScenarios 호출 — dropRate=0이면 stressedDc > 0이고 dropRate 필드 정상", () => {
    const wagePeakInput: SimulationInput = {
      ...BASE_INPUT,
      salaryPathConfig: {
        mode: "WAGE_PEAK",
        wagePeak: { peakStartYear: 5, cutRate: 0.2, postPeakGrowthRate: 0.01 },
      },
    };
    const scenarios = buildStressScenarios(wagePeakInput, 0.7, [0]);
    expect(scenarios[0].stressedDcAmount).toBeGreaterThan(0);
    expect(scenarios[0].dropRate).toBe(0);
  });
});
