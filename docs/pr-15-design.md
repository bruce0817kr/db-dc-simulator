# PR 15 설계 — YEARLY_CUSTOM salary path UI 노출

> 후속 변경: PR 17에서 기본 미포함 정책은 유지하되, 사용자가 명시적으로 선택하면 고급 임금 설정을 URL에 포함·복원할 수 있도록 확장했다. 현재 계약은 `docs/pr-17-design.md`를 따른다.

> 상태: **구현 완료(PR 15B/15C)**. UI + 검증 + 단위테스트(15B, `ea1c994`), 보고서 + 공유 안내 + E2E + 문서(15C). 검증 결과는 `docs/qa-results-pr15-2026-07-09.md`.
> 기반: v0.1.0 (`78e810f`) 이후 작업. v0.1.0 태그·rc.1·rc.2 불변.
> 배경: `YEARLY_CUSTOM`은 계산 엔진·단위 테스트 수준에서 이미 지원되나, v0.1.0 UI에는 노출하지 않았음(`docs/qa-results-2026-07-08.md`에서 N/A·Deferred, 비차단). PR 15에서 UI 노출.

---

## 1. 목표와 범위

**목표**: 계산 엔진에 존재하는 `YEARLY_CUSTOM` 모드를 **고급 임금 시나리오(`AdvancedSalarySection`) 안에서만** UI로 노출한다. 엔진 수식은 변경하지 않고 기존 public API(`buildSalaryPath` / `simulate`)를 재사용.

**핵심 결정(요약)**
- 구현은 **PR 15B / PR 15C**로 분리.
- **PR 15B**: YEARLY_CUSTOM UI + validation + 단위테스트 (보고서·E2E 없음)
- **PR 15C**: 인쇄 보고서(`PrintReportHeader`) + 공유 안내(`ShareSection`) + 문서 + Playwright E2E
- **URL 공유에 `yearlySalaries`를 포함하지 않는다.** 고급 임금 시나리오 설정은 공유 링크에 포함되지 않는다는 안내문을 표시.
- 기본 폼은 복잡하게 만들지 않고 `AdvancedSalarySection` 안에서만 노출.
- **계산 엔진 수식은 변경하지 않는다.** `src/calculator`의 기존 `YEARLY_CUSTOM` 로직을 재사용.

**포함(in-scope)**
- 임금 경로 드롭다운에 `YEARLY_CUSTOM`("연도별 직접 입력") 추가
- 선택 시 남은 근속연수 `n`개의 연도별 연봉 입력 행(원화 포맷)
- “현재 연봉으로 채우기” 보조 버튼
- 길이·빈 값·0 이하·음수·NaN·콤마·과다값 validation
- `n` 변경 시 배열 resize 정책(사용자 입력 보존)
- `validateForm` → `salaryPathConfig { mode: "YEARLY_CUSTOM", yearlySalaries }` 구성
- 인쇄 보고서 입력 요약에 연도별 경로 요약 표시 + STEP_UP 라벨 정리(PR 15C)
- 문서 갱신(PR 15C): calculation-policy, manual-qa 4.7 active 전환, release-checklist, test-scenarios, README
- Vitest(PR 15B) + Playwright E2E(PR 15C)

**제외(out-of-scope)**
- 계산 엔진 수식 / 세금 / 포트폴리오 수익률 / 몬테카를로 변경
- UI 대규모 리디자인, 차트 라이브러리, 서버 저장, 로그인, 외부 API
- v0.1.0 태그 변경
- **URL 공유에 `yearlySalaries` 직렬화** (미포함, §7)

**사용자 가치**: 임금피크제·승진 같은 정형 패턴이 아닌, 본인의 실제 예상 연봉 변동(이직·휴직·성과급 반영 등)을 연도별로 입력해 DB/DC 비교의 현실성을 높인다.

---

## 2. 현재 코드 상태 요약

**엔진 지원(완료, 불변)**: `src/calculator/salary-path.ts`
- `SalaryPathMode`에 `YEARLY_CUSTOM` 포함, `SalaryPathConfig.yearlySalaries?: number[]`
- `buildSalaryPath`: `yearlySalaries.length !== remainingYears` → throw; 통과 시 `[...yearlySalaries]` 반환
- 단위테스트 3건(`salary-path.test.ts` 104–130): 그대로 반환 / 길이 불일치 throw / 빈 배열+n=0 통과
- `simulate.ts`는 `input.salaryPathConfig` → `buildSalaryPath()` 로 그대로 소비 → **엔진 재사용, 수식 변경 無**

**UI 미노출 이유**: v0.1.0 릴리스 후보 단계에서 새 입력 UI 추가 지연(방침 B). `SalaryPathModeUI`(features 타입)가 3모드만, `AdvancedSalarySection.MODE_OPTIONS`도 3개. 엔진과 UI 타입이 의도적으로 분리되어 있어 **UI만 확장**하면 된다.

**관련 파일**
- 엔진(불변): `salary-path.ts`, `simulate.ts`, `sensitivity.ts`, `types.ts`
- UI/상태(PR 15B 수정): `features/simulator/types.ts`, `hooks/useSimulatorForm.ts`, `utils/validation.ts`, `components/AdvancedSalarySection.tsx`, `components/ResultPanel.tsx`(뱃지 조건)
- 표시/공유(PR 15C 수정): `components/PrintReportHeader.tsx`, `components/ShareSection.tsx`
- URL(정책만, 변경 최소): `utils/urlParams.ts`
- 테스트: `validation.test.ts`, `urlParams.test.ts`, `SimulatorPage.test.tsx`, `e2e/`(신규 `yearly-custom.spec.ts` 또는 `scenarios.spec.ts` 확장)

**기존 WAGE_PEAK / STEP_UP UI 구조**(재사용 패턴)
- `AdvancedSalarySection`: `<details>` 안 `<Select id="salaryPathMode">` + 모드별 조건부 `TextInput`
- 상태는 `SimulatorFormValues`의 **문자열 필드**, `onChange(field, value)` 갱신
- `validateForm`에서 모드별 검증 후 `salaryPathConfig` 구성 → `SimulationInput` 주입
- `ResultPanel`이 `salaryPathMode !== "CONSTANT_GROWTH"`일 때 “고급 임금 시나리오 적용 중” 뱃지

**사전 발견(사이드 정리)**: `PrintReportHeader`의 STEP_UP 라벨이 `"단계별 상승"`인데 폼 드롭다운은 `"승진·호봉 점프"`라 불일치. PR 15C에서 같은 파일을 만지므로 자연스럽게 정리.

---

## 3. UX 설계

**노출 위치**: 오직 `AdvancedSalarySection`(`고급 임금 시나리오` details) 안. **기본 폼은 변경하지 않는다.**

**드롭다운**: 4번째 옵션 추가 — `{ value: "YEARLY_CUSTOM", label: "연도별 직접 입력" }` (기존: 기본(일정 상승) / 임금피크제 / 승진·호봉 점프).

**연도별 입력 행**
- 모드 선택 시 `n = remainingYearsOfService`개 행을 `TextInput`(suffix “원”, inputMode numeric)으로 렌더
- 라벨: “1년차 연봉” … “n년차 연봉”
- 컨테이너: `max-h-[320px] overflow-y-auto` 스크롤 박스(n 클 때 대비)
- 모바일(375px): 1열 스택, 라벨/입력 가독 확보

**보조 버튼 “현재 연봉으로 채우기”**
- 클릭 시 `currentSalary`·`salaryGrowthRate`로 CONSTANT_GROWTH 베이스라인을 계산해 `yearlySalaries`를 KRW 포맷으로 prefill
- 목적: 빈 칸부터 n개를 손으로 채우는 부담 제거 + 기본 시나리오와의 비교 출발점
- 계산은 UI 보조용. `buildSalaryPath(..., { mode: "CONSTANT_GROWTH" })` 결과를 표시값으로 변환해도 OK (엔진 수식 변경 아님)

**`n` 변경 시 UX**
- `remainingYearsOfService`가 바뀌면 배열 길이가 어긋남 → resize(§4 정책). **기존 사용자 입력은 덮어쓰지 않는다.**
- resize 후 입력 영역 상단 안내: “남은 근속연수 변경 — {n}년치 연봉을 확인/수정하세요”
- 미입력(빈) 행이 생기면 validation 에러로 결과 패널 계산 보류(기존 errors → input:null 동작과 동일)

---

## 4. 상태 모델 설계

**UI state 타입** (`features/simulator/types.ts`)
```ts
export type SalaryPathModeUI = "CONSTANT_GROWTH" | "WAGE_PEAK" | "STEP_UP" | "YEARLY_CUSTOM";

export interface SimulatorFormValues {
  // ...기존 필드...
  yearlySalaries: string[];   // 신규. 표시용 KRW 문자열("80,000,000"). 빈 문자열 허용(미입력)
}
```
- 기본값: `yearlySalaries: []` (CONSTANT_GROWTH 기본이므로 빈 배열)

**엔진 전달 타입** (`calculator/salary-path.ts` — 변경 없음, 재사용)
```ts
salaryPathConfig = { mode: "YEARLY_CUSTOM", yearlySalaries: number[] }
```

**number KRW vs 표시 문자열 분리** (기존 패턴 준수)
- 표시/저장: `string[]` (콤마 포함)
- onBlur 시 `formatKRW(n).replace("원","").trim()` 로 콤마 정규화 (`currentSalary`의 `formatKRWField` 패턴 재사용)
- 계산 직전: `values.yearlySalaries.map(parseKRWInput)` → `number[]`

**resize 정책 — ⚠️ 사용자 입력 보존 원칙**
- **자동 조정은 오직 두 시점에서만**: (a) `YEARLY_CUSTOM` 모드 진입 시, (b) `remainingYearsOfService` 변경 시.
- `n` 증가: **기존 접두부 보존**, 새로 생긴 연도 칸만 베이스라인(currentSalary×(1+g)^t)으로 pad. 기존 입력값은 건드리지 않는다.
- `n` 감소: 꼬리 잘림(접두부 보존).
- `n` 동일: 유지.
- **`currentSalary` 또는 `salaryGrowthRate` 변경만으로는 기존 `yearlySalaries`를 자동 덮어쓰지 않는다.** 사용자가 갱신을 원하면 “현재 연봉으로 채우기” 버튼을 누른다.
- 구현 위치: `useSimulatorForm`에서 `remainingYearsOfService`·`salaryPathMode` 변경을 감지하는 effect/onChange. **무한 루프 주의** — 의존성은 해당 두 값만.
- **mode 진입 시 prefill도 사용자가 이미 입력한 값이 있으면 보존** (빈 배열일 때만 베이스라인 prefill).

---

## 5. validation 설계 (`validation.ts` YEARLY_CUSTOM 블록)

```ts
if (values.salaryPathMode === "YEARLY_CUSTOM") {
  const n = remainingServiceYears ?? 0;
  const arr = values.yearlySalaries;
  if (arr.length !== n) {
    errors.yearlySalaries = `남은 근속연수(${n})개의 연도별 연봉을 입력해주세요. (현재 ${arr.length}개)`;
  } else {
    const bad: string[] = [];
    arr.forEach((raw, i) => {
      const v = parseKRWInput(raw);
      if (v === null) bad.push(`${i + 1}년차`);
      else if (v <= 0) bad.push(`${i + 1}년차(0 이하)`);
      else if (v > 1e12) bad.push(`${i + 1}년차(과다)`);
    });
    if (bad.length > 0) {
      // ⚠️ 메시지 길이 제한: 앞 5개만 + "외 N개"
      const head = bad.slice(0, 5).join(", ");
      const tail = bad.length > 5 ? ` 외 ${bad.length - 5}개` : "";
      errors.yearlySalaries = `연도별 연봉을 확인해주세요: ${head}${tail}`;
    }
  }
}
```
- **길이 불일치** → 집계 에러(엔진 throw 전에 UI가 선차단; 엔진은 2차 방어)
- **빈 입력** → `parseKRWInput("")` = null
- **0 이하/음수** → `<= 0` 차단 (currentSalary 정책과 동일)
- **콤마 원화** → `parseKRWInput`이 콤마/`원` 처리 (기존)
- **NaN/문자** → `Number.isFinite` 실패 → null → 에러
- **과다값** → 상한 `1e12`(1조) 가드
- **n ≤ 1** → 1행 정상 동작
- **n 매우 큼(예: 40)** → 스크롤 박스 + “채우기” 버튼으로 부담 완화
- **미완료 상태** → `errors` 존재 → `validateForm`이 `input: null` 반환 → 결과 패널 **계산 보류**. ⚠️ **뱃지는 `result !== null`일 때만 표시** (`ResultPanel` 조건 점검/수정).

---

## 6. 계산 연결 방식

**재구현 금지.** `validateForm`에서 config 구성 후 기존 파이프라인에 주입:

```ts
} else if (values.salaryPathMode === "YEARLY_CUSTOM") {
  // ⚠️ parseKRWInput 결과를 number[]로 단언하기 전에 null 제거 / type guard 사용
  const parsed = values.yearlySalaries.map(parseKRWInput); // (number | null)[]
  const nums = parsed.filter((n): n is number => n !== null);
  // 위 validation 블록 통과 전제(길이·값 검증 완료) 아래에서만 도달
  salaryPathConfig = { mode: "YEARLY_CUSTOM", yearlySalaries: nums };
}
```
- 흐름: `SimulationInput.salaryPathConfig` → `simulate()` 내 `buildSalaryPath(currentSalary, g, n, config)` → `salaryPath[n-1]`가 DB finalYearSalary, `salaryPath` 전체가 DC 기여금 경로 (WAGE_PEAK/STEP_UP과 동일 경로).
- 민감도·손익분기도 동일 config로 자동 연동(`buildSensitivityMatrix`가 g축마다 path 재생성).

**`dbAverageSalaryOverride` 충돌 여부**: **충돌 없음(독립 compose)**
- DB 금액 우선순위: `override > salaryPath[n-1] > 기본`(calculation-policy §override). YEARLY_CUSTOM + override 입력 시 DB는 override 기준, DC는 여전히 `yearlySalaries` 경로.
- 두 설정 동시 입력 = 의도적 고급 조합. 추가 충돌 UI 불필요. 보고서에 두 설정 표시되는지 §8에서 점검.

---

## 7. URL 공유/복원 정책 — **PR 15 당시 미포함, PR 17에서 대체됨**

> 아래 내용은 PR 15 당시 결정 기록이다. 현재는 기본 미포함을 유지하면서 매 공유 시 명시적으로 동의하면 포함·복원하며, 80년·8KB 상한과 손상 URL 폴백을 적용한다. 현재 계약은 `docs/pr-17-design.md`를 따른다.

**PR 15 당시 결정: `yearlySalaries`(및 고급 임금 시나리오 설정 전반)을 URL에 포함하지 않는다.**
- 근거: (a) 현재 WAGE_PEAK/STEP_UP도 URL 직렬화 없음 → 일관성; (b) n개 연봉 직렬화 시 URL이 ~150–400자 증가; (c) 연봉은 고도 개인정보 → URL/히스토리/서버로그 노출 확대; (d) 복원 검증·fallback 복잡도.

**동작**
- `buildShareUrl`: salaryPath 관련 파라미터 미포함(현행 유지). `yearlySalaries` 직렬화 코드 추가 안 함.
- `parseSearchToFormValues`: 링크에 `yearlySalaries` 없음 → **`salaryPathMode`는 기본값(`CONSTANT_GROWTH`)으로 복원**됨(현행과 동일). 즉 공유 링크를 열면 고급 임금 시나리오 설정은 전달되지 않는다.
- **`ShareSection` 안내문 표시(PR 15C)**: `salaryPathMode !== "CONSTANT_GROWTH"`일 때 — “고급 임금 시나리오(임금피크제·승진·연도별 직접 입력) 설정은 공유 링크에 포함되지 않습니다. 링크로 열면 기본 설정으로 표시됩니다.” (기존 개인정보 경고문과 병기)

> 복원 시 `salaryPathMode`가 기본값으로 돌아갈 수 있음을 안내 문구로 명시한다.

---

## 8. 인쇄 보고서 반영 (PR 15C — `PrintReportHeader.tsx`)

**⚠️ 구현 주의**: 본 절 예시 코드는 **실제 타입명·현재 코드 필드명을 구현 시점에 반드시 확인**해야 한다. 특히 `remainingServiceYears`(SimulationInput) vs `remainingYearsOfService`(SimulatorFormValues) 등 **이름 불일치 가능성**에 주의. 아래는 의사코드이므로 그대로 복사하지 말 것.

**`salaryScenarioLabel` YEARLY_CUSTOM 분기(의사코드)**
```ts
} else if (values.salaryPathMode === "YEARLY_CUSTOM") {
  // 구현 시 실제 필드명 확인: input.remainingServiceYears (SimulationInput)
  const n = input.remainingServiceYears;
  const nums = values.yearlySalaries
    .map(parseKRWInput)
    .filter((x): x is number => x !== null && x > 0);
  salaryScenarioLabel = `연도별 직접 입력 — ${n}년치` +
    (nums.length ? ` (첫 ${formatKRW(nums[0])} / 마지막 ${formatKRW(nums[nums.length - 1])})` : "");
}
```
- **n 클 때 표 길이**: 상세 전체 나열 대신 **요약 1줄**(n, 첫/마지막 연봉) → 입력 요약 표가 부풀지 않음.
- 상세 전체 표가 필요하면 별도 블록을 `print:break-inside-avoid` + 화면 전용 `max-h`로 두되, MVP는 **요약줄만** 권장.
- **PDF 수동 QA 갱신**: manual-qa 4.15 기대결과에 “YEARLY_CUSTOM 모드 시 임금 경로 설정이 요약줄로 표시” 추가.

**사이드 정리(같은 파일)**: STEP_UP 분기 라벨 `"단계별 상승"` → 폼 드롭다운 `"승진·호봉 점프"`와 일치시킴.

---

## 9. 테스트 계획

**Vitest (PR 15B)**
- `salary-path.test.ts`: **변경 없음**(엔진 불변). 기존 3건 유지.
- `validation.test.ts` 신규:
  - 길이 불일치 → `errors.yearlySalaries` + `input === null`
  - 빈/0/음수/과다 원소 → 에러 (메시지 길이 제한 “외 N개” 검증 포함)
  - 정상 n개 → `input.salaryPathConfig.mode === "YEARLY_CUSTOM"` + `yearlySalaries` number[]
  - `dbAverageSalaryOverride` 동시 입력 시 DB에만 반영(conflict 없음)
- `useSimulatorForm`/`SimulatorPage.test.tsx`: resize(pref/pad/truncate, **사용자 입력 보존**), “채우기” 버튼 prefill, **뱃지는 `result !== null` 시만**, currentSalary/growth 변경 시 yearlySalaries 미갱신
- `urlParams.test.ts`: YEARLY_CUSTOM 세션의 share URL에 `salaries=` 미포함 단정; restore 시 `CONSTANT_GROWTH` 폴백

**Playwright E2E (PR 15C)** — 신규 `e2e/yearly-custom.spec.ts` 또는 `scenarios.spec.ts` 확장:
1. 모드 “연도별 직접 입력” 선택 → n개 행 표시 / 되돌리면 숨김
2. “현재 연봉으로 채우기” → 결과 갱신 + “적용 중” 뱃지
3. 행 하나 비우기 → 에러 메시지 + 결과 패널 계산 보류
4. “공유 링크 복사” → URL에 `salaries=` 미포함 단정 + 고급 설정 미포함 안내문 표시
5. 인쇄(media print)에서 “연도별 직접 입력 — n년치” 요약줄 표시

---

## 10. 문서 업데이트 계획 (PR 15C)

| 파일 | 변경 |
|---|---|
| `docs/calculation-policy.md` | YEARLY_CUSTOM 행 아래 노트: “v0.1.0 UI 미노출 → PR 15부터 UI 노출”. **수식은 변경 없음**. |
| `docs/manual-qa.md` 4.7 | **N/A/Deferred → active 전환**. 실제 단계로 재작성(모드 “연도별 직접 입력”, “현재 연봉으로 채우기”, 길이/빈 값 에러, 뱃지). 매핑표·집계문구·변경이력 갱신 |
| `docs/release-checklist.md` 4.7 | `[x] N/A` → active `[ ]` 항목으로 복구 + 변경이력 |
| `docs/test-scenarios.md` | 5.4 YEARLY_CUSTOM 아래 UI/E2E 매핑 추가 |
| `README.md` | 기능 목록에 `YEARLY_CUSTOM` 재추가: `(CONSTANT_GROWTH, WAGE_PEAK, STEP_UP, YEARLY_CUSTOM)` |
| `docs/qa-results-*.md` | PR 15 검증 후 신규 결과 항목(4.7 PASS) |

---

## 11. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| UI 복잡도(n행 입력) | 고급 details 안 한정 + 스크롤 박스 + “채우기” 버튼. 기본 폼 영향 0 |
| 사용자 입력 실삭제(resize) | ⚠️ 자동 조정은 모드 진입/n 변경 시만, 기존값 보존, currentSalary/growth 변경은 미갱신(§4) |
| URL 길이/개인정보 | `yearlySalaries` 직렬화 제외(§7) + 고급 설정 미포함 안내문 |
| 보고서 표 길이 | 상세 대신 요약 1줄(n, 첫/끝 연봉) |
| 모바일 입력 UX(375px) | 1열 스택 + 충분한 입력 타겟; E2E 375px로 가독 확인 |
| resize 무한루프 | effect 의존성 최소화(`remainingYearsOfService`, `salaryPathMode`만) |
| 뱃지 오표시(미완료인데 표시) | 뱃지 조건을 `result !== null`로 정정 |
| 엔진 throw 노출 | UI validation 선차단; 엔진 throw는 2차 방어로 유지 |
| 메시지 과장 | validation 메시지 앞 5개 + “외 N개”(§5) |
| 타입 단언 남용 | `parseKRWInput` → number[] 변환 시 type guard/filter(§6) |
| 필드명 불일치 | PrintReportHeader 구현 시 실제 필드명 확인(§8) |
| 테스트 flaky | locator는 label 기반(`getByLabel("3년차 연봉")`) |
| STEP_UP 라벨 불일치(사전 결함) | PR 15C에서 인쇄 라벨 정리 |

---

## 12. 구현 PR 분리 (확정)

- **PR 15A — 설계 문서**: 본 파일(리뷰만, 코드 0)
- **PR 15B — UI + validation + 단위테스트**: types/`AdvancedSalarySection`/`useSimulatorForm`/`validation.ts`/`ResultPanel`(뱃지) + Vitest. **보고서·E2E 없음.**
- **PR 15C — 보고서 + 공유 안내 + 문서 + E2E**: `PrintReportHeader`(YEARLY_CUSTOM 요약 + STEP_UP 정리), `ShareSection`(고급 설정 미포함 안내), 문서 6종, Playwright E2E 5건

근거: 15B가 상태/검증/resize로 회귀 위험이 크므로 먼저 green 고정 후 15C(표시/문서/E2E)를 얹어 리뷰·롤백 단위를 깔끔하게 유지.

---

## 13. 구현 프롬프트 (PR 15B 당시 기록 — PR 17 공유 정책으로 대체됨)

```
PR 15B 구현. 범위: YEARLY_CUSTOM salary path UI + validation + 단위테스트 ONLY.
(보고서/공유 안내/문서/E2E는 PR 15C에서 별도.)

제약:
- src/calculator/** 절대 수정 금지 (엔진 재사용).
- 계산 수식/세금/포트폴리오/몬테카를로 건드리지 말 것.
- PR 15B 범위에서는 URL 직렬화 추가 금지 (PR 17에서 명시적 옵트인 방식으로 대체).
- 고급 임금 시나리오 details 안에서만 노출. 기본 폼 변경 금지.
- 보고서(PrintReportHeader)·E2E·문서는 이 PR에서 하지 않는다.

작업:
1. features/simulator/types.ts
   - SalaryPathModeUI 에 "YEARLY_CUSTOM" 추가
   - SimulatorFormValues 에 yearlySalaries: string[] 추가 (기본값 [])
2. hooks/useSimulatorForm.ts
   - DEFAULT_FORM_VALUES.yearlySalaries = []
   - 자동 resize는 오직 (a) YEARLY_CUSTOM 진입 시(빈 배열일 때만 prefill), (b) remainingYearsOfService 변경 시만.
     n 증가: 기존값 보존 + 새 칸만 베이스라인 pad. n 감소: 꼬리 truncate.
     currentSalary/salaryGrowthRate 변경으로는 yearlySalaries를 건드리지 않는다.
     effect 의존성: remainingYearsOfService, salaryPathMode 만 (무한루프 주의).
   - fillYearlyFromBaseline(): buildSalaryPath(CONSTANT_GROWTH) 결과를 KRW 표시문자열로 변환해 세팅
3. components/AdvancedSalarySection.tsx
   - MODE_OPTIONS 에 {value:"YEARLY_CUSTOM", label:"연도별 직접 입력"} 추가
   - 해당 모드일 때: n개 TextInput 행(label "{t}년차 연봉", suffix 원, inputMode numeric), max-h 스크롤 박스, "현재 연봉으로 채우기" Button
   - onChange('yearlySalaries', newArray) 로 행 갱신
4. utils/validation.ts
   - YEARLY_CUSTOM 블록: length!==n 에러, 원소별 parseKRWInput→null/<=0/>1e12 에러 집계(앞 5개 + "외 N개")
   - 통과 시 salaryPathConfig 구성. number[] 변환 시 type guard/filter 사용 (as number[] 금지).
5. components/ResultPanel.tsx (뱃지): salaryPathMode!==CONSTANT_GROWTH && result!==null
6. 단위테스트: validation.test.ts(길이/빈/0/음수/과다/정상/메시지길이/override동시),
   SimulatorPage.test.tsx(resize pad/truncate + 사용자입력 보존, fill 버튼, 뱃지조건, currentSalary/growth 변경 시 미갱신),
   urlParams.test.ts(salaries 미포함 + CONSTANT_GROWTH 폴백)

완료 기준: pnpm qa 전부 green. 기존 253+33 테스트 회귀 0.
```

---

## 14. 리뷰 체크리스트

**엔진 무결성**
- [ ] `src/calculator/**` 1줄도 변경 없음 (diff 비어있어야)
- [ ] 엔진 재사용 경로: `validateForm` → `SimulationInput.salaryPathConfig` → `simulate` → `buildSalaryPath`
- [ ] 엔진 throw(길이 불일치)가 UI validation으로 선차단되는가

**상태/검증**
- [ ] `yearlySalaries` 표시문자열(string[])과 계산 number[] 분리 명확
- [ ] resize: 기존 사용자 입력 보존, 자동 조정은 모드 진입/n 변경 시만, currentSalary/growth 변경은 미갱신
- [ ] 무한루프 없음
- [ ] 모든 에러 케이스(길이/빈/0/음수/NaN/과다) 검증 + `input:null` → 결과 보류
- [ ] validation 메시지 길이 제한(앞 5 + “외 N개”)
- [ ] `parseKRWInput` → number[] 변환에 type guard/filter 사용
- [ ] `dbAverageSalaryOverride`와 충돌 없음(DB만 override, DC는 경로 유지)

**UX**
- [ ] 고급 details 안에만 노출, 기본 폼 무변경
- [ ] n행 스크롤 + “채우기” 버튼 + 모바일 1열 가독
- [ ] 뱃지는 `result !== null`일 때만

**URL/개인정보(PR 15C)**
- [ ] `buildShareUrl`/`parseSearchToFormValues` 에 `yearlySalaries` 미추가
- [ ] 고급 설정 미포함 안내문 표시 + 복원 시 기본값 폴백 안내

**보고서(PR 15C)**
- [ ] YEARLY_CUSTOM 요약줄 렌더(n, 첫/끝 연봉) — 구현 시 실제 필드명 확인
- [ ] STEP_UP 라벨 “승진·호봉 점프”로 정리
- [ ] 긴 표로 페이지 깨짐 없음(요약줄)

**문서(PR 15C)**
- [ ] manual-qa 4.7 active 전환, 매핑표·집계·이력
- [ ] release-checklist 4.7 active, README 기능목록 복구, calculation-policy 노트, test-scenarios 매핑

**테스트**
- [ ] 엔진 단위테스트 3건 유지(회귀 0)
- [ ] validation/state/url/report 신규 단위테스트
- [ ] E2E 5건(PR 15C)
- [ ] `pnpm qa` green, 기존 253+33 회귀 0

**제약 준수**
- [ ] 의존성/차트/서버/로그인/API 추가 없음
- [ ] v0.1.0·rc.1·rc.2 태그 건드리지 않음
