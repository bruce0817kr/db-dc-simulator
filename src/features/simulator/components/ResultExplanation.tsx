import { SimulationInput, SimulationResult } from "@/src/calculator/types";
import { buildExplanation } from "../utils/explanation";

interface ResultExplanationProps {
  input: SimulationInput;
  result: SimulationResult;
}

export function ResultExplanation({ input, result }: ResultExplanationProps) {
  const { breakevenSentence, comparisonSentence } = buildExplanation(input, result);
  return (
    <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
      <p>{breakevenSentence}</p>
      <p className="mt-1">{comparisonSentence}</p>
    </div>
  );
}
