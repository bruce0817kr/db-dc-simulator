"use client";

import { useEffect, useState } from "react";
import { useSimulatorForm } from "./hooks/useSimulatorForm";
import { HeroSection } from "./components/HeroSection";
import { SimulatorForm } from "./components/SimulatorForm";
import { ResultPanel } from "./components/ResultPanel";
import { AssumptionNotice } from "./components/AssumptionNotice";
import { ShareSection } from "./components/ShareSection";
import { SensitivitySection } from "./components/SensitivitySection";
import { RiskSection } from "./components/RiskSection";
import { StressSection } from "./components/StressSection";
import { PrintReportHeader } from "./components/PrintReportHeader";
import { ReportSection } from "./components/ReportSection";
import { parseSearchToFormValues } from "./utils/urlParams";

export function SimulatorPage() {
  const { values, errors, input, result, volatility, inflationRate, riskyAssetWeight, onChange, onBlur, onReset, applyScenario, onSelectPreset, onToggleDisplay, setYearlySalary, fillYearlyFromBaseline, restoreValues } =
    useSimulatorForm();
  const hasErrors = Object.keys(errors).length > 0;

  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    restoreValues(parseSearchToFormValues(window.location.search));
  }, [restoreValues]);

  function handlePrint() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    setGeneratedAt(`${yyyy}-${mm}-${dd} ${hh}:${min}`);
    setTimeout(() => window.print(), 0);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      {input && (
        <PrintReportHeader values={values} input={input} generatedAt={generatedAt} />
      )}
      <div className="print:hidden">
        <HeroSection />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
        <div className="print:hidden">
          <SimulatorForm
            values={values}
            errors={errors}
            onChange={onChange}
            onBlur={onBlur}
            onReset={onReset}
            onSelectScenario={applyScenario}
            presetId={values.portfolioPresetId}
            onSelectPreset={onSelectPreset}
            onSetYearlySalary={setYearlySalary}
            onFillYearlyFromBaseline={fillYearlyFromBaseline}
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
          {input && result && <SensitivitySection input={input} result={result} />}
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
          <div className="print:hidden">
            <ShareSection values={values} disabled={hasErrors} />
          </div>
          <ReportSection disabled={hasErrors} onPrint={handlePrint} />
        </div>
      </div>
      <AssumptionNotice />
    </main>
  );
}
