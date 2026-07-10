import type { ConversionType } from "@/src/calculator/types";
import type { SimulatorFormValues, SalaryPathModeUI } from "../types";
import { parseKRWInput, formatKRW } from "./formatters";

interface ShareUrlOptions {
  readonly includeAdvanced?: boolean;
}

function isConversionType(value: string): value is ConversionType {
  return value === "TRANSFER_ALL_TO_DC" || value === "CUSTOM_TRANSFER_AMOUNT";
}

function isSalaryPathMode(value: string): value is SalaryPathModeUI {
  return (
    value === "CONSTANT_GROWTH" ||
    value === "WAGE_PEAK" ||
    value === "STEP_UP" ||
    value === "YEARLY_CUSTOM"
  );
}

function setFiniteParam(params: URLSearchParams, key: string, raw: string): void {
  const value = Number(raw);
  if (Number.isFinite(value)) params.set(key, raw);
}

function setKrwParam(params: URLSearchParams, key: string, raw: string): void {
  const value = parseKRWInput(raw);
  if (value !== null) params.set(key, String(Math.round(value)));
}

function formatKrwParam(raw: string): string | null {
  const value = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;
  return formatKRW(value).replace("원", "").trim();
}

function serializeYearlySalaries(values: readonly string[]): string | null {
  const serialized: string[] = [];
  for (const raw of values) {
    const value = parseKRWInput(raw);
    if (value === null) return null;
    serialized.push(String(Math.round(value)));
  }
  return serialized.length > 0 ? serialized.join(",") : null;
}

function parseYearlySalaries(raw: string): string[] | null {
  if (raw.length === 0) return null;
  const parsed: string[] = [];
  for (const item of raw.split(",")) {
    const formatted = formatKrwParam(item);
    if (formatted === null) return null;
    parsed.push(formatted);
  }
  return parsed;
}

export function buildShareUrl(
  values: SimulatorFormValues,
  origin: string,
  options: ShareUrlOptions = {}
): string {
  const params = new URLSearchParams();

  const salaryNum = parseKRWInput(values.currentSalary);
  if (salaryNum !== null) params.set("salary", String(Math.round(salaryNum)));

  params.set("currentYears", values.currentYearsOfService);
  params.set("remainingYears", values.remainingYearsOfService);
  params.set("salaryGrowth", values.salaryGrowthRate);
  params.set("dcReturn", values.dcReturnRate);
  params.set("volatility", values.dcVolatility);
  params.set("method", values.conversionMethod);

  if (values.conversionMethod === "CUSTOM_TRANSFER_AMOUNT") {
    const customNum = parseKRWInput(values.customTransferAmount);
    if (customNum !== null) params.set("customTransfer", String(Math.round(customNum)));
  }

  if (options.includeAdvanced === true) {
    params.set("advanced", "1");
    params.set("salaryMode", values.salaryPathMode);
    setKrwParam(params, "dbAverageSalary", values.dbAverageSalary);

    switch (values.salaryPathMode) {
      case "CONSTANT_GROWTH":
        break;
      case "WAGE_PEAK":
        setFiniteParam(params, "peakStart", values.peakStartYear);
        setFiniteParam(params, "peakCut", values.peakCutRate);
        setFiniteParam(params, "peakPostGrowth", values.peakPostGrowthRate);
        break;
      case "STEP_UP":
        setFiniteParam(params, "stepUpYear", values.stepUpYear);
        setFiniteParam(params, "stepUpRate", values.stepUpRate);
        break;
      case "YEARLY_CUSTOM": {
        const salaries = serializeYearlySalaries(values.yearlySalaries);
        if (salaries !== null) params.set("salaries", salaries);
        break;
      }
    }
  }

  return `${origin}/?${params.toString()}`;
}

export function parseSearchToFormValues(search: string): Partial<SimulatorFormValues> {
  const params = new URLSearchParams(search);
  const result: Partial<SimulatorFormValues> = {};

  const salaryRaw = params.get("salary");
  if (salaryRaw !== null) {
    const n = Number(salaryRaw.replace(/,/g, ""));
    if (Number.isFinite(n)) {
      result.currentSalary = formatKRW(n).replace("원", "").trim();
    }
  }

  const currentYears = params.get("currentYears");
  if (currentYears !== null) {
    const n = Number(currentYears);
    if (Number.isFinite(n)) result.currentYearsOfService = currentYears;
  }

  const remainingYears = params.get("remainingYears");
  if (remainingYears !== null) {
    const n = Number(remainingYears);
    if (Number.isFinite(n)) result.remainingYearsOfService = remainingYears;
  }

  const salaryGrowth = params.get("salaryGrowth");
  if (salaryGrowth !== null) {
    const n = Number(salaryGrowth);
    if (Number.isFinite(n)) result.salaryGrowthRate = salaryGrowth;
  }

  const dcReturn = params.get("dcReturn");
  if (dcReturn !== null) {
    const n = Number(dcReturn);
    if (Number.isFinite(n)) result.dcReturnRate = dcReturn;
  }

  const volatility = params.get("volatility");
  if (volatility !== null) {
    const n = Number(volatility);
    if (Number.isFinite(n)) result.dcVolatility = volatility;
  }

  const method = params.get("method");
  if (method !== null && isConversionType(method)) {
    result.conversionMethod = method;
  }

  const customTransfer = params.get("customTransfer");
  if (customTransfer !== null) {
    const formatted = formatKrwParam(customTransfer);
    if (formatted !== null) result.customTransferAmount = formatted;
  }

  if (params.get("advanced") === "1") {
    const salaryMode = params.get("salaryMode");
    if (salaryMode !== null && isSalaryPathMode(salaryMode)) {
      result.salaryPathMode = salaryMode;

      switch (salaryMode) {
        case "CONSTANT_GROWTH":
          break;
        case "WAGE_PEAK": {
          const peakStart = params.get("peakStart");
          const peakCut = params.get("peakCut");
          const peakPostGrowth = params.get("peakPostGrowth");
          if (peakStart !== null && Number.isFinite(Number(peakStart))) {
            result.peakStartYear = peakStart;
          }
          if (peakCut !== null && Number.isFinite(Number(peakCut))) {
            result.peakCutRate = peakCut;
          }
          if (peakPostGrowth !== null && Number.isFinite(Number(peakPostGrowth))) {
            result.peakPostGrowthRate = peakPostGrowth;
          }
          break;
        }
        case "STEP_UP": {
          const stepUpYear = params.get("stepUpYear");
          const stepUpRate = params.get("stepUpRate");
          if (stepUpYear !== null && Number.isFinite(Number(stepUpYear))) {
            result.stepUpYear = stepUpYear;
          }
          if (stepUpRate !== null && Number.isFinite(Number(stepUpRate))) {
            result.stepUpRate = stepUpRate;
          }
          break;
        }
        case "YEARLY_CUSTOM": {
          const salaries = params.get("salaries");
          if (salaries !== null) {
            const parsed = parseYearlySalaries(salaries);
            if (parsed !== null) result.yearlySalaries = parsed;
          }
          break;
        }
      }
    }

    const dbAverageSalary = params.get("dbAverageSalary");
    if (dbAverageSalary !== null) {
      const formatted = formatKrwParam(dbAverageSalary);
      if (formatted !== null) result.dbAverageSalary = formatted;
    }
  }

  return result;
}
