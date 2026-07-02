import { SimulatorFormValues, FieldErrors } from "../types";
import { TextInput } from "@/src/components/ui/TextInput";
import { Select } from "@/src/components/ui/Select";
import { Button } from "@/src/components/ui/Button";
import { ConversionType } from "@/src/calculator/types";
import { SampleScenarios } from "./SampleScenarios";
import { PortfolioPresetSelect } from "./PortfolioPresetSelect";

interface SimulatorFormProps {
  values: SimulatorFormValues;
  errors: FieldErrors;
  onChange: (field: keyof SimulatorFormValues, value: string) => void;
  onBlur: (field: keyof SimulatorFormValues) => void;
  onReset: () => void;
  onSelectScenario: (values: SimulatorFormValues) => void;
  presetId: string;
  onSelectPreset: (id: string) => void;
}

const CONVERSION_OPTIONS: { value: ConversionType; label: string }[] = [
  { value: "TRANSFER_ALL_TO_DC", label: "과거분 전액 DC 이전" },
  { value: "CUSTOM_TRANSFER_AMOUNT", label: "정산금 직접 입력" },
];

export function SimulatorForm({ values, errors, onChange, onBlur, onReset, onSelectScenario, presetId, onSelectPreset }: SimulatorFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-800">입력 정보</h2>

      <SampleScenarios onSelect={onSelectScenario} />

      <TextInput
        id="currentSalary"
        label="현재 연봉"
        value={values.currentSalary}
        onChange={(v) => onChange("currentSalary", v)}
        onBlur={() => onBlur("currentSalary")}
        error={errors.currentSalary}
        inputMode="numeric"
        suffix="원"
        placeholder="80,000,000"
      />

      <TextInput
        id="currentYearsOfService"
        label="현재 근속연수"
        value={values.currentYearsOfService}
        onChange={(v) => onChange("currentYearsOfService", v)}
        error={errors.currentYearsOfService}
        inputMode="decimal"
        suffix="년"
        placeholder="10"
      />

      <TextInput
        id="remainingYearsOfService"
        label="남은 근속연수"
        value={values.remainingYearsOfService}
        onChange={(v) => onChange("remainingYearsOfService", v)}
        error={errors.remainingYearsOfService}
        inputMode="decimal"
        suffix="년"
        placeholder="15"
      />

      <TextInput
        id="salaryGrowthRate"
        label="예상 임금상승률"
        value={values.salaryGrowthRate}
        onChange={(v) => onChange("salaryGrowthRate", v)}
        error={errors.salaryGrowthRate}
        inputMode="decimal"
        suffix="%"
        placeholder="3"
      />

      <PortfolioPresetSelect presetId={presetId} onSelectPreset={onSelectPreset} />

      <TextInput
        id="dcReturnRate"
        label="DC 예상 운용수익률"
        value={values.dcReturnRate}
        onChange={(v) => onChange("dcReturnRate", v)}
        error={errors.dcReturnRate}
        inputMode="decimal"
        suffix="%"
        placeholder="5"
      />

      <Select
        id="conversionMethod"
        label="전환 방식"
        value={values.conversionMethod}
        onChange={(v) => onChange("conversionMethod", v)}
        options={CONVERSION_OPTIONS}
        error={errors.conversionMethod}
      />

      {values.conversionMethod === "CUSTOM_TRANSFER_AMOUNT" && (
        <TextInput
          id="customTransferAmount"
          label="전환 정산금"
          value={values.customTransferAmount}
          onChange={(v) => onChange("customTransferAmount", v)}
          onBlur={() => onBlur("customTransferAmount")}
          error={errors.customTransferAmount}
          inputMode="numeric"
          suffix="원"
          placeholder="0"
        />
      )}

      <Button variant="secondary" onClick={onReset} type="button">
        초기화
      </Button>
    </div>
  );
}
