import { SimulationInput, SimulationResult } from "@/src/calculator/types";
import { Card } from "@/src/components/ui/Card";
import { ResultSummaryCards } from "./ResultSummaryCards";
import { ResultExplanation } from "./ResultExplanation";
import { DisplayModeToggle } from "./DisplayModeToggle";
import { buildDisplayAmounts } from "../utils/displayAmounts";
import { FieldErrors, SimulatorFormValues } from "../types";
import { TAX_RULE_YEAR } from "@/src/calculator/tax-rules";

interface ResultPanelProps {
  result: SimulationResult | null;
  input: SimulationInput | null;
  hasErrors: boolean;
  values: Pick<SimulatorFormValues, "showAfterTax" | "showPresentValue" | "inflationRate">;
  errors: Pick<FieldErrors, "inflationRate">;
  inflationRate: number | null;
  onToggleDisplay: (field: "showAfterTax" | "showPresentValue") => void;
  onChange: (field: keyof SimulatorFormValues, value: string) => void;
}

export function ResultPanel({ result, input, values, errors, inflationRate, onToggleDisplay, onChange }: ResultPanelProps) {
  const showAdvancedBadge =
    input !== null &&
    (input.salaryPathConfig !== undefined || input.dbAverageSalaryOverride !== undefined);

  const display = result !== null && input !== null
    ? buildDisplayAmounts(
        result,
        input.currentServiceYears + input.remainingServiceYears,
        input.remainingServiceYears,
        {
          afterTax: values.showAfterTax,
          presentValue: values.showPresentValue,
          inflationRate: inflationRate ?? 0.02,
        }
      )
    : null;

  return (
    <div aria-live="polite">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">시뮬레이션 결과</h2>
      {showAdvancedBadge && (
        <span className="mb-3 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          고급 임금 시나리오 적용 중
        </span>
      )}
      <DisplayModeToggle
        showAfterTax={values.showAfterTax}
        showPresentValue={values.showPresentValue}
        inflationRate={values.inflationRate}
        errors={errors}
        onToggleDisplay={onToggleDisplay}
        onChange={(field, value) => onChange(field, value)}
      />
      {values.showAfterTax && (
        <p className="mb-3 text-xs text-gray-500">
          퇴직소득세는 {TAX_RULE_YEAR}년 세법 기준 단순 추정치입니다. 수령 방식, 세법 개정, 개인별 공제에 따라 실제 세액은 달라질 수 있습니다.
        </p>
      )}
      {result === null || input === null || display === null ? (
        <Card>
          <p className="text-sm text-gray-500">
            모든 입력값을 올바르게 입력하면 결과가 표시됩니다.
          </p>
        </Card>
      ) : (
        <>
          <ResultSummaryCards result={result} display={display} />
          <ResultExplanation input={input} result={result} display={display} />
        </>
      )}
    </div>
  );
}
