// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
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

describe("ShareSection — 고급 임금 설정 공유 옵트인", () => {
  it("(share-constant) CONSTANT_GROWTH — 고급 설정 옵트인 미표시", () => {
    render(<ShareSection values={baseValues()} disabled={false} />);
    expect(screen.queryByText(ADVANCED_NOTICE)).toBeNull();
  });

  it("(share-yearly) YEARLY_CUSTOM — 기본 미선택 옵트인 표시", () => {
    render(
      <ShareSection
        values={baseValues({ salaryPathMode: "YEARLY_CUSTOM" })}
        disabled={false}
      />
    );
    expect(screen.getByText(ADVANCED_NOTICE)).toBeTruthy();
    expect(
      screen
        .getByRole("checkbox", { name: "고급 임금 설정도 공유 링크에 포함" })
        .matches(":checked")
    ).toBe(false);
  });

  it("(share-wagepeak) WAGE_PEAK — 고급 설정 옵트인 표시", () => {
    render(
      <ShareSection
        values={baseValues({ salaryPathMode: "WAGE_PEAK" })}
        disabled={false}
      />
    );
    expect(screen.getByText(ADVANCED_NOTICE)).toBeTruthy();
  });

  it("(share-average) 평균임금 직접 입력만 있어도 옵트인 표시", () => {
    render(
      <ShareSection
        values={baseValues({ dbAverageSalary: "90,000,000" })}
        disabled={false}
      />
    );

    expect(
      screen
        .getByRole("checkbox", { name: "고급 임금 설정도 공유 링크에 포함" })
        .matches(":checked")
    ).toBe(false);
  });

  it("(share-change) 포함 승인 후 고급 값 변경 → 다시 미선택", () => {
    const initialValues = baseValues({
      salaryPathMode: "YEARLY_CUSTOM",
      yearlySalaries: ["82,400,000", "84,872,000"],
    });
    const { rerender } = render(<ShareSection values={initialValues} disabled={false} />);
    const checkbox = screen.getByRole("checkbox", {
      name: "고급 임금 설정도 공유 링크에 포함",
    });
    fireEvent.click(checkbox);
    expect(checkbox.matches(":checked")).toBe(true);

    rerender(
      <ShareSection
        values={{ ...initialValues, yearlySalaries: ["83,000,000", "84,872,000"] }}
        disabled={false}
      />
    );

    expect(
      screen
        .getByRole("checkbox", { name: "고급 임금 설정도 공유 링크에 포함" })
        .matches(":checked")
    ).toBe(false);
  });
});
