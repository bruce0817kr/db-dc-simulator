import { ConversionType } from "@/src/calculator/types";

export const MAX_REMAINING_YEARS = 80;

export type SalaryPathModeUI = "CONSTANT_GROWTH" | "WAGE_PEAK" | "STEP_UP" | "YEARLY_CUSTOM";

export interface SimulatorFormValues {
  currentSalary: string;
  currentYearsOfService: string;
  remainingYearsOfService: string;
  salaryGrowthRate: string;
  dcReturnRate: string;
  dcVolatility: string;
  conversionMethod: ConversionType;
  customTransferAmount: string;
  portfolioPresetId: string;
  salaryPathMode: SalaryPathModeUI;
  peakStartYear: string;
  peakCutRate: string;
  peakPostGrowthRate: string;
  stepUpYear: string;
  stepUpRate: string;
  /** 연도별 직접 입력(YEARLY_CUSTOM) 표시용 KRW 문자열 배열. 빈 문자열 = 미입력. */
  yearlySalaries: string[];
  dbAverageSalary: string;
  showAfterTax: boolean;
  showPresentValue: boolean;
  inflationRate: string;
}

export type FieldErrors = Partial<Record<keyof SimulatorFormValues, string>>;
