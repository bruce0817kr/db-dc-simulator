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
  const showAdvancedBadge =
    input !== null &&
    (input.salaryPathConfig !== undefined || input.dbAverageSalaryOverride !== undefined);

  return (
    <div aria-live="polite">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">시뮬레이션 결과</h2>
      {showAdvancedBadge && (
        <span className="mb-3 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          고급 임금 시나리오 적용 중
        </span>
      )}
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
