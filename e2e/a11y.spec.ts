import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { FORBIDDEN_PATTERNS, REQUIRED_PATTERNS, LABELS } from "./utils";

/**
 * manual-qa.md 4.18 + 신규 — 접근성 자동 스캔 + 제품 원칙 회귀.
 * 자동화: e2e/a11y.spec.ts
 *
 * 1. WCAG 2.1 AA 자동 스캔 (critical/serious 위반 0건)
 *    단, color-contrast는 UI 색상 변경이 본 PR out of scope이므로
 *    본 스캔에서 제외하고 별도 수동 QA/후속 PR에서 다룬다.
 * 2. 제품 원칙 회귀 — 금지/필수 문구 검증
 *    - 금지: "추천"/"가입" 전체 부재 아님. 좁힌 패턴만(PR 14 지침 #3).
 *    - 필수: "세전 시뮬레이션", "확정 예측이 아닙니다" 등
 */

test.describe("접근성 자동 스캔", () => {
  test("WCAG 2.1 AA — critical/serious 위반 0건 (color-contrast 제외)", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(criticalOrSerious).toHaveLength(0);
  });

  test("프리셋 변경 후 접근성 유지 (sp500, color-contrast 제외)", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(LABELS.portfolioPreset).selectOption("sp500");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(criticalOrSerious).toHaveLength(0);
  });
});

test.describe("제품 원칙 회귀", () => {
  test("금지 문구 부재 (좁힌 패턴)", async ({ page }) => {
    await page.goto("/");
    const text = (await page.locator("body").textContent()) ?? "";

    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(text).not.toMatch(pattern);
    }
  });

  test("필수 문구 존재", async ({ page }) => {
    await page.goto("/");
    const text = (await page.locator("body").textContent()) ?? "";

    for (const pattern of REQUIRED_PATTERNS) {
      expect(text).toMatch(pattern);
    }
  });

  test("sp500 프리셋 → '지수 추종형 자산' 표현 존재", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(LABELS.portfolioPreset).selectOption("sp500");

    const text = (await page.locator("body").textContent()) ?? "";
    expect(text).toMatch(/지수 추종형 자산/);
  });

  test("nasdaq100 프리셋 → '지수 추종형 자산' 표현 존재", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(LABELS.portfolioPreset).selectOption("nasdaq100");

    const text = (await page.locator("body").textContent()) ?? "";
    expect(text).toMatch(/지수 추종형 자산/);
  });
});