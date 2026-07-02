import { PORTFOLIO_PRESETS, netReturnRate } from "@/src/calculator";
import { Select } from "@/src/components/ui/Select";
import { Card } from "@/src/components/ui/Card";
import { formatPercent } from "../utils/formatters";

interface PortfolioPresetSelectProps {
  presetId: string;
  onSelectPreset: (id: string) => void;
}

const PRESET_OPTIONS = [
  { value: "CUSTOM", label: "직접 입력" },
  ...PORTFOLIO_PRESETS.map((p) => ({ value: p.id, label: p.name })),
];

export function PortfolioPresetSelect({ presetId, onSelectPreset }: PortfolioPresetSelectProps) {
  const activePreset = presetId !== "CUSTOM" ? PORTFOLIO_PRESETS.find((p) => p.id === presetId) : null;

  return (
    <div className="flex flex-col gap-2">
      <Select
        id="portfolioPreset"
        label="포트폴리오 프리셋"
        value={presetId}
        onChange={onSelectPreset}
        options={PRESET_OPTIONS}
      />
      {activePreset && (
        <Card>
          <div className="flex flex-col gap-1 text-sm">
            <p className="text-gray-700">
              위험자산 {formatPercent(activePreset.riskyAssetWeight, 0)} · 안전자산 {formatPercent(activePreset.safeAssetWeight, 0)}
            </p>
            <p className="text-gray-700">
              기대수익률 {formatPercent(activePreset.expectedReturnRate, 1)} − 연 보수 {formatPercent(activePreset.annualFeeRate, 1)} = 순 수익률 {formatPercent(netReturnRate(activePreset), 1)}
            </p>
            <p className="text-gray-500">{activePreset.description}</p>
            <p className="text-xs text-gray-400">이 수익률은 서비스의 가정치이며 예측이나 보장이 아닙니다.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
