import type { ConversionType } from "@/src/calculator/types";
import {
  MAX_REMAINING_YEARS,
  type SimulatorFormValues,
  type SalaryPathModeUI,
} from "../types";
import { parseKRWInput, formatKRW } from "./formatters";

interface ShareUrlOptions {
  readonly includeAdvanced?: boolean;
}

const MAX_SHARE_SEARCH_LENGTH = 8_192;

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
  if (value !== null && value > 0 && value <= 1e12) {
    params.set(key, String(Math.round(value)));
  }
}

function formatPositiveKrwParam(raw: string): string | null {
  const value = parseKRWInput(raw);
  if (value === null || value <= 0 || value > 1e12) return null;
  return formatKRW(value).replace("원", "").trim();
}

function formatNonNegativeKrwParam(raw: string): string | null {
  const value = parseKRWInput(raw);
  if (value === null || value < 0) return null;
  return formatKRW(value).replace("원", "").trim();
}

function parseRemainingYears(raw: string | null): number | null {
  if (raw === null) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > MAX_REMAINING_YEARS) return null;
  return value;
}

function parseNumberInRange(
  raw: string | null,
  minimum: number,
  maximum: number,
  integer = false
): string | null {
  if (raw === null || raw.trim().length === 0) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < minimum || value > maximum) return null;
  if (integer && !Number.isInteger(value)) return null;
  return raw;
}

function serializeYearlySalaries(values: readonly string[]): string | null {
  const serialized: string[] = [];
  for (const raw of values) {
    const value = parseKRWInput(raw);
    if (value === null || value <= 0 || value > 1e12) return null;
    serialized.push(String(Math.round(value)));
  }
  return serialized.length > 0 ? serialized.join(",") : null;
}

function parseYearlySalaries(raw: string): string[] | null {
  if (raw.length === 0) return null;
  const items = raw.split(",");
  if (items.length > MAX_REMAINING_YEARS) return null;
  const parsed: string[] = [];
  for (const item of items) {
    const formatted = formatPositiveKrwParam(item);
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
  if (search.length > MAX_SHARE_SEARCH_LENGTH) return {};
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
  const parsedRemainingYears = parseRemainingYears(remainingYears);
  if (parsedRemainingYears !== null) result.remainingYearsOfService = String(parsedRemainingYears);

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
    const formatted = formatNonNegativeKrwParam(customTransfer);
    if (formatted !== null) result.customTransferAmount = formatted;
  }

  if (params.get("advanced") === "1") {
    const salaryMode = params.get("salaryMode");
    if (salaryMode !== null && isSalaryPathMode(salaryMode)) {
      switch (salaryMode) {
        case "CONSTANT_GROWTH":
          result.salaryPathMode = salaryMode;
          break;
        case "WAGE_PEAK": {
          const peakStart = parseNumberInRange(
            params.get("peakStart"),
            1,
            parsedRemainingYears ?? 0,
            true
          );
          const peakCut = parseNumberInRange(params.get("peakCut"), 0, 50);
          const peakPostGrowth = parseNumberInRange(
            params.get("peakPostGrowth"),
            -10,
            20
          );
          if (peakStart !== null && peakCut !== null && peakPostGrowth !== null) {
            result.salaryPathMode = salaryMode;
            result.peakStartYear = peakStart;
            result.peakCutRate = peakCut;
            result.peakPostGrowthRate = peakPostGrowth;
          }
          break;
        }
        case "STEP_UP": {
          const stepUpYear = parseNumberInRange(
            params.get("stepUpYear"),
            1,
            parsedRemainingYears ?? 0,
            true
          );
          const stepUpRate = parseNumberInRange(params.get("stepUpRate"), 0, 100);
          if (stepUpYear !== null && stepUpRate !== null) {
            result.salaryPathMode = salaryMode;
            result.stepUpYear = stepUpYear;
            result.stepUpRate = stepUpRate;
          }
          break;
        }
        case "YEARLY_CUSTOM": {
          const salaries = params.get("salaries");
          if (salaries !== null) {
            const parsed = parseYearlySalaries(salaries);
            if (parsed !== null && parsed.length === parsedRemainingYears) {
              result.salaryPathMode = salaryMode;
              result.yearlySalaries = parsed;
            }
          }
          break;
        }
      }
    }

    const dbAverageSalary = params.get("dbAverageSalary");
    if (dbAverageSalary !== null) {
      const formatted = formatPositiveKrwParam(dbAverageSalary);
      if (formatted !== null) result.dbAverageSalary = formatted;
    }
  }

  return result;
}
