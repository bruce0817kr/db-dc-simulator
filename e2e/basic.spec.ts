import { test, expect } from "@playwright/test";
import { TEXTS } from "./utils";

/**
 * manual-qa.md 4.1 기본 샘플 입력 smoke.
 *
 * 자동화: e2e/basic.spec.ts
 * 기본값 로드 → 카드 4장 + 손익분기 문장 + 주의문구 "세전 시뮬레이션입니다".
 */
test.describe("4.1 기본 샘플 입력 smoke", () => {
  test("기본값 로드 → 결과 카드 4장 + 손익분기 문장 + 주의문구", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(TEXTS.dbCard)).toBeVisible();
    await expect(page.getByText(TEXTS.dcCard)).toBeVisible();
    await expect(page.getByText(TEXTS.differenceCard)).toBeVisible();
    // 손익분기 수익률 — h3 제목이 가장 안정적
    await expect(page.getByRole("heading", { name: /손익분기 수익률/ })).toBeVisible();

    // 손익분기 문장
    await expect(page.getByText(/이상 운용해야/)).toBeVisible();

    // 주의문구 — "세전 시뮬레이션입니다"
    await expect(page.getByText(/세전 시뮬레이션입니다/)).toBeVisible();
  });
});