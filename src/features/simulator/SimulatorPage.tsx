"use client";

import { useState } from "react";
import { useSimulatorForm } from "./hooks/useSimulatorForm";
import { HeroSection } from "./components/HeroSection";
import { SimulatorForm } from "./components/SimulatorForm";
import { ResultPanel } from "./components/ResultPanel";
import { AssumptionNotice } from "./components/AssumptionNotice";
import { ShareSection } from "./components/ShareSection";
import { SensitivitySection } from "./components/SensitivitySection";
import { RiskSection } from "./components/RiskSection";
import { StressSection } from "./components/StressSection";
import { parseSearchToFormValues } from "./utils/urlParams";

export function SimulatorPage() {
  const [initialValues] = useState(() =>
    typeof window === "undefined" ? {} : parseSearchToFormValues(window.location.search)
  );
  const { values, errors, input, result, volatility, inflationRate, riskyAssetWeight, onChange, onBlur, onReset, applyScenario, onSelectPreset, onToggleDisplay } =
    useSimulatorForm(initialValues);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <HeroSection />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
        <div>
          <SimulatorForm
            values={values}
            errors={errors}
            onChange={onChange}
            onBlur={onBlur}
            onReset={onReset}
            onSelectScenario={applyScenario}
            presetId={values.portfolioPresetId}
            onSelectPreset={onSelectPreset}
          />
        </div>
        <div>
          <ResultPanel
            result={result}
            input={input}
            hasErrors={hasErrors}
            values={values}
            errors={errors}
            inflationRate={inflationRate}
            onToggleDisplay={onToggleDisplay}
            onChange={onChange}
          />
          {input && <SensitivitySection input={input} />}
          {input && result && volatility !== null && (
            <RiskSection input={input} volatility={volatility} dbAmount={result.dbAmount} />
          )}
          {input && result && (
            <StressSection
              input={input}
              result={result}
              riskyAssetWeight={riskyAssetWeight}
              isCustomWeight={values.portfolioPresetId === "CUSTOM"}
            />
          )}
          <ShareSection values={values} disabled={hasErrors} />
        </div>
      </div>
      <AssumptionNotice />
    </main>
  );
}
