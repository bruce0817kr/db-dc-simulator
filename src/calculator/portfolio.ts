export interface PortfolioPreset {
  id: string;
  name: string;
  description: string;
  expectedReturnRate: number;
  riskyAssetWeight: number;
  safeAssetWeight: number;
  annualFeeRate: number;
}

export const PORTFOLIO_PRESETS: PortfolioPreset[] = [
  {
    id: "deposit",
    name: "예금형",
    description: "원리금 보장형 안전자산으로만 구성한다고 가정합니다.",
    expectedReturnRate: 0.025,
    riskyAssetWeight: 0,
    safeAssetWeight: 1,
    annualFeeRate: 0.001,
  },
  {
    id: "stable",
    name: "안정형",
    description: "위험자산을 30% 편입하고 안전자산 중심으로 구성한다고 가정합니다.",
    expectedReturnRate: 0.035,
    riskyAssetWeight: 0.3,
    safeAssetWeight: 0.7,
    annualFeeRate: 0.003,
  },
  {
    id: "neutral",
    name: "중립형",
    description: "위험자산과 안전자산을 각각 50% 편입한다고 가정합니다.",
    expectedReturnRate: 0.045,
    riskyAssetWeight: 0.5,
    safeAssetWeight: 0.5,
    annualFeeRate: 0.004,
  },
  {
    id: "aggressive",
    name: "공격형",
    description: "위험자산을 70% 편입하고 성장 중심으로 구성한다고 가정합니다.",
    expectedReturnRate: 0.055,
    riskyAssetWeight: 0.7,
    safeAssetWeight: 0.3,
    annualFeeRate: 0.005,
  },
  {
    id: "sp500",
    name: "S&P 500 중심형",
    description: "S&P 500 지수 추종형 자산을 70% 편입한다고 가정합니다.",
    expectedReturnRate: 0.06,
    riskyAssetWeight: 0.7,
    safeAssetWeight: 0.3,
    annualFeeRate: 0.004,
  },
  {
    id: "nasdaq100",
    name: "NASDAQ 100 중심형",
    description: "NASDAQ 100 지수 추종형 자산을 70% 편입한다고 가정합니다.",
    expectedReturnRate: 0.065,
    riskyAssetWeight: 0.7,
    safeAssetWeight: 0.3,
    annualFeeRate: 0.005,
  },
];

export function netReturnRate(preset: PortfolioPreset): number {
  return preset.expectedReturnRate - preset.annualFeeRate;
}
