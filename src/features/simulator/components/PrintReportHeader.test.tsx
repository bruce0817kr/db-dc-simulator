// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
afterEach(() => {
  cleanup();
});
import { PrintReportHeader } from "./PrintReportHeader";
import { SimulatorFormValues } from "../types";
import { SimulationInput } from "@/src/calculator/types";

const baseInput: SimulationInput = {
  currentSalary: 80000000,
  currentServiceYears: 10,
  remainingServiceYears: 15,
  wageGrowthRate: 0.03,
  dcReturnRate: 0.05,
  conversionType: "TRANSFER_ALL_TO_DC",
};

function baseValues(overrides: Partial<SimulatorFormValues> = {}): SimulatorFormValues {
  return {
    currentSalary: "80,000,000",
    currentYearsOfService: "10",
    remainingYearsOfService: "15",
    salaryGrowthRate: "3",
    dcReturnRate: "5",
    dcVolatility: "12",
    conversionMethod: "TRANSFER_ALL_TO_DC",
    customTransferAmount: "",
    portfolioPresetId: "CUSTOM",
    salaryPathMode: "CONSTANT_GROWTH",
    peakStartYear: "",
    peakCutRate: "",
    peakPostGrowthRate: "0",
    stepUpYear: "",
    stepUpRate: "",
    yearlySalaries: [],
    dbAverageSalary: "",
    showAfterTax: false,
    showPresentValue: false,
    inflationRate: "2",
    ...overrides,
  };
}

describe("PrintReportHeader — 임금 경로 설정 라벨", () => {
  it("(print-yearly) YEARLY_CUSTOM — 요약줄(n년치 + 첫/마지막 연봉) 렌더", () => {
    render(
      <PrintReportHeader
        values={baseValues({
          salaryPathMode: "YEARLY_CUSTOM",
          yearlySalaries: ["82,400,000", "84,872,000"],
        })}
        input={{ ...baseInput, remainingServiceYears: 2 }}
        generatedAt="2026-07-09 09:00"
      />
    );

    expect(screen.getByText(/연도별 직접 입력 — 2년치/)).toBeTruthy();
    expect(screen.getByText(/첫 82,400,000원/)).toBeTruthy();
    expect(screen.getByText(/마지막 84,872,000원/)).toBeTruthy();
  });

  it("(print-yearly-single) YEARLY_CUSTOM n=1 — 첫=마지막 동일값 요약", () => {
    render(
      <PrintReportHeader
        values={baseValues({
          salaryPathMode: "YEARLY_CUSTOM",
          yearlySalaries: ["82,400,000"],
        })}
        input={{ ...baseInput, remainingServiceYears: 1 }}
        generatedAt={null}
      />
    );

    const cell = screen.getByText(/연도별 직접 입력 — 1년치/);
    expect(cell.textContent).toContain("첫 82,400,000원");
    expect(cell.textContent).toContain("마지막 82,400,000원");
  });

  it("(print-stepup) STEP_UP 라벨이 폼 드롭다운과 일치(승진·호봉 점프)", () => {
    render(
      <PrintReportHeader
        values={baseValues({
          salaryPathMode: "STEP_UP",
          stepUpYear: "5",
          stepUpRate: "10",
        })}
        input={baseInput}
        generatedAt={null}
      />
    );

    expect(screen.getByText(/승진·호봉 점프 — 5년차 이후 10% 상승/)).toBeTruthy();
    // 구 라벨 미존재 확인
    expect(screen.queryByText(/단계별 상승/)).toBeNull();
  });

  it("(print-constant) CONSTANT_GROWTH — 기본 라벨 유지(회귀)", () => {
    render(
      <PrintReportHeader
        values={baseValues()}
        input={baseInput}
        generatedAt={null}
      />
    );

    expect(screen.getByText("기본 (일정 상승)")).toBeTruthy();
  });
});
