import { test, expect } from "@playwright/test";
import { LABELS, TEXTS } from "./utils";

/**
 * manual-qa.md 시나리오 자동화 매핑:
 *   4.2  DB 유리 (DC 1%)
 *   4.3  DC 유리 (DC 7%)
 *   4.4  CUSTOM_TRANSFER_AMOUNT 정산금 노출
 *   4.8  포트폴리오 프리셋 6개
 *   4.9  위험자산 한도 안내
 *   4.10 몬테카를로 리스크 섹션
 *   4.11 스트레스 테스트
 *   4.12 세전/세후 토글
 *   4.13 현재가치 표시
 *   4.17 긴 금액 (10억) 자동 부분
 */

test.describe("4.2 DB 유리 케이스", () => {
  test("DC 1% → DB 유리 라벨 + 손익분기 문장 존재", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(LABELS.dcReturnRate).fill("1");
    // "DB 유리" 라벨 — 차이 카드 배지가 가장 안정적 (.first())
    await expect(page.getByText("DB 유리", { exact: true }).first()).toBeVisible();
    // 손익분기 문장 여전히 존재 (방향성 검증)
    await expect(page.getByText(/이상 운용해야/)).toBeVisible();
  });
});

test.describe("4.3 DC 유리 케이스", () => {
  test("DC 7% → DC 유리 라벨 + 손익분기 문장 존재", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(LABELS.dcReturnRate).fill("7");
    await expect(page.getByText("DC 유리", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/이상 운용해야/)).toBeVisible();
  });
});

test.describe("4.4 CUSTOM_TRANSFER_AMOUNT", () => {
  test("전환 방식 토글 → 정산금 입력 노출/숨김", async ({ page }) => {
    await page.goto("/");

    // 기본값(TRANSFER_ALL_TO_DC)에서 정산금 입력 숨김
    await expect(page.getByLabel(LABELS.customTransferAmount)).not.toBeVisible();

    // CUSTOM으로 변경 → 정산금 입력 노출
    await page.getByLabel(LABELS.conversionMethod).selectOption("CUSTOM_TRANSFER_AMOUNT");
    await expect(page.getByLabel(LABELS.customTransferAmount)).toBeVisible();

    // 되돌리면 숨김
    await page.getByLabel(LABELS.conversionMethod).selectOption("TRANSFER_ALL_TO_DC");
    await expect(page.getByLabel(LABELS.customTransferAmount)).not.toBeVisible();
  });
});

test.describe("4.8 포트폴리오 프리셋 변경", () => {
  // presetId → 기대 netReturnRate(%). portfolio.ts의 netReturnRate 기준.
  const PRESETS: Array<[string, string]> = [
    ["deposit", "2.4"],
    ["stable", "3.2"],
    ["neutral", "4.1"],
    ["aggressive", "5"],
    ["sp500", "5.6"],
    ["nasdaq100", "6"],
  ];

  for (const [id, expectedReturn] of PRESETS) {
    test(`프리셋 ${id} → DC 수익률 ${expectedReturn}% 자동 반영`, async ({ page }) => {
      await page.goto("/");
      await page.getByLabel(LABELS.portfolioPreset).selectOption(id);
      await expect(page.getByLabel(LABELS.dcReturnRate)).toHaveValue(expectedReturn);
    });
  }

  test("가정치 안내 + 좁힌 금지 문구 부재", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(LABELS.portfolioPreset).selectOption("sp500");

    // 가정치 안내
    await expect(page.getByText(/가정치이며 예측이나 보장이 아닙니다/)).toBeVisible();

    // 좁힌 금지 문구 부재 (정상 문맥 "가입자" 등은 허용)
    const text = (await page.locator("body").textContent()) ?? "";
    expect(text).not.toMatch(/S&P 500 ETF에 가입/);
    expect(text).not.toMatch(/NASDAQ 100.*가입/);
    expect(text).not.toMatch(/이 상품을 사/);
    expect(text).not.toMatch(/매수하/);
    expect(text).not.toMatch(/확정 수익입니다/);
    expect(text).not.toMatch(/보장 수익률입니다/);
  });
});

test.describe("4.9 위험자산 한도 안내", () => {
  test("현재 서비스의 계산 가정 details 펼침 → 룰셋 정보 표시", async ({ page }) => {
    await page.goto("/");

    // AssumptionNotice의 details summary 클릭으로 펼침
    const summary = page.getByText(TEXTS.rulesSummary);
    await summary.click();

    // details 하위 ul의 li로 스코프 — PrintReportHeader의 hidden <li>와 분리
    const detailsList = page.locator("details ul li");
    await expect(detailsList.filter({ hasText: /연간 임금총액의 1\/12/ })).toBeVisible();
    await expect(detailsList.filter({ hasText: /위험자산 비중 한도: 70%/ })).toBeVisible();
  });
});

test.describe("4.10 몬테카를로 리스크 섹션", () => {
  test("리스크 섹션 + 확률 카드 + 확정 예측 아님 안내", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(TEXTS.riskSectionH2)).toBeVisible();
    await expect(page.getByText(TEXTS.probabilityLabel)).toBeVisible();
    await expect(page.getByText(/확정 예측이 아닙니다/)).toBeVisible();
  });
});

test.describe("4.11 스트레스 테스트", () => {
  test("기본값(CUSTOM)에서 -10/20/30/40% 4행 표시", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(TEXTS.stressSectionH2)).toBeVisible();
    for (const rate of ["10%", "20%", "30%", "40%"]) {
      await expect(page.getByText(rate, { exact: true }).first()).toBeVisible();
    }
  });

  test("예금형 선택 → '영향 받지 않음' + 스트레스 표 미렌더", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(LABELS.portfolioPreset).selectOption("deposit");

    await expect(page.getByText(/영향을 받지 않습니다/)).toBeVisible();
    // 예금형에서는 4개 하락률 행이 표 형태로 나오지 않음
    const rows = page.locator("td", { hasText: /^(10|20|30|40)%$/ });
    await expect(rows).toHaveCount(0);
  });
});

test.describe("4.12 세전/세후 토글", () => {
  test("세후 체크 → (세후) 라벨 + 실효세율 + 세법 고지", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("checkbox", { name: TEXTS.afterTaxCheckbox }).check();

    await expect(page.getByText(/\(세후\)/).first()).toBeVisible();
    await expect(page.getByText(/실효세율/).first()).toBeVisible();
    await expect(page.getByText(/세법 기준 단순 추정치입니다/)).toBeVisible();
  });
});

test.describe("4.13 현재가치 표시", () => {
  test("현재가치 체크 → 물가상승률 입력 노출", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByLabel(LABELS.inflationRate)).not.toBeVisible();
    await page.getByRole("checkbox", { name: TEXTS.presentValueCheckbox }).check();
    await expect(page.getByLabel(LABELS.inflationRate)).toBeVisible();
  });

  test("물가상승률 11 → 에러 메시지", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("checkbox", { name: TEXTS.presentValueCheckbox }).check();

    await page.getByLabel(LABELS.inflationRate).fill("11");
    await expect(page.getByText(/0%에서 10% 사이로 입력해주세요/)).toBeVisible();
  });
});

test.describe("4.17 긴 금액 표시 (10억 원) — 자동 부분", () => {
  test("연봉 10억 입력 → 콤마 포맷 + 콘솔 에러 0건", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/");
    await page.getByLabel(LABELS.currentSalary).fill("1000000000");
    // blur해야 콤마 포맷 적용 (useSimulatorForm onBlur)
    await page.getByLabel(LABELS.currentSalary).blur();

    // 콤마 포맷
    await expect(page.getByLabel(LABELS.currentSalary)).toHaveValue(/1,000,000,000/);

    // 결과 카드 여전히 표시
    await expect(page.getByText(TEXTS.dbCard)).toBeVisible();

    // 콘솔 에러 0건
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});