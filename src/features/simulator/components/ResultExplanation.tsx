import { SimulationInput, SimulationResult } from "@/src/calculator/types";
import { buildExplanation } from "../utils/explanation";
import { DisplayAmounts } from "../utils/displayAmounts";

interface ResultExplanationProps {
  input: SimulationInput;
  result: SimulationResult;
  display?: DisplayAmounts;
}

export function ResultExplanation({ input, result, display }: ResultExplanationProps) {
  const { breakevenSentence, comparisonSentence } = buildExplanation(input, result, display);
  return (
    <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
      <p>{breakevenSentence}</p>
      <p className="mt-1">{comparisonSentence}</p>
    </div>
  );
}
