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
