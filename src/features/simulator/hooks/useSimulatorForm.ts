"use client";

import { useState, useMemo } from "react";
import { simulate } from "@/src/calculator";
import { SimulationResult } from "@/src/calculator/types";
import { SimulatorFormValues } from "../types";
import { validateForm } from "../utils/validation";
import { parseKRWInput, formatKRW } from "../utils/formatters";

const DEFAULT_FORM_VALUES: SimulatorFormValues = {
  currentSalary: "80,000,000",
  currentYearsOfService: "10",
  remainingYearsOfService: "15",
  salaryGrowthRate: "3",
  dcReturnRate: "5",
  conversionMethod: "TRANSFER_ALL_TO_DC",
  customTransferAmount: "",
};

const KRW_FIELDS: Array<keyof SimulatorFormValues> = [
  "currentSalary",
  "customTransferAmount",
];

function formatKRWField(raw: string): string {
  const n = parseKRWInput(raw);
  if (n === null) return raw;
  return formatKRW(n).replace("원", "").trim();
}

export function useSimulatorForm(initialValues?: Partial<SimulatorFormValues>) {
  const [values, setValues] = useState<SimulatorFormValues>({
    ...DEFAULT_FORM_VALUES,
    ...initialValues,
  });

  const { errors, input } = useMemo(() => validateForm(values), [values]);

  const result = useMemo<SimulationResult | null>(() => {
    if (!input) return null;
    const r = simulate(input);
    return [r.dbAmount, r.dcAmount, r.difference].every(Number.isFinite) ? r : null;
  }, [input]);

  function onChange(field: keyof SimulatorFormValues, value: string) {
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

  function onReset() {
    setValues(DEFAULT_FORM_VALUES);
  }

  function applyScenario(vals: SimulatorFormValues) {
    setValues(vals);
  }

  return { values, errors, input, result, onChange, onBlur, onReset, applyScenario };
}
