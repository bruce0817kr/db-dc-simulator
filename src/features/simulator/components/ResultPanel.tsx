import { SimulationInput, SimulationResult } from "@/src/calculator/types";
import { Card } from "@/src/components/ui/Card";
import { ResultSummaryCards } from "./ResultSummaryCards";
import { ResultExplanation } from "./ResultExplanation";

interface ResultPanelProps {
  result: SimulationResult | null;
  input: SimulationInput | null;
  hasErrors: boolean;
}

export function ResultPanel({ result, input }: ResultPanelProps) {
  return (
    <div aria-live="polite">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">시뮬레이션 결과</h2>
      {result === null || input === null ? (
        <Card>
          <p className="text-sm text-gray-500">
            모든 입력값을 올바르게 입력하면 결과가 표시됩니다.
          </p>
        </Card>
      ) : (
        <>
          <ResultSummaryCards result={result} />
          <ResultExplanation input={input} result={result} />
        </>
      )}
    </div>
  );
}
