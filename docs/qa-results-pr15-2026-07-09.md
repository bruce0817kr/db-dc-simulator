# PR 15 QA 결과 (2026-07-09)

- **범위**: PR 15B/15C — `YEARLY_CUSTOM`(연도별 직접 입력) salary path UI 노출 + 검증 + 인쇄 보고서 + 공유 안내 + E2E + 문서
- **기반**: `ea1c994`(PR 15B) 이후 PR 15C 작업. 계산 엔진(`src/calculator/**`)은 변경 없음.
- **환경**: Chromium(Playwright 번들, 자동)
- **실행자**: 자동화 주도 (2026-07-09)

> **전체 판정: PASS** — 4.7 YEARLY_CUSTOM이 v0.1.0 N/A/Deferred에서 active로 전환되어 자동 검증됨.

---

## 결과 요약 (4.7 YEARLY_CUSTOM)

| 항목 | 결과 | 근거 |
|------|------|------|
| 모드 노출·n개 행 표시/숨김 | ✅ PASS | `yearly-custom.spec.ts` yc-1 |
| 현재 연봉으로 채우기(baseline) + 적용 중 뱃지 | ✅ PASS | `yearly-custom.spec.ts` yc-2 |
| 행 비우기 → 검증 에러 + 결과 보류 | ✅ PASS | `yearly-custom.spec.ts` yc-3 |
| 공유 링크에 salaries 미포함 + 미포함 안내문 | ✅ PASS | `yearly-custom.spec.ts` yc-4 |
| 인쇄 보고서 연도별 요약줄 | ✅ PASS | `yearly-custom.spec.ts` yc-5 |

### 단위테스트 (Vitest)
- ✅ `validation.test.ts` — 길이/빈/0/음수/과다/정상/메시지 길이 제한/override 동시 (PR 15B)
- ✅ `SimulatorPage.test.tsx` — resize pad/truncate + 사용자 입력 보존, 채우기 버튼, 뱃지 조건, currentSalary/growth 미갱신 (PR 15B)
- ✅ `urlParams.test.ts` — salaries 미포함 + CONSTANT_GROWTH 폴백 (PR 15B)
- ✅ `PrintReportHeader.test.tsx` — YEARLY_CUSTOM 요약줄(n, 첫/마지막), STEP_UP 라벨 정리, CONSTANT_GROWTH 회귀 (PR 15C)
- ✅ `ShareSection.test.tsx` — CONSTANT_GROWTH 미표시 / YEARLY_CUSTOM·WAGE_PEAK 고급 설정 미포함 안내 표시 (PR 15C)

### 엔진 무결성
- ✅ `src/calculator/**` 변경 0건 (엔진 재사용, 수식 불변)
- ✅ `salary-path.test.ts` 기존 3건 회귀 0

---

## 사이드 정리 (PR 15C)
- `PrintReportHeader` STEP_UP 라벨 `"단계별 상승"` → `"승진·호봉 점프"` 정리 (폼 드롭다운과 일치). qa-results-2026-07-08 발견 #1의 잔류 불일치 해소.

---

## 집계
- 단위테스트: 272 passed (기존 265 + 신규 7)
- E2E: 38 passed (기존 33 + 신규 5: `yearly-custom.spec.ts`)
- `pnpm qa` 4-gate(test·lint·build·e2e) green

## 비고
- YEARLY_CUSTOM 세션의 URL 공유는 연도별 연봉을 포함하지 않으며, 링크 복원 시 `CONSTANT_GROWTH` 기본값으로 폴백됨(안내문 표시).
- 엔진 수식·세금·포트폴리오·몬테카를로는 변경 없음.
- 본 결과는 4.7 단일 시나리오에 대한 PR 15 검증이며, 전체 회귀는 `pnpm qa`로 확인.
