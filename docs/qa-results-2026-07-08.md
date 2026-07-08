# 수동 QA 결과 (2026-07-08)

- **기반**: `v0.1.0-rc.2` (`229ce50`). 수동 QA는 `ea4222f` 프로덕션 빌드로 실행 (== rc.2 앱 바이너리, 문서 전용 차이).
- **환경**: Chromium(Playwright 번들, 자동) + Chrome·Edge(사람 눈 수동) + Safari(N/A)
- **실행자**: 자동화 주도 + 사람 눈 수동 검증 (2026-07-08)
- **자동 근거**: `pnpm e2e` 33 passed + 일시적 보충 스펙 4 passed(실행 후 삭제)
- **수동 근거**: 4.15 실제 PDF 저장 / 4.17 10억 시각 / 4.18 키보드 / Chrome·Edge 매트릭스 — 전부 사람 눈 PASS

> **전체 판정: PASS** (v0.1.0 최종 태그 가능 — 사용자 최종 승인 시)
> - 발견 #1(4.6 라벨 불일치) — 문서 정정 완료 (비치명, 해결됨)
> - 4.7 YEARLY_CUSTOM — **N/A / Deferred** (방침 B: v0.1.0 UI 미노출, PR 15 후보. **비차단**)
> - 수동 사람-눈 항목(4.15/4.17/4.18/매트릭스) 전부 PASS 또는 합의된 N/A

---

## 결과 요약

| # | 시나리오 | 결과 | 근거 |
|---|---------|------|------|
| 4.1 | 기본 샘플 입력 | ✅ PASS | `basic.spec.ts` — 카드 4장 + 손익분기 문장 + 주의문구 |
| 4.2 | DB 유리 (DC 1%) | ✅ PASS | `scenarios.spec.ts` — "DB 유리" 라벨 + 손익분기 문장 |
| 4.3 | DC 유리 (DC 7%) | ✅ PASS | `scenarios.spec.ts` — "DC 유리" 라벨 + 손익분기 문장 |
| 4.4 | CUSTOM_TRANSFER_AMOUNT | ✅ PASS | `scenarios.spec.ts` — 정산금 입력 노출/숨김 |
| 4.5 | 임금피크제 (WAGE_PEAK) | ✅ PASS | 보충 스펙 — 모드 전환·필드 노출·"적용 중" 뱃지 |
| 4.6 | STEP_UP | ✅ PASS | 보충 스펙 — 뱃지 정상. 매뉴얼 라벨 불일치 → 정정 완료 (발견 #1) |
| 4.7 | YEARLY_CUSTOM | ⬜ N/A (Deferred) | 방침 B — v0.1.0 UI 미노출. 엔진·단위 테스트는 지원. PR 15 후보. **비차단** |
| 4.8 | 포트폴리오 프리셋 | ✅ PASS | `scenarios.spec.ts` 6 프리셋 자동 수익률 반영 + 가정치 안내 + 금지문구 부재 |
| 4.9 | 위험자산 한도 안내 | ✅ PASS | `scenarios.spec.ts` — "현재 서비스의 계산 가정" 룰셋 정보 |
| 4.10 | 몬테카를로 리스크 | ✅ PASS | `scenarios.spec.ts` — 리스크 섹션 + 확률 카드 + "확정 예측이 아닙니다" |
| 4.11 | 스트레스 테스트 | ✅ PASS | `scenarios.spec.ts` — -10/20/30/40% 4행 + 예금형 시 표 미렌더 |
| 4.12 | 세전/세후 토글 | ✅ PASS | `scenarios.spec.ts` — "(세후)" + 실효세율 + 세법 고지 |
| 4.13 | 현재가치 표시 | ✅ PASS | `scenarios.spec.ts` — 물가상승률 입력 노출 + 11 입력 시 에러 |
| 4.14 | URL 공유 복원 | ✅ PASS | `url-share.spec.ts` — 클립보드 + 개인정보 경고 + 새 탭 복원 |
| 4.15 | 인쇄/PDF 보고서 | ✅ PASS | `print.spec.ts`(자동) + **실제 PDF 저장 확인**(수동): 헤더·입력요약·결과·민감도·리스크·스트레스·주의문구 누락 없음 |
| 4.16 | 모바일 375px | ✅ PASS | `mobile.spec.ts` (375px 프로젝트) — 1단 레이아웃 + 입력 + overflow-x-auto |
| 4.17 | 긴 금액 (10억) | ✅ PASS | `scenarios.spec.ts`(포맷·콘솔 에러 0) + **시각 깨짐 없음**(수동): 카드·표·모바일 375px 가독 정상 |
| 4.18 | 키보드 탭 이동 | ✅ PASS | 보충 스펙(Tab·Enter 활성) + **상세 순서 확인**(수동): 입력→select→체크박스→공유·인쇄 논리적 + Shift+Tab 역순 |

**집계**: PASS 17 / N/A(Deferred, 비차단) 1 (4.7) / FAIL 0 / BLOCKED 0

### 부가 자동화 (시나리오 외)
- ✅ 접근성 자동 스캔 — `a11y.spec.ts`: WCAG critical/serious 위반 0, 프리셋 변경 후 유지
- ✅ 제품 원칙 회귀 — 금지 문구 부재 / 필수 문구 존재 / sp500·nasdaq100 "지수 추종형 자산" 표현

### 브라우저 매트릭스 (사람 눈, 2026-07-08)
| 시나리오 | Chrome | Edge | Safari |
|---|---|---|---|
| 4.1 기본 샘플 입력 | ✅ PASS | ✅ PASS | N/A — macOS/iOS 환경 없음 |
| 4.14 URL 공유 복원 | ✅ PASS | ✅ PASS | N/A — macOS/iOS 환경 없음 |
| 4.15 인쇄/PDF 보고서 | ✅ PASS | ✅ PASS | N/A — macOS/iOS 환경 없음 |
| 4.16 모바일 375px | ✅ PASS | ✅ PASS | N/A — macOS/iOS 환경 없음 |

> Chrome·Edge는 사람 눈으로 기본 입력·URL 공유·인쇄 확인 완료. Safari는 macOS/iOS 환경 부재로 N/A (릴리스 차단 아님).

---

## 처리 내역

### 발견 #1 — 4.6 STEP_UP 매뉴얼 라벨 불일치 (해결됨, 비치명)
- **매뉴얼 원본**: 모드 "단계별 상승" / 입력 "인상 연차", "인상률"
- **실제 UI**: 모드 **"승진·호봉 점프"** / 입력 **"점프 연차"**, **"추가 인상률"**
- **조치**: `docs/manual-qa.md` 4.6 라벨 정정 + 변경 이력 추가. 기능 자체는 정상.

### 4.7 YEARLY_CUSTOM — N/A / Deferred (방침 B, 비차단, 유지)
- **방침 유지**: v0.1.0 사용자 UI 미노출. 계산 엔진·단위 테스트 수준 지원은 유지.
- **엔진 현황**: `salary-path.ts` + `salary-path.test.ts`에 구현/테스트 존재. UI는 `SalaryPathModeUI` 3모드만 노출.
- **후속**: **PR 15 후보** — expose YEARLY_CUSTOM salary path UI.
- **v0.1.0 영향**: 없음 (비차단).

---

## 승인 조건 검토 (rc.2 → v0.1.0)

| 조건 | 상태 |
|------|------|
| 18개 시나리오 PASS 또는 N/A | ✅ 충족 (PASS 17 + N/A 1) |
| FAIL 0 또는 비치명 합의 | ✅ 충족 (FAIL 0) |
| 4-gate + `pnpm qa` 유지 | ✅ (자동화 33건 green, 본 업데이트 시점 재검증) |
| 브라우저 매트릭스 4개 핵심 PASS | ✅ 충족 (Chrome·Edge PASS, Safari N/A-환경부재) |
| 문서 동기화 | ✅ (4.6 라벨·4.7 deferral·README 기능목록 정정 완료) |

**결론: v0.1.0 최종 태그 가능** — 차단 이슈 없음. 사용자 최종 승인 시 태그 생성.

---

## 비고
- 자동화(33 e2e + 보충 4) + 사람 눈 수동(4.15/4.17/4.18/Chrome·Edge 매트릭스) 모두 완료.
- Safari는 macOS/iOS 환경 부재로 N/A (인쇄·클립보드 API 차이 검증 미수행, 비차단).
- 일시적 보충 스펙(`e2e/_tmp_manual.spec.ts`)은 검증 후 삭제. 동일 검증 재 필요 시 매뉴얼 부록 스펙화 권장.
