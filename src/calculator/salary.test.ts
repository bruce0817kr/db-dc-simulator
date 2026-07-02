import { describe, it, expect } from "vitest";
import { salaryAtYear, finalSalary } from "./salary";

describe("salaryAtYear", () => {
  it("year 0 returns currentSalary", () => {
    expect(salaryAtYear(60_000_000, 0.03, 0)).toBe(60_000_000);
  });

  it("year 1", () => {
    expect(salaryAtYear(60_000_000, 0.03, 1)).toBeCloseTo(60_000_000 * 1.03, 6);
  });

  it("year 2", () => {
    expect(salaryAtYear(60_000_000, 0.03, 2)).toBeCloseTo(
      60_000_000 * 1.03 * 1.03,
      6
    );
  });

  it("g=0 returns currentSalary unchanged", () => {
    expect(salaryAtYear(60_000_000, 0, 5)).toBe(60_000_000);
  });
});

describe("finalSalary", () => {
  it("n=1", () => {
    expect(finalSalary(60_000_000, 0.03, 1)).toBeCloseTo(60_000_000 * 1.03, 6);
  });

  it("n=2", () => {
    expect(finalSalary(60_000_000, 0.03, 2)).toBeCloseTo(
      60_000_000 * Math.pow(1.03, 2),
      6
    );
  });

  it("equals salaryAtYear(n)", () => {
    const s = 80_000_000;
    const g = 0.03;
    const n = 15;
    expect(finalSalary(s, g, n)).toBeCloseTo(salaryAtYear(s, g, n), 10);
  });
});
