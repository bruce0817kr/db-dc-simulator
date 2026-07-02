// @vitest-environment node
import { describe, it, expect } from "vitest";
import { runMonteCarlo, MonteCarloInput } from "./monte-carlo";
import { calculateDcAmount } from "./dc";
import { SimulationInput } from "./types";
import { simulate } from "./simulate";

const BASE_INPUT: SimulationInput = {
  currentSalary: 80_000_000,
  currentServiceYears: 10,
  remainingServiceYears: 15,
  wageGrowthRate: 0.03,
  dcReturnRate: 0.05,
  conversionType: "TRANSFER_ALL_TO_DC",
};

const BASE_MC: MonteCarloInput = {
  baseInput: BASE_INPUT,
  expectedReturnRate: 0.05,
  volatility: 0.12,
  iterations: 1000,
  seed: 20260702,
};

describe("runMonteCarlo 재현성", () => {
  it("같은 입력+seed 두 번 → 결과 필드 전부 동일", () => {
    const a = runMonteCarlo(BASE_MC);
    const b = runMonteCarlo(BASE_MC);
    expect(a.p5).toBe(b.p5);
    expect(a.p25).toBe(b.p25);
    expect(a.p50).toBe(b.p50);
    expect(a.p75).toBe(b.p75);
    expect(a.p95).toBe(b.p95);
    expect(a.probabilityDcBeatsDb).toBe(b.probabilityDcBeatsDb);
    expect(a.worstCase).toBe(b.worstCase);
    expect(a.bestCase).toBe(b.bestCase);
  });
});

describe("σ=0 결정론적 검증", () => {
  it("p5 === p50 === p95이며 calculateDcAmount와 일치 (toBeCloseTo 4자리)", () => {
    const mc = runMonteCarlo({ ...BASE_MC, volatility: 0, iterations: 1000 });
    expect(mc.p5).toBe(mc.p50);
    expect(mc.p50).toBe(mc.p95);

    const expected = calculateDcAmount(
      BASE_INPUT.currentSalary,
      BASE_INPUT.wageGrowthRate,
      BASE_INPUT.currentServiceYears,
      BASE_INPUT.remainingServiceYears,
      BASE_INPUT.dcReturnRate
    );
    expect(mc.p50).toBeCloseTo(expected, 4);
  });
});

describe("분위 순서", () => {
  it("worstCase ≤ p5 ≤ p25 ≤ p50 ≤ p75 ≤ p95 ≤ bestCase", () => {
    const mc = runMonteCarlo(BASE_MC);
    expect(mc.worstCase).toBeLessThanOrEqual(mc.p5);
    expect(mc.p5).toBeLessThanOrEqual(mc.p25);
    expect(mc.p25).toBeLessThanOrEqual(mc.p50);
    expect(mc.p50).toBeLessThanOrEqual(mc.p75);
    expect(mc.p75).toBeLessThanOrEqual(mc.p95);
    expect(mc.p95).toBeLessThanOrEqual(mc.bestCase);
  });
});

describe("probabilityDcBeatsDb 범위 및 방향성", () => {
  it("∈ [0, 1]", () => {
    const mc = runMonteCarlo(BASE_MC);
    expect(mc.probabilityDcBeatsDb).toBeGreaterThanOrEqual(0);
    expect(mc.probabilityDcBeatsDb).toBeLessThanOrEqual(1);
  });

  it("g=0.03 / μ=0.06 / σ=0.1 → > 0.5 (손익분기 3% 초과)", () => {
    const mc = runMonteCarlo({
      baseInput: { ...BASE_INPUT, wageGrowthRate: 0.03 },
      expectedReturnRate: 0.06,
      volatility: 0.1,
      iterations: 1000,
      seed: 20260702,
    });
    expect(mc.probabilityDcBeatsDb).toBeGreaterThan(0.5);
  });

  it("μ=0.01 → < 0.5", () => {
    const mc = runMonteCarlo({
      baseInput: BASE_INPUT,
      expectedReturnRate: 0.01,
      volatility: 0.1,
      iterations: 1000,
      seed: 20260702,
    });
    expect(mc.probabilityDcBeatsDb).toBeLessThan(0.5);
  });
});

describe("CUSTOM transferAmount 반영", () => {
  it("customTransferAmount=0이면 같은 seed에서 전액 이전보다 p50 낮음", () => {
    const full = runMonteCarlo(BASE_MC);
    const zero = runMonteCarlo({
      ...BASE_MC,
      baseInput: {
        ...BASE_INPUT,
        conversionType: "CUSTOM_TRANSFER_AMOUNT",
        customTransferAmount: 0,
      },
    });
    expect(zero.p50).toBeLessThan(full.p50);
  });
});

describe("iterations 차이", () => {
  it("100회와 1000회 결과가 다름 (p50 기준)", () => {
    const a = runMonteCarlo({ ...BASE_MC, iterations: 100 });
    const b = runMonteCarlo({ ...BASE_MC, iterations: 1000 });
    expect(a.p50).not.toBe(b.p50);
  });

  it("100회는 재현됨", () => {
    const a = runMonteCarlo({ ...BASE_MC, iterations: 100 });
    const b = runMonteCarlo({ ...BASE_MC, iterations: 100 });
    expect(a.p50).toBe(b.p50);
  });

  it("1000회는 재현됨", () => {
    const a = runMonteCarlo({ ...BASE_MC, iterations: 1000 });
    const b = runMonteCarlo({ ...BASE_MC, iterations: 1000 });
    expect(a.p50).toBe(b.p50);
  });
});

describe("runMonteCarlo + salaryPathConfig", () => {
  it("σ=0 + WAGE_PEAK: p50이 simulate dcAmount와 toBeCloseTo(4자리)", () => {
    const wagePeakInput: SimulationInput = {
      ...BASE_INPUT,
      salaryPathConfig: {
        mode: "WAGE_PEAK",
        wagePeak: { peakStartYear: 5, cutRate: 0.2, postPeakGrowthRate: 0.01 },
      },
    };
    const mc = runMonteCarlo({
      baseInput: wagePeakInput,
      expectedReturnRate: BASE_INPUT.dcReturnRate,
      volatility: 0,
      iterations: 1000,
      seed: 20260702,
    });
    const simResult = simulate(wagePeakInput);
    expect(mc.p50).toBeCloseTo(simResult.dcAmount, 4);
  });
});
