import { ConversionType } from "@/src/calculator/types";
import { SimulatorFormValues } from "../types";
import { parseKRWInput, formatKRW } from "./formatters";

const CONVERSION_TYPE_WHITELIST: ConversionType[] = [
  "TRANSFER_ALL_TO_DC",
  "CUSTOM_TRANSFER_AMOUNT",
];

export function buildShareUrl(values: SimulatorFormValues, origin: string): string {
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
  if (method !== null && (CONVERSION_TYPE_WHITELIST as string[]).includes(method)) {
    result.conversionMethod = method as ConversionType;
  }

  const customTransfer = params.get("customTransfer");
  if (customTransfer !== null) {
    const n = Number(customTransfer.replace(/,/g, ""));
    if (Number.isFinite(n)) {
      result.customTransferAmount = formatKRW(n).replace("원", "").trim();
    }
  }

  return result;
}
