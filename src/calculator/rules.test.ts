import { describe, it, expect } from "vitest";
import { DEFAULT_RULE_SET, exceedsRiskyAssetLimit } from "./rules";
import { PORTFOLIO_PRESETS } from "./portfolio";

describe("DEFAULT_RULE_SET 불변식", () => {
  it("riskyAssetLimit === 0.7", () => {
    expect(DEFAULT_RULE_SET.riskyAssetLimit).toBe(0.7);
  });

  it("dcContributionRate === 1/12", () => {
    expect(DEFAULT_RULE_SET.dcContributionRate).toBe(1 / 12);
  });
});

describe("exceedsRiskyAssetLimit", () => {
  it("0.7은 한도 이내 (false)", () => {
    expect(exceedsRiskyAssetLimit(0.7)).toBe(false);
  });

  it("0.71은 한도 초과 (true)", () => {
    expect(exceedsRiskyAssetLimit(0.71)).toBe(true);
  });

  it("0은 한도 이내 (false)", () => {
    expect(exceedsRiskyAssetLimit(0)).toBe(false);
  });
});

describe("PORTFOLIO_PRESETS 한도 검사", () => {
  it("모든 프리셋이 riskyAssetLimit 이내", () => {
    for (const preset of PORTFOLIO_PRESETS) {
      expect(exceedsRiskyAssetLimit(preset.riskyAssetWeight)).toBe(false);
    }
  });
});
