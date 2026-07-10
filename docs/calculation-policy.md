# 계산 규약 (DB→DC 전환 시뮬레이터 MVP)

## 계산 규약 표

| 번호 | 항목 | 수식 |
|------|------|------|
| 1 | t년차 급여 | S₀ × (1+g)^t &nbsp; (t = 1..n) |
| 2 | DB 퇴직금 | finalSalary / 12 × (y₀ + n) |
| 3 | 전환 시점 DB 정산금 (settlement) | S₀ / 12 × y₀ |
| 4 | DC t년차 기여금 FV | [S₀(1+g)^t / 12] × (1+r)^(n−t) |
| 5 | DC 수령액 | settlement × (1+r)^n + Σ_{t=1..n} [S₀(1+g)^t / 12] × (1+r)^(n−t) |
| 6 | 손익분기 수익률 r* | DC(r*) = DB를 만족하는 r |

변수 정의:
- S₀: 현재 연봉 (KRW, number)
- y₀: 현재 근속연수
- n: 잔여 근속연수 (정수)
- g: 임금상승률 (소수, 0.03 = 3%)
- r: DC 운용 수익률 (소수)
- finalSalary = S₀ × (1+g)^n

## 납입 시점 규약

DC 기여금은 **연말** 납입을 가정한다. 따라서 t년차에 납입한 기여금은 퇴직 시까지 (n−t)년간 복리로 운용된다.

## 손익분기 수익률 정의 및 해법 (이분법)

**정의**: DC(r*) = DB가 성립하는 r*를 손익분기 수익률로 정의한다.

**해법**: 이분법(Bisection Method)
- 탐색 구간: [−0.99, 3.0]
- 허용 오차: 1×10⁻¹⁰
- 최대 반복 횟수: 200회
- DC(r)는 r에 대해 순증가 함수이므로 (원금이 존재하고 n ≥ 1인 경우) 구간 내에서 유일한 해가 존재한다.
- 구간 내에서 해가 존재하지 않거나, r에 무관하게 DC가 일정한 경우(n=0 또는 원금 없음) `null`을 반환한다.

## g = r이면 DB = DC인 이유

t년차 기여금 미래가치 = S₀(1+g)^t / 12 × (1+r)^(n−t)

g = r이면: = S₀(1+g)^t / 12 × (1+g)^(n−t) = S₀(1+g)^n / 12

n년 합산: Σ_{t=1..n} S₀(1+g)^n / 12 = n × S₀(1+g)^n / 12

settlement FV: S₀/12 × y₀ × (1+g)^n

DC 합계: S₀(1+g)^n / 12 × (y₀ + n) = finalSalary / 12 × (y₀ + n) = DB

## 전환 방식

| 방식 | 설명 |
|------|------|
| TRANSFER_ALL_TO_DC | 전환 시점 DB 정산금(S₀/12 × y₀)을 전액 DC로 이전한다. |
| CUSTOM_TRANSFER_AMOUNT | 계산된 현재 DB 정산금을 회사 규약상 실제 정산금으로 대체하는 방식. 사용자가 입력한 `customTransferAmount` 값이 settlement 대신 사용된다. DB 유지 시나리오에는 영향 없음. |

## 리스크 시뮬레이션 (몬테카를로)

### 로그정규 수익률 모델

연간 수익률 배수는 로그정규 분포를 따른다고 가정한다.

```
z ~ N(0, 1)
logMu = ln(1 + μ) − σ²/2
배수 = exp(logMu + σ × z)
```

여기서 μ는 기대수익률(DC 운용수익률), σ는 연간 변동성이다.

**E[배수] = 1+μ 성질**: 로그정규 분포의 기댓값 공식에 의해

```
E[exp(logMu + σ×z)] = exp(logMu + σ²/2) = exp(ln(1+μ)) = 1+μ
```

이 성질은 기대수익률이 입력한 μ와 일치함을 보장한다.

σ=0이면 z항이 소멸하여 배수 = exp(ln(1+μ)) = 1+μ 로 결정론적이다.

### 경로 시뮬레이션

iteration마다 다음 경로를 계산한다.

```
balance₀ = calculateCurrentDbSettlement(S₀, y₀)  // TRANSFER_ALL_TO_DC
           또는 customTransferAmount               // CUSTOM_TRANSFER_AMOUNT

for t = 1..n:
  balance_t = balance_{t-1} × 배수_t + salaryAtYear(S₀, g, t) × dcContributionRate
```

### Percentile 계산 방식

결과 배열을 오름차순 정렬 후 단순 인덱스로 분위값을 구한다.

```
index(q) = floor(q × (n − 1))
percentile(q) = sortedResults[index(q)]
```

선형 보간을 적용하지 않는다.

### 파라미터

| 항목 | 값 |
|------|-----|
| 반복 횟수 | 1,000회 |
| seed | 20260702 (고정 상수 리터럴) |
| 기본 변동성 | 12% (가정치, 시장 예측이 아님) |
| PRNG | mulberry32 (결정적, Math.random 미사용) |

### DC 승률 정의

```
probabilityDcBeatsDb = (dc > db인 iteration 수) / 전체 iteration 수
```

엄격 부등호(dc > db)를 사용하며, 동률(dc === db)은 승률에 포함하지 않는다.

## 스트레스 테스트

### 모델 식

```
스트레스 DC = 기준 DC × (1 − riskyAssetWeight × dropRate)
```

기준 DC는 기존 결정론적 경로(`calculateDcAmount`, 현재 `dcReturnRate`)의 결괏값이다.

### 가정

- 쇼크는 퇴직 직전 1회 발생한다.
- 위험자산 부분(riskyAssetWeight)만 하락한다. 안전자산 부분은 영향 없음.
- CUSTOM(직접 입력) 선택 시 `riskyAssetWeight = 1.0` (보수적 가정).
- 하락률 4종 고정: 10%, 20%, 30%, 40%.

### CUSTOM 보수적 가정 근거

직접 입력 방식은 포트폴리오 구성 정보가 없으므로 전액 위험자산으로 간주하여 최대 충격을 표시한다.

## 고급 임금 시나리오 (SalaryPath)

### 4가지 모드

| 모드 | 수식 | 설명 |
|------|------|------|
| `CONSTANT_GROWTH` | path[t-1] = S₀ × (1+g)^t | 기본값. config 미전달 시 동일 동작 보장 |
| `WAGE_PEAK` | t < peakStart: S₀×(1+g)^t / t = peakStart: prev×(1−cutRate) / t > peakStart: peakSalary×(1+postRate)^(t−peakStart) | 1회 감액 후 저성장 모델 |
| `STEP_UP` | path[t-1] = S₀×(1+g)^t × ∏(1+extraRate_i) for all i where yearIndex_i ≤ t | 복수 임시 인상, 누적 유지 |
| `YEARLY_CUSTOM` | path[t-1] = yearlySalaries[t-1] | 직접 입력. 길이 ≠ n이면 throw |

> **PR 15/17 노트**: `YEARLY_CUSTOM`은 PR 15부터 `고급 임금 시나리오` details 안에서 UI로 노출한다. **수식은 변경 없이** 기존 `buildSalaryPath` 로직을 재사용한다(연도별 연봉 입력 → 검증 → `SimulationInput.salaryPathConfig` 주입). URL 공유는 기본적으로 연도별 연봉을 제외하며, 사용자가 고급 임금 설정 포함을 명시적으로 선택한 경우에만 포함한다.

### WAGE_PEAK 1회 감액+저성장 모델 상세

peakStartYear 시점에 직전 연봉(t=1이 피크면 S₀) × (1 − cutRate)로 1회 감액하고, 이후 postPeakGrowthRate로 매년 성장한다.

```
t < peakStartYear  : S₀ × (1+g)^t
t = peakStartYear  : S₀ × (1+g)^(t-1) × (1 - cutRate)   [t=1이면 S₀ × (1-cutRate)]
t > peakStartYear  : peakSalary × (1 + postPeakGrowthRate)^(t - peakStartYear)
```

### 민감도 분석 g축 상호작용

`buildSensitivityMatrix` / `buildBreakevenByGrowthRate`에서 `salaryPathConfig`가 있으면 **각 g값마다** `buildSalaryPath(S₀, g, n, config)`를 재생성한다. 즉 g축은 베이스 성장률로만 추종하며, WAGE_PEAK·STEP_UP의 구조(peakStartYear, cutRate 등)는 고정된 채로 g만 달라진다.

### override 우선순위

| 항목 | 우선순위 |
|------|---------|
| DB 금액 | `dbAverageSalaryOverride` > `salaryPath[n-1]` > 기본 finalSalary(S₀×(1+g)^n) |
| DC 기여금 | `salaryPath[t-1]` > 기본 S₀×(1+g)^t (`dbAverageSalaryOverride`는 DC에 무관) |

`dbAverageSalaryOverride` 적용 시: `dbAmount = override / 12 × (y₀ + n)`

### g = r TIE 성질이 경로 비대칭에서 깨지는 것이 정상

기본 CONSTANT_GROWTH 경로에서는 g = r이면 DC = DB가 수학적으로 성립한다 (g = r 증명 참조). 그러나 WAGE_PEAK·STEP_UP 등 비선형 경로에서는 DC 기여금 경로와 DB 최종급여 기준이 달라지므로 g = r이어도 DC ≠ DB가 될 수 있다. 이는 버그가 아니라 경로 비대칭의 정상적인 결과이다.

## 퇴직소득세 추정

기준: 2025년 세법 (국세청 고시 기준)

> **주의**: 서비스 공개 전 세무 전문가 검증 필요

### 단순화 가정

- DC 수령액 전액을 퇴직소득으로 취급
- 총근속연수 기준으로 일괄 계산
- 일시금 수령 가정
- 비과세소득 없음 가정

### 계산 순서

① **근속연수공제** 차감 (음수면 0)

| 근속연수 | 공제액 |
|---------|--------|
| ≤ 5년 | 근속 × 100만원 |
| ≤ 10년 | 500만 + (근속 − 5) × 200만 |
| ≤ 20년 | 1,500만 + (근속 − 10) × 250만 |
| > 20년 | 4,000만 + (근속 − 20) × 300만 |

② **환산급여** = 잔액 ÷ 근속연수 × 12

③ **환산급여공제** 차감 → 과세표준 (음수면 0)

| 환산급여 | 공제액 |
|---------|--------|
| ≤ 800만 | 전액 |
| ≤ 7,000만 | 800만 + (환산급여 − 800만) × 60% |
| ≤ 1억 | 4,520만 + (환산급여 − 7,000만) × 55% |
| ≤ 3억 | 6,170만 + (환산급여 − 1억) × 45% |
| > 3억 | 1억5,170만 + (환산급여 − 3억) × 35% |

④ **환산산출세액** = 과세표준 × 세율 − 누진공제

| 과세표준 | 세율 | 누진공제 |
|---------|------|--------|
| ≤ 1,400만 | 6% | 0 |
| ≤ 5,000만 | 15% | 126만 |
| ≤ 8,800만 | 24% | 576만 |
| ≤ 1.5억 | 35% | 1,544만 |
| ≤ 3억 | 38% | 1,994만 |
| ≤ 5억 | 40% | 2,594만 |
| ≤ 10억 | 42% | 3,594만 |
| > 10억 | 45% | 6,594만 |

⑤ **최종 소득세** = ④ ÷ 12 × 근속연수

⑥ **지방소득세** = ⑤ × 10%

### 세후 + 현재가치 조합 순서

과세 먼저 적용 후 현재가치 할인: `toPresentValue(netAmount, inflationRate, years)`

## 현재가치 환산

```
PV = amount / (1 + π)^years
```

- `amount`: 미래 금액 (KRW)
- `π`: 물가상승률 (소수, 0.02 = 2%)
- `years`: 할인 기간 (연수)

## MVP 제외 항목

다음 항목은 MVP 범위에서 제외되며 향후 버전에서 구현 예정이다.

- 운용소득세
- 임금피크제 (감액 구간 적용)
- 상여금·성과급 (정기급여 외 항목)
- ETF·펀드별 분산 투자 시뮬레이션
- 중도 전환 시나리오 (부분 전환, 시점 선택)

## 단위 규약

- 금액: KRW, JavaScript `number` 타입
- 수익률·상승률: 소수 (0.03 = 3%)
- 연수: 정수 (`number` 타입, 정수만 유효)

## 제도 가정 (룰셋)

제도 가정은 `src/calculator/rules.ts`의 `DEFAULT_RULE_SET`으로 중앙 관리된다.

| 필드 | 값 | 설명 |
|------|----|------|
| id | `kr-retirement-pension-mvp` | 룰셋 식별자 |
| label | `MVP 기본 가정` | 표시용 이름 |
| riskyAssetLimit | `0.7` | 위험자산 비중 한도 (70%) |
| dcContributionRate | `1/12` | DC 연간 부담금 비율 |

### /12의 두 가지 의미

이 코드베이스에서 `/12`는 두 곳에 등장하지만 개념이 다르다.

- **DC 부담금 비율** (`dc.ts`): 연간 임금총액의 1/12을 DC 계좌에 납입한다는 퇴직연금 제도 규정. `DEFAULT_RULE_SET.dcContributionRate`로 표현되며, 룰셋이 지배한다.
- **DB 월평균임금 산정** (`db.ts`, settlement 계산): 연봉을 12로 나눠 월평균임금을 구하는 수학적 변환. 제도 가정이 아닌 산술 연산이므로 룰셋 대상이 아니다.

값은 동일(1/12)하지만 개념이 별개이므로 룰셋은 전자만 지배한다.

### 제도 변경 시

향후 퇴직연금 법령 개정 등으로 부담금 비율이나 위험자산 한도가 바뀌면 `src/calculator/rules.ts`의 `DEFAULT_RULE_SET` 한 곳만 수정하면 된다. `dc.ts`와 UI 컴포넌트는 자동으로 변경된 값을 참조한다.

## DC 포트폴리오 프리셋 가정

### 순 기대수익률 = 기대수익률 − 연간 보수

아래 수치는 서비스의 가정치이며 시장 예측이나 수익 보장이 아닙니다.

| 프리셋 | 위험자산 비중 | 안전자산 비중 | 기대수익률 | 연간 보수 | 순 수익률 |
|--------|--------------|--------------|-----------|----------|----------|
| 예금형 | 0% | 100% | 2.5% | 0.1% | 2.4% |
| 안정형 | 30% | 70% | 3.5% | 0.3% | 3.2% |
| 중립형 | 50% | 50% | 4.5% | 0.4% | 4.1% |
| 공격형 | 70% | 30% | 5.5% | 0.5% | 5.0% |
| S&P 500 중심형 | 70% | 30% | 6.0% | 0.4% | 5.6% |
| NASDAQ 100 중심형 | 70% | 30% | 6.5% | 0.5% | 6.0% |
