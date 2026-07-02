import { salaryAtYear } from "./salary";

export type SalaryPathMode = "CONSTANT_GROWTH" | "WAGE_PEAK" | "STEP_UP" | "YEARLY_CUSTOM";

export interface SalaryPathConfig {
  mode: SalaryPathMode;
  wagePeak?: { peakStartYear: number; cutRate: number; postPeakGrowthRate: number };
  stepUps?: { yearIndex: number; extraRaiseRate: number }[];
  yearlySalaries?: number[];
}

export function buildSalaryPath(
  currentSalary: number,
  wageGrowthRate: number,
  remainingYears: number,
  config?: SalaryPathConfig
): number[] {
  const mode = config?.mode ?? "CONSTANT_GROWTH";

  if (mode === "CONSTANT_GROWTH" || config === undefined) {
    const path: number[] = [];
    for (let t = 1; t <= remainingYears; t++) {
      path.push(salaryAtYear(currentSalary, wageGrowthRate, t));
    }
    return path;
  }

  if (mode === "WAGE_PEAK") {
    const { peakStartYear, cutRate, postPeakGrowthRate } = config.wagePeak!;
    const path: number[] = [];
    for (let t = 1; t <= remainingYears; t++) {
      if (t < peakStartYear) {
        path.push(salaryAtYear(currentSalary, wageGrowthRate, t));
      } else if (t === peakStartYear) {
        const prevSalary = peakStartYear === 1
          ? currentSalary
          : salaryAtYear(currentSalary, wageGrowthRate, peakStartYear - 1);
        path.push(prevSalary * (1 - cutRate));
      } else {
        const yearsAfterPeak = t - peakStartYear;
        const peakYearSalary = peakStartYear === 1
          ? currentSalary * (1 - cutRate)
          : salaryAtYear(currentSalary, wageGrowthRate, peakStartYear - 1) * (1 - cutRate);
        path.push(peakYearSalary * Math.pow(1 + postPeakGrowthRate, yearsAfterPeak));
      }
    }
    return path;
  }

  if (mode === "STEP_UP") {
    const stepUps = config.stepUps ?? [];
    const path: number[] = [];
    let cumulativeExtra = 1;
    for (let t = 1; t <= remainingYears; t++) {
      for (const su of stepUps) {
        if (su.yearIndex === t) {
          cumulativeExtra *= 1 + su.extraRaiseRate;
        }
      }
      path.push(salaryAtYear(currentSalary, wageGrowthRate, t) * cumulativeExtra);
    }
    return path;
  }

  if (mode === "YEARLY_CUSTOM") {
    const yearlySalaries = config.yearlySalaries ?? [];
    if (yearlySalaries.length !== remainingYears) {
      throw new Error(
        `yearlySalaries length ${yearlySalaries.length} does not match remainingYears ${remainingYears}`
      );
    }
    return [...yearlySalaries];
  }

  return [];
}
