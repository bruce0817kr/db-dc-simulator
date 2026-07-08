# DB/DC 퇴직연금 전환 시뮬레이터

한국 직장인을 위한 DB/DC 퇴직연금 전환 시뮬레이터.
DB 유지 vs DC 전환 예상 퇴직급여 비교, 손익분기 연평균 수익률, 민감도, 리스크, 세금/현재가치, 인쇄용 보고서를 제공한다.

> 본 서비스는 투자 권유 도구가 아닙니다. 자세한 내용은 `docs/disclaimer.md` 참조.

## 특징

- DB/DC 예상 퇴직급여 + 차이 금액 + 손익분기 연평균 수익률
- 임금상승률 × 운용수익률 민감도 매트릭스 (54 points)
- 몬테카를로 기반 리스크 시뮬레이션 (seed 고정 재현성)
- 퇴직 직전 시장 하락 스트레스 테스트 (-10/20/30/40%)
- 퇴직소득세 추정 + 현재가치 환산 (옵션)
- URL 공유, 인쇄용 보고서 출력
- 고급 임금 시나리오 (CONSTANT_GROWTH, WAGE_PEAK, STEP_UP, YEARLY_CUSTOM)

## 제품 원칙 (요약)

- 투자 권유 도구가 아님
- 특정 ETF/금융상품 매수 권유 금지
- S&P 500, NASDAQ 100 = "지수 추종형 자산을 가정"
- 모든 결과는 입력값 기반 세전 시뮬레이션
- 실제 결과는 회사 규약, 평균임금 산정 방식, 임금피크제, 상여·성과급, 세금, 운용성과, 제도 변경에 따라 달라짐

자세한 내용은 `docs/product-principles.md` 참조.

## 시작하기

```bash
pnpm install
pnpm exec playwright install chromium   # E2E용 브라우저 (최초 1회)
pnpm dev      # 개발 서버 (http://localhost:3000)
pnpm test     # 단위/UI 테스트 (vitest)
pnpm lint     # eslint
pnpm build    # 프로덕션 빌드 (정적 프리렌더 /)
pnpm e2e      # Playwright E2E (release QA)
pnpm qa       # test + lint + build + e2e 통합 게이트
```

## 기술 스택

- Next.js 16 (App Router)
- TypeScript
- React 19
- Tailwind CSS 4
- Vitest + @testing-library/react + jsdom

## 프로젝트 구조

```
src/
  calculator/        # 계산 엔진 (deterministic pure TypeScript)
    types.ts
    salary.ts
    db.ts
    dc.ts
    breakeven.ts
    simulate.ts
    sensitivity.ts
    portfolio.ts
    rules.ts
    monte-carlo.ts
    stress.ts
    salary-path.ts
    tax.ts
    tax-rules.ts
    present-value.ts
    random.ts
    index.ts
  features/
    simulator/       # 시뮬레이터 도메인 UI
      components/
      hooks/
      utils/
      types.ts
  components/
    ui/              # 공통 UI 컴포넌트
app/
  page.tsx           # 라우트 (SimulatorPage 렌더)
  layout.tsx
  globals.css
docs/
  project-master-plan.md
  calculation-policy.md
  product-principles.md
  disclaimer.md
  test-scenarios.md
  release-checklist.md
```

## 계산 가정

- 금액: KRW, JavaScript `number` 타입 (원 단위)
- 수익률·상승률: decimal rate (`0.03` = 3%)
- UI 표시: `3%` 퍼센트 / 계산 엔진 전달: `0.03` decimal
- 계산 로직(`src/calculator`)과 UI(`src/features`) 분리
- 룰셋 중앙 관리: `src/calculator/rules.ts` `DEFAULT_RULE_SET`
- 외부 API 없음, 모든 계산 브라우저 내 수행
- 차트 라이브러리 미사용

자세한 계산 규약은 `docs/calculation-policy.md` 참조.

## 문서

| 문서 | 내용 |
|------|------|
| `docs/project-master-plan.md` | 전체 개발 계획 (Phase 1~12, PR 1~10) |
| `docs/calculation-policy.md` | 계산 규약, 산식, 단위 규약 |
| `docs/product-principles.md` | 제품 철학, 투자 권유 금지, 표현 규칙 |
| `docs/disclaimer.md` | 면책 고지, 세전 시뮬레이션, 개인정보 안내 |
| `docs/test-scenarios.md` | 테스트 시나리오 명세, golden 케이스 |
| `docs/release-checklist.md` | 배포 전 검증 항목 |
| `docs/manual-qa.md` | 수동 QA 시나리오 18개 + 결과 기록 형식 |
| `docs/deployment-notes.md` | 빌드 산출물, 호스팅, 롤백 절차 |

## 면책 고지

본 결과는 입력값과 단순화된 계산 가정에 따른 세전 시뮬레이션입니다.
실제 퇴직급여는 회사 퇴직연금 규약, 평균임금 산정 방식, 임금피크제, 상여·성과급, 세금, 운용성과에 따라 달라질 수 있습니다.

자세한 내용은 `docs/disclaimer.md` 참조.

## 배포 전 확인

릴리스 전 `docs/release-checklist.md`와 `docs/manual-qa.md`의 항목을 모두 충족해야 합니다. 배포 환경 정보는 `docs/deployment-notes.md`를 참조.
