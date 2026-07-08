import { SimulationInput } from "@/src/calculator/types";
import { SalaryPathConfig } from "@/src/calculator/salary-path";
import { SimulatorFormValues, FieldErrors } from "../types";
import { parseKRWInput, parsePercentInput } from "./formatters";

export function validateForm(values: SimulatorFormValues): {
  errors: FieldErrors;
  input: SimulationInput | null;
  volatility: number | null;
  inflationRate: number | null;
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

  const dcVolatility = parsePercentInput(values.dcVolatility);
  if (dcVolatility === null || dcVolatility < 0 || dcVolatility > 0.6) {
    errors.dcVolatility = "연간 변동성은 0%에서 60% 사이로 입력해주세요.";
  }

  const remainingYears = remainingServiceYears ?? 0;

  if (values.salaryPathMode === "WAGE_PEAK") {
    const peakStartYearRaw = parseKRWInput(values.peakStartYear);
    if (
      peakStartYearRaw === null ||
      !Number.isInteger(peakStartYearRaw) ||
      peakStartYearRaw < 1 ||
      peakStartYearRaw > remainingYears
    ) {
      errors.peakStartYear =
        "피크 시작 연차는 1년차부터 남은 근속연수 이내의 정수로 입력해주세요.";
    }
    const peakCutRateRaw = parsePercentInput(values.peakCutRate);
    if (peakCutRateRaw === null || peakCutRateRaw < 0 || peakCutRateRaw > 0.5) {
      errors.peakCutRate = "감액률은 0%에서 50% 사이로 입력해주세요.";
    }
    const peakPostGrowthRateRaw = parsePercentInput(values.peakPostGrowthRate);
    if (
      peakPostGrowthRateRaw === null ||
      peakPostGrowthRateRaw < -0.1 ||
      peakPostGrowthRateRaw > 0.2
    ) {
      errors.peakPostGrowthRate = "피크 이후 상승률은 -10%에서 20% 사이로 입력해주세요.";
    }
  }

  if (values.salaryPathMode === "STEP_UP") {
    const stepUpYearRaw = parseKRWInput(values.stepUpYear);
    if (
      stepUpYearRaw === null ||
      !Number.isInteger(stepUpYearRaw) ||
      stepUpYearRaw < 1 ||
      stepUpYearRaw > remainingYears
    ) {
      errors.stepUpYear =
        "점프 연차는 1년차부터 남은 근속연수 이내의 정수로 입력해주세요.";
    }
    const stepUpRateRaw = parsePercentInput(values.stepUpRate);
    if (stepUpRateRaw === null || stepUpRateRaw < 0 || stepUpRateRaw > 1.0) {
      errors.stepUpRate = "추가 인상률은 0%에서 100% 사이로 입력해주세요.";
    }
  }

  if (values.salaryPathMode === "YEARLY_CUSTOM") {
    const n = remainingYears;
    const arr = values.yearlySalaries;
    if (arr.length !== n) {
      errors.yearlySalaries = `남은 근속연수(${n})개의 연도별 연봉을 입력해주세요. (현재 ${arr.length}개)`;
    } else {
      const bad: string[] = [];
      arr.forEach((raw, i) => {
        const v = parseKRWInput(raw);
        if (v === null) {
          bad.push(`${i + 1}년차`);
        } else if (v <= 0) {
          bad.push(`${i + 1}년차(0 이하)`);
        } else if (v > 1e12) {
          bad.push(`${i + 1}년차(과다)`);
        }
      });
      if (bad.length > 0) {
        const head = bad.slice(0, 5).join(", ");
        const tail = bad.length > 5 ? ` 외 ${bad.length - 5}개` : "";
        errors.yearlySalaries = `연도별 연봉을 확인해주세요: ${head}${tail}`;
      }
    }
  }

  let dbAverageSalaryOverride: number | undefined = undefined;
  if ((values.dbAverageSalary ?? "").trim() !== "") {
    const parsed = parseKRWInput(values.dbAverageSalary);
    if (parsed === null || parsed <= 0) {
      errors.dbAverageSalary = "평균임금은 0보다 큰 금액으로 입력해주세요.";
    } else {
      dbAverageSalaryOverride = parsed;
    }
  }

  let inflationRate: number | null = null;
  if (values.showPresentValue) {
    inflationRate = parsePercentInput(values.inflationRate);
    if (inflationRate === null || inflationRate < 0 || inflationRate > 0.1) {
      errors.inflationRate = "물가상승률은 0%에서 10% 사이로 입력해주세요.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors, input: null, volatility: null, inflationRate: null };
  }

  let salaryPathConfig: SalaryPathConfig | undefined = undefined;
  if (values.salaryPathMode === "WAGE_PEAK") {
    salaryPathConfig = {
      mode: "WAGE_PEAK",
      wagePeak: {
        peakStartYear: parseKRWInput(values.peakStartYear)!,
        cutRate: parsePercentInput(values.peakCutRate)!,
        postPeakGrowthRate: parsePercentInput(values.peakPostGrowthRate)!,
      },
    };
  } else if (values.salaryPathMode === "STEP_UP") {
    salaryPathConfig = {
      mode: "STEP_UP",
      stepUps: [
        {
          yearIndex: parseKRWInput(values.stepUpYear)!,
          extraRaiseRate: parsePercentInput(values.stepUpRate)!,
        },
      ],
    };
  } else if (values.salaryPathMode === "YEARLY_CUSTOM") {
    // type guard로 null 제거 후 number[] 구성 (위 validation 통과 전제)
    const nums = values.yearlySalaries
      .map(parseKRWInput)
      .filter((x): x is number => x !== null && x > 0 && x <= 1e12);
    salaryPathConfig = { mode: "YEARLY_CUSTOM", yearlySalaries: nums };
  }

  const input: SimulationInput = {
    currentSalary: currentSalary!,
    currentServiceYears: currentServiceYears!,
    remainingServiceYears: remainingServiceYears!,
    wageGrowthRate: wageGrowthRate!,
    dcReturnRate: dcReturnRate!,
    conversionType: values.conversionMethod,
    customTransferAmount,
    ...(salaryPathConfig !== undefined ? { salaryPathConfig } : {}),
    ...(dbAverageSalaryOverride !== undefined ? { dbAverageSalaryOverride } : {}),
  };

  return { errors: {}, input, volatility: dcVolatility!, inflationRate };
}
