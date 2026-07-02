import { SimulationInput } from "@/src/calculator/types";
import { SimulatorFormValues, FieldErrors } from "../types";
import { parseKRWInput, parsePercentInput } from "./formatters";

export function validateForm(values: SimulatorFormValues): {
  errors: FieldErrors;
  input: SimulationInput | null;
} {
  const errors: FieldErrors = {};

  const currentSalary = parseKRWInput(values.currentSalary);
  if (currentSalary === null || currentSalary <= 0) {
    errors.currentSalary = "현재 연봉을 0보다 큰 금액으로 입력해주세요.";
  }

  const currentServiceYears = parseKRWInput(values.currentYearsOfService);
  if (
    currentServiceYears === null ||
    currentServiceYears < 0 ||
    !Number.isInteger(currentServiceYears)
  ) {
    errors.currentYearsOfService = "현재 근속연수는 0년 이상의 정수로 입력해주세요.";
  }

  const remainingServiceYears = parseKRWInput(values.remainingYearsOfService);
  if (
    remainingServiceYears === null ||
    remainingServiceYears <= 0 ||
    !Number.isInteger(remainingServiceYears)
  ) {
    errors.remainingYearsOfService = "남은 근속연수는 1년 이상의 정수로 입력해주세요.";
  }

  const wageGrowthRate = parsePercentInput(values.salaryGrowthRate);
  if (wageGrowthRate === null || wageGrowthRate < -0.1 || wageGrowthRate > 0.2) {
    errors.salaryGrowthRate = "임금상승률은 -10%에서 20% 사이로 입력해주세요.";
  }

  const dcReturnRate = parsePercentInput(values.dcReturnRate);
  if (dcReturnRate === null || dcReturnRate < -0.5 || dcReturnRate > 0.5) {
    errors.dcReturnRate = "DC 운용수익률은 -50%에서 50% 사이로 입력해주세요.";
  }

  let customTransferAmount: number | undefined = undefined;
  if (values.conversionMethod === "CUSTOM_TRANSFER_AMOUNT") {
    const parsed = parseKRWInput(values.customTransferAmount);
    if (parsed === null || parsed < 0) {
      errors.customTransferAmount = "전환 정산금을 0원 이상으로 입력해주세요.";
    } else {
      customTransferAmount = parsed;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors, input: null };
  }

  const input: SimulationInput = {
    currentSalary: currentSalary!,
    currentServiceYears: currentServiceYears!,
    remainingServiceYears: remainingServiceYears!,
    wageGrowthRate: wageGrowthRate!,
    dcReturnRate: dcReturnRate!,
    conversionType: values.conversionMethod,
    customTransferAmount,
  };

  return { errors: {}, input };
}
