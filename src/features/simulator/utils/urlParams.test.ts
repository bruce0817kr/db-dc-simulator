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

describe("고급 임금 설정 옵트인", () => {
  it("고급 설정이 있어도 기본 공유에는 포함하지 않음", () => {
    const values: SimulatorFormValues = {
      ...BASE_VALUES,
      salaryPathMode: "YEARLY_CUSTOM",
      yearlySalaries: ["82,400,000", "84,872,000"],
      dbAverageSalary: "90,000,000",
      remainingYearsOfService: "2",
    };

    const url = buildShareUrl(values, "https://example.com");

    expect(url).not.toContain("advanced=");
    expect(url).not.toContain("salaryMode=");
    expect(url).not.toContain("salaries=");
    expect(url).not.toContain("dbAverageSalary=");
  });

  it("YEARLY_CUSTOM 옵트인 → 연도별 연봉과 평균임금 왕복", () => {
    const values: SimulatorFormValues = {
      ...BASE_VALUES,
      salaryPathMode: "YEARLY_CUSTOM",
      yearlySalaries: ["82,400,000", "84,872,000"],
      dbAverageSalary: "90,000,000",
      remainingYearsOfService: "2",
    };

    const url = buildShareUrl(values, "https://example.com", { includeAdvanced: true });
    const parsed = parseSearchToFormValues(new URL(url).search);

    expect(parsed.salaryPathMode).toBe("YEARLY_CUSTOM");
    expect(parsed.yearlySalaries).toEqual(["82,400,000", "84,872,000"]);
    expect(parsed.dbAverageSalary).toBe("90,000,000");
  });

  it("WAGE_PEAK과 STEP_UP은 각 모드에 필요한 값만 왕복", () => {
    const wagePeak = buildShareUrl(
      {
        ...BASE_VALUES,
        salaryPathMode: "WAGE_PEAK",
        peakStartYear: "7",
        peakCutRate: "20",
        peakPostGrowthRate: "0",
        stepUpYear: "5",
        stepUpRate: "10",
      },
      "https://example.com",
      { includeAdvanced: true }
    );
    const stepUp = buildShareUrl(
      {
        ...BASE_VALUES,
        salaryPathMode: "STEP_UP",
        peakStartYear: "7",
        peakCutRate: "20",
        peakPostGrowthRate: "0",
        stepUpYear: "5",
        stepUpRate: "10",
      },
      "https://example.com",
      { includeAdvanced: true }
    );

    expect(wagePeak).toContain("peakStart=7");
    expect(wagePeak).not.toContain("stepUpYear=");
    expect(parseSearchToFormValues(new URL(wagePeak).search)).toMatchObject({
      salaryPathMode: "WAGE_PEAK",
      peakStartYear: "7",
      peakCutRate: "20",
      peakPostGrowthRate: "0",
    });
    expect(stepUp).toContain("stepUpYear=5");
    expect(stepUp).not.toContain("peakStart=");
    expect(parseSearchToFormValues(new URL(stepUp).search)).toMatchObject({
      salaryPathMode: "STEP_UP",
      stepUpYear: "5",
      stepUpRate: "10",
    });
  });

  it("advanced=1 없는 고급 파라미터는 복원하지 않음", () => {
    const parsed = parseSearchToFormValues(
      "?salaryMode=YEARLY_CUSTOM&salaries=82400000%2C84872000&dbAverageSalary=90000000"
    );

    expect(parsed.salaryPathMode).toBeUndefined();
    expect(parsed.yearlySalaries).toBeUndefined();
    expect(parsed.dbAverageSalary).toBeUndefined();
  });

  it("필수 필드가 없거나 손상된 고급 모드는 전체를 무시", () => {
    const cases = [
      "?remainingYears=2&advanced=1&salaryMode=YEARLY_CUSTOM&salaries=82400000,,84872000",
      "?remainingYears=2&advanced=1&salaryMode=YEARLY_CUSTOM&salaries=82400000,0",
      "?remainingYears=2&advanced=1&salaryMode=YEARLY_CUSTOM&salaries=82400000",
      "?remainingYears=2&advanced=1&salaryMode=WAGE_PEAK&peakStart=1&peakCut=20",
      "?remainingYears=2&advanced=1&salaryMode=STEP_UP&stepUpYear=1",
    ];

    for (const search of cases) {
      const parsed = parseSearchToFormValues(search);
      expect(parsed.salaryPathMode).toBeUndefined();
      expect(parsed.yearlySalaries).toBeUndefined();
    }
  });

  it("80년 초과 remainingYears와 salaries 목록은 복원하지 않음", () => {
    const salaries = Array.from({ length: 81 }, () => "82400000").join(",");
    const parsed = parseSearchToFormValues(
      `?remainingYears=81&advanced=1&salaryMode=YEARLY_CUSTOM&salaries=${salaries}`
    );

    expect(parsed.remainingYearsOfService).toBeUndefined();
    expect(parsed.salaryPathMode).toBeUndefined();
    expect(parsed.yearlySalaries).toBeUndefined();
  });

  it("8KB 초과 query는 전체를 무시", () => {
    const parsed = parseSearchToFormValues(`?salary=80000000&padding=${"x".repeat(8_192)}`);

    expect(parsed).toEqual({});
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
