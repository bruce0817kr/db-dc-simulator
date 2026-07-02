export interface PensionRuleSet {
  id: string;
  label: string;
  riskyAssetLimit: number;
  dcContributionRate: number;
  effectiveFrom?: string;
  note?: string;
}

export const DEFAULT_RULE_SET: PensionRuleSet = {
  id: "kr-retirement-pension-mvp",
  label: "MVP 기본 가정",
  riskyAssetLimit: 0.7,
  dcContributionRate: 1 / 12,
};

export function exceedsRiskyAssetLimit(
  riskyAssetWeight: number,
  rules: PensionRuleSet = DEFAULT_RULE_SET
): boolean {
  return riskyAssetWeight > rules.riskyAssetLimit;
}
