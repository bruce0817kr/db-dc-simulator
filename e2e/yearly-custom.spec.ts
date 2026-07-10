import { test, expect } from "@playwright/test";
import { TEXTS } from "./utils";

/**
 * PR 15C — YEARLY_CUSTOM (연도별 직접 입력) salary path UI E2E.
 * 자동화: e2e/yearly-custom.spec.ts
 *
 * manual-qa.md 4.7 연도별 직접 입력 시나리오에 대응.
 */

/** 고급 임금 시나리오 details summary를 펼침. */
async function openAdvanced(page: import("@playwright/test").Page) {
  await page.locator("summary", { hasText: "고급 임금 시나리오" }).click();
}

test.describe("4.7 연도별 직접 입력 (YEARLY_CUSTOM)", () => {
  test("(yc-1) 모드 선택 → n개 행 표시 / 기본 복귀 시 숨김", async ({ page }) => {
    await page.goto("/");

    // 남은 근속연수 3년으로 단순화
    await page.getByLabel("남은 근속연수").fill("3");
    await openAdvanced(page);
    await page.getByLabel("임금 경로 모드").selectOption("YEARLY_CUSTOM");

    await expect(page.getByLabel("1년차 연봉")).toBeVisible();
    await expect(page.getByLabel("2년차 연봉")).toBeVisible();
    await expect(page.getByLabel("3년차 연봉")).toBeVisible();
    await expect(page.getByLabel("4년차 연봉")).toHaveCount(0);

    // 기본 모드 복귀 → 행 숨김
    await page.getByLabel("임금 경로 모드").selectOption("CONSTANT_GROWTH");
    await expect(page.getByLabel("1년차 연봉")).toHaveCount(0);
  });

  test("(yc-2) 현재 연봉으로 채우기 → baseline 채움 + 적용 중 뱃지", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("남은 근속연수").fill("2");
    await openAdvanced(page);
    await page.getByLabel("임금 경로 모드").selectOption("YEARLY_CUSTOM");

    // 1년차 비운 뒤 채우기 버튼 → baseline(80,000,000 × 1.03 = 82,400,000)
    await page.getByLabel("1년차 연봉").fill("");
    await page.getByRole("button", { name: "현재 연봉으로 채우기" }).click();
    await expect(page.getByLabel("1년차 연봉")).toHaveValue(/82,400,000/);

    // 결과 계산 + 고급 시나리오 적용 중 뱃지
    await expect(page.getByText(TEXTS.dbCard)).toBeVisible();
    await expect(page.getByText("고급 임금 시나리오 적용 중")).toBeVisible();
  });

  test("(yc-3) 행 하나 비우기 → validation 에러 + 결과 패널 계산 보류", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("남은 근속연수").fill("2");
    await openAdvanced(page);
    await page.getByLabel("임금 경로 모드").selectOption("YEARLY_CUSTOM");

    await page.getByLabel("1년차 연봉").fill("");

    await expect(page.getByText(/연도별 연봉을 확인해주세요/)).toBeVisible();
    await expect(
      page.getByText("모든 입력값을 올바르게 입력하면 결과가 표시됩니다.")
    ).toBeVisible();
  });

  test("(yc-4) 기본 공유 링크에 salaries 미포함 + 옵트인 안내문", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("남은 근속연수").fill("2");
    await openAdvanced(page);
    await page.getByLabel("임금 경로 모드").selectOption("YEARLY_CUSTOM");

    await expect(
      page.getByText(/고급 임금 시나리오.*공유 링크에 포함되지 않습니다/)
    ).toBeVisible();

    await page.getByRole("button", { name: TEXTS.shareButton }).click();
    const url = await page.evaluate(() => navigator.clipboard.readText());

    // 공유 버튼이 실제로 URL을 생성했는지 긍정 단정(false-pass 방지)
    expect(url).toContain("salary=");
    expect(url).not.toContain("salaries=");
    expect(url).not.toContain("yearlySalaries");
  });

  test("(yc-5) print media → 보고서에 연도별 직접 입력 요약줄 표시", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("남은 근속연수").fill("2");
    await openAdvanced(page);
    await page.getByLabel("임금 경로 모드").selectOption("YEARLY_CUSTOM");

    // 인쇄 클릭 → 생성 시각 채움
    await page.getByRole("button", { name: TEXTS.printButton }).click();
    await page.waitForTimeout(100);

    await page.emulateMedia({ media: "print" });

    // 요약줄: "연도별 직접 입력 — 2년치 (첫 ... / 마지막 ...)"
    // em-dash(—) 인코딩 차이 회피: 연도/금액 토큰만으로 단정
    const reportCell = page.locator("td", { hasText: "연도별 직접 입력" });
    await expect(reportCell).toBeVisible();
    await expect(reportCell).toContainText("2년치");
    await expect(reportCell).toContainText("첫 82,400,000원");
  });
});
