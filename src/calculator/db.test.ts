import { describe, it, expect } from "vitest";
import { calculateDbAmount, calculateCurrentDbSettlement } from "./db";

describe("calculateCurrentDbSettlement", () => {
  it("n=1 basic", () => {
    expect(calculateCurrentDbSettlement(60_000_000, 5)).toBe(
      (60_000_000 / 12) * 5
    );
  });

  it("y0=0 returns 0", () => {
    expect(calculateCurrentDbSettlement(60_000_000, 0)).toBe(0);
  });
});

describe("calculateDbAmount", () => {
  it("n=1, y0=5, g=0.03", () => {
    const expected = ((60_000_000 * 1.03) / 12) * (5 + 1);
    expect(calculateDbAmount(60_000_000, 0.03, 5, 1)).toBeCloseTo(expected, 4);
  });

  it("n=2, y0=5, g=0.03", () => {
    const expected = ((60_000_000 * Math.pow(1.03, 2)) / 12) * (5 + 2);
    expect(calculateDbAmount(60_000_000, 0.03, 5, 2)).toBeCloseTo(expected, 4);
  });

  it("g=0: finalSalary = currentSalary", () => {
    expect(calculateDbAmount(60_000_000, 0, 5, 3)).toBeCloseTo(
      (60_000_000 / 12) * 8,
      4
    );
  });

  it("n=0: DB = settlement", () => {
    expect(calculateDbAmount(60_000_000, 0.03, 5, 0)).toBeCloseTo(
      (60_000_000 / 12) * 5,
      4
    );
  });
});
