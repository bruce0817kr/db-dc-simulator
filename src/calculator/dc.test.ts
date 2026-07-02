import { describe, it, expect } from "vitest";
import { calculateDcAmount } from "./dc";
import { calculateDbAmount } from "./db";

describe("calculateDcAmount", () => {
  it("n=1, y0=5, g=0.03, r=0.04 — hand computed", () => {
    const settlement = (60_000_000 / 12) * 5;
    const contrib1 = (60_000_000 * 1.03) / 12;
    const expected = settlement * 1.04 + contrib1 * Math.pow(1.04, 0);
    expect(calculateDcAmount(60_000_000, 0.03, 5, 1, 0.04)).toBeCloseTo(
      expected,
      4
    );
  });

  it("n=2, y0=5, g=0.03, r=0.04 — hand computed", () => {
    const settlement = (60_000_000 / 12) * 5;
    const contrib1 = (60_000_000 * 1.03) / 12;
    const contrib2 = (60_000_000 * Math.pow(1.03, 2)) / 12;
    const expected =
      settlement * Math.pow(1.04, 2) +
      contrib1 * Math.pow(1.04, 1) +
      contrib2 * Math.pow(1.04, 0);
    expect(calculateDcAmount(60_000_000, 0.03, 5, 2, 0.04)).toBeCloseTo(
      expected,
      4
    );
  });

  it("g=0, r=0: DC = settlement + sum of salary/12", () => {
    const s = 60_000_000;
    const y0 = 5;
    const n = 3;
    const expected = (s / 12) * y0 + n * (s / 12);
    expect(calculateDcAmount(s, 0, y0, n, 0)).toBeCloseTo(expected, 4);
  });

  it("n=0: DC = settlement", () => {
    const s = 60_000_000;
    const y0 = 5;
    expect(calculateDcAmount(s, 0.03, y0, 0, 0.04)).toBeCloseTo(
      (s / 12) * y0,
      4
    );
  });

  it("g=r: DC equals DB (key mathematical property)", () => {
    const s = 80_000_000;
    const y0 = 10;
    const n = 15;
    const g = 0.03;
    const r = 0.03;
    const dc = calculateDcAmount(s, g, y0, n, r);
    const db = calculateDbAmount(s, g, y0, n);
    expect(dc).toBeCloseTo(db, 4);
  });

  it("monotonicity: DC(r=0.05) > DC(r=0.03)", () => {
    const s = 60_000_000;
    const dc05 = calculateDcAmount(s, 0.03, 5, 10, 0.05);
    const dc03 = calculateDcAmount(s, 0.03, 5, 10, 0.03);
    expect(dc05).toBeGreaterThan(dc03);
  });
});
