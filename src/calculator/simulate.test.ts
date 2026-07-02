import { describe, it, expect } from "vitest";
import { simulate } from "./simulate";
import { calculateCurrentDbSettlement } from "./db";
import { calculateDcAmount } from "./dc";
import { buildSalaryPath } from "./salary-path";
import { SimulationInput } from "./types";

describe("simulate", () => {
  it("required sample case: S=80M, y0=10, n=15, g=r=0.03 → DB≈DC, diff≈0, breakeven≈0.03", () => {
    const result = simulate({
      currentSalary: 80_000_000,
      currentServiceYears: 10,
      remainingServiceYears: 15,
      wageGrowthRate: 0.03,
      dcReturnRate: 0.03,
      conversionType: "TRANSFER_ALL_TO_DC",
    });

    expect(result.dcAmount).toBeCloseTo(result.dbAmount, 4);
    expect(result.difference).toBeCloseTo(0, 4);
    expect(result.breakevenReturnRate).not.toBeNull();
    expect(result.breakevenReturnRate!).toBeCloseTo(0.03, 6);
  });

  it("n=0: DB=DC=settlement, breakevenReturnRate=null", () => {
    const s = 60_000_000;
    const y0 = 5;
    const result = simulate({
      currentSalary: s,
      currentServiceYears: y0,
      remainingServiceYears: 0,
      wageGrowthRate: 0.03,
      dcReturnRate: 0.04,
      conversionType: "TRANSFER_ALL_TO_DC",
    });

    const settlement = (s / 12) * y0;
    expect(result.dbAmount).toBeCloseTo(settlement, 4);
    expect(result.dcAmount).toBeCloseTo(settlement, 4);
    expect(result.difference).toBeCloseTo(0, 4);
    expect(result.breakevenReturnRate).toBeNull();
  });

  it("dcAmount reflects dcReturnRate: higher r → higher DC", () => {
    const base = {
      currentSalary: 60_000_000,
      currentServiceYears: 5,
      remainingServiceYears: 10,
      wageGrowthRate: 0.03,
      conversionType: "TRANSFER_ALL_TO_DC" as const,
    };
    const low = simulate({ ...base, dcReturnRate: 0.03 });
    const high = simulate({ ...base, dcReturnRate: 0.05 });
    expect(high.dcAmount).toBeGreaterThan(low.dcAmount);
  });
});

describe("simulate + salaryPathConfig", () => {
  const base = {
    currentSalary: 60_000_000,
    currentServiceYears: 5,
    remainingServiceYears: 10,
    wageGrowthRate: 0.03,
    dcReturnRate: 0.05,
    conversionType: "TRANSFER_ALL_TO_DC" as const,
  };

  it("CONSTANT_GROWTH config 명시 == config 없음 결과 완전 동일", () => {
    const without = simulate({ ...base });
    const with_ = simulate({ ...base, salaryPathConfig: { mode: "CONSTANT_GROWTH" } });
    expect(with_.dbAmount).toBeCloseTo(without.dbAmount, 4);
    expect(with_.dcAmount).toBeCloseTo(without.dcAmount, 4);
    expect(with_.difference).toBeCloseTo(without.difference, 4);
    if (without.breakevenReturnRate !== null && with_.breakevenReturnRate !== null) {
      expect(with_.breakevenReturnRate).toBeCloseTo(without.breakevenReturnRate, 6);
    }
  });

  it("WAGE_PEAK → dbAmount 감소 (임금 삭감 반영)", () => {
    const normal = simulate({ ...base });
    const wagePeak = simulate({
      ...base,
      salaryPathConfig: {
        mode: "WAGE_PEAK",
        wagePeak: { peakStartYear: 3, cutRate: 0.2, postPeakGrowthRate: 0 },
      },
    });
    expect(wagePeak.dbAmount).toBeLessThan(normal.dbAmount);
  });

  it("WAGE_PEAK: g=r=0.03에서 difference ≠ 0 (TIE 깨짐 정상)", () => {
    const result = simulate({
      ...base,
      dcReturnRate: 0.03,
      wageGrowthRate: 0.03,
      salaryPathConfig: {
        mode: "WAGE_PEAK",
        wagePeak: { peakStartYear: 3, cutRate: 0.2, postPeakGrowthRate: 0 },
      },
    });
    expect(Math.abs(result.difference)).toBeGreaterThan(1);
  });

  it("dbAverageSalaryOverride → dbAmount = override/12 × 총근속, dcAmount 불변", () => {
    const override = 70_000_000;
    const totalYears = base.currentServiceYears + base.remainingServiceYears;
    const normal = simulate({ ...base });
    const overridden = simulate({ ...base, dbAverageSalaryOverride: override });
    expect(overridden.dbAmount).toBeCloseTo((override / 12) * totalYears, 4);
    expect(overridden.dcAmount).toBeCloseTo(normal.dcAmount, 4);
  });
});

describe("simulate breakeven 정합성 (dbAverageSalaryOverride)", () => {
  it("override 설정 시 DC(r*)가 override 기준 dbAmount와 상대오차 < 1e-4", () => {
    const input: SimulationInput = {
      currentSalary: 60_000_000,
      currentServiceYears: 5,
      remainingServiceYears: 10,
      wageGrowthRate: 0.03,
      dcReturnRate: 0.05,
      conversionType: "TRANSFER_ALL_TO_DC",
      salaryPathConfig: {
        mode: "WAGE_PEAK",
        wagePeak: { peakStartYear: 6, cutRate: 0.2, postPeakGrowthRate: 0 },
      },
      dbAverageSalaryOverride: 70_000_000,
    };
    const result = simulate(input);
    expect(result.breakevenReturnRate).not.toBeNull();
    const path = buildSalaryPath(
      input.currentSalary,
      input.wageGrowthRate,
      input.remainingServiceYears,
      input.salaryPathConfig
    );
    const dc = calculateDcAmount(
      input.currentSalary,
      input.wageGrowthRate,
      input.currentServiceYears,
      input.remainingServiceYears,
      result.breakevenReturnRate!,
      undefined,
      path
    );
    expect(Math.abs(dc - result.dbAmount) / result.dbAmount).toBeLessThan(1e-4);
  });
});

describe("simulate CUSTOM_TRANSFER_AMOUNT", () => {
  const base = {
    currentSalary: 80_000_000,
    currentServiceYears: 10,
    remainingServiceYears: 15,
    wageGrowthRate: 0.03,
    dcReturnRate: 0.05,
  };

  it("(a) CUSTOM + customTransferAmount = settlement → same as TRANSFER_ALL_TO_DC", () => {
    const settlement = calculateCurrentDbSettlement(
      base.currentSalary,
      base.currentServiceYears
    );
    const allDc = simulate({ ...base, conversionType: "TRANSFER_ALL_TO_DC" });
    const custom = simulate({
      ...base,
      conversionType: "CUSTOM_TRANSFER_AMOUNT",
      customTransferAmount: settlement,
    });
    expect(custom.dcAmount).toBeCloseTo(allDc.dcAmount, 4);
    expect(custom.dbAmount).toBeCloseTo(allDc.dbAmount, 4);
    expect(custom.breakevenReturnRate).toBeCloseTo(allDc.breakevenReturnRate!, 6);
  });

  it("(b) CUSTOM + customTransferAmount = 0 → dcAmount equals contribution FV sum only", () => {
    const result = simulate({
      ...base,
      conversionType: "CUSTOM_TRANSFER_AMOUNT",
      customTransferAmount: 0,
    });
    const n = base.remainingServiceYears;
    const r = base.dcReturnRate;
    const g = base.wageGrowthRate;
    let expectedFvSum = 0;
    for (let t = 1; t <= n; t++) {
      expectedFvSum +=
        ((base.currentSalary * Math.pow(1 + g, t)) / 12) *
        Math.pow(1 + r, n - t);
    }
    expect(result.dcAmount).toBeCloseTo(expectedFvSum, 4);
  });

  it("(c) breakevenReturnRate with custom=0 is higher than with full settlement", () => {
    const allDcResult = simulate({ ...base, conversionType: "TRANSFER_ALL_TO_DC" });
    const customResult = simulate({
      ...base,
      conversionType: "CUSTOM_TRANSFER_AMOUNT",
      customTransferAmount: 0,
    });
    expect(customResult.breakevenReturnRate).not.toBeNull();
    expect(allDcResult.breakevenReturnRate).not.toBeNull();
    expect(customResult.breakevenReturnRate!).toBeGreaterThan(
      allDcResult.breakevenReturnRate!
    );
  });
});
