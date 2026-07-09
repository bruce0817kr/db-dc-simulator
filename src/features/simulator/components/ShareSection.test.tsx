// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
afterEach(() => {
  cleanup();
});
import { ShareSection } from "./ShareSection";
import { SimulatorFormValues } from "../types";

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

const ADVANCED_NOTICE = /고급 임금 시나리오.*공유 링크에 포함되지 않습니다/;

describe("ShareSection — 고급 임금 시나리오 미포함 안내", () => {
  it("(share-constant) CONSTANT_GROWTH — 고급 설정 미포함 안내문 미표시", () => {
    render(<ShareSection values={baseValues()} disabled={false} />);
    expect(screen.queryByText(ADVANCED_NOTICE)).toBeNull();
  });

  it("(share-yearly) YEARLY_CUSTOM — 고급 설정 미포함 안내문 표시", () => {
    render(
      <ShareSection
        values={baseValues({ salaryPathMode: "YEARLY_CUSTOM" })}
        disabled={false}
      />
    );
    expect(screen.getByText(ADVANCED_NOTICE)).toBeTruthy();
  });

  it("(share-wagepeak) WAGE_PEAK — 고급 설정 미포함 안내문 표시", () => {
    render(
      <ShareSection
        values={baseValues({ salaryPathMode: "WAGE_PEAK" })}
        disabled={false}
      />
    );
    expect(screen.getByText(ADVANCED_NOTICE)).toBeTruthy();
  });
});
