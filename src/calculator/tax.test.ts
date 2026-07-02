import { describe, it, expect } from "vitest";
import { estimateRetirementIncomeTax } from "./tax";

describe("estimateRetirementIncomeTax", () => {
  describe("수기 케이스 1: gross 2억, 근속 20년", () => {
    const result = estimateRetirementIncomeTax(200_000_000, 20);

    it("totalTax = 7,727,500", () => {
      expect(result.totalTax).toBeCloseTo(7_727_500, 0);
    });

    it("netAmount = 192,272,500", () => {
      expect(result.netAmount).toBeCloseTo(192_272_500, 0);
    });
  });

  describe("수기 케이스 2: gross 5,000만, 근속 10년", () => {
    const result = estimateRetirementIncomeTax(50_000_000, 10);

    it("totalTax = 748,000", () => {
      expect(result.totalTax).toBeCloseTo(748_000, 0);
    });
  });

  describe("공제 초과: gross 500만, 근속 10년", () => {
    const result = estimateRetirementIncomeTax(5_000_000, 10);

    it("세금 0", () => {
      expect(result.totalTax).toBe(0);
    });

    it("netAmount = gross", () => {
      expect(result.netAmount).toBe(5_000_000);
    });
  });

  describe("근속연수공제 경계 연속성", () => {
    it("근속 5년: 두 공식 일치 (500만)", () => {
      const formula1 = 5 * 1_000_000;
      const formula2 = 5_000_000 + (5 - 5) * 2_000_000;
      expect(formula1).toBe(formula2);

      const r1 = estimateRetirementIncomeTax(100_000_000, 5);
      const r2 = estimateRetirementIncomeTax(100_000_000, 5);
      expect(r1.totalTax).toBeCloseTo(r2.totalTax, 0);
    });

    it("근속 10년: 경계 연속", () => {
      const deduction10via5bracket = 5_000_000 + (10 - 5) * 2_000_000;
      const deduction10via10bracket = 15_000_000 + (10 - 10) * 2_500_000;
      expect(deduction10via5bracket).toBe(deduction10via10bracket);
    });

    it("근속 20년: 경계 연속", () => {
      const deduction20via10bracket = 15_000_000 + (20 - 10) * 2_500_000;
      const deduction20via20bracket = 40_000_000 + (20 - 20) * 3_000_000;
      expect(deduction20via10bracket).toBe(deduction20via20bracket);
    });
  });

  describe("환산급여공제 경계 연속성", () => {
    function convertedSalaryDeduction(cs: number): number {
      if (cs <= 8_000_000) return cs;
      if (cs <= 70_000_000) return 8_000_000 + (cs - 8_000_000) * 0.6;
      if (cs <= 100_000_000) return 45_200_000 + (cs - 70_000_000) * 0.55;
      if (cs <= 300_000_000) return 61_700_000 + (cs - 100_000_000) * 0.45;
      return 151_700_000 + (cs - 300_000_000) * 0.35;
    }

    it("환산급여 800만: 경계 연속", () => {
      const v = 8_000_000;
      expect(convertedSalaryDeduction(v)).toBeCloseTo(
        8_000_000 + (v - 8_000_000) * 0.6,
        0
      );
    });

    it("환산급여 7,000만: 경계 연속", () => {
      const v = 70_000_000;
      const via2 = 8_000_000 + (v - 8_000_000) * 0.6;
      const via3 = 45_200_000 + (v - 70_000_000) * 0.55;
      expect(via2).toBeCloseTo(via3, 0);
    });

    it("환산급여 1억: 경계 연속", () => {
      const v = 100_000_000;
      const via3 = 45_200_000 + (v - 70_000_000) * 0.55;
      const via4 = 61_700_000 + (v - 100_000_000) * 0.45;
      expect(via3).toBeCloseTo(via4, 0);
    });

    it("환산급여 3억: 경계 연속", () => {
      const v = 300_000_000;
      const via4 = 61_700_000 + (v - 100_000_000) * 0.45;
      const via5 = 151_700_000 + (v - 300_000_000) * 0.35;
      expect(via4).toBeCloseTo(via5, 0);
    });
  });

  describe("성질 검증", () => {
    it("gross 증가 시 totalTax 단조 증가", () => {
      const t1 = estimateRetirementIncomeTax(50_000_000, 10).totalTax;
      const t2 = estimateRetirementIncomeTax(100_000_000, 10).totalTax;
      const t3 = estimateRetirementIncomeTax(300_000_000, 10).totalTax;
      expect(t1).toBeLessThan(t2);
      expect(t2).toBeLessThan(t3);
    });

    it("0 ≤ effectiveRate < 0.495", () => {
      const cases = [
        estimateRetirementIncomeTax(50_000_000, 10),
        estimateRetirementIncomeTax(200_000_000, 20),
        estimateRetirementIncomeTax(1_000_000_000, 30),
      ];
      for (const r of cases) {
        expect(r.effectiveRate).toBeGreaterThanOrEqual(0);
        expect(r.effectiveRate).toBeLessThan(0.495);
      }
    });

    it("netAmount + totalTax === gross", () => {
      const cases = [
        { gross: 50_000_000, years: 10 },
        { gross: 200_000_000, years: 20 },
        { gross: 5_000_000, years: 10 },
      ];
      for (const { gross, years } of cases) {
        const r = estimateRetirementIncomeTax(gross, years);
        expect(r.netAmount + r.totalTax).toBeCloseTo(gross, 5);
      }
    });
  });
});
