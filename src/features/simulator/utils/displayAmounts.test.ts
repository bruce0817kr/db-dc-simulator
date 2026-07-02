import { describe, it, expect } from "vitest";
import { buildDisplayAmounts } from "./displayAmounts";
import { estimateRetirementIncomeTax } from "@/src/calculator/tax";
import { toPresentValue } from "@/src/calculator/present-value";
import { SimulationResult } from "@/src/calculator/types";

const result: SimulationResult = {
  dbAmount: 300_000_000,
  dcAmount: 350_000_000,
  difference: 50_000_000,
  breakevenReturnRate: 0.03,
};

const totalServiceYears = 25;
const remainingYears = 15;
const inflationRate = 0.02;

describe("buildDisplayAmounts", () => {
  it("모드 없음 — 세전 원본 그대로, modeLabel 빈 문자열", () => {
    const d = buildDisplayAmounts(result, totalServiceYears, remainingYears, {
      afterTax: false,
      presentValue: false,
      inflationRate,
    });
    expect(d.db).toBeCloseTo(result.dbAmount);
    expect(d.dc).toBeCloseTo(result.dcAmount);
    expect(d.difference).toBeCloseTo(result.dcAmount - result.dbAmount);
    expect(d.modeLabel).toBe("");
    expect(d.dbTax).toBeUndefined();
    expect(d.dcTax).toBeUndefined();
  });

  it("afterTax 전용 — netAmount 적용, modeLabel '(세후)', tax 포함", () => {
    const dbTax = estimateRetirementIncomeTax(result.dbAmount, totalServiceYears);
    const dcTax = estimateRetirementIncomeTax(result.dcAmount, totalServiceYears);
    const d = buildDisplayAmounts(result, totalServiceYears, remainingYears, {
      afterTax: true,
      presentValue: false,
      inflationRate,
    });
    expect(d.db).toBeCloseTo(dbTax.netAmount);
    expect(d.dc).toBeCloseTo(dcTax.netAmount);
    expect(d.difference).toBeCloseTo(dcTax.netAmount - dbTax.netAmount);
    expect(d.modeLabel).toBe("(세후)");
    expect(d.dbTax).toBeDefined();
    expect(d.dcTax).toBeDefined();
  });

  it("presentValue 전용 — 현재가치 할인 적용, modeLabel '(현재가치)'", () => {
    const dbPv = toPresentValue(result.dbAmount, inflationRate, remainingYears);
    const dcPv = toPresentValue(result.dcAmount, inflationRate, remainingYears);
    const d = buildDisplayAmounts(result, totalServiceYears, remainingYears, {
      afterTax: false,
      presentValue: true,
      inflationRate,
    });
    expect(d.db).toBeCloseTo(dbPv);
    expect(d.dc).toBeCloseTo(dcPv);
    expect(d.difference).toBeCloseTo(dcPv - dbPv);
    expect(d.modeLabel).toBe("(현재가치)");
    expect(d.dbTax).toBeUndefined();
  });

  it("afterTax + presentValue — 과세 후 할인, modeLabel '(세후·현재가치)'", () => {
    const dbTax = estimateRetirementIncomeTax(result.dbAmount, totalServiceYears);
    const dcTax = estimateRetirementIncomeTax(result.dcAmount, totalServiceYears);
    const dbFinal = toPresentValue(dbTax.netAmount, inflationRate, remainingYears);
    const dcFinal = toPresentValue(dcTax.netAmount, inflationRate, remainingYears);
    const d = buildDisplayAmounts(result, totalServiceYears, remainingYears, {
      afterTax: true,
      presentValue: true,
      inflationRate,
    });
    expect(d.db).toBeCloseTo(dbFinal);
    expect(d.dc).toBeCloseTo(dcFinal);
    expect(d.difference).toBeCloseTo(dcFinal - dbFinal);
    expect(d.modeLabel).toBe("(세후·현재가치)");
    expect(d.dbTax).toBeDefined();
    expect(d.dcTax).toBeDefined();
  });

  it("difference는 변환 후 dc - db로 재계산 (세후는 비선형)", () => {
    const d = buildDisplayAmounts(result, totalServiceYears, remainingYears, {
      afterTax: true,
      presentValue: false,
      inflationRate,
    });
    expect(d.difference).toBeCloseTo(d.dc - d.db);
    expect(d.difference).not.toBeCloseTo(result.difference);
  });
});
