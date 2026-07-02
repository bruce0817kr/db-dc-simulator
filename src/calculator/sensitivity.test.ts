import { describe, it, expect } from "vitest";
import {
  buildSensitivityMatrix,
  buildBreakevenByGrowthRate,
  DEFAULT_GROWTH_RATES,
  DEFAULT_RETURN_RATES,
} from "./sensitivity";
import { simulate } from "./simulate";
import { calculateDcAmount } from "./dc";
import { SimulationInput } from "./types";

const BASE_TRANSFER_ALL: SimulationInput = {
  currentSalary: 80_000_000,
  currentServiceYears: 10,
  remainingServiceYears: 15,
  wageGrowthRate: 0.03,
  dcReturnRate: 0.05,
  conversionType: "TRANSFER_ALL_TO_DC",
};

const BASE_CUSTOM_ZERO: SimulationInput = {
  ...BASE_TRANSFER_ALL,
  conversionType: "CUSTOM_TRANSFER_AMOUNT",
  customTransferAmount: 0,
};

describe("buildSensitivityMatrix", () => {
  it("기본 grid 54 points", () => {
    const m = buildSensitivityMatrix(BASE_TRANSFER_ALL);
    expect(m.points.length).toBe(DEFAULT_GROWTH_RATES.length * DEFAULT_RETURN_RATES.length);
    expect(m.points.length).toBe(54);
  });

  it("순회 순서: points[0]=growth[0]×return[0], points[8]=growth[0]×return[8], points[9]=growth[1]×return[0]", () => {
    const m = buildSensitivityMatrix(BASE_TRANSFER_ALL);
    expect(m.points[0].salaryGrowthRate).toBeCloseTo(DEFAULT_GROWTH_RATES[0]);
    expect(m.points[0].dcReturnRate).toBeCloseTo(DEFAULT_RETURN_RATES[0]);
    expect(m.points[8].salaryGrowthRate).toBeCloseTo(DEFAULT_GROWTH_RATES[0]);
    expect(m.points[8].dcReturnRate).toBeCloseTo(DEFAULT_RETURN_RATES[8]);
    expect(m.points[9].salaryGrowthRate).toBeCloseTo(DEFAULT_GROWTH_RATES[1]);
    expect(m.points[9].dcReturnRate).toBeCloseTo(DEFAULT_RETURN_RATES[0]);
  });

  it("g=r 대각선 6셀 전부 winner=TIE (TRANSFER_ALL, 80M/10/15)", () => {
    const m = buildSensitivityMatrix(BASE_TRANSFER_ALL);
    const diagonal = DEFAULT_GROWTH_RATES.filter((g) =>
      DEFAULT_RETURN_RATES.some((r) => Math.abs(r - g) < 1e-9)
    );
    for (const g of diagonal) {
      const pt = m.points.find(
        (p) => Math.abs(p.salaryGrowthRate - g) < 1e-9 && Math.abs(p.dcReturnRate - g) < 1e-9
      );
      expect(pt, `g=r=${g} point not found`).toBeDefined();
      expect(pt!.winner).toBe("TIE");
    }
  });

  it("행 내 단조 전이: 각 growth 행에서 DB→(TIE)→DC 순으로만 전이 (역행 없음)", () => {
    const m = buildSensitivityMatrix(BASE_TRANSFER_ALL);
    const winnerOrder = { DB: 0, TIE: 1, DC: 2 };
    for (const g of DEFAULT_GROWTH_RATES) {
      const row = m.points.filter((p) => Math.abs(p.salaryGrowthRate - g) < 1e-9);
      let prev = winnerOrder[row[0].winner];
      for (const pt of row.slice(1)) {
        const cur = winnerOrder[pt.winner];
        expect(cur).toBeGreaterThanOrEqual(prev);
        prev = cur;
      }
    }
  });

  it("교차 검증: 임의 1셀의 dbExpectedAmount/dcExpectedAmount가 simulate() 결과와 일치", () => {
    const g = 0.02;
    const r = 0.04;
    const m = buildSensitivityMatrix(BASE_TRANSFER_ALL);
    const pt = m.points.find(
      (p) => Math.abs(p.salaryGrowthRate - g) < 1e-9 && Math.abs(p.dcReturnRate - r) < 1e-9
    );
    expect(pt).toBeDefined();
    const simResult = simulate({ ...BASE_TRANSFER_ALL, wageGrowthRate: g, dcReturnRate: r });
    expect(pt!.dbExpectedAmount).toBeCloseTo(simResult.dbAmount, 0);
    expect(pt!.dcExpectedAmount).toBeCloseTo(simResult.dcAmount, 0);
  });
});

describe("buildBreakevenByGrowthRate", () => {
  it("각 비-null r*에서 calculateDcAmount와 DB의 상대오차 < 1e-4", () => {
    const rows = buildBreakevenByGrowthRate(BASE_TRANSFER_ALL);
    for (const row of rows) {
      if (row.breakevenReturnRate === null) continue;
      const dc = calculateDcAmount(
        BASE_TRANSFER_ALL.currentSalary,
        row.salaryGrowthRate,
        BASE_TRANSFER_ALL.currentServiceYears,
        BASE_TRANSFER_ALL.remainingServiceYears,
        row.breakevenReturnRate
      );
      const rel = Math.abs(dc - row.dbExpectedAmount) / row.dbExpectedAmount;
      expect(rel).toBeLessThan(1e-4);
    }
  });

  it("CUSTOM(customTransferAmount=0)의 breakeven이 TRANSFER_ALL보다 큼 (같은 growth 행 기준)", () => {
    const rowsAll = buildBreakevenByGrowthRate(BASE_TRANSFER_ALL);
    const rowsCustom = buildBreakevenByGrowthRate(BASE_CUSTOM_ZERO);
    for (let i = 0; i < rowsAll.length; i++) {
      const rAll = rowsAll[i].breakevenReturnRate;
      const rCustom = rowsCustom[i].breakevenReturnRate;
      if (rAll !== null && rCustom !== null) {
        expect(rCustom).toBeGreaterThan(rAll);
      }
    }
  });
});
