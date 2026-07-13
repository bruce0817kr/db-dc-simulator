# 배포 체크리스트 (Release Checklist)

본 문서는 DB/DC 퇴직연금 전환 시뮬레이터의 출시 전 검증 항목을 정의한다.
모든 항목이 충족되어야 배포 가능 상태로 간주한다.

---

## 1. 4-gate (필수)

| 게이트 | 명령 | 기준 |
|--------|------|------|
| Test | `pnpm test` | 전량 통과 (현재 296건) |
| Lint | `pnpm lint` | eslint 오류·경고 없음 |
| Typecheck | `pnpm build` (TS 검사 포함) | Finished TypeScript 성공 |
| Build | `pnpm build` | 정적 프리렌더 `/` 완료 |
| E2E | `pnpm e2e` | Playwright 전량 통과 (현재 49건, PR 14/15/17/18) |
| 통합 QA | `pnpm qa` | test && lint && build && e2e 전부 통과 |
| Container | GitHub Actions `Container image` | PR에서는 build-only, master/tag에서는 `pnpm qa` 성공 후 GHCR publish |

- 4-gate 중 하나라도 실패 시 배포 불가.
- GitHub Actions CI green: master push/PR 시 `.github/workflows/ci.yml`이 `pnpm qa`를 자동 실행한다 (PR 16A).
- Container workflow green: PR에서는 registry 로그인·push·attestation step이 실행되지 않아야 한다 (PR 16D).

- `package.json` scripts 기준:
  - `dev`: next dev
  - `build`: next build
  - `start`: next start
  - `start:standalone`: node scripts/start-standalone.mjs (standalone 프로덕션 서버, Docker 와 동일 아티팩트)
  - `lint`: eslint
  - `test`: vitest run
  - `e2e`: playwright test
  - `e2e:headed`: playwright test --headed
  - `qa`: pnpm test && pnpm lint && pnpm build && pnpm e2e

## 2. 계산 정합성

- [ ] 샘플 케이스 golden값 일치
  - S=80M, y0=10, n=15, g=r=0.03 → DB≈DC, diff≈0, breakeven≈0.03
- [ ] g = r이면 DB = DC 정합성 (CONSTANT_GROWTH 경로)
- [ ] n = 0 → breakevenReturnRate = null
- [ ] CUSTOM + customTransferAmount = settlement → TRANSFER_ALL_TO_DC와 동일
- [ ] dbAverageSalaryOverride 시 DC(r*) 상대오차 < 1e-4
- [ ] 민감도 매트릭스 54 points (6 × 9)
- [ ] breakevenByGrowthRate 각 r*의 정합성
- [ ] DB/DC 비교선 차트 9개 점 × 2계열 + 손익분기·현재 입력 + 정확한 수치 표
- [ ] 세금 단조성 (gross 증가 → totalTax 증가)
- [ ] 세금 경계 연속성 (근속 5/10/20년, 환산급여 800만/7,000만/1억/3억)
- [ ] 몬테카를로 seed 고정 재현성
- [ ] σ = 0 → p50 = calculateDcAmount

자동화 매핑: `docs/test-scenarios.md` 각 절 참조.

## 3. 문서 동기화

- [ ] `docs/calculation-policy.md`와 코드 일치
  - 퇴직소득세 산식, 현재가치, 룰셋, 포트폴리오 가정
- [ ] `docs/product-principles.md`와 UI 문구 일치
  - 투자 권유 금지, "지수 추종형 자산을 가정", "세전 시뮬레이션"
- [ ] `docs/disclaimer.md`와 `AssumptionNotice`, `RiskSection`, `ShareSection` 문구 일치
- [ ] `docs/test-scenarios.md`의 golden값이 테스트 단정문과 일치
- [ ] `docs/release-checklist.md`의 4-gate가 `package.json` scripts와 일치
- [ ] `README.md`의 명령어가 `package.json` scripts와 일치

## 4. UI/접근성

### 4.1 반응형

- [ ] 모바일 세로 360px에서 입력·결과 확인 가능
- [ ] 태블릿 768px에서 레이아웃 정상
- [ ] 데스크톱 1280px에서 2단 레이아웃 (`lg:grid-cols-[400px_1fr]`)
- [ ] 민감도 매트릭스 표 모바일 가로 스크롤 가능 (`overflow-x-auto`)

### 4.2 접근성

- [ ] 모든 숫자 입력이 `<label>`과 연결 (`getByLabelText` 회피 가능)
- [ ] 키보드 Tab 순서 논리적
- [ ] 결과 카드 heading(h2/h3) 존재
- [ ] 주의문구 읽기 가능 (텍스트 기반, 색상 전용 아님)
- [ ] 이미지 alt 부재 검사: `<img>` 0건 (시뮬레이터는 이미지 없음)

### 4.3 색상 의존성

- [ ] DB/DC 배지가 색 + 텍스트 라벨 동시 제공
- [ ] DC 유리 / DB 유리 / 거의 동일 텍스트 라벨 존재
- [ ] TIE 표기 "=" 또는 "거의 동일"

## 5. 제품 문구 감사

- [ ] "추천" 텍스트 부재 (문서 전체)
- [ ] "가입" 텍스트 부재
- [ ] "매수" 텍스트 부재
- [ ] "확정 수익" / "보장 수익률" 부재
- [ ] "세전 시뮬레이션" 표시 존재
- [ ] "지수 추종형 자산을 가정" 표현 사용 (S&P 500, NASDAQ 100)
- [ ] "가정치이며 예측이나 보장이 아닙니다" 안내 존재 (포트폴리오)
- [ ] "확정 예측이 아닙니다" 표시 (리스크 섹션)
- [ ] 회사 규약 변동 안내 존재 (AssumptionNotice)

자동화 매핑: `SimulatorPage.test.tsx` — `(preset-e) 추천·가입 부재`, `(risk-b) 확정 예측 아님`, `(a) 세전 시뮬레이션`

## 6. 개인정보

- [ ] URL 공유 경고문 존재 ("재무 정보가 그대로 포함됩니다")
- [ ] 고급 임금 설정 공유 옵트인은 기본 미선택이며 선택 시에만 고급 파라미터 포함
- [ ] 별도 데이터베이스 미저장 + 브라우저 기록·운영 서버 접속 로그 가능성 안내
- [ ] localStorage 자동 저장 부재 (명시 옵션으로만 확장 예정)
- [ ] 외부 API 전송 부재

## 7. 인쇄/보고서

- [ ] `window.print()` 트리거 버튼 존재
- [ ] 인쇄 헤더 화면 hidden / 인쇄 시 block
- [ ] ShareSection, HeroSection, DisplayModeToggle 인쇄 시 숨김 (`print:hidden`)
- [ ] 민감도·리스크·스트레스 섹션 `break-inside-avoid` 적용
- [ ] 표 `print:overflow-visible`, `print:min-w-0` 적용
- [ ] 기준 환경에서 약 4페이지 또는 주요 섹션 누락 없음 (헤더/요약/민감도/주의사항)

자동화 매핑: `SimulatorPage.test.tsx` — 인쇄 smoke 보강 (PR 12)

## 7-수동. 수동 QA (PR 13)

자동화가 커버하지 못한 출시 전 수동 검증. 상세 시나리오와 결과 기록 형식은 `docs/manual-qa.md` 참조.

- [ ] 4.1 기본 샘플 입력 — 카드 4장 + 손익분기 문장 + 주의문구
- [ ] 4.2 DB 유리 케이스 (DC 1%) — 차이 음수 + "DB 유리" 라벨
- [ ] 4.3 DC 유리 케이스 (DC 7%) — 차이 양수 + "DC 유리" 라벨
- [ ] 4.4 CUSTOM_TRANSFER_AMOUNT — 정산금 입력 노출/숨김
- [ ] 4.5 임금피크제 (WAGE_PEAK) — DB 감소 + "적용 중" 뱃지
- [ ] 4.6 STEP_UP — DB/DC 증가 + "적용 중" 뱃지
- [ ] 4.7 YEARLY_CUSTOM (연도별 직접 입력) — 모드 노출·채우기·검증·뱃지·공유 기본 미포함·인쇄 요약 (`e2e/yearly-custom.spec.ts`)
- [ ] 4.8 포트폴리오 프리셋 변경 — 6개 프리셋 DC 수익률 자동 반영
- [ ] 4.9 위험자산 한도 안내 — "현재 서비스의 계산 가정" summary
- [ ] 4.10 몬테카를로 리스크 — p5~p95 표 + "확정 예측이 아닙니다"
- [ ] 4.11 스트레스 테스트 — -10/20/30/40% 4행 + 예금형 시 표 미렌더
- [ ] 4.12 세전/세후 토글 — "(세후)" 라벨 + 실효세율 + 세법 고지
- [ ] 4.13 현재가치 표시 — 물가상승률 입력 노출 + 금액 감소
- [ ] 4.14 URL 공유 복원 — 기본값 복원 + 고급 설정 옵트인 복원 + 개인정보 경고문
- [ ] 4.14 공유 URL 직접 진입 — React hydration/console/page 오류 0건
- [ ] 4.15 인쇄/PDF 보고서 — 기준 환경에서 약 4페이지 또는 주요 섹션 누락 없음 + 헤더 + 주의문구
- [ ] 4.16 모바일 375px — 1단 레이아웃 + 표 가로 스크롤
- [ ] 4.17 긴 금액 (10억 원) — 카드 깨짐 없음 + 콤마 포맷
- [ ] 4.18 키보드 탭 이동 — Tab 순서 논리적 + Enter 버튼 활성

브라우저 매트릭스 (Chrome/Edge/Safari):
- [ ] 4.1 기본 샘플 입력 — 3개 브라우저 전부 PASS
- [ ] 4.14 URL 공유 복원 — 3개 브라우저 전부 PASS
- [ ] 4.15 인쇄/PDF 보고서 — 3개 브라우저 전부 PASS
- [ ] 4.16 모바일 375px — Chrome/Edge/Safari 전부 PASS

Safari 검증은 macOS/iOS 환경이 없으면 N/A로 기록한다.

배포 환경 정보: `docs/deployment-notes.md` 참조.

## 8. 인프라

- [ ] `.fablize/`, `.gjc/` 추적 제외 (`.gitignore` 등록)
- [ ] 의존성 추가 없음 (next, react, react-dom + devDeps 유지)
- [ ] 차트 라이브러리 미사용
- [ ] 외부 금융 API 미연동
- [ ] Docker smoke (PR 16B): `docker compose up -d` → `127.0.0.1:3000` 200 응답 + `docker compose exec db-dc-simulator id` non-root(uid 1001) + 로그 치명 에러 0건
- [ ] PR workflow에서 `Build image (no publish)`만 실행
- [ ] master workflow에서 `latest`와 `sha-<40자리 SHA>` 발행
- [ ] 향후 `v*` tag workflow에서 지원하는 SemVer core/prerelease tag 발행
- [ ] 잘못된 `v*` tag는 publish 전에 실패
- [ ] `pnpm qa` 실패 시 login·push·attestation 미실행
- [ ] 발행 digest에 GitHub artifact attestation 생성
- [ ] GHCR package가 이 저장소에 연결되고 visibility 정책이 명시됨
- [ ] 불변 digest를 `DB_DC_SIMULATOR_IMAGE`로 지정해 healthcheck 통과
- [ ] 이전 SHA 또는 로컬 build로 롤백 가능


## 9. 데이터 처리

- [ ] 모든 계산이 브라우저 내 수행
- [ ] 계산 함수가 `Date`, `locale`, browser API에 의존하지 않음
- [ ] 동일 input → 동일 output (deterministic)
- [ ] seed 고정 시 몬테카를로 재현성

## 10. 롤백 조건

다음 중 하나라도 발생 시 즉시 롤백:

- 4-gate 중 하나 실패
- 샘플 케이스 golden값 불일치
- "추천", "가입", "확정 수익" 금지 문구 노출
- 서버 전송 또는 외부 API 호출 발견
- 인쇄 보고서에 주의문구 누락
- URL 공유 시 개인정보 경고문 누락

---

## 변경 이력

| 날짜 | 변경 | 비고 |
|------|------|------|
| 2026-07-07 | 최초 작성 (PR 12) | master plan 12절 기반 세부화 |
| 2026-07-07 | 수동 QA 절 추가 (PR 13) | 18개 시나리오 + 브라우저 매트릭스 + 4-gate 테스트 수 253으로 갱신 |
| 2026-07-08 | E2E 게이트 추가 (PR 14) | Playwright 자동화 33건 추가, `pnpm e2e`/`pnpm qa` 게이트 도입 |
| 2026-07-08 | 4.7 YEARLY_CUSTOM N/A/Deferred (방침 B) | v0.1.0 UI 미노출. 엔진·단위 테스트는 지원. UI 노출은 PR 15 후보. v0.1.0 차단 아님 |
| 2026-07-09 | 4.7 active 전환 (PR 15B/15C) | YEARLY_CUSTOM UI 노출·검증·인쇄 요약·공유 안내·E2E 5건 추가. `[x] N/A` → active `[ ]` 복구 |
| 2026-07-09 | GitHub Actions CI 추가 (PR 16A) | master push/PR 시 `pnpm qa` 자동 실행, `.github/workflows/ci.yml` |
| 2026-07-10 | Docker smoke check 추가 (PR 16B) | `docker compose` 배포 검증 항목 (200/non-root/로그) |
| 2026-07-10 | webServer standalone 정합 (PR 16C) | E2E webServer·로컬 QA → standalone 서버(`pnpm start:standalone`). `next start` 경고 제거, Docker 와 동일 아티팩트 검증. E2E 38건, scripts 목록 갱신 |
| 2026-07-10 | URL 공유 고급 설정 옵트인 (PR 17) | 기본 미포함, 매 공유 재동의, 손상 URL 폴백, 80년·8KB 상한. 단위·컴포넌트 283건, E2E 40건 |
| 2026-07-10 | DB/DC 민감도 차트 (PR 18) | 네이티브 SVG, 표 병행, 색상 외 구분, 375/768/1280·인쇄·axe 검증. 단위·컴포넌트 296건, E2E 49건 |
| 2026-07-13 | GHCR 이미지 발행 (PR 16D) | PR build-only, QA-gated master/tag publish, SHA 추적·SemVer tag, digest provenance attestation, compose image override |
