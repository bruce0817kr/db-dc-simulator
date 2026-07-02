import { describe, it, expect } from "vitest";
import { toPresentValue } from "./present-value";

describe("toPresentValue", () => {
  it("π=0이면 amount 그대로", () => {
    expect(toPresentValue(1_000_000, 0, 10)).toBe(1_000_000);
  });

  it("2%, 15년 = amount / 1.02^15", () => {
    const amount = 100_000_000;
    expect(toPresentValue(amount, 0.02, 15)).toBeCloseTo(
      amount / Math.pow(1.02, 15),
      10
    );
  });

  it("years=0이면 amount 그대로", () => {
    expect(toPresentValue(500_000, 0.03, 0)).toBe(500_000);
  });
});
