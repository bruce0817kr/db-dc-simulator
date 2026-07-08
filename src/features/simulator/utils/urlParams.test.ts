// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildShareUrl, parseSearchToFormValues } from "./urlParams";
import { SimulatorFormValues } from "../types";

const BASE_VALUES: SimulatorFormValues = {
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
  dbAverageSalary: "",
  showAfterTax: false,
  showPresentValue: false,
  inflationRate: "2",
  yearlySalaries: [],
};

describe("buildShareUrl / parseSearchToFormValues 왕복", () => {
  it("기본값 왕복 — salary/years/rates/method 모두 복원", () => {
    const url = buildShareUrl(BASE_VALUES, "https://example.com");
    const search = "?" + url.split("?")[1];
    const parsed = parseSearchToFormValues(search);

    expect(parsed.currentSalary).toBe("80,000,000");
    expect(parsed.currentYearsOfService).toBe("10");
    expect(parsed.remainingYearsOfService).toBe("15");
    expect(parsed.salaryGrowthRate).toBe("3");
    expect(parsed.dcReturnRate).toBe("5");
    expect(parsed.conversionMethod).toBe("TRANSFER_ALL_TO_DC");
  });

  it("CUSTOM_TRANSFER_AMOUNT 왕복 — customTransfer 포함", () => {
    const values: SimulatorFormValues = {
      ...BASE_VALUES,
      conversionMethod: "CUSTOM_TRANSFER_AMOUNT",
      customTransferAmount: "50,000,000",
    };
    const url = buildShareUrl(values, "https://example.com");
    const search = "?" + url.split("?")[1];
    const parsed = parseSearchToFormValues(search);

    expect(parsed.conversionMethod).toBe("CUSTOM_TRANSFER_AMOUNT");
    expect(parsed.customTransferAmount).toBe("50,000,000");
  });

  it("TRANSFER_ALL_TO_DC일 때 customTransfer 직렬화 안 됨", () => {
    const values: SimulatorFormValues = {
      ...BASE_VALUES,
      conversionMethod: "TRANSFER_ALL_TO_DC",
      customTransferAmount: "50,000,000",
    };
    const url = buildShareUrl(values, "https://example.com");
    expect(url).not.toContain("customTransfer");
  });
});

describe("parseSearchToFormValues — 무효값 처리", () => {
  it("salary=abc → salary 제외, dcReturn 유지", () => {
    const parsed = parseSearchToFormValues("?salary=abc&dcReturn=5");
    expect(parsed.currentSalary).toBeUndefined();
    expect(parsed.dcReturnRate).toBe("5");
  });

  it("method whitelist 위반 → method 제외", () => {
    const parsed = parseSearchToFormValues("?method=INVALID&salary=80000000");
    expect(parsed.conversionMethod).toBeUndefined();
    expect(parsed.currentSalary).toBe("80,000,000");
  });

  it("빈 search → 빈 객체", () => {
    const parsed = parseSearchToFormValues("");
    expect(Object.keys(parsed).length).toBe(0);
  });

  it("각 숫자 필드 개별 무효값 → 해당 필드만 제외", () => {
    const parsed = parseSearchToFormValues(
      "?currentYears=abc&remainingYears=15&salaryGrowth=NaN&dcReturn=7"
    );
    expect(parsed.currentYearsOfService).toBeUndefined();
    expect(parsed.remainingYearsOfService).toBe("15");
    expect(parsed.salaryGrowthRate).toBeUndefined();
    expect(parsed.dcReturnRate).toBe("7");
  });
});

describe("buildShareUrl URL 구조", () => {
  it("origin과 /? 포함", () => {
    const url = buildShareUrl(BASE_VALUES, "https://example.com");
    expect(url.startsWith("https://example.com/?")).toBe(true);
  });

  it("salary는 콤마 없는 정수로 직렬화", () => {
    const url = buildShareUrl(BASE_VALUES, "https://example.com");
    expect(url).toContain("salary=80000000");
  });
});

describe("volatility 왕복", () => {
  it("dcVolatility '12' 직렬화 후 복원", () => {
    const url = buildShareUrl(BASE_VALUES, "https://example.com");
    expect(url).toContain("volatility=12");
    const search = "?" + url.split("?")[1];
    const parsed = parseSearchToFormValues(search);
    expect(parsed.dcVolatility).toBe("12");
  });

  it("dcVolatility '20' 왕복", () => {
    const values: SimulatorFormValues = { ...BASE_VALUES, dcVolatility: "20" };
    const url = buildShareUrl(values, "https://example.com");
    const search = "?" + url.split("?")[1];
    const parsed = parseSearchToFormValues(search);
    expect(parsed.dcVolatility).toBe("20");
  });

  it("volatility=abc → dcVolatility 제외", () => {
    const parsed = parseSearchToFormValues("?volatility=abc");
    expect(parsed.dcVolatility).toBeUndefined();
  });
});
