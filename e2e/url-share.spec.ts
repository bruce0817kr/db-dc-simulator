import { test, expect } from "@playwright/test";
import { LABELS, TEXTS } from "./utils";

/**
 * manual-qa.md 4.14 URL 공유 복원.
 * 자동화: e2e/url-share.spec.ts
 *
 * 흐름:
 *  1. 기본값에서 공유 버튼 클릭 → clipboard.writeText 호출
 *  2. 클립보드 URL에 핵심 파라미터 포함
 *  3. 복사되었습니다 메시지 + 개인정보 경고문 표시
 *  4. 신규 페이지 컨텍스트에서 URL을 직접 이동 → 입력값 복원
 */
test.describe("4.14 URL 공유 복원", () => {
  test("공유 버튼 클릭 → 클립보드 URL + 개인정보 경고문", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: TEXTS.shareButton }).click();

    // 복사 완료 메시지
    await expect(page.getByText("복사되었습니다")).toBeVisible();

    // 클립보드에 기대 URL
    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain("salary=80000000");
    expect(url).toContain("method=TRANSFER_ALL_TO_DC");

    // 개인정보 경고문
    await expect(page.getByText(/재무 정보가 그대로 포함됩니다/)).toBeVisible();
    await expect(page.getByText(/서버에 저장하지 않습니다/)).toBeVisible();
  });

  test("공유 URL → 신규 페이지에서 입력값 복원", async ({ browser }) => {
    // 1차 페이지에서 URL 생성
    const page1 = await browser.newPage();
    await page1.goto("/");
    await page1.getByRole("button", { name: TEXTS.shareButton }).click();
    const url = await page1.evaluate(() => navigator.clipboard.readText());
    await page1.close();

    // 신규 컨텍스트에서 URL 로드 → 복원
    const page2 = await browser.newPage();
    await page2.goto(url);

    await expect(page2.getByLabel(LABELS.currentSalary)).toHaveValue(/80,000,000/);
    await expect(page2.getByLabel(LABELS.currentYearsOfService)).toHaveValue("10");
    await expect(page2.getByLabel(LABELS.remainingYearsOfService)).toHaveValue("15");
    await expect(page2.getByText(TEXTS.dbCard)).toBeVisible();
    await expect(page2.getByText(TEXTS.dcCard)).toBeVisible();
    await page2.close();
  });
});