/**
 * PR 14 E2E 공통 유틸.
 *
 * 과한 추상화 금지 지침 반영:
 * - 공통 라벨 셀렉터
 * - 금지/필수 문구 정규식
 * - 기본 helper (goto, 값 채우기)
 *
 * UI 컴포넌트에 data-testid를 추가하지 않으므로
 * label, role, text 기반 locator만 사용한다.
 */

/** 입력 폼 라벨 — SimulatorForm.tsx의 label 문자열과 일치 */
export const LABELS = {
  currentSalary: "현재 연봉",
  currentYearsOfService: "현재 근속연수",
  remainingYearsOfService: "남은 근속연수",
  salaryGrowthRate: "예상 임금상승률",
  dcReturnRate: "DC 예상 운용수익률",
  dcVolatility: "연간 변동성",
  conversionMethod: "전환 방식",
  customTransferAmount: "전환 정산금",
  portfolioPreset: "포트폴리오 프리셋",
  inflationRate: "물가상승률 (%)",
} as const;

/** 핵심 결과 카드 / 섹션 제목 텍스트 */
export const TEXTS = {
  dbCard: "DB 유지 예상액",
  dcCard: "DC 전환 예상액",
  differenceCard: "차이 금액",
  breakevenCard: "손익분기 수익률",
  riskSectionH2: "운용 성과가 흔들린다면? (리스크 시뮬레이션)",
  stressSectionH2: "퇴직 직전 시장이 하락한다면? (스트레스 테스트)",
  sensitivityHeading: "가정이 달라지면?",
  probabilityLabel: "DC가 DB보다 유리할 확률",
  rulesSummary: "현재 서비스의 계산 가정",
  shareButton: "공유 링크 복사",
  printButton: "보고서 인쇄 · PDF 저장",
  afterTaxCheckbox: "세후 금액 보기",
  presentValueCheckbox: "현재가치로 보기",
  printReportTitle: "DB/DC 퇴직연금 전환 시뮬레이션 보고서",
} as const;

/**
 * 제품 원칙 회귀 — 금지 문구 패턴.
 *
 * "추천", "가입" 같은 단어 전체 부재 검증은 정상 문맥("가입자") false positive 위험.
 * 대신 명확한 권유/단정 패턴으로 좁힘 (PR 14 지침 #3).
 */
export const FORBIDDEN_PATTERNS: RegExp[] = [
  /S&P 500 ETF에 가입/,
  /NASDAQ 100.*가입/,
  /이 상품을 사/,
  /매수하/,
  /확정 수익입니다/,
  /보장 수익률입니다/,
];

/** 제품 원칙 회귀 — 필수 문구 패턴 */
export const REQUIRED_PATTERNS: RegExp[] = [
  /세전 시뮬레이션/,
  /확정 예측이 아닙니다/,
  /달라질 수 있습니다/,
  /재무 정보가 그대로 포함/,
];

/** 기본값에서 시작하도록 페이지 로드. 커스텀 쿼리 필요 시 인자로 전달. */
export function baseGoto(page: import("@playwright/test").Page, query = "") {
  return page.goto("/" + (query ? "?" + query : ""));
}

/**
 * 페이지 전체 텍스트 반환. 금지/필수 문구 검증에 사용.
 */
export async function bodyText(page: import("@playwright/test").Page): Promise<string> {
  return (await page.locator("body").textContent()) ?? "";
}