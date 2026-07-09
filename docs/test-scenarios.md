# 테스트 시나리오 명세 (Test Scenarios)

본 문서는 DB/DC 퇴직연금 전환 시뮬레이터의 샘플 케이스, 극단/엣지 케이스, 재현성 시나리오를 정의하고,
현재 자동화된 테스트와의 매핑을 제공한다.

**기준 검증 결과 (PR 11 커밋 2034662 시점)**:
- `pnpm test`: 249/249 통과 (21 파일)
- `pnpm lint`: 통과
- `pnpm build`: 통과

---

## 1. 샘플 케이스 (Golden)

### 1.1 기본 케이스 (정합성 기준)

```text
현재 연봉: 80,000,000
현재 근속연수: 10
남은 근속연수: 15
임금상승률: 0.03
DC 운용수익률: 0.03
전환 방식: TRANSFER_ALL_TO_DC
```

기대 결과 (g = r이면 DB = DC):
- `dcAmount ≈ dbAmount` (toBeCloseTo 4자리)
- `difference ≈ 0` (toBeCloseTo 4자리)
- `breakevenReturnRate ≈ 0.03` (toBeCloseTo 6자리)

자동화 매핑: `src/calculator/simulate.test.ts` — `required sample case` 테스트

### 1.2 사회초년생 (UI 샘플 시나리오)

```text
현재 연봉: 42,000,000
현재 근속연수: 2
남은 근속연수: 28
임금상승률: 0.03
DC 운용수익률: 0.05
전환 방식: TRANSFER_ALL_TO_DC
```

자동화 매핑: `src/features/simulator/SimulatorPage.test.tsx` — `(d) 시나리오 chip 클릭`
소스: `src/features/simulator/utils/sampleScenarios.ts` `SAMPLE_SCENARIOS[0]` (id: `junior`)

### 1.3 중간 경력 (UI 샘플 시나리오)

```text
현재 연봉: 80,000,000
현재 근속연수: 10
남은 근속연수: 15
임금상승률: 0.03
DC 운용수익률: 0.05
전환 방식: TRANSFER_ALL_TO_DC
```

자동화 매핑: 기본값으로 사용. `SimulatorPage.test.tsx` (a)~(m), preset, rules, risk, stress 시리즈.
소스: `sampleScenarios.ts` `SAMPLE_SCENARIOS[1]` (id: `mid`)

### 1.4 퇴직 임박 (UI 샘플 시나리오)

```text
현재 연봉: 100,000,000
현재 근속연수: 25
남은 근속연수: 5
임금상승률: 0.02
DC 운용수익률: 0.04
전환 방식: TRANSFER_ALL_TO_DC
```

자동화 매핑: 소스 레벨 정의만. UI smoke 테스트에서 chip 클릭 시 입력값 반영 검증 패턴과 동일.
소스: `sampleScenarios.ts` `SAMPLE_SCENARIOS[2]` (id: `senior`)

## 2. 극단/엣지 케이스

### 2.1 n = 0 (잔여 근속 0)

```text
현재 연봉: 60,000,000
현재 근속연수: 5
남은 근속연수: 0
임금상승률: 0.03
DC 운용수익률: 0.04
전환 방식: TRANSFER_ALL_TO_DC
```

기대 결과:
- `dbAmount = dcAmount = settlement = S₀/12 × y₀ = 25,000,000`
- `difference = 0`
- `breakevenReturnRate = null` (해 없음)

자동화 매핑: `simulate.test.ts` — `n=0: DB=DC=settlement, breakevenReturnRate=null`

### 2.2 임금상승률 / 운용수익률 경계 (UI validation)

- 임금상승률: `-0.1` ~ `0.2` (UI 허용 범위)
- DC 운용수익률: `-0.5` ~ `0.5` (UI 허용 범위)
- 경계 밖 입력 → validation 에러 메시지 + 결과 미렌더

자동화 매핑: `src/features/simulator/utils/validation.test.ts`

### 2.3 변동성 경계

- 연간 변동성: `0%` ~ `60%` 허용
- `61%` 입력 → 에러 메시지 + 리스크 섹션 미렌더

자동화 매핑: `SimulatorPage.test.tsx` — `(risk-c) 변동성 '61' 입력 → 에러`

### 2.4 customTransferAmount = 0

```text
현재 연봉: 80,000,000
현재 근속연수: 10
남은 근속연수: 15
임금상승률: 0.03
DC 운용수익률: 0.05
전환 방식: CUSTOM_TRANSFER_AMOUNT
customTransferAmount: 0
```

기대 결과:
- `dcAmount = 기여금 FV 합` (settlement FV 제외)
- `breakevenReturnRate`는 TRANSFER_ALL_TO_DC보다 **높음**

자동화 매핑: `simulate.test.ts` — `simulate CUSTOM_TRANSFER_AMOUNT (b)(c)`

### 2.5 위험자산 비중 한도 (0.7) 경계

- `riskyAssetWeight = 0.7` → 한도 이내 (false)
- `riskyAssetWeight > 0.7` → 한도 초과 (true)
- 모든 기본 프리셋은 한도 이내

자동화 매핑: `src/calculator/rules.test.ts` — `exceedsRiskyAssetLimit`, `PORTFOLIO_PRESETS 한도 검사`

### 2.6 CUSTOM + customTransferAmount = settlement

- `customTransferAmount = calculateCurrentDbSettlement(S₀, y₀)`인 경우
- `TRANSFER_ALL_TO_DC`와 `dcAmount`, `dbAmount`, `breakevenReturnRate` 모두 일치

자동화 매핑: `simulate.test.ts` — `CUSTOM + customTransferAmount = settlement → same as TRANSFER_ALL_TO_DC`

## 3. 몬테카를로 재현성

### 3.1 seed 고정 재현성

```text
seed: 20260702 (고정 상수 리터럴)
iterations: 1000
```

기대: 같은 입력 + 같은 seed → p5, p25, p50, p75, p95, probabilityDcBeatsDb, worstCase, bestCase 전부 동일.

자동화 매핑: `src/calculator/monte-carlo.test.ts` — `runMonteCarlo 재현성`, `분위 순서`, `probabilityDcBeatsDb 범위`

### 3.2 σ = 0 결정론적 검증

- 변동성 0 → p5 = p25 = p50 = p75 = p95
- p50 = `calculateDcAmount` 결과와 toBeCloseTo 4자리 일치

자동화 매핑: `monte-carlo.test.ts` — `σ=0 결정론적 검증`

### 3.3 CUSTOM transferAmount = 0 반영

- `customTransferAmount = 0`이면 같은 seed에서 전액 이전보다 p50 낮음

자동화 매핑: `monte-carlo.test.ts` — `CUSTOM transferAmount 반영`

### 3.4 salaryPathConfig + 몬테카를로

- σ = 0 + WAGE_PEAK: p50이 simulate의 `dcAmount`와 toBeCloseTo 4자리 일치

자동화 매핑: `monte-carlo.test.ts` — `runMonteCarlo + salaryPathConfig`

## 4. 세금 경계

### 4.1 근속연수공제 경계

| 근속 | 공제액 공식 | 경계 케이스 |
|------|------------|-------------|
| ≤ 5년 | 근속 × 100만 | 5년 = 500만 (두 공식 일치) |
| ≤ 10년 | 500만 + (근속−5) × 200만 | 10년 경계 |
| ≤ 20년 | 1,500만 + (근속−10) × 250만 | 20년 경계 |
| > 20년 | 4,000만 + (근속−20) × 300만 | 21년+ |

자동화 매핑: `src/calculator/tax.test.ts` — `근속연수공제 경계 연속성`

### 4.2 환산급여공제 경계

| 환산급여 | 공제액 공식 | 경계 |
|---------|------------|------|
| ≤ 800만 | 전액 | 800만 |
| ≤ 7,000만 | 800만 + (cs−800만) × 60% | 7,000만 |
| ≤ 1억 | 4,520만 + (cs−7,000만) × 55% | 1억 |
| ≤ 3억 | 6,170만 + (cs−1억) × 45% | 3억 |
| > 3억 | 1억5,170만 + (cs−3억) × 35% | 3억 초과 |

자동화 매핑: `tax.test.ts` — `환산급여공제 경계 연속성`

### 4.3 수기 케이스

- gross 2억, 근속 20년 → totalTax = 7,727,500
- gross 5,000만, 근속 10년 → totalTax = 748,000
- gross 500만, 근속 10년 → 세금 0 (공제 초과)

자동화 매핑: `tax.test.ts` — `수기 케이스 1/2`, `공제 초과`

### 4.4 단조성

- gross 증가 시 totalTax 단조 증가

자동화 매핑: `tax.test.ts` — `성질 검증`

## 5. 고급 임금 시나리오 (SalaryPath)

### 5.1 CONSTANT_GROWTH

- `config` 미전달 시 `salaryAtYear`와 일치
- `CONSTANT_GROWTH` 명시 == config 없음 결과 완전 동일

자동화 매핑: `src/calculator/salary-path.test.ts`, `simulate.test.ts`

### 5.2 WAGE_PEAK

- 1회 감액 후 저성장 모델
- g = r = 0.03이어도 difference ≠ 0 (경로 비대칭, 정상)

자동화 매핑: `salary-path.test.ts`, `simulate.test.ts` — `WAGE_PEAK → dbAmount 감소`, `WAGE_PEAK: g=r=0.03에서 difference ≠ 0`

### 5.3 STEP_UP

- 복수 임시 인상, 누적 유지

자동화 매핑: `salary-path.test.ts` — `buildSalaryPath STEP_UP`

### 5.4 YEARLY_CUSTOM

- `yearlySalaries` 그대로 반환
- 길이 ≠ n이면 throw

자동화 매핑: `salary-path.test.ts` — `buildSalaryPath YEARLY_CUSTOM`
- UI/E2E 매핑(PR 15): `src/features/simulator/SimulatorPage.test.tsx`(resize·채우기·뱃지·미갱신), `validation.test.ts`(길이/빈/0/음수/과다/override), `components/PrintReportHeader.test.tsx`(요약줄·STEP_UP 라벨), `components/ShareSection.test.tsx`(미포함 안내), `e2e/yearly-custom.spec.ts`(yc-1~yc-5)

### 5.5 dbAverageSalaryOverride

- `dbAmount = override / 12 × (y₀ + n)`
- `dcAmount` 불변
- `breakevenReturnRate`의 r*을 DC에 대입 시 dbAmount와 상대오차 < 1e-4

자동화 매핑: `simulate.test.ts` — `dbAverageSalaryOverride`, `simulate breakeven 정합성`

## 6. 민감도 분석

### 6.1 기본 grid

- growth rates × return rates = 6 × 9 = 54 points

자동화 매핑: `src/calculator/sensitivity.test.ts` — `기본 grid 54 points`

### 6.2 breakevenByGrowthRate 정합성

- 각 비-null r*에서 `calculateDcAmount`와 DB의 상대오차 < 1e-4

자동화 매핑: `sensitivity.test.ts` — `buildBreakevenByGrowthRate`, `dbAverageSalaryOverride 정합성`

### 6.3 salaryPathConfig 상호작용

- WAGE_PEAK base: 임의 셀이 같은 g로 simulate한 결과와 일치
- g축은 베이스 성장률로만 추종, 구조(peakStartYear 등)는 고정

자동화 매핑: `sensitivity.test.ts` — `buildSensitivityMatrix + salaryPathConfig`

## 7. 스트레스 테스트

### 7.1 dropRate = 0

- `stressedDc = 기준 calculateDcAmount`와 동일

자동화 매핑: `src/calculator/stress.test.ts` — `dropRates=[0] → stressedDc가 기준 calculateDcAmount와 동일`

### 7.2 고정 4종

- 하락률: 10%, 20%, 30%, 40%
- 쇼크는 퇴직 직전 1회 발생 가정

자동화 매핑: `SimulatorPage.test.tsx` — `(stress-a) 기본값(CUSTOM)에서 h2 렌더 + 표 4행`

### 7.3 위험자산 비중 0

- 예금형 프리셋 선택 → "영향을 받지 않습니다" 문구 + 표 미렌더

자동화 매핑: `SimulatorPage.test.tsx` — `(stress-c) 예금형 선택`

### 7.4 salaryPathConfig + 스트레스

- WAGE_PEAK base로 buildStressScenarios 호출 → dropRate=0이면 stressedDc > 0

자동화 매핑: `stress.test.ts` — `buildStressScenarios + salaryPathConfig`

## 8. 인쇄/보고서

### 8.1 인쇄 헤더

- 화면에서 hidden, 인쇄 시 block
- `input` 존재 시에만 렌더

자동화 매핑: `SimulatorPage.test.tsx` — 인쇄 smoke 보강(PR 12 추가 예정)

### 8.2 print:hidden 적용

- ShareSection 컨테이너, DisplayModeToggle, HeroSection 등 화면 전용 요소에 적용

### 8.3 break-inside-avoid

- 민감도·리스크·스트레스 섹션에 적용

## 9. UI smoke (SimulatorPage)

### 9.1 기본 렌더

- 결과 카드 4장 (DB, DC, 차이, 손익분기)
- 손익분기 문장 존재
- 주의 문구 "세전 시뮬레이션입니다" 존재

자동화 매핑: `SimulatorPage.test.tsx` — `(a)`

### 9.2 전환 방식 토글

- CUSTOM 선택 시 전환 정산금 입력 표시
- TRANSFER_ALL_TO_DC 복귀 시 숨김

자동화 매핑: `SimulatorPage.test.tsx` — `(b)`

### 9.3 validation 에러

- 연봉 입력 지움 → 에러 메시지 + placeholder

자동화 매핑: `SimulatorPage.test.tsx` — `(c)`

### 9.4 URL 공유

- 공유 버튼 클릭 → `clipboard.writeText` 호출
- URL에 `salary=80000000`, `method=TRANSFER_ALL_TO_DC` 포함
- 개인정보 문구 렌더

자동화 매핑: `SimulatorPage.test.tsx` — `(e)`, `(f)`

### 9.5 포맷팅

- 원화 raw 입력 후 blur → 콤마 포맷

자동화 매핑: `SimulatorPage.test.tsx` — `(g)`

### 9.6 투자 권유 문구 부재

- "추천", "가입" 텍스트 부재

자동화 매핑: `SimulatorPage.test.tsx` — `(preset-e)`

### 9.7 접근성 (PR 12 보강 예정)

- 모든 숫자 입력이 label과 연결
- `<img>` 0건 (이미지 없음)
- 결과 카드 heading 존재

## 10. URL 파라미터

### 10.1 왕복 직렬화

- 기본값 왕복 — salary/years/rates/method 모두 복원

자동화 매핑: `src/features/simulator/utils/urlParams.test.ts`

### 10.2 무효값 처리

- `salary=abc` → salary 제외, 나머지 유지

자동화 매핑: `urlParams.test.ts` — `parseSearchToFormValues — 무효값 처리`

### 10.3 volatility 왕복

- `dcVolatility '12'` 직렬화 후 복원

자동화 매핑: `urlParams.test.ts` — `volatility 왕복`

---

## 11. 시나리오 자동화 매핑 요약

| 시나리오 그룹 | 테스트 파일 | 케이스 수 |
|--------------|------------|----------|
| simulate 정합성 | simulate.test.ts | 9 |
| SalaryPath | salary-path.test.ts | 다수 |
| 민감도 | sensitivity.test.ts | 다수 |
| 몬테카를로 | monte-carlo.test.ts | 다수 |
| 스트레스 | stress.test.ts | 다수 |
| 세금 | tax.test.ts | 다수 |
| 현재가치 | present-value.test.ts | 소수 |
| PRNG | random.test.ts | 소수 |
| 포트폴리오 | portfolio.test.ts | 소수 |
| 룰셋 | rules.test.ts | 소수 |
| UI smoke | SimulatorPage.test.tsx | 20+ |
| formatters | formatters.test.ts | 다수 |
| URL params | urlParams.test.ts | 다수 |
| explanation | explanation.test.ts | 소수 |
| stressNarrative | stressNarrative.test.ts | 소수 |
| displayAmounts | displayAmounts.test.ts | 소수 |
| DB | db.test.ts | 소수 |
| DC | dc.test.ts | 소수 |
| salary | salary.test.ts | 소수 |
| breakeven | breakeven.test.ts | 소수 |
| 합계 | 21 파일 | 249 |

PR 12에서 인쇄 smoke + a11y baseline 약 6~8건 추가 예상 → 255~257건.

---

## 변경 이력

| 날짜 | 변경 | 비고 |
|------|------|------|
| 2026-07-07 | 최초 작성 (PR 12) | 기존 249 테스트 전체 매핑 정리 |
