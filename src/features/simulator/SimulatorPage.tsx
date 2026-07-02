"use client";

import { useSimulatorForm } from "./hooks/useSimulatorForm";
import { HeroSection } from "./components/HeroSection";
import { SimulatorForm } from "./components/SimulatorForm";
import { ResultPanel } from "./components/ResultPanel";
import { AssumptionNotice } from "./components/AssumptionNotice";

export function SimulatorPage() {
  const { values, errors, input, result, onChange, onReset } = useSimulatorForm();
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
            onReset={onReset}
          />
        </div>
        <div>
          <ResultPanel result={result} input={input} hasErrors={hasErrors} />
        </div>
      </div>
      <AssumptionNotice />
    </main>
  );
}
