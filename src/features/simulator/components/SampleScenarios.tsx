import { SimulatorFormValues } from "../types";
import { SAMPLE_SCENARIOS } from "../utils/sampleScenarios";

interface SampleScenariosProps {
  onSelect: (values: SimulatorFormValues) => void;
}

export function SampleScenarios({ onSelect }: SampleScenariosProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SAMPLE_SCENARIOS.map((scenario) => (
        <button
          key={scenario.id}
          type="button"
          onClick={() => onSelect(scenario.values)}
          className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          {scenario.label}
        </button>
      ))}
    </div>
  );
}
