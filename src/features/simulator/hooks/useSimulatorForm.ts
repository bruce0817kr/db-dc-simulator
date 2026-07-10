"use client";

import { useState, useMemo } from "react";
import { simulate, PORTFOLIO_PRESETS, netReturnRate, buildSalaryPath } from "@/src/calculator";
import { SimulationResult } from "@/src/calculator/types";
import { MAX_REMAINING_YEARS, SimulatorFormValues, SalaryPathModeUI } from "../types";
import { validateForm } from "../utils/validation";
import { parseKRWInput, parsePercentInput, formatKRW, formatPercent } from "../utils/formatters";

const DEFAULT_FORM_VALUES: SimulatorFormValues = {
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
};

const KRW_FIELDS: Array<keyof SimulatorFormValues> = [
  "currentSalary",
  "customTransferAmount",
  "dbAverageSalary",
];

function formatKRWField(raw: string): string {
  const n = parseKRWInput(raw);
  if (n === null) return raw;
  return formatKRW(n).replace("원", "").trim();
}

function presetToRateString(rate: number): string {
  const s = formatPercent(rate, 1).replace("%", "");
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/** 남은 근속연수 n을 정수로 파싱. 유효하지 않으면 null. */
function parseRemainingYears(raw: string): number | null {
  const n = parseKRWInput(raw);
  if (n === null || !Number.isInteger(n) || n < 1 || n > MAX_REMAINING_YEARS) return null;
  return n;
}

/** currentSalary·salaryGrowthRate 기준 CONSTANT_GROWTH 베이스라인 n년치를 표시 문자열로 생성. */
function baselineYearlyValues(currentSalary: string, growthPercent: string, n: number): string[] {
  const salary = parseKRWInput(currentSalary);
  const g = parsePercentInput(growthPercent);
  if (salary === null || g === null) {
    return Array.from({ length: n }, () => "");
  }
  const path = buildSalaryPath(salary, g, n, { mode: "CONSTANT_GROWTH" });
  return path.map((v) => formatKRW(v).replace("원", "").trim());
}

/** 기존 접두부 보존, 부족분은 baseline으로 pad, 초과분은 꼬리 truncate. */
function resizeYearly(current: string[], n: number, baseline: string[]): string[] {
  if (current.length === n) return current;
  if (current.length > n) return current.slice(0, n);
  return [...current, ...baseline.slice(current.length)];
}

export function useSimulatorForm(initialValues?: Partial<SimulatorFormValues>) {
  const [values, setValues] = useState<SimulatorFormValues>({
    ...DEFAULT_FORM_VALUES,
    ...initialValues,
  });

  const { errors, input, volatility, inflationRate } = useMemo(() => validateForm(values), [values]);

  const result = useMemo<SimulationResult | null>(() => {
    if (!input) return null;
    const r = simulate(input);
    return [r.dbAmount, r.dcAmount, r.difference].every(Number.isFinite) ? r : null;
  }, [input]);

  function onChange(field: keyof SimulatorFormValues, value: string) {
    if (field === "dcReturnRate" && values.portfolioPresetId !== "CUSTOM") {
      setValues((prev) => ({ ...prev, [field]: value, portfolioPresetId: "CUSTOM" }));
      return;
    }

    // 임금 경로 모드 변경 → YEARLY_CUSTOM 진입 시 배열 길이 보정 (사용자 입력 보존)
    if (field === "salaryPathMode") {
      setValues((prev) => {
        const next: SimulatorFormValues = { ...prev, salaryPathMode: value as SalaryPathModeUI };
        if (value === "YEARLY_CUSTOM") {
          const n = parseRemainingYears(prev.remainingYearsOfService);
          if (n !== null && prev.yearlySalaries.length !== n) {
            const baseline = baselineYearlyValues(prev.currentSalary, prev.salaryGrowthRate, n);
            next.yearlySalaries =
              prev.yearlySalaries.length === 0
                ? baseline
                : resizeYearly(prev.yearlySalaries, n, baseline);
          }
        }
        return next;
      });
      return;
    }

    // 남은 근속연수 변경 → YEARLY_CUSTOM일 때만 resize (기존값 보존, currentSalary/growth 변경은 미갱신)
    if (field === "remainingYearsOfService" && values.salaryPathMode === "YEARLY_CUSTOM") {
      setValues((prev) => {
        const next: SimulatorFormValues = { ...prev, remainingYearsOfService: value };
        const n = parseRemainingYears(value);
        if (n !== null && prev.yearlySalaries.length !== n) {
          const baseline = baselineYearlyValues(prev.currentSalary, prev.salaryGrowthRate, n);
          next.yearlySalaries = resizeYearly(prev.yearlySalaries, n, baseline);
        }
        return next;
      });
      return;
    }

    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function onBlur(field: keyof SimulatorFormValues) {
    if (KRW_FIELDS.includes(field)) {
      setValues((prev) => {
        const raw = prev[field] as string;
        const formatted = formatKRWField(raw);
        if (formatted !== raw) return { ...prev, [field]: formatted };
        return prev;
      });
    }
  }

  function onToggleDisplay(field: "showAfterTax" | "showPresentValue") {
    setValues((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function onReset() {
    setValues(DEFAULT_FORM_VALUES);
  }

  function applyScenario(vals: SimulatorFormValues) {
    setValues(vals);
  }

  function onSelectPreset(id: string) {
    if (id === "CUSTOM") {
      setValues((prev) => ({ ...prev, portfolioPresetId: "CUSTOM" }));
      return;
    }
    const preset = PORTFOLIO_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const rateStr = presetToRateString(netReturnRate(preset));
    setValues((prev) => ({ ...prev, portfolioPresetId: id, dcReturnRate: rateStr }));
  }

  function setYearlySalary(index: number, value: string) {
    setValues((prev) => {
      const next = [...prev.yearlySalaries];
      next[index] = value;
      return { ...prev, yearlySalaries: next };
    });
  }

  function fillYearlyFromBaseline() {
    setValues((prev) => {
      const n = parseRemainingYears(prev.remainingYearsOfService);
      if (n === null) return prev;
      return { ...prev, yearlySalaries: baselineYearlyValues(prev.currentSalary, prev.salaryGrowthRate, n) };
    });
  }

  const riskyAssetWeight = useMemo<number>(() => {
    if (values.portfolioPresetId === "CUSTOM") return 1.0;
    const preset = PORTFOLIO_PRESETS.find((p) => p.id === values.portfolioPresetId);
    return preset ? preset.riskyAssetWeight : 1.0;
  }, [values.portfolioPresetId]);

  return {
    values,
    errors,
    input,
    result,
    volatility,
    inflationRate,
    riskyAssetWeight,
    onChange,
    onBlur,
    onReset,
    applyScenario,
    onSelectPreset,
    onToggleDisplay,
    setYearlySalary,
    fillYearlyFromBaseline,
  };
}
