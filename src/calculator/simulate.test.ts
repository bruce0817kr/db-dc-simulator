import { describe, it, expect } from "vitest";
import { simulate } from "./simulate";

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
