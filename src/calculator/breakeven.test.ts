import { describe, it, expect } from "vitest";
import { findBreakevenReturnRate } from "./breakeven";
import { calculateDcAmount } from "./dc";
import { calculateDbAmount } from "./db";

describe("findBreakevenReturnRate", () => {
  it("n=0 returns null", () => {
    expect(findBreakevenReturnRate(60_000_000, 0.03, 5, 0)).toBeNull();
  });

  it("g=r=0.03 case: breakeven ≈ 0.03", () => {
    const r = findBreakevenReturnRate(80_000_000, 0.03, 10, 15);
    expect(r).not.toBeNull();
    expect(r!).toBeCloseTo(0.03, 6);
  });

  it("breakeven property: plug r* back into DC → equals DB within 1e-4 relative", () => {
    const s = 60_000_000;
    const g = 0.03;
    const y0 = 5;
    const n = 10;
    const rStar = findBreakevenReturnRate(s, g, y0, n);
    expect(rStar).not.toBeNull();
    const dc = calculateDcAmount(s, g, y0, n, rStar!);
    const db = calculateDbAmount(s, g, y0, n);
    expect(Math.abs(dc - db) / db).toBeLessThan(1e-4);
  });

  it("different g and r (g=0.03, r=0.05 scenario) — r* is valid and DC(r*)=DB", () => {
    const s = 60_000_000;
    const g = 0.02;
    const y0 = 5;
    const n = 10;
    const rStar = findBreakevenReturnRate(s, g, y0, n);
    expect(rStar).not.toBeNull();
    const dc = calculateDcAmount(s, g, y0, n, rStar!);
    const db = calculateDbAmount(s, g, y0, n);
    expect(Math.abs(dc - db) / db).toBeLessThan(1e-4);
  });
});
