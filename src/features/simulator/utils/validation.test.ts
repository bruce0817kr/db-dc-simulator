import { describe, it, expect } from "vitest";
import { validateForm } from "./validation";
import { SimulatorFormValues } from "../types";

const valid: SimulatorFormValues = {
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
};

describe("validateForm", () => {
  it("all valid → input not null, no errors", () => {
    const { errors, input } = validateForm(valid);
    expect(input).not.toBeNull();
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("field name mapping: currentYearsOfService → currentServiceYears", () => {
    const { input } = validateForm(valid);
    expect(input?.currentServiceYears).toBe(10);
  });

  it("field name mapping: salaryGrowthRate → wageGrowthRate (decimal)", () => {
    const { input } = validateForm(valid);
    expect(input?.wageGrowthRate).toBeCloseTo(0.03);
  });

  it("field name mapping: remainingYearsOfService → remainingServiceYears", () => {
    const { input } = validateForm(valid);
    expect(input?.remainingServiceYears).toBe(15);
  });

  it("field name mapping: dcReturnRate → dcReturnRate (decimal)", () => {
    const { input } = validateForm(valid);
    expect(input?.dcReturnRate).toBeCloseTo(0.05);
  });

  it("currentSalary = 0 → error", () => {
    const { errors } = validateForm({ ...valid, currentSalary: "0" });
    expect(errors.currentSalary).toBe("현재 연봉을 0보다 큰 금액으로 입력해주세요.");
  });

  it("currentSalary empty → error", () => {
    const { errors } = validateForm({ ...valid, currentSalary: "" });
    expect(errors.currentSalary).toBe("현재 연봉을 0보다 큰 금액으로 입력해주세요.");
  });

  it("currentYearsOfService = 0 → valid (boundary)", () => {
    const { errors, input } = validateForm({ ...valid, currentYearsOfService: "0" });
    expect(errors.currentYearsOfService).toBeUndefined();
    expect(input?.currentServiceYears).toBe(0);
  });

  it("currentYearsOfService = -1 → error", () => {
    const { errors } = validateForm({ ...valid, currentYearsOfService: "-1" });
    expect(errors.currentYearsOfService).toBe(
      "현재 근속연수는 0년 이상의 정수로 입력해주세요."
    );
  });

  it("currentYearsOfService = 10.5 (decimal) → error", () => {
    const { errors } = validateForm({ ...valid, currentYearsOfService: "10.5" });
    expect(errors.currentYearsOfService).toBe(
      "현재 근속연수는 0년 이상의 정수로 입력해주세요."
    );
  });

  it("remainingYearsOfService = 0 → error", () => {
    const { errors } = validateForm({ ...valid, remainingYearsOfService: "0" });
    expect(errors.remainingYearsOfService).toBe(
      "남은 근속연수는 1년 이상의 정수로 입력해주세요."
    );
  });

  it("remainingYearsOfService = 15.5 (decimal) → error", () => {
    const { errors } = validateForm({ ...valid, remainingYearsOfService: "15.5" });
    expect(errors.remainingYearsOfService).toBe(
      "남은 근속연수는 1년 이상의 정수로 입력해주세요."
    );
  });

  it("remainingYearsOfService = 1 → valid (boundary)", () => {
    const { errors } = validateForm({ ...valid, remainingYearsOfService: "1" });
    expect(errors.remainingYearsOfService).toBeUndefined();
  });

  it("salaryGrowthRate = -10 (boundary) → valid", () => {
    const { errors } = validateForm({ ...valid, salaryGrowthRate: "-10" });
    expect(errors.salaryGrowthRate).toBeUndefined();
  });

  it("salaryGrowthRate = 20 (boundary) → valid", () => {
    const { errors } = validateForm({ ...valid, salaryGrowthRate: "20" });
    expect(errors.salaryGrowthRate).toBeUndefined();
  });

  it("salaryGrowthRate = 21 → error", () => {
    const { errors } = validateForm({ ...valid, salaryGrowthRate: "21" });
    expect(errors.salaryGrowthRate).toBe("임금상승률은 -10%에서 20% 사이로 입력해주세요.");
  });

  it("dcReturnRate = -50 (boundary) → valid", () => {
    const { errors } = validateForm({ ...valid, dcReturnRate: "-50" });
    expect(errors.dcReturnRate).toBeUndefined();
  });

  it("dcReturnRate = 50 (boundary) → valid", () => {
    const { errors } = validateForm({ ...valid, dcReturnRate: "50" });
    expect(errors.dcReturnRate).toBeUndefined();
  });

  it("dcReturnRate = 51 → error", () => {
    const { errors } = validateForm({ ...valid, dcReturnRate: "51" });
    expect(errors.dcReturnRate).toBe("DC 운용수익률은 -50%에서 50% 사이로 입력해주세요.");
  });

  it("CUSTOM: customTransferAmount empty → error", () => {
    const { errors } = validateForm({
      ...valid,
      conversionMethod: "CUSTOM_TRANSFER_AMOUNT",
      customTransferAmount: "",
    });
    expect(errors.customTransferAmount).toBe("전환 정산금을 0원 이상으로 입력해주세요.");
  });

  it("CUSTOM: customTransferAmount = 0 → valid (boundary)", () => {
    const { errors, input } = validateForm({
      ...valid,
      conversionMethod: "CUSTOM_TRANSFER_AMOUNT",
      customTransferAmount: "0",
    });
    expect(errors.customTransferAmount).toBeUndefined();
    expect(input?.customTransferAmount).toBe(0);
  });

  it("CUSTOM: customTransferAmount = -1 → error", () => {
    const { errors } = validateForm({
      ...valid,
      conversionMethod: "CUSTOM_TRANSFER_AMOUNT",
      customTransferAmount: "-1",
    });
    expect(errors.customTransferAmount).toBe("전환 정산금을 0원 이상으로 입력해주세요.");
  });

  it("TRANSFER_ALL_TO_DC: customTransferAmount not validated", () => {
    const { errors } = validateForm({
      ...valid,
      conversionMethod: "TRANSFER_ALL_TO_DC",
      customTransferAmount: "",
    });
    expect(errors.customTransferAmount).toBeUndefined();
  });

  it("any invalid field → input is null", () => {
    const { input } = validateForm({ ...valid, currentSalary: "" });
    expect(input).toBeNull();
  });
});

const advValid: SimulatorFormValues = {
  ...valid,
  salaryPathMode: "CONSTANT_GROWTH",
  peakStartYear: "",
  peakCutRate: "",
  peakPostGrowthRate: "0",
  stepUpYear: "",
  stepUpRate: "",
  dbAverageSalary: "",
};

describe("validateForm — advanced salary fields", () => {
  it("CONSTANT_GROWTH + 빈 고급 필드 → input valid, salaryPathConfig undefined", () => {
    const { errors, input } = validateForm(advValid);
    expect(Object.keys(errors)).toHaveLength(0);
    expect(input).not.toBeNull();
    expect(input?.salaryPathConfig).toBeUndefined();
    expect(input?.dbAverageSalaryOverride).toBeUndefined();
  });

  it("WAGE_PEAK 모드: peakStartYear 빈값 → 에러", () => {
    const { errors } = validateForm({
      ...advValid,
      salaryPathMode: "WAGE_PEAK",
      peakStartYear: "",
      peakCutRate: "20",
      peakPostGrowthRate: "0",
    });
    expect(errors.peakStartYear).toBe(
      "피크 시작 연차는 1년차부터 남은 근속연수 이내의 정수로 입력해주세요."
    );
  });

  it("WAGE_PEAK 모드: peakStartYear > remainingYears → 에러", () => {
    const { errors } = validateForm({
      ...advValid,
      salaryPathMode: "WAGE_PEAK",
      peakStartYear: "16",
      peakCutRate: "20",
      peakPostGrowthRate: "0",
    });
    expect(errors.peakStartYear).toBe(
      "피크 시작 연차는 1년차부터 남은 근속연수 이내의 정수로 입력해주세요."
    );
  });

  it("WAGE_PEAK 모드: peakStartYear 소수점 → 에러", () => {
    const { errors } = validateForm({
      ...advValid,
      salaryPathMode: "WAGE_PEAK",
      peakStartYear: "3.5",
      peakCutRate: "20",
      peakPostGrowthRate: "0",
    });
    expect(errors.peakStartYear).toBe(
      "피크 시작 연차는 1년차부터 남은 근속연수 이내의 정수로 입력해주세요."
    );
  });

  it("WAGE_PEAK 모드: peakCutRate 51% → 에러", () => {
    const { errors } = validateForm({
      ...advValid,
      salaryPathMode: "WAGE_PEAK",
      peakStartYear: "5",
      peakCutRate: "51",
      peakPostGrowthRate: "0",
    });
    expect(errors.peakCutRate).toBe("감액률은 0%에서 50% 사이로 입력해주세요.");
  });

  it("WAGE_PEAK 모드: peakPostGrowthRate -11% → 에러", () => {
    const { errors } = validateForm({
      ...advValid,
      salaryPathMode: "WAGE_PEAK",
      peakStartYear: "5",
      peakCutRate: "20",
      peakPostGrowthRate: "-11",
    });
    expect(errors.peakPostGrowthRate).toBe(
      "피크 이후 상승률은 -10%에서 20% 사이로 입력해주세요."
    );
  });

  it("WAGE_PEAK 모드: 유효값 → salaryPathConfig wagePeak 조립", () => {
    const { errors, input } = validateForm({
      ...advValid,
      salaryPathMode: "WAGE_PEAK",
      peakStartYear: "5",
      peakCutRate: "20",
      peakPostGrowthRate: "0",
    });
    expect(Object.keys(errors)).toHaveLength(0);
    expect(input?.salaryPathConfig?.mode).toBe("WAGE_PEAK");
    expect(input?.salaryPathConfig?.wagePeak?.peakStartYear).toBe(5);
    expect(input?.salaryPathConfig?.wagePeak?.cutRate).toBeCloseTo(0.2);
    expect(input?.salaryPathConfig?.wagePeak?.postPeakGrowthRate).toBeCloseTo(0);
  });

  it("STEP_UP 모드: stepUpYear 빈값 → 에러", () => {
    const { errors } = validateForm({
      ...advValid,
      salaryPathMode: "STEP_UP",
      stepUpYear: "",
      stepUpRate: "10",
    });
    expect(errors.stepUpYear).toBe(
      "점프 연차는 1년차부터 남은 근속연수 이내의 정수로 입력해주세요."
    );
  });

  it("STEP_UP 모드: stepUpRate 101% → 에러", () => {
    const { errors } = validateForm({
      ...advValid,
      salaryPathMode: "STEP_UP",
      stepUpYear: "5",
      stepUpRate: "101",
    });
    expect(errors.stepUpRate).toBe("추가 인상률은 0%에서 100% 사이로 입력해주세요.");
  });

  it("STEP_UP 모드: 유효값 → salaryPathConfig stepUps 조립", () => {
    const { errors, input } = validateForm({
      ...advValid,
      salaryPathMode: "STEP_UP",
      stepUpYear: "5",
      stepUpRate: "10",
    });
    expect(Object.keys(errors)).toHaveLength(0);
    expect(input?.salaryPathConfig?.mode).toBe("STEP_UP");
    expect(input?.salaryPathConfig?.stepUps?.[0]?.yearIndex).toBe(5);
    expect(input?.salaryPathConfig?.stepUps?.[0]?.extraRaiseRate).toBeCloseTo(0.1);
  });

  it("dbAverageSalary 빈 값 → 통과, override undefined", () => {
    const { errors, input } = validateForm({ ...advValid, dbAverageSalary: "" });
    expect(errors.dbAverageSalary).toBeUndefined();
    expect(input?.dbAverageSalaryOverride).toBeUndefined();
  });

  it("dbAverageSalary 유효값 → dbAverageSalaryOverride 포함", () => {
    const { errors, input } = validateForm({
      ...advValid,
      dbAverageSalary: "9,000,000",
    });
    expect(errors.dbAverageSalary).toBeUndefined();
    expect(input?.dbAverageSalaryOverride).toBe(9000000);
  });

  it("dbAverageSalary 0 → 에러", () => {
    const { errors } = validateForm({ ...advValid, dbAverageSalary: "0" });
    expect(errors.dbAverageSalary).toBe("평균임금은 0보다 큰 금액으로 입력해주세요.");
  });

  it("dbAverageSalary 음수 → 에러", () => {
    const { errors } = validateForm({ ...advValid, dbAverageSalary: "-1000" });
    expect(errors.dbAverageSalary).toBe("평균임금은 0보다 큰 금액으로 입력해주세요.");
  });
});
