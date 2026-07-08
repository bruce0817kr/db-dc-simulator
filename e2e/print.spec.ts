import { test, expect } from "@playwright/test";
import { TEXTS } from "./utils";

/**
 * manual-qa.md 4.15 인쇄/PDF 보고서 — 자동 부분.
 * 자동화: e2e/print.spec.ts
 * 수동 유지: 실제 OS 인쇄 대화상자 → PDF 저장 → 파일 열기 → 페이지 수 확인
 *
 * 본 spec은:
 *   - window.print 호출 여부만 spy로 검증 (OS 대화상자 자동화 X)
 *   - print media emulate로 print-only 헤더 표시 + print:hidden 동작 확인
 */
test.describe("4.15 인쇄/PDF 보고서 (자동 부분)", () => {
  test("window.print 호출 검증 (stub)", async ({ page }) => {
    // window.print를 spy로 교체 — 실제 대화상자 호출 방지
    await page.addInitScript(() => {
      (window as unknown as { __printCalled?: boolean }).__printCalled = false;
      window.print = () => {
        (window as unknown as { __printCalled?: boolean }).__printCalled = true;
      };
    });

    await page.goto("/");
    await page.getByRole("button", { name: TEXTS.printButton }).click();

    // setTimeout(0) 후 호출되므로 약간 대기
    await page.waitForTimeout(100);
    const called = await page.evaluate(
      () => (window as unknown as { __printCalled?: boolean }).__printCalled
    );
    expect(called).toBe(true);
  });

  test("print media → print-only 헤더 표시 + screen-only 요소 숨김 + 생성 시각", async ({ page }) => {
    await page.goto("/");

    // 생성 시각은 인쇄 클릭 후에만 채워지므로 먼저 클릭
    await page.getByRole("button", { name: TEXTS.printButton }).click();
    await page.waitForTimeout(100);

    // 화면 상태: print 헤더 숨김, ShareSection 표시
    await expect(page.getByText(TEXTS.printReportTitle)).not.toBeVisible();
    await expect(page.getByRole("button", { name: TEXTS.shareButton })).toBeVisible();

    // print media로 전환
    await page.emulateMedia({ media: "print" });

    // print-only 헤더 표시
    await expect(page.getByText(TEXTS.printReportTitle)).toBeVisible();

    // 생성 시각 텍스트 표시 (YYYY-MM-DD HH:MM) — print 모드에서 가시
    await expect(page.getByText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)).toBeVisible();

    // screen-only 요소 숨김 (print:hidden)
    await expect(page.getByRole("button", { name: TEXTS.shareButton })).not.toBeVisible();
    await expect(page.getByRole("button", { name: TEXTS.printButton })).not.toBeVisible();

    // 주요 섹션은 print에서도 존재
    await expect(page.getByText(TEXTS.dbCard)).toBeVisible();
    await expect(page.getByText(/투자 권유가 아닌 시뮬레이션 결과입니다/)).toBeVisible();
  });
});