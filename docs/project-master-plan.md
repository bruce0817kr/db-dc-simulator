# DB/DC 퇴직연금 전환 시뮬레이터 전체 개발 계획

## 0. 프로젝트 목적

이 프로젝트는 직장인이 퇴직연금 DB형을 유지할지, DC형으로 전환할지 판단할 수 있도록 돕는 웹 기반 시뮬레이터다.

사용자는 현재 연봉, 현재 근속연수, 남은 근속연수, 예상 임금상승률, DC 운용수익률 또는 포트폴리오 가정을 입력한다.

서비스는 다음 정보를 제공한다.

- DB 유지 예상 퇴직급여
- DC 전환 예상 퇴직급여
- DB 대비 DC 차이 금액
- DC가 DB보다 유리해지기 위한 손익분기 연평균 수익률
- 임금상승률과 운용수익률 변화에 따른 민감도
- S&P 500, NASDAQ 100, 안전자산 등을 가정한 포트폴리오 시뮬레이션
- 장기적으로는 변동성, 손실 가능성, 몬테카를로 시뮬레이션, 세금, PDF 보고서까지 확장한다.

중요한 제품 철학은 다음과 같다.

> 이 서비스는 특정 상품 가입을 권유하는 도구가 아니라, 사용자가 자신의 임금상승률이라는 확정적 복리와 DC 운용수익률이라는 불확실한 복리를 비교하도록 돕는 시뮬레이션 도구다.

---

## 1. 현재 상태

현재 PR 1에서 계산 엔진 MVP가 구현되어 있다고 가정한다.

이미 완료된 범위:

- `docs/calculation-policy.md`
- `src/calculator/types.ts`
- `src/calculator/salary.ts`
- `src/calculator/db.ts`
- `src/calculator/dc.ts`
- `src/calculator/breakeven.ts`
- `src/calculator/simulate.ts`
- `src/calculator/index.ts`
- 계산 엔진 테스트
- 샘플 케이스 검산

샘플 케이스:

```text
현재 연봉: 80,000,000
현재 근속연수: 10
남은 근속연수: 15
임금상승률: 0.03
DC 운용수익률: 0.03
전환 방식: TRANSFER_ALL_TO_DC
````

이 케이스에서는 단순화된 MVP 가정상 DB와 DC 결과가 거의 비슷해야 한다.

---

## 2. 기술 원칙

### 2.1 기본 스택

* Next.js
* TypeScript
* React
* Tailwind CSS
* 계산 로직은 React 컴포넌트와 분리된 pure TypeScript function
* MVP에서는 서버, DB, 로그인 없음
* 사용자의 연봉, 근속연수 등 민감한 입력값은 브라우저 안에서만 처리

### 2.2 아키텍처 원칙

계산 로직과 UI는 반드시 분리한다.

```text
src/
  calculator/
    계산 엔진
  app/
    라우트
  components/
    UI 컴포넌트
  features/
    시뮬레이터 도메인 UI
  lib/
    포맷터, 유틸
```

권장 구조:

```text
src/
  calculator/
    types.ts
    salary.ts
    db.ts
    dc.ts
    breakeven.ts
    simulate.ts
    sensitivity.ts
    portfolio.ts
    monte-carlo.ts
    index.ts

  features/
    simulator/
      components/
        SimulatorForm.tsx
        ResultSummary.tsx
        ResultExplanation.tsx
        SensitivityTable.tsx
        ScenarioAssumptions.tsx
      hooks/
        useSimulatorForm.ts
      utils/
        formatters.ts
      types.ts

  components/
    ui/
      Button.tsx
      Card.tsx
      Input.tsx
      Select.tsx
      NumberInput.tsx
      Tooltip.tsx

  lib/
    format.ts
    constants.ts
```

### 2.3 계산 엔진 원칙

* 계산 함수는 deterministic해야 한다.
* 동일한 input은 항상 동일한 output을 반환해야 한다.
* Date, locale, browser API에 의존하지 않는다.
* 테스트하기 쉬워야 한다.
* UI의 표시 단위와 계산 단위를 분리한다.
* 내부 계산에서는 원 단위 number를 사용한다.
* 수익률은 `0.03`처럼 decimal rate를 사용한다.
* UI에서는 `%`로 보여주되 계산 함수에는 decimal로 전달한다.

---

## 3. 제품 단계별 개발 계획

## Phase 1. MVP 계산 결과 화면

목표:

계산 엔진을 실제 사용자가 만질 수 있는 단일 페이지 UI로 연결한다.

핵심 질문:

> 내 조건에서 DB 유지와 DC 전환 중 어느 쪽이 유리한가?

필수 기능:

* 현재 연봉 입력
* 현재 근속연수 입력
* 남은 근속연수 입력
* 예상 임금상승률 입력
* DC 예상 운용수익률 입력
* 전환 방식 선택
* DB 유지 예상액 표시
* DC 전환 예상액 표시
* 차이 금액 표시
* 손익분기 수익률 표시
* 결과 해석 문장 표시

권장 라우트:

```text
/
또는
/simulator
```

권장 화면 구조:

```text
[Hero]
DB 유지 vs DC 전환, 어느 쪽이 유리할까요?

[입력 카드]
- 현재 연봉
- 현재 근속연수
- 남은 근속연수
- 예상 임금상승률
- DC 예상 운용수익률
- 전환 방식

[결과 요약 카드]
- DB 유지 예상액
- DC 전환 예상액
- 차이 금액
- 손익분기 수익률

[해석 문장]
입력하신 조건에서는 DC 전환 후 연평균 X.X% 이상 운용해야 DB 유지보다 유리합니다.

[주의 문구]
본 계산은 단순화된 시뮬레이션이며 실제 퇴직급여, 세금, 회사 규약, 임금피크제, 상여금 포함 여부에 따라 달라질 수 있습니다.
```

이번 Phase에서 하지 말 것:

* ETF 프리셋
* 몬테카를로
* 세금
* PDF
* 로그인
* 서버 저장
* 외부 금융 API 연동
* 복잡한 차트

완료 기준:

* 사용자가 숫자를 입력하면 실시간으로 결과가 계산된다.
* 잘못된 입력값에 대해 명확한 validation 메시지가 나온다.
* 빈 입력, 음수, 비현실적인 수익률에 대해 깨지지 않는다.
* 모바일에서도 사용 가능하다.
* 계산 결과가 기존 테스트 케이스와 일치한다.

---

## Phase 2. 입력 UX와 검증 강화

목표:

사용자가 숫자 입력에서 실수하지 않도록 한다.

필수 기능:

* 원화 입력 포맷팅
* 퍼센트 입력 포맷팅
* 연수 입력 검증
* 기본값 제공
* 샘플 입력 버튼
* 초기화 버튼
* 입력값 변경 시 즉시 재계산
* 계산 가정 접기/펼치기

권장 기본값:

```text
현재 연봉: 80,000,000
현재 근속연수: 10
남은 근속연수: 15
예상 임금상승률: 3%
DC 예상 운용수익률: 5%
전환 방식: 과거분 전액 DC 이전
```

Validation 기준:

```text
currentSalary > 0
currentYearsOfService >= 0
remainingYearsOfService > 0
salaryGrowthRate >= -0.1 && salaryGrowthRate <= 0.2
dcReturnRate >= -0.5 && dcReturnRate <= 0.5
customTransferAmount >= 0
```

주의:

* validation 범위는 UI 기준이다.
* 계산 엔진 자체도 기본적인 guard를 가져야 한다.
* 다만 guard가 너무 공격적이면 테스트나 고급 시뮬레이션 확장에 방해될 수 있으므로 적정 수준으로 둔다.

---

## Phase 3. 민감도 분석

목표:

단일 가정에 의존하지 않고, 임금상승률과 운용수익률 변화에 따른 결과를 보여준다.

필수 기능:

* 운용수익률별 결과표
* 임금상승률별 결과표
* 임금상승률 × 운용수익률 매트릭스
* DB 유리 / DC 유리 / 거의 동일 표시
* 손익분기 수익률을 강조

권장 계산 파일:

```text
src/calculator/sensitivity.ts
```

권장 타입:

```ts
interface SensitivityPoint {
  salaryGrowthRate: number;
  dcReturnRate: number;
  dbExpectedAmount: number;
  dcExpectedAmount: number;
  difference: number;
  winner: "DB" | "DC" | "TIE";
}

interface SensitivityMatrix {
  salaryGrowthRates: number[];
  dcReturnRates: number[];
  points: SensitivityPoint[];
}
```

권장 UI:

```text
[운용수익률별 결과]
- 0%
- 1%
- 2%
- 3%
- 4%
- 5%
- 6%
- 7%
- 8%

[임금상승률별 손익분기]
- 0%
- 1%
- 2%
- 3%
- 4%
- 5%
```

완료 기준:

* 사용자가 자신의 가정이 조금 달라져도 결과가 어떻게 변하는지 볼 수 있다.
* 색상에만 의존하지 않고 텍스트로도 DB/DC 유리 여부를 표시한다.
* 모바일에서는 표가 가로 스크롤되거나 카드형으로 변환된다.

---

## Phase 4. 공유 가능한 시나리오

목표:

사용자가 입력값을 저장하거나 다른 사람에게 공유할 수 있게 한다.

MVP 방식:

* 서버 저장 없음
* URL query parameter 또는 압축된 hash 기반 공유
* 개인정보 노출 주의 문구 표시

예시:

```text
/simulator?salary=80000000&currentYears=10&remainingYears=15&salaryGrowth=0.03&dcReturn=0.05&method=TRANSFER_ALL_TO_DC
```

권장 기능:

* 현재 입력값으로 공유 링크 만들기
* 링크 복사 버튼
* URL에서 입력값 복원
* 잘못된 URL 값은 안전하게 무시하거나 기본값 사용

주의:

* 연봉 정보가 URL에 포함될 수 있음을 명확히 안내한다.
* 별도 데이터베이스에 저장하지 않으며 URL은 브라우저 기록·운영 서버 접속 로그에 남을 수 있다고 표시한다.
* 향후에는 localStorage 저장을 별도 옵션으로 제공할 수 있다.

---

## Phase 5. DC 포트폴리오 프리셋

목표:

사용자가 단순 수익률 직접 입력뿐 아니라, 포트폴리오 가정으로 DC 결과를 볼 수 있게 한다.

중요한 전제:

* ETF 시뮬레이션은 DB형이 아니라 DC 전환 후 운용 가정이다.
* 특정 ETF 추천처럼 보이면 안 된다.
* 지수 또는 자산군 기반 가정으로 표현한다.

권장 프리셋:

```text
예금형
- 안전자산 100%

안정형
- 위험자산 30%
- 안전자산 70%

중립형
- 위험자산 50%
- 안전자산 50%

공격형
- 위험자산 70%
- 안전자산 30%

S&P 500 중심형
- S&P 500 지수 추종형 자산 70%
- 안전자산 30%

NASDAQ 100 중심형
- NASDAQ 100 지수 추종형 자산 70%
- 안전자산 30%

직접 입력형
- 사용자가 기대수익률, 변동성, 비중 입력
```

권장 타입:

```ts
interface PortfolioPreset {
  id: string;
  name: string;
  description: string;
  expectedReturnRate: number;
  volatility?: number;
  riskyAssetWeight: number;
  safeAssetWeight: number;
  annualFeeRate?: number;
}
```

포트폴리오 계산 원칙:

```text
순 기대수익률 = 기대수익률 - 연간 보수
```

MVP에서는 기대수익률과 보수 차감만 반영한다.

이번 Phase에서 하지 말 것:

* 실시간 ETF 가격 API
* 과거 수익률 자동 다운로드
* 특정 ETF 종목 추천
* 실제 매수 안내

완료 기준:

* 사용자는 직접 수익률 입력 또는 프리셋 선택 중 하나를 사용할 수 있다.
* 프리셋 선택 시 DC 운용수익률이 자동으로 반영된다.
* 위험자산 비중이 기본 한도를 초과하면 경고를 표시한다.
* 경고는 차단이 아니라 안내로 시작한다.

---

## Phase 6. 위험자산 한도와 제도 가정 관리

목표:

DC/IRP 위험자산 한도 등 제도 가정을 코드에 하드코딩하지 않고 설정으로 관리한다.

권장 파일:

```text
src/calculator/rules.ts
```

권장 타입:

```ts
interface PensionRuleSet {
  id: string;
  label: string;
  riskyAssetLimit: number;
  dcContributionRate: number;
  effectiveFrom?: string;
  note?: string;
}
```

기본값 예시:

```ts
const DEFAULT_RULE_SET = {
  id: "kr-retirement-pension-mvp",
  label: "MVP 기본 가정",
  riskyAssetLimit: 0.7,
  dcContributionRate: 1 / 12,
};
```

주의:

* 향후 제도 변경 가능성이 있으므로 UI에 “현재 서비스의 계산 가정”으로 표시한다.
* 법령·규정 데이터는 자동 업데이트하지 않는다.
* 관리자가 바꿀 수 있는 구조를 염두에 둔다.

---

## Phase 7. 리스크 시뮬레이션

목표:

평균 수익률 하나만 보여주는 한계를 넘어서, DC 결과의 불확실성을 보여준다.

필수 기능:

* 기대수익률 입력
* 연간 변동성 입력
* 시뮬레이션 횟수 입력 또는 고정값
* 5%, 25%, 50%, 75%, 95% 분위값
* DC가 DB보다 유리할 확률
* 하위 시나리오에서 DB 대비 손실액 표시

권장 파일:

```text
src/calculator/monte-carlo.ts
```

권장 타입:

```ts
interface MonteCarloInput {
  baseInput: SimulationInput;
  expectedReturnRate: number;
  volatility: number;
  iterations: number;
  seed?: number;
}

interface MonteCarloResult {
  iterations: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  probabilityDcBeatsDb: number;
  worstCase?: number;
  bestCase?: number;
}
```

중요 원칙:

* 테스트 가능성을 위해 seed 기반 pseudo random generator를 사용한다.
* Math.random에 직접 의존하지 않는다.
* UI에서는 “예상 범위”로 표현하고 확정적 예측처럼 표현하지 않는다.

완료 기준:

* 같은 seed에서는 같은 결과가 나온다.
* 기준 시나리오와 리스크 시나리오를 구분해서 보여준다.
* 사용자가 “평균적으로는 DC가 유리하지만 나쁜 경우에는 손해가 날 수 있다”는 점을 이해할 수 있다.

---

## Phase 8. 스트레스 테스트

목표:

퇴직 직전 주식시장 하락 같은 현실적인 위험을 보여준다.

필수 시나리오:

```text
퇴직 직전 위험자산 -10%
퇴직 직전 위험자산 -20%
퇴직 직전 위험자산 -30%
퇴직 직전 위험자산 -40%
```

권장 출력:

```text
기준 시나리오에서는 DC가 5,200만 원 유리합니다.
하지만 퇴직 직전 위험자산이 30% 하락하면 DC가 DB보다 1,800만 원 불리해질 수 있습니다.
```

완료 기준:

* 사용자가 DC 전환의 upside와 downside를 함께 볼 수 있다.
* 단순 기대수익률 중심 판단을 보완한다.

---

## Phase 9. 고급 임금 시나리오

목표:

현실적인 임금 경로를 반영한다.

추가 기능:

* 승진/호봉 점프
* 임금피크제
* 특정 연도 연봉 직접 입력
* 임금상승률 기간별 차등 입력
* 상여/성과급 포함 여부
* 평균임금 직접 입력

권장 타입:

```ts
type SalaryPathMode =
  | "CONSTANT_GROWTH"
  | "YEARLY_CUSTOM"
  | "WAGE_PEAK"
  | "STEP_UP";

interface SalaryPathEvent {
  yearIndex: number;
  type: "RAISE" | "CUT" | "SET_ABSOLUTE";
  value: number;
}
```

주의:

* 이 기능은 DB 결과에 큰 영향을 준다.
* MVP 기본 계산과 고급 계산을 명확히 구분해야 한다.
* 사용자가 회사 규약에 따라 직접 전환정산금을 입력할 수 있는 길을 유지해야 한다.

---

## Phase 10. 세금과 수령 방식

목표:

세전 비교에서 세후 비교로 확장한다.

추가 기능:

* 퇴직소득세 추정
* 일시금 수령
* 연금 수령
* 세전/세후 토글
* 현재가치 환산

주의:

* 세법은 변동 가능성이 높다.
* 세금 계산은 정확도 리스크가 크므로 별도 검증이 필요하다.
* MVP에서는 반드시 “세전 기준”이라고 명확히 표시한다.

---

## Phase 11. 보고서 출력

목표:

사용자가 계산 결과를 저장하거나 상담 자료로 사용할 수 있게 한다.

추가 기능:

* PDF 보고서
* 입력값 요약
* 계산 가정 요약
* DB/DC 비교 결과
* 민감도 표
* 포트폴리오 가정
* 주의사항

주의:

* 보고서에는 투자 권유가 아니라 시뮬레이션이라는 점을 명확히 표시한다.
* 개인정보 포함 가능성이 있으므로 다운로드 전 안내한다.

---

## Phase 12. 제품 신뢰성 강화

목표:

금융 계산 도구로서 신뢰도를 높인다.

필수 문서:

```text
docs/calculation-policy.md
docs/product-principles.md
docs/disclaimer.md
docs/test-scenarios.md
docs/release-checklist.md
```

필수 테스트:

* DB 계산 단위 테스트
* DC 계산 단위 테스트
* 손익분기 수익률 테스트
* 민감도 계산 테스트
* 포트폴리오 계산 테스트
* Monte Carlo seed 재현성 테스트
* UI smoke test
* 주요 샘플 시나리오 snapshot test

필수 검증:

* 계산 정책 문서와 코드 일치 여부
* 기본 샘플 케이스 결과
* 극단값 처리
* 음수/0 입력 처리
* 모바일 UI 확인
* 접근성 기본 확인

---

## 4. PR 단위 개발 로드맵

## PR 1. 계산 엔진 MVP

상태: 완료 또는 완료 예정

범위:

* 계산 정책 문서
* DB 계산
* DC 계산
* 손익분기 수익률
* 샘플 테스트

---

## PR 2. MVP UI 연결

목표:

계산 엔진을 사용자가 조작 가능한 화면에 연결한다.

작업 범위:

* simulator page 생성
* 입력 폼 생성
* 결과 카드 생성
* 결과 해석 문장 생성
* 기본 validation
* 숫자 포맷팅

예상 파일:

```text
src/app/page.tsx
src/features/simulator/components/SimulatorForm.tsx
src/features/simulator/components/ResultSummary.tsx
src/features/simulator/components/ResultExplanation.tsx
src/features/simulator/hooks/useSimulatorForm.ts
src/features/simulator/utils/formatters.ts
src/components/ui/Card.tsx
src/components/ui/Input.tsx
src/components/ui/Button.tsx
```

완료 기준:

* 브라우저에서 입력값을 바꾸면 결과가 바뀐다.
* PR 1 계산 엔진을 직접 사용한다.
* 계산 로직을 UI 컴포넌트 안에 중복 구현하지 않는다.
* 모바일에서 기본 사용이 가능하다.
* UI 텍스트는 한국어다.

---

## PR 3. 입력 UX 개선과 URL 공유

목표:

사용성을 개선하고 결과 공유가 가능하게 한다.

작업 범위:

* 원화/퍼센트 입력 UX 개선
* 샘플 입력 버튼
* 초기화 버튼
* URL query parameter 저장/복원
* 공유 링크 복사
* 개인정보 안내 문구

완료 기준:

* 공유 URL을 열면 동일한 입력값이 복원된다.
* 잘못된 query parameter가 들어와도 앱이 깨지지 않는다.
* URL에 연봉 정보가 포함될 수 있다는 안내가 있다.

---

## PR 4. 민감도 분석

목표:

임금상승률과 운용수익률 변화에 따른 DB/DC 유불리를 보여준다.

작업 범위:

* `src/calculator/sensitivity.ts`
* 운용수익률별 결과표
* 임금상승률별 결과표
* 임금상승률 × 운용수익률 매트릭스
* DB/DC/TIE 표시

완료 기준:

* 기준 입력값에서 다양한 수익률 시나리오를 볼 수 있다.
* 색상 외에 텍스트로도 결과를 표시한다.
* 모바일 대응이 되어 있다.

---

## PR 5. 포트폴리오 프리셋 v1

목표:

DC 운용수익률 직접 입력을 포트폴리오 선택으로 확장한다.

작업 범위:

* 포트폴리오 프리셋 타입 정의
* 예금형, 안정형, 중립형, 공격형
* S&P 500 중심형
* NASDAQ 100 중심형
* 직접 입력형
* 보수 차감
* 위험자산 비중 표시

완료 기준:

* 프리셋 선택 시 DC 운용수익률이 자동 반영된다.
* 특정 ETF 추천 문구가 없다.
* “지수 추종형 자산을 가정”한다는 표현을 사용한다.

---

## PR 6. 위험자산 한도와 룰셋

목표:

제도 가정을 설정값으로 분리한다.

작업 범위:

* `src/calculator/rules.ts`
* 위험자산 한도 기본값
* DC 부담금 비율 기본값
* UI에 계산 가정 표시
* 한도 초과 경고

완료 기준:

* 위험자산 한도는 코드 여러 곳에 흩어져 있지 않다.
* 룰셋에서 한 번에 변경 가능하다.
* 한도 초과 시 안내 문구가 나온다.

---

## PR 7. 리스크 시뮬레이션 v1

목표:

기대수익률뿐 아니라 변동성과 손실 가능성을 보여준다.

작업 범위:

* Monte Carlo 계산 엔진
* seed 기반 random generator
* 분위값 계산
* DC가 DB를 이길 확률
* 리스크 결과 카드

완료 기준:

* 같은 seed에서 같은 결과가 나온다.
* 테스트 가능하다.
* “확률적 시뮬레이션”임을 명확히 표시한다.

---

## PR 8. 스트레스 테스트

목표:

퇴직 직전 하락 시나리오를 보여준다.

작업 범위:

* 위험자산 하락률 입력 또는 프리셋
* -10%, -20%, -30%, -40% 시나리오
* DB 대비 손실액 표시

완료 기준:

* 기준 시나리오와 스트레스 시나리오가 구분된다.
* 사용자가 downside를 이해할 수 있다.

---

## PR 9. 고급 임금 시나리오

목표:

임금피크제, 승진, 연도별 임금 변화를 반영한다.

작업 범위:

* salary path mode 추가
* 연도별 커스텀 연봉
* 임금피크제
* 승진/호봉 점프
* 평균임금 직접 입력

완료 기준:

* 기본 모드는 복잡해지지 않는다.
* 고급 설정 안에서만 노출된다.
* 기존 MVP 계산과 호환된다.

---

## PR 10. 세금/현재가치/보고서

목표:

고급 사용자와 상담용 기능을 제공한다.

작업 범위:

* 세전/세후 토글
* 퇴직소득세 추정
* 물가상승률 현재가치
* PDF 보고서

완료 기준:

* 세금 계산의 가정이 문서화되어 있다.
* 보고서에 입력값, 계산 가정, 주의사항이 포함된다.
* 투자 권유로 오해될 표현이 없다.

---

## 5. UI/UX 원칙

### 5.1 초보자 우선

처음 보는 사람도 아래 질문에 답할 수 있어야 한다.

```text
내 조건에서는 DB와 DC 중 뭐가 더 유리하지?
DC가 유리하려면 수익률이 몇 % 필요하지?
그 수익률이 현실적으로 감당 가능한 수준인가?
```

### 5.2 결과는 숫자 + 문장으로 제공

숫자만 보여주지 않는다.

좋은 예:

```text
입력하신 조건에서는 DC 전환 후 연평균 3.4% 이상 운용해야 DB 유지보다 유리합니다.
현재 입력한 DC 운용수익률 5.0% 기준으로는 DC가 약 4,800만 원 유리합니다.
```

나쁜 예:

```text
DB: 260,000,000
DC: 308,000,000
```

### 5.3 불확실성 강조

DC는 확정 수익이 아니다.

반드시 다음 문구가 필요하다.

```text
본 결과는 입력한 가정에 따른 시뮬레이션입니다.
실제 결과는 임금 변동, 회사 퇴직연금 규약, 운용성과, 수수료, 세금, 제도 변경에 따라 달라질 수 있습니다.
```

### 5.4 투자 권유 금지

금지 표현:

```text
S&P 500 ETF에 가입하세요.
NASDAQ 100이 더 유리합니다.
이 상품을 사면 됩니다.
```

권장 표현:

```text
S&P 500 지수 추종형 자산을 편입한다고 가정합니다.
NASDAQ 100 지수 추종형 자산의 기대수익률을 사용자가 입력한 경우입니다.
이 결과는 상품 추천이 아니라 시뮬레이션입니다.
```

---

## 6. Fable, Sonnet, Codex 역할 분담

## Fable 역할

Fable은 최고 수준 설계와 검토에 사용한다.

Fable에게 맡길 일:

* 제품 구조 설계
* PR 단위 작업 설계
* 계산 모델 검토
* 타입 설계
* 상태관리 설계
* 예외 케이스 도출
* 테스트 전략 설계
* 투자 권유 오해 가능성 점검
* 코드 리뷰

Fable에게 시키지 않을 일:

* 대량 코드 직접 작성
* 단순 CSS 반복 작업
* 구현 세부 노가다

---

## Sonnet 5 역할

Sonnet 5는 실제 구현에 사용한다.

Sonnet 5에게 맡길 일:

* 컴포넌트 구현
* 테스트 구현
* 타입에 맞춘 코드 작성
* Tailwind UI 구현
* 리팩터링
* 버그 수정

주의:

* 한 번에 너무 큰 작업을 맡기지 않는다.
* PR 단위로 명확히 범위를 제한한다.
* “하지 말 것”을 반드시 포함한다.

---

## Codex 역할

Codex는 코드베이스 안에서의 실전 검토와 패치에 사용한다.

Codex에게 맡길 일:

* 테스트 실행
* 타입 오류 확인
* lint 확인
* 변경 diff 검토
* 작은 버그 수정
* 누락된 edge case 테스트 추가
* PR 리뷰 코멘트 반영

---

## 7. 다음 즉시 작업: PR 2 설계

현재 계산 엔진이 완성되어 있다면 다음 작업은 PR 2다.

PR 2의 목표는 다음이다.

> 계산 엔진을 실제 사용 가능한 MVP 화면에 연결한다.

PR 2에서 Fable이 먼저 설계해야 할 것:

* 페이지 구조
* 컴포넌트 트리
* form state 구조
* validation 정책
* formatter 설계
* 계산 엔진 호출 방식
* 결과 해석 문장 생성 방식
* 접근성 기본 원칙
* 모바일 레이아웃
* 테스트 범위

PR 2에서 아직 하지 말 것:

* ETF 포트폴리오
* 민감도 표
* URL 공유
* 차트
* 몬테카를로
* 세금
* PDF
* 로그인
* 서버 저장

---

## 8. PR 2 상세 요구사항

### 8.1 페이지

기본 페이지:

```text
src/app/page.tsx
```

또는 라우트 분리 시:

```text
src/app/simulator/page.tsx
```

현재는 단일 기능이므로 `/`에서 바로 시뮬레이터를 보여주는 것이 좋다.

### 8.2 컴포넌트 트리

권장 구조:

```text
App Page
  SimulatorPage
    HeroSection
    SimulatorLayout
      SimulatorForm
      ResultPanel
        ResultSummaryCards
        ResultExplanation
        AssumptionNotice
```

### 8.3 입력 필드

필수 입력:

```text
currentSalary
currentYearsOfService
remainingYearsOfService
salaryGrowthRate
dcReturnRate
conversionMethod
customTransferAmount
```

`customTransferAmount`는 `conversionMethod === CUSTOM_TRANSFER_AMOUNT`일 때만 표시한다.

### 8.4 결과 카드

필수 카드:

```text
DB 유지 예상액
DC 전환 예상액
차이 금액
손익분기 수익률
```

차이 금액이 양수이면 DC 유리, 음수이면 DB 유리로 표시한다.

### 8.5 결과 해석 문장

필수 문장:

```text
입력하신 조건에서는 DC 전환 후 연평균 {breakevenReturnRate}% 이상 운용해야 DB 유지보다 유리합니다.
```

수익률 입력값 기준 문장:

```text
현재 입력한 DC 운용수익률 {dcReturnRate}% 기준으로는 {winner}가 약 {difference} 유리합니다.
```

### 8.6 주의 문구

필수 주의 문구:

```text
본 결과는 입력값과 단순화된 계산 가정에 따른 세전 시뮬레이션입니다.
실제 퇴직급여는 회사 퇴직연금 규약, 평균임금 산정 방식, 임금피크제, 상여·성과급, 세금, 운용성과에 따라 달라질 수 있습니다.
```

---

## 9. PR 2 완료 기준

PR 2는 다음 조건을 만족해야 한다.

* 사용자가 브라우저에서 입력값을 바꿀 수 있다.
* 입력값 변경 시 결과가 즉시 업데이트된다.
* 계산은 `src/calculator`의 함수를 사용한다.
* UI 컴포넌트 안에 계산식을 중복 구현하지 않는다.
* 잘못된 입력값은 validation 메시지를 보여준다.
* 한국어 사용자 문구를 사용한다.
* 모바일 화면에서 입력과 결과를 볼 수 있다.
* 테스트가 통과한다.
* 기존 계산 엔진 테스트가 깨지지 않는다.
* 새로 추가한 formatter 또는 helper는 테스트한다.

---

## 10. Fable에게 요청할 산출물

Fable은 PR 2를 바로 코딩하지 말고 먼저 설계 문서를 작성해야 한다.

Fable의 산출물은 다음이어야 한다.

```text
1. PR 2 설계 요약
2. 파일 변경 계획
3. 컴포넌트 트리
4. 상태관리 방식
5. validation 방식
6. formatter 방식
7. 계산 엔진 연결 방식
8. 예외 케이스
9. 테스트 계획
10. Sonnet 5에게 넘길 구현 프롬프트
11. Codex/Fable 코드 리뷰 체크리스트
```

---

## 11. Sonnet 5에게 넘길 구현 기준

Sonnet 5는 Fable 설계가 승인된 뒤 구현한다.

구현 프롬프트에는 반드시 다음을 포함한다.

```text
Goal:
PR 2 MVP UI를 구현한다.

Context:
PR 1 계산 엔진은 이미 존재한다.
계산식은 UI에 중복 구현하지 말고 src/calculator의 simulate 함수를 사용한다.

Scope:
- 단일 페이지 시뮬레이터 UI
- 입력 폼
- 결과 카드
- 결과 해석 문장
- 기본 validation
- formatters

Out of scope:
- ETF
- 민감도 표
- 차트
- URL 공유
- 몬테카를로
- 세금
- PDF
- 로그인
- 서버 저장

Done when:
- pnpm test 통과
- pnpm lint 통과
- 모바일 레이아웃 기본 동작
- 기존 계산 엔진 테스트 유지
- 주요 입력값 변경 시 결과가 실시간 업데이트
```

---

## 12. 코드 리뷰 체크리스트

Fable과 Codex는 PR마다 아래를 검토한다.

계산 관련:

* 계산식이 UI에 중복 구현되어 있지 않은가?
* `src/calculator`의 public function을 사용하는가?
* decimal rate와 percent display를 혼동하지 않는가?
* 원화 단위와 만 원/억 원 표시가 혼동되지 않는가?
* 음수, 0, 극단값에서 깨지지 않는가?

제품 문구 관련:

* 투자 권유처럼 보이는 문장이 없는가?
* S&P 500, NASDAQ 100을 확정 수익처럼 표현하지 않는가?
* “세전 시뮬레이션”임을 명확히 표시하는가?
* 회사 규약에 따라 결과가 달라질 수 있음을 안내하는가?

UI 관련:

* 모바일에서 입력이 가능한가?
* 숫자 포맷이 읽기 쉬운가?
* 결과가 숫자와 문장으로 함께 제공되는가?
* 색상에만 의존하지 않는가?

엔지니어링 관련:

* 타입이 명확한가?
* 컴포넌트가 너무 커지지 않았는가?
* 불필요한 dependency를 추가하지 않았는가?
* 테스트가 있는가?
* lint/typecheck/test가 통과하는가?

---

## 13. 장기적으로 중요한 결정사항

아래 결정은 나중에 제품 품질에 큰 영향을 준다.

### 13.1 실제 ETF 데이터 연동 여부

초기에는 하지 않는다.

이유:

* 데이터 정확성 이슈
* 과거 수익률이 미래 수익률처럼 오해될 가능성
* API 관리 부담
* 투자 권유 오해 가능성

대신 사용자가 직접 기대수익률과 변동성을 입력하거나, 보수적인 프리셋을 제공한다.

### 13.2 세금 계산 시점

세금은 후순위다.

이유:

* 세법 변경 가능성
* 개인별 차이
* 정확도 리스크
* 제품 초기 검증에는 세전 비교만으로도 충분

### 13.3 로그인/저장 기능

초기에는 하지 않는다.

이유:

* 연봉 정보는 민감하다.
* 서버 저장은 개인정보 부담을 만든다.
* URL 공유 또는 localStorage만으로도 초기 사용성은 충분하다.

### 13.4 모바일 우선 여부

모바일 대응은 필요하지만, 초기 UX는 데스크톱과 모바일 모두 간단히 쓸 수 있는 반응형으로 간다.

---

## 14. 최우선 제품 목표

이 프로젝트의 첫 번째 성공 기준은 예쁜 UI가 아니다.

첫 번째 성공 기준은 다음이다.

> 사용자가 1분 안에 자신의 조건을 입력하고, DC가 DB보다 유리해지려면 연평균 몇 % 수익률이 필요한지 이해한다.

따라서 PR 2에서는 다음 문장이 가장 중요하다.

```text
입력하신 조건에서는 DC 전환 후 연평균 X.X% 이상 운용해야 DB 유지보다 유리합니다.
```

이 문장이 명확하게 전달되면 MVP의 핵심은 성공이다.

````

---

그리고 Fable에게는 위 MD만 던지지 말고, 아래처럼 시키면 좋아.

```text
위 project-master-plan.md를 기준으로 PR 2 설계 계획을 작성해줘.

현재 상태:
- PR 1 계산 엔진은 이미 구현되어 있음.
- 현재 필요한 것은 계산 엔진을 실제 사용자 화면에 연결하는 PR 2 설계임.
- 아직 코드는 작성하지 마.

너의 산출물:
1. PR 2의 목표와 범위
2. 구현할 파일 목록
3. 컴포넌트 트리
4. form state 설계
5. validation 정책
6. formatter 설계
7. 계산 엔진 연결 방식
8. 결과 해석 문장 생성 방식
9. 예외 케이스
10. 테스트 계획
11. Sonnet 5에게 넘길 구현 프롬프트
12. Fable/Codex 코드 리뷰 체크리스트

중요 제약:
- 계산식은 UI에 중복 구현하지 말 것.
- 반드시 기존 src/calculator의 simulate 계열 함수를 사용할 것.
- 이번 PR에서는 ETF, 민감도 표, 차트, 몬테카를로, 세금, PDF, 로그인, 서버 저장을 하지 말 것.
- 사용자 문구는 한국어.
- 투자 권유로 오해될 표현을 피할 것.
````
