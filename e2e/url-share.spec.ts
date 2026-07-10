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
    await expect(page.getByText(/별도 데이터베이스에 저장하지 않지만/)).toBeVisible();
    await expect(page.getByText(/운영 서버 접속 로그에 남을 수 있습니다/)).toBeVisible();
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

  test("고급 임금 설정 옵트인 → 연도별 연봉과 평균임금 복원", async ({ browser }) => {
    const page1 = await browser.newPage();
    await page1.goto("/");
    await page1.getByLabel("남은 근속연수").fill("2");
    await page1.locator("summary", { hasText: "고급 임금 시나리오" }).click();
    await page1.getByLabel("임금 경로 모드").selectOption("YEARLY_CUSTOM");
    await page1.getByLabel("평균임금 직접 입력 (선택)").fill("90000000");

    const optIn = page1.getByRole("checkbox", {
      name: "고급 임금 설정도 공유 링크에 포함",
    });
    await expect(optIn).not.toBeChecked();
    await optIn.check();
    await page1.getByRole("button", { name: TEXTS.shareButton }).click();

    const url = await page1.evaluate(() => navigator.clipboard.readText());
    const params = new URL(url).searchParams;
    expect(params.get("advanced")).toBe("1");
    expect(params.get("salaryMode")).toBe("YEARLY_CUSTOM");
    expect(params.get("salaries")).toBe("82400000,84872000");
    expect(params.get("dbAverageSalary")).toBe("90000000");
    await page1.close();

    const page2 = await browser.newPage();
    await page2.goto(url);
    await page2.locator("summary", { hasText: "고급 임금 시나리오" }).click();
    await expect(page2.getByLabel("임금 경로 모드")).toHaveValue("YEARLY_CUSTOM");
    await expect(page2.getByLabel("1년차 연봉")).toHaveValue("82,400,000");
    await expect(page2.getByLabel("2년차 연봉")).toHaveValue("84,872,000");
    await expect(page2.getByLabel("평균임금 직접 입력 (선택)")).toHaveValue(
      "90,000,000"
    );
    await page2.close();
  });

  test("손상되거나 과도한 고급 URL → 기본 모드로 안전하게 폴백", async ({ page }) => {
    await page.goto(
      "/?remainingYears=1000000&advanced=1&salaryMode=YEARLY_CUSTOM&salaries=82400000%2C%2C84872000"
    );

    await expect(page.getByLabel("남은 근속연수")).toHaveValue("15");
    await page.locator("summary", { hasText: "고급 임금 시나리오" }).click();
    await expect(page.getByLabel("임금 경로 모드")).toHaveValue("CONSTANT_GROWTH");
    await expect(page.getByText(TEXTS.dbCard)).toBeVisible();
  });
});
