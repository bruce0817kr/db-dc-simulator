import { test, expect } from "@playwright/test";
import { LABELS, TEXTS } from "./utils";

/**
 * manual-qa.md 4.16 모바일 375px 폭.
 * 자동화: e2e/mobile.spec.ts
 *
 * 본 spec은 chromium-mobile-375 프로젝트(Pixel 5, 375px)에서만 실행.
 * playwright.config.ts의 testMatch로 제한.
 */
test.describe("4.16 모바일 375px 폭", () => {
  test("1단 레이아웃 + 입력 가능 + 결과 표시", async ({ page }) => {
    await page.goto("/");

    // 결과 카드 표시 — 페이지가 정상 로드되었는지 가장 직접적인 확인
    await expect(page.getByText(TEXTS.dbCard)).toBeVisible();

    // 입력 가능 — blur 후 콤마 포맷 적용 (useSimulatorForm onBlur)
    await page.getByLabel(LABELS.currentSalary).fill("50000000");
    await page.getByLabel(LABELS.currentSalary).blur();
    await expect(page.getByLabel(LABELS.currentSalary)).toHaveValue(/50,000,000/);

    // 결과 갱신
    await expect(page.getByText(TEXTS.dcCard)).toBeVisible();
  });

  test("민감도 섹션 렌더 — overflow-x-auto 컨테이너 존재", async ({ page }) => {
    await page.goto("/");

    // 민감도 섹션 헤더
    await expect(page.getByText(TEXTS.sensitivityHeading)).toBeVisible();

    // overflow-x-auto 컨테이너 존재 — 375px에서 표가 가로 스크롤 컨테이너 안에 있음
    const scrollContainer = page.locator("[class*='overflow-x-auto']").first();
    await expect(scrollContainer).toBeVisible();
  });
});