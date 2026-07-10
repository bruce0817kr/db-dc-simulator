// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SensitivityMatrix } from "@/src/calculator/sensitivity";
import type { SimulationInput, SimulationResult } from "@/src/calculator/types";
import { RetirementComparisonChart } from "./RetirementComparisonChart";

afterEach(cleanup);

const input: SimulationInput = {
  currentSalary: 80_000_000,
  currentServiceYears: 10,
  remainingServiceYears: 15,
  wageGrowthRate: 0.03,
  dcReturnRate: 0.04,
  conversionType: "TRANSFER_ALL_TO_DC",
};

const result: SimulationResult = {
  dbAmount: 250_000_000,
  dcAmount: 270_000_000,
  difference: 20_000_000,
  breakevenReturnRate: 0.032,
};

const matrix: SensitivityMatrix = {
  salaryGrowthRates: [0.03],
  dcReturnRates: [0, 0.04, 0.08],
  points: [
    {
      salaryGrowthRate: 0.03,
      dcReturnRate: 0,
      dbExpectedAmount: 250_000_000,
      dcExpectedAmount: 190_000_000,
      difference: -60_000_000,
      winner: "DB",
    },
    {
      salaryGrowthRate: 0.03,
      dcReturnRate: 0.04,
      dbExpectedAmount: 250_000_000,
      dcExpectedAmount: 270_000_000,
      difference: 20_000_000,
      winner: "DC",
    },
    {
      salaryGrowthRate: 0.03,
      dcReturnRate: 0.08,
      dbExpectedAmount: 250_000_000,
      dcExpectedAmount: 390_000_000,
      difference: 140_000_000,
      winner: "DC",
    },
  ],
};

describe("RetirementComparisonChart", () => {
  it("접근 가능한 차트 이름과 설명, 두 계열의 직접 라벨을 표시한다", () => {
    render(<RetirementComparisonChart input={input} result={result} matrix={matrix} />);

    expect(screen.getByRole("img", { name: "DB/DC 예상 퇴직급여 비교 차트" })).toBeTruthy();
    expect(screen.getByText("DB 예상액", { exact: true })).toBeTruthy();
    expect(screen.getByText("DC 예상액", { exact: true })).toBeTruthy();
    expect(screen.getByText("손익분기 약 3.2%", { exact: true })).toBeTruthy();
    expect(screen.getByText("현재 입력 4.0%", { exact: true })).toBeTruthy();
    expect(document.querySelector("desc")?.textContent).toContain(
      "DB 예상액은 수익률 구간에서 동일합니다. DC 예상액은 수익률이 높아질수록 증가합니다."
    );
    expect(screen.getByText(/확정 수익이나 운용성과를 보장하지 않습니다/)).toBeTruthy();
  });

  it("DB와 DC 계열을 색상 외 선과 점 모양으로 구분한다", () => {
    const { container } = render(<RetirementComparisonChart input={input} result={result} matrix={matrix} />);

    expect(container.querySelector('[data-series="DB"]')?.getAttribute("stroke-dasharray")).toBe("8 6");
    expect(container.querySelectorAll('circle[data-point-series="DB"]')).toHaveLength(3);
    expect(container.querySelector('[data-series="DC"]')?.getAttribute("stroke-dasharray")).toBeNull();
    expect(container.querySelectorAll('rect[data-point-series="DC"]')).toHaveLength(3);
  });

  it("손익분기와 현재 입력이 표시 범위 밖이면 왜곡하지 않고 상태 문구를 표시한다", () => {
    render(
      <RetirementComparisonChart
        input={{ ...input, dcReturnRate: 0.12 }}
        result={{ ...result, breakevenReturnRate: 0.09 }}
        matrix={matrix}
      />
    );

    expect(screen.getByText("손익분기 수익률이 표시 범위(0~8%)보다 높습니다.")).toBeTruthy();
    expect(screen.getByText("현재 입력 수익률은 표시 범위 밖입니다.")).toBeTruthy();
    expect(screen.queryByText(/현재 입력 12/)).toBeNull();
  });

  it("데이터가 비어 있으면 빈 축 대신 대체 문구를 표시한다", () => {
    render(
      <RetirementComparisonChart
        input={input}
        result={{ ...result, breakevenReturnRate: null }}
        matrix={{ salaryGrowthRates: [], dcReturnRates: [], points: [] }}
      />
    );

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("차트로 표시할 민감도 데이터가 없습니다.")).toBeTruthy();
    expect(screen.getByText("입력하신 조건에서는 손익분기 수익률을 계산할 수 없습니다.")).toBeTruthy();
  });

  it("마지막 DB/DC 금액이 가까우면 직접 라벨을 서로 다른 높이에 배치한다", () => {
    const { container } = render(
      <RetirementComparisonChart
        input={input}
        result={result}
        matrix={{
          ...matrix,
          points: matrix.points.map((point) => ({
            ...point,
            dbExpectedAmount: 250_000_000,
            dcExpectedAmount: 250_000_000,
          })),
        }}
      />
    );

    const dbY = container.querySelector('[data-chart-label="db-series"]')?.getAttribute("y");
    const dcY = container.querySelector('[data-chart-label="dc-series"]')?.getAttribute("y");
    expect(Math.abs(Number(dbY) - Number(dcY))).toBeGreaterThanOrEqual(20);
  });

  it("손익분기 라벨을 8% 경계에서는 왼쪽으로, 0% 경계에서는 오른쪽으로 펼친다", () => {
    const { container, rerender } = render(
      <RetirementComparisonChart input={input} result={{ ...result, breakevenReturnRate: 0.08 }} matrix={matrix} />
    );
    expect(container.querySelector('[data-chart-label="breakeven"]')?.getAttribute("text-anchor")).toBe("end");

    rerender(
      <RetirementComparisonChart input={input} result={{ ...result, breakevenReturnRate: 0 }} matrix={matrix} />
    );
    expect(container.querySelector('[data-chart-label="breakeven"]')?.getAttribute("text-anchor")).toBe("start");
  });
});
