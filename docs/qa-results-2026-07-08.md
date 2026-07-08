# 수동 QA 결과 (2026-07-08)

- **기반**: `v0.1.0-rc.2` (`229ce50`)
- **환경**: Chromium (Playwright 번들, Desktop Chrome + Pixel 5/375px)
- **실행자**: 자동화 주도 + 소스/DOM 검증
- **자동 근거**: `pnpm e2e` 33 passed (24.1s) + 일시적 보충 스펙 4 passed(실행 후 삭제)

> **전체 판정: PASS with one deferred non-blocking item**
> - 발견 #1(4.6 라벨 불일치) — 문서 정정 완료 (비치명, 해결됨)
> - 4.7 YEARLY_CUSTOM — **N/A / Deferred** (방침 B: v0.1.0 UI 미노출, PR 15 후보. v0.1.0 차단 아님)
> - 잔여 사람-눈 항목(4.15 실제 PDF / 4.17 시각 / 4.18 상세 Tab 순서 / Edge·Safari 매트릭스)은 자동화 관점 판정과 별개.

---

## 결과 요약

| # | 시나리오 | 결과 | 근거 |
|---|---------|------|------|
| 4.1 | 기본 샘플 입력 | ✅ PASS | `basic.spec.ts` — 카드 4장 + 손익분기 문장 + 주의문구 |
| 4.2 | DB 유리 (DC 1%) | ✅ PASS | `scenarios.spec.ts` — "DB 유리" 라벨 + 손익분기 문장 |
| 4.3 | DC 유리 (DC 7%) | ✅ PASS | `scenarios.spec.ts` — "DC 유리" 라벨 + 손익분기 문장 |
| 4.4 | CUSTOM_TRANSFER_AMOUNT | ✅ PASS | `scenarios.spec.ts` — 정산금 입력 노출/숨김 |
| 4.5 | 임금피크제 (WAGE_PEAK) | ✅ PASS(기계) | 보충 스펙 — 모드 전환·필드 노출·"적용 중" 뱃지. 금액 감소 방향은 수동 시각 확인 권장 |
| 4.6 | STEP_UP | ✅ PASS(기능) | 보충 스펙 — 뱃지 정상. **매뉴얼 라벨 불일치 → 정정 완료** (발견 #1) |
| 4.7 | YEARLY_CUSTOM | ⬜ N/A (Deferred) | 방침 B — v0.1.0 UI 미노출. 엔진·단위 테스트는 지원. PR 15 후보. v0.1.0 차단 아님 |
| 4.8 | 포트폴리오 프리셋 | ✅ PASS | `scenarios.spec.ts` 6 프리셋 자동 수익률 반영 + 가정치 안내 + 금지문구 부재 |
| 4.9 | 위험자산 한도 안내 | ✅ PASS | `scenarios.spec.ts` — "현재 서비스의 계산 가정" 룰셋 정보 |
| 4.10 | 몬테카를로 리스크 | ✅ PASS | `scenarios.spec.ts` — 리스크 섹션 + 확률 카드 + "확정 예측이 아닙니다" |
| 4.11 | 스트레스 테스트 | ✅ PASS | `scenarios.spec.ts` — -10/20/30/40% 4행 + 예금형 시 표 미렌더 |
| 4.12 | 세전/세후 토글 | ✅ PASS | `scenarios.spec.ts` — "(세후)" + 실효세율 + 세법 고지 |
| 4.13 | 현재가치 표시 | ✅ PASS | `scenarios.spec.ts` — 물가상승률 입력 노출 + 11 입력 시 에러 |
| 4.14 | URL 공유 복원 | ✅ PASS | `url-share.spec.ts` — 클립보드 + 개인정보 경고 + 새 탭 복원 |
| 4.15 | 인쇄/PDF 보고서 | 🟡 부분 PASS | `print.spec.ts` — window.print 호출 + print media 헤더/숨김/시각. **실제 PDF 저장은 수동 대기** |
| 4.16 | 모바일 375px | ✅ PASS | `mobile.spec.ts` (375px 프로젝트) — 1단 레이아웃 + 입력 + overflow-x-auto |
| 4.17 | 긴 금액 (10억) | 🟡 부분 PASS | `scenarios.spec.ts` — 콤마 포맷 + 콘솔 에러 0건. **시각 깨짐은 수동 대기** |
| 4.18 | 키보드 탭 이동 | 🟡 부분 PASS | 보충 스펙 — Tab 이동 + Enter로 초기화 활성. **상세 순서는 수동 대기** (a11y axe는 `a11y.spec.ts` PASS) |

**집계**: PASS 14 / 부분 PASS 3 / N/A(Deferred) 1 (4.7) / FAIL 0 / BLOCKED 0

### 부가 자동화 (시나리오 외)
- ✅ 접근성 자동 스캔 — `a11y.spec.ts`: WCAG critical/serious 위반 0, 프리셋 변경 후 유지
- ✅ 제품 원칙 회귀 — 금지 문구 부재 / 필수 문구 존재 / sp500·nasdaq100 "지수 추종형 자산" 표현

### 브라우저 매트릭스
| 시나리오 | Chrome(Chromium) | Edge | Safari |
|---|---|---|---|
| 4.1 기본 샘플 입력 | ✅ | 수동 대기 | 수동 대기(N/A 가능) |
| 4.14 URL 공유 복원 | ✅ | 수동 대기 | 수동 대기(클립보드 API 차이 필수 확인) |
| 4.15 인쇄/PDF 보고서 | 부분 ✅ | 수동 대기 | 수동 대기(인쇄 API 차이 필수 확인) |
| 4.16 모바일 375px | ✅ | 수동 대기 | 수동 대기 |

> Chromium 계열(Chrome/Edge)은 동일 동작 예상. Safari는 인쇄·클립보드 API 차이 반드시 수동 확인. macOS/iOS 없으면 N/A.

---

## 처리 내역

### 발견 #1 — 4.6 STEP_UP 매뉴얼 라벨 불일치 (해결됨, 비치명)
- **매뉴얼 원본**: 모드 "단계별 상승" / 입력 "인상 연차", "인상률"
- **실제 UI**: 모드 **"승진·호봉 점프"** / 입력 **"점프 연차"**, **"추가 인상률"**
- **출처**: `AdvancedSalarySection.tsx` `MODE_OPTIONS` 및 필드 라벨
- **조치**: `docs/manual-qa.md` 4.6 라벨을 실제 UI에 맞게 정정 + 변경 이력 추가. 기능 자체는 정상(보충 스펙으로 뱃지 렌더 확인).

### 4.7 YEARLY_CUSTOM — N/A / Deferred (방침 B, 비차단)
- **방침**: v0.1.0에서 사용자 UI 미노출. 계산 엔진·단위 테스트 수준 지원은 유지. v0.1.0 UI QA 대상은 N/A/Deferred.
- **근거**: 릴리스 후보 단계에서 새 사용자 입력 UI를 추가하지 않는다. 연도별 입력 UI는 검증·URL 공유·보고서·E2E까지 연결되어 범위가 크다.
- **엔진 현황**: `salary-path.ts` + `salary-path.test.ts`에 `YEARLY_CUSTOM` 구현/테스트 존재. UI는 `SalaryPathModeUI` 3모드(CONSTANT_GROWTH, WAGE_PEAK, STEP_UP)만 노출.
- **후속**: **PR 15 후보** — expose YEARLY_CUSTOM salary path UI.
- **문서 반영**: `README.md`(기능 목록), `docs/manual-qa.md`(매핑표·집계·4.7 본문), `docs/release-checklist.md`(4.7 항목)에서 UI 제공 표현 제거/정정.

---

## 승인 조건 검토 (rc.2 → v0.1.0)

| 조건 | 상태 |
|------|------|
| 18개 시나리오 PASS 또는 N/A | ✅ 충족 (PASS 14 + 부분 PASS 3 + N/A 1) |
| FAIL 0 또는 비치명 합의 | ✅ 충족 (FAIL 0; 4.6은 비치명-문서 해결, 4.7은 N/A-Deferred) |
| 4-gate + `pnpm qa` 유지 | ✅ (자동화 33건 green) — 본 보고서 작성 시점 재검증 예정 |
| 브라우저 매트릭스 4개 핵심 PASS | 🟡 Chromium만 PASS, Edge/Safari 수동 대기 |
| 문서 동기화 | ✅ (4.6 라벨·4.7 deferral·README 기능목록 정정 완료) |

**결론(자동화 관점)**: v0.1.0 차단 이슈 없음. 최종 태그는 Edge/Safari 수동 매트릭스 + 실제 PDF/시각 확인 후 승인 권장.

---

## 비고
- 본 결과는 자동화 주도 검증. 4.15(실제 PDF)/4.17(시각)/4.18(상세 순서)/Edge·Safari 매트릭스는 사람 눈 수동 확인이 필요하다.
- 일시적 보충 스펙(`e2e/_tmp_manual.spec.ts`)은 4.5/4.6/4.7/4.18 검증 후 삭제. 동일 검증이 필요하면 매뉴얼 부록으로 스펙화 권장.
