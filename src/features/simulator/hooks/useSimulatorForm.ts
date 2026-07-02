"use client";

import { useState, useMemo } from "react";
import { simulate, PORTFOLIO_PRESETS, netReturnRate } from "@/src/calculator";
import { SimulationResult } from "@/src/calculator/types";
import { SimulatorFormValues } from "../types";
import { validateForm } from "../utils/validation";
import { parseKRWInput, formatKRW, formatPercent } from "../utils/formatters";

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
  dbAverageSalary: "",
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

export function useSimulatorForm(initialValues?: Partial<SimulatorFormValues>) {
  const [values, setValues] = useState<SimulatorFormValues>({
    ...DEFAULT_FORM_VALUES,
    ...initialValues,
  });

  const { errors, input, volatility } = useMemo(() => validateForm(values), [values]);

  const result = useMemo<SimulationResult | null>(() => {
    if (!input) return null;
    const r = simulate(input);
    return [r.dbAmount, r.dcAmount, r.difference].every(Number.isFinite) ? r : null;
  }, [input]);

  function onChange(field: keyof SimulatorFormValues, value: string) {
    if (field === "dcReturnRate" && values.portfolioPresetId !== "CUSTOM") {
      setValues((prev) => ({ ...prev, [field]: value, portfolioPresetId: "CUSTOM" }));
    } else {
      setValues((prev) => ({ ...prev, [field]: value }));
    }
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

  const riskyAssetWeight = useMemo<number>(() => {
    if (values.portfolioPresetId === "CUSTOM") return 1.0;
    const preset = PORTFOLIO_PRESETS.find((p) => p.id === values.portfolioPresetId);
    return preset ? preset.riskyAssetWeight : 1.0;
  }, [values.portfolioPresetId]);

  return { values, errors, input, result, volatility, riskyAssetWeight, onChange, onBlur, onReset, applyScenario, onSelectPreset };
}
