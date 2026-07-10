import { describe, expect, it } from "vitest";
import type { SensitivityMatrix } from "@/src/calculator/sensitivity";
import {
  buildRetirementComparisonChartData,
  createAmountScale,
  getRateRangeStatus,
  scaleValue,
} from "./chartData";

const matrix: SensitivityMatrix = {
  salaryGrowthRates: [0.03],
  dcReturnRates: [0.02, 0, 0.01],
  points: [
    {
      salaryGrowthRate: 0.03,
      dcReturnRate: 0.02,
      dbExpectedAmount: 210_000_000,
      dcExpectedAmount: 205_000_000,
      difference: -5_000_000,
      winner: "DB",
    },
    {
      salaryGrowthRate: 0.03,
      dcReturnRate: 0,
      dbExpectedAmount: 210_000_000,
      dcExpectedAmount: 180_000_000,
      difference: -30_000_000,
      winner: "DB",
    },
    {
      salaryGrowthRate: 0.03,
      dcReturnRate: 0.01,
      dbExpectedAmount: 210_000_000,
      dcExpectedAmount: 192_000_000,
      difference: -18_000_000,
      winner: "DB",
    },
  ],
};

describe("chartData", () => {
  it("민감도 점을 수익률 오름차순 차트 데이터로 변환할 때 원본 값을 유지한다", () => {
    const data = buildRetirementComparisonChartData(matrix);

    expect(data).toEqual([
      { dcReturnRate: 0, dbExpectedAmount: 210_000_000, dcExpectedAmount: 180_000_000 },
      { dcReturnRate: 0.01, dbExpectedAmount: 210_000_000, dcExpectedAmount: 192_000_000 },
      { dcReturnRate: 0.02, dbExpectedAmount: 210_000_000, dcExpectedAmount: 205_000_000 },
    ]);
    expect(matrix.dcReturnRates).toEqual([0.02, 0, 0.01]);
  });

  it("손익분기와 현재 입력 수익률을 표시 범위에 따라 분류한다", () => {
    expect(getRateRangeStatus(null)).toEqual({ kind: "unavailable" });
    expect(getRateRangeStatus(-0.01)).toEqual({ kind: "below" });
    expect(getRateRangeStatus(0.04)).toEqual({ kind: "inside", value: 0.04 });
    expect(getRateRangeStatus(0.09)).toEqual({ kind: "above" });
  });

  it("동일한 금액만 있어도 유한한 세로축과 좌표를 만든다", () => {
    const scale = createAmountScale([
      { dcReturnRate: 0, dbExpectedAmount: 100_000_000, dcExpectedAmount: 100_000_000 },
    ]);

    expect(scale.minimum).toBe(0);
    expect(scale.maximum).toBeGreaterThan(100_000_000);
    expect(scale.ticks).toHaveLength(4);
    expect(
      Number.isFinite(
        scaleValue(100_000_000, {
          domainMinimum: scale.minimum,
          domainMaximum: scale.maximum,
          rangeMinimum: 200,
          rangeMaximum: 20,
        })
      )
    ).toBe(true);
  });

  it("빈 데이터에는 축을 만들지 않는다", () => {
    expect(createAmountScale([])).toBeNull();
  });
});
