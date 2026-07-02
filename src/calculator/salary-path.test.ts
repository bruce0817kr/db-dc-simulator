import { describe, it, expect } from "vitest";
import { buildSalaryPath } from "./salary-path";
import { salaryAtYear } from "./salary";

describe("buildSalaryPath CONSTANT_GROWTH", () => {
  it("config 없음: 모든 t에서 salaryAtYear와 일치", () => {
    const S0 = 60_000_000;
    const g = 0.03;
    const n = 5;
    const path = buildSalaryPath(S0, g, n);
    for (let t = 1; t <= n; t++) {
      expect(path[t - 1]).toBeCloseTo(salaryAtYear(S0, g, t), 10);
    }
  });

  it("mode=CONSTANT_GROWTH 명시: config 없음과 동일", () => {
    const S0 = 60_000_000;
    const g = 0.03;
    const n = 5;
    const withoutConfig = buildSalaryPath(S0, g, n);
    const withConfig = buildSalaryPath(S0, g, n, { mode: "CONSTANT_GROWTH" });
    for (let i = 0; i < n; i++) {
      expect(withConfig[i]).toBeCloseTo(withoutConfig[i], 10);
    }
  });

  it("길이가 remainingYears와 동일", () => {
    expect(buildSalaryPath(60_000_000, 0.03, 7)).toHaveLength(7);
    expect(buildSalaryPath(60_000_000, 0.03, 0)).toHaveLength(0);
  });
});

describe("buildSalaryPath WAGE_PEAK", () => {
  it("손계산: S0=60M, g=3%, n=5, peak=3년차, cut=20%, post=0%", () => {
    const S0 = 60_000_000;
    const g = 0.03;
    const n = 5;
    const path = buildSalaryPath(S0, g, n, {
      mode: "WAGE_PEAK",
      wagePeak: { peakStartYear: 3, cutRate: 0.2, postPeakGrowthRate: 0 },
    });
    // t=1: S0*(1.03)^1 = 61,800,000
    expect(path[0]).toBeCloseTo(60_000_000 * 1.03, 2);
    // t=2: S0*(1.03)^2 = 63,654,000
    expect(path[1]).toBeCloseTo(60_000_000 * Math.pow(1.03, 2), 2);
    // t=3: S0*(1.03)^2 * (1-0.2) = 50,923,200
    expect(path[2]).toBeCloseTo(60_000_000 * Math.pow(1.03, 2) * 0.8, 2);
    // t=4: peak값 * (1+0)^1 = 50,923,200
    expect(path[3]).toBeCloseTo(60_000_000 * Math.pow(1.03, 2) * 0.8, 2);
    // t=5: peak값 * (1+0)^2 = 50,923,200
    expect(path[4]).toBeCloseTo(60_000_000 * Math.pow(1.03, 2) * 0.8, 2);
  });

  it("peak=1년차: t=1에서 S0 * (1-cutRate)", () => {
    const S0 = 60_000_000;
    const path = buildSalaryPath(S0, 0.03, 3, {
      mode: "WAGE_PEAK",
      wagePeak: { peakStartYear: 1, cutRate: 0.1, postPeakGrowthRate: 0.02 },
    });
    // t=1 peak: S0 * (1-0.1)
    expect(path[0]).toBeCloseTo(S0 * 0.9, 2);
    // t=2: S0*0.9 * 1.02
    expect(path[1]).toBeCloseTo(S0 * 0.9 * 1.02, 2);
    // t=3: S0*0.9 * 1.02^2
    expect(path[2]).toBeCloseTo(S0 * 0.9 * Math.pow(1.02, 2), 2);
  });
});

describe("buildSalaryPath STEP_UP", () => {
  it("n=3, jump 2년차 +10%", () => {
    const S0 = 60_000_000;
    const g = 0.03;
    const n = 3;
    const path = buildSalaryPath(S0, g, n, {
      mode: "STEP_UP",
      stepUps: [{ yearIndex: 2, extraRaiseRate: 0.1 }],
    });
    // t=1: S0*(1.03)^1 (점프 전)
    expect(path[0]).toBeCloseTo(salaryAtYear(S0, g, 1), 6);
    // t=2: S0*(1.03)^2 * 1.1 (점프 적용)
    expect(path[1]).toBeCloseTo(salaryAtYear(S0, g, 2) * 1.1, 6);
    // t=3: S0*(1.03)^3 * 1.1 (누적 유지)
    expect(path[2]).toBeCloseTo(salaryAtYear(S0, g, 3) * 1.1, 6);
  });

  it("복수 점프: 1년차 +5%, 3년차 +10% → 누적", () => {
    const S0 = 60_000_000;
    const g = 0.03;
    const n = 4;
    const path = buildSalaryPath(S0, g, n, {
      mode: "STEP_UP",
      stepUps: [
        { yearIndex: 1, extraRaiseRate: 0.05 },
        { yearIndex: 3, extraRaiseRate: 0.1 },
      ],
    });
    expect(path[0]).toBeCloseTo(salaryAtYear(S0, g, 1) * 1.05, 6);
    expect(path[1]).toBeCloseTo(salaryAtYear(S0, g, 2) * 1.05, 6);
    expect(path[2]).toBeCloseTo(salaryAtYear(S0, g, 3) * 1.05 * 1.1, 6);
    expect(path[3]).toBeCloseTo(salaryAtYear(S0, g, 4) * 1.05 * 1.1, 6);
  });
});

describe("buildSalaryPath YEARLY_CUSTOM", () => {
  it("yearlySalaries 그대로 반환", () => {
    const salaries = [50_000_000, 52_000_000, 54_000_000];
    const path = buildSalaryPath(60_000_000, 0.03, 3, {
      mode: "YEARLY_CUSTOM",
      yearlySalaries: salaries,
    });
    expect(path).toEqual(salaries);
  });

  it("길이 불일치 시 throw", () => {
    expect(() =>
      buildSalaryPath(60_000_000, 0.03, 3, {
        mode: "YEARLY_CUSTOM",
        yearlySalaries: [50_000_000, 52_000_000],
      })
    ).toThrow();
  });

  it("빈 배열 + n=0 → 통과", () => {
    const path = buildSalaryPath(60_000_000, 0.03, 0, {
      mode: "YEARLY_CUSTOM",
      yearlySalaries: [],
    });
    expect(path).toEqual([]);
  });
});
