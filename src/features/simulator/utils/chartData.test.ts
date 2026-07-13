import { describe, expect, it } from "vitest";
import type { SensitivityMatrix } from "@/src/calculator/sensitivity";
import {
  buildRetirementComparisonChartData,
  createAmountScale,
  getRateRangeStatus,
  getSeriesDirectionDescription,
  getSeriesLabelPositions,
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
      {
        dcReturnRate: 0,
        dbExpectedAmount: 210_000_000,
        dcExpectedAmount: 180_000_000,
      },
      {
        dcReturnRate: 0.01,
        dbExpectedAmount: 210_000_000,
        dcExpectedAmount: 192_000_000,
      },
      {
        dcReturnRate: 0.02,
        dbExpectedAmount: 210_000_000,
        dcExpectedAmount: 205_000_000,
      },
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
      {
        dcReturnRate: 0,
        dbExpectedAmount: 100_000_000,
        dcExpectedAmount: 100_000_000,
      },
    ]);

    if (scale === null) throw new Error("유효한 데이터에는 금액 축이 필요합니다.");

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

  it("DB/DC 계열의 증가, 감소, 동일 방향을 설명한다", () => {
    expect(
      getSeriesDirectionDescription([
        { dcReturnRate: 0, dbExpectedAmount: 200, dcExpectedAmount: 100 },
        { dcReturnRate: 0.08, dbExpectedAmount: 200, dcExpectedAmount: 300 },
      ])
    ).toBe("DB 예상액은 수익률 구간에서 동일합니다. DC 예상액은 수익률이 높아질수록 증가합니다.");
    expect(
      getSeriesDirectionDescription([
        { dcReturnRate: 0, dbExpectedAmount: 200, dcExpectedAmount: 300 },
        { dcReturnRate: 0.08, dbExpectedAmount: 100, dcExpectedAmount: 200 },
      ])
    ).toContain("감소합니다");
  });

  it("유한 범위를 만들 수 없는 극단값은 축 생성을 중단한다", () => {
    expect(
      createAmountScale([
        {
          dcReturnRate: 0,
          dbExpectedAmount: Number.MAX_VALUE,
          dcExpectedAmount: 1,
        },
      ])
    ).toBeNull();
  });

  it("근접한 DB/DC 라벨을 원래 순서를 유지하며 20px 이상 분리한다", () => {
    expect(getSeriesLabelPositions(100, 100)).toEqual({ db: 90, dc: 110 });
    expect(getSeriesLabelPositions(119, 100)).toEqual({ db: 119.5, dc: 99.5 });
    expect(getSeriesLabelPositions(100, 119)).toEqual({ db: 99.5, dc: 119.5 });
    expect(getSeriesLabelPositions(100, 121)).toEqual({ db: 104, dc: 125 });
  });
});
