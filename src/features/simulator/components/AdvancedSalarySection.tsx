import { SimulatorFormValues, FieldErrors, SalaryPathModeUI } from "../types";
import { TextInput } from "@/src/components/ui/TextInput";
import { Select } from "@/src/components/ui/Select";
import { Button } from "@/src/components/ui/Button";

interface AdvancedSalarySectionProps {
  values: SimulatorFormValues;
  errors: FieldErrors;
  onChange: (field: keyof SimulatorFormValues, value: string) => void;
  onBlur: (field: keyof SimulatorFormValues) => void;
  onSetYearlySalary: (index: number, value: string) => void;
  onFillYearlyFromBaseline: () => void;
}

const MODE_OPTIONS: { value: SalaryPathModeUI; label: string }[] = [
  { value: "CONSTANT_GROWTH", label: "기본 (일정 상승)" },
  { value: "WAGE_PEAK", label: "임금피크제" },
  { value: "STEP_UP", label: "승진·호봉 점프" },
  { value: "YEARLY_CUSTOM", label: "연도별 직접 입력" },
];

function parseRemainingYears(raw: string): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 0;
}

export function AdvancedSalarySection({
  values,
  errors,
  onChange,
  onBlur,
  onSetYearlySalary,
  onFillYearlyFromBaseline,
}: AdvancedSalarySectionProps) {
  const yearlyN = parseRemainingYears(values.remainingYearsOfService);

  return (
    <details className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <summary className="cursor-pointer font-medium">고급 임금 시나리오</summary>
      <div className="mt-4 flex flex-col gap-4">
        <Select
          id="salaryPathMode"
          label="임금 경로 모드"
          value={values.salaryPathMode}
          onChange={(v) => onChange("salaryPathMode", v)}
          options={MODE_OPTIONS}
        />

        {values.salaryPathMode === "WAGE_PEAK" && (
          <>
            <TextInput
              id="peakStartYear"
              label="피크 시작 연차"
              value={values.peakStartYear}
              onChange={(v) => onChange("peakStartYear", v)}
              error={errors.peakStartYear}
              inputMode="decimal"
              suffix="년"
              placeholder="10"
            />
            <TextInput
              id="peakCutRate"
              label="감액률"
              value={values.peakCutRate}
              onChange={(v) => onChange("peakCutRate", v)}
              error={errors.peakCutRate}
              inputMode="decimal"
              suffix="%"
              placeholder="20"
            />
            <TextInput
              id="peakPostGrowthRate"
              label="피크 이후 상승률"
              value={values.peakPostGrowthRate}
              onChange={(v) => onChange("peakPostGrowthRate", v)}
              error={errors.peakPostGrowthRate}
              inputMode="decimal"
              suffix="%"
              placeholder="0"
            />
          </>
        )}

        {values.salaryPathMode === "STEP_UP" && (
          <>
            <TextInput
              id="stepUpYear"
              label="점프 연차"
              value={values.stepUpYear}
              onChange={(v) => onChange("stepUpYear", v)}
              error={errors.stepUpYear}
              inputMode="decimal"
              suffix="년"
              placeholder="5"
            />
            <TextInput
              id="stepUpRate"
              label="추가 인상률"
              value={values.stepUpRate}
              onChange={(v) => onChange("stepUpRate", v)}
              error={errors.stepUpRate}
              inputMode="decimal"
              suffix="%"
              placeholder="10"
            />
          </>
        )}

        {values.salaryPathMode === "YEARLY_CUSTOM" && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-amber-700">총 {yearlyN}년치 연봉 입력</span>
              <Button
                variant="secondary"
                type="button"
                onClick={onFillYearlyFromBaseline}
              >
                현재 연봉으로 채우기
              </Button>
            </div>
            <div className="flex max-h-[320px] flex-col gap-3 overflow-y-auto pr-1">
              {Array.from({ length: yearlyN }, (_, i) => (
                <TextInput
                  key={i}
                  id={`yearlySalary-${i}`}
                  label={`${i + 1}년차 연봉`}
                  value={values.yearlySalaries[i] ?? ""}
                  onChange={(v) => onSetYearlySalary(i, v)}
                  inputMode="numeric"
                  suffix="원"
                  placeholder="80,000,000"
                />
              ))}
            </div>
            {errors.yearlySalaries && (
              <p className="text-xs text-red-600">{errors.yearlySalaries}</p>
            )}
          </div>
        )}

        <div>
          <TextInput
            id="dbAverageSalary"
            label="평균임금 직접 입력 (선택)"
            value={values.dbAverageSalary}
            onChange={(v) => onChange("dbAverageSalary", v)}
            onBlur={() => onBlur("dbAverageSalary")}
            error={errors.dbAverageSalary}
            inputMode="numeric"
            suffix="원"
            placeholder="0"
          />
          <p className="mt-1 text-xs text-amber-700">
            회사 규약상 평균임금을 아는 경우에만 입력하세요. DB 예상액 산정에만 사용됩니다.
          </p>
        </div>
      </div>
    </details>
  );
}
