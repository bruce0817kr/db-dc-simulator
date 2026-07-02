// @vitest-environment node
import { describe, it, expect } from "vitest";
import { PORTFOLIO_PRESETS, netReturnRate } from "./portfolio";

describe("PORTFOLIO_PRESETS", () => {
  it("6개 프리셋이 정의된 순서대로 존재한다", () => {
    expect(PORTFOLIO_PRESETS).toHaveLength(6);
    expect(PORTFOLIO_PRESETS.map((p) => p.id)).toEqual([
      "deposit",
      "stable",
      "neutral",
      "aggressive",
      "sp500",
      "nasdaq100",
    ]);
  });

  it("id가 모두 유일하다", () => {
    const ids = PORTFOLIO_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("각 프리셋의 weights 합이 1이다", () => {
    for (const p of PORTFOLIO_PRESETS) {
      expect(p.riskyAssetWeight + p.safeAssetWeight).toBeCloseTo(1, 10);
    }
  });

  it("netReturnRate는 expectedReturnRate - annualFeeRate이다", () => {
    for (const p of PORTFOLIO_PRESETS) {
      expect(netReturnRate(p)).toBeCloseTo(p.expectedReturnRate - p.annualFeeRate, 10);
    }
  });

  it("모든 순 수익률이 -0.5~0.5 범위 내이다", () => {
    for (const p of PORTFOLIO_PRESETS) {
      const net = netReturnRate(p);
      expect(net).toBeGreaterThan(-0.5);
      expect(net).toBeLessThan(0.5);
    }
  });

  it("description에 '가정합니다'가 포함되고 '추천'/'가입'은 없다", () => {
    for (const p of PORTFOLIO_PRESETS) {
      expect(p.description).toContain("가정합니다");
      expect(p.description).not.toContain("추천");
      expect(p.description).not.toContain("가입");
    }
  });
});
