import { expect, test } from "@playwright/test";
import { LABELS } from "./utils";

test.describe("PR 18 DB/DC 민감도 차트", () => {
  test("기본 입력에서 차트와 정확한 수치 표를 함께 표시한다", async ({ page }) => {
    await page.goto("/");

    const chart = page.getByRole("img", { name: "DB/DC 예상 퇴직급여 비교 차트" });
    await expect(chart).toBeVisible();
    await expect(chart.locator('[data-point-series="DB"]')).toHaveCount(9);
    await expect(chart.locator('[data-point-series="DC"]')).toHaveCount(9);
    await expect(chart.locator("text").filter({ hasText: /^손익분기 약/ })).toBeVisible();
    await expect(chart.locator("text").filter({ hasText: /^현재 입력 5.0%$/ })).toBeVisible();

    const section = page.getByRole("heading", {
      name: "수익률별 결과 (현재 임금상승률 기준)",
    }).locator("..");
    await expect(section.locator("table")).toBeVisible();
  });

  test("현재 입력 수익률 변경을 차트 표식에 즉시 반영한다", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(LABELS.dcReturnRate).fill("7");

    await expect(page.getByText("현재 입력 7.0%", { exact: true })).toBeVisible();
  });

  test("표시 범위 밖 입력을 축 끝으로 왜곡하지 않고 안내한다", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(LABELS.dcReturnRate).fill("12");

    await expect(
      page.getByText("현재 입력 수익률은 표시 범위 밖입니다.", { exact: true })
    ).toBeVisible();
    await expect(page.getByText(/현재 입력 12/)).toHaveCount(0);
  });

  for (const width of [375, 768, 1280]) {
    test(`${width}px에서 차트가 잘리지 않고 표시된다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");

      const chart = page.getByRole("img", { name: "DB/DC 예상 퇴직급여 비교 차트" });
      await expect(chart).toBeVisible();
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }

  test("인쇄 미디어에서 차트와 정확한 수치 표를 함께 표시한다", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });

    await expect(
      page.getByRole("img", { name: "DB/DC 예상 퇴직급여 비교 차트" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "수익률별 결과 (현재 임금상승률 기준)" })
        .locator("..")
        .locator("table")
    ).toBeVisible();
  });

  test("입력 변경 중 브라우저 오류를 발생시키지 않는다", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");
    await page.getByLabel(LABELS.dcReturnRate).fill("7");
    await page.getByLabel(LABELS.dcReturnRate).fill("12");
    await expect(page.getByText("현재 입력 수익률은 표시 범위 밖입니다.", { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
