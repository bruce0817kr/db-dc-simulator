import { SimulatorFormValues, FieldErrors, SalaryPathModeUI } from "../types";
import { TextInput } from "@/src/components/ui/TextInput";
import { Select } from "@/src/components/ui/Select";

interface AdvancedSalarySectionProps {
  values: SimulatorFormValues;
  errors: FieldErrors;
  onChange: (field: keyof SimulatorFormValues, value: string) => void;
  onBlur: (field: keyof SimulatorFormValues) => void;
}

const MODE_OPTIONS: { value: SalaryPathModeUI; label: string }[] = [
  { value: "CONSTANT_GROWTH", label: "기본 (일정 상승)" },
  { value: "WAGE_PEAK", label: "임금피크제" },
  { value: "STEP_UP", label: "승진·호봉 점프" },
];

export function AdvancedSalarySection({
  values,
  errors,
  onChange,
  onBlur,
}: AdvancedSalarySectionProps) {
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
