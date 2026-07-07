# 배포 체크리스트 (Release Checklist)

본 문서는 DB/DC 퇴직연금 전환 시뮬레이터의 출시 전 검증 항목을 정의한다.
모든 항목이 충족되어야 배포 가능 상태로 간주한다.

---

## 1. 4-gate (필수)

| 게이트 | 명령 | 기준 |
|--------|------|------|
| Test | `pnpm test` | 전량 통과 (현재 249건, PR 12 이후 255~257건 예상) |
| Lint | `pnpm lint` | eslint 오류·경고 없음 |
| Typecheck | `pnpm build` (TS 검사 포함) | Finished TypeScript 성공 |
| Build | `pnpm build` | 정적 프리렌더 `/` 완료 |

- 4-gate 중 하나라도 실패 시 배포 불가.
- `package.json` scripts 기준:
  - `dev`: next dev
  - `build`: next build
  - `start`: next start
  - `lint`: eslint
  - `test`: vitest run

## 2. 계산 정합성

- [ ] 샘플 케이스 golden값 일치
  - S=80M, y0=10, n=15, g=r=0.03 → DB≈DC, diff≈0, breakeven≈0.03
- [ ] g = r이면 DB = DC 정합성 (CONSTANT_GROWTH 경로)
- [ ] n = 0 → breakevenReturnRate = null
- [ ] CUSTOM + customTransferAmount = settlement → TRANSFER_ALL_TO_DC와 동일
- [ ] dbAverageSalaryOverride 시 DC(r*) 상대오차 < 1e-4
- [ ] 민감도 매트릭스 54 points (6 × 9)
- [ ] breakevenByGrowthRate 각 r*의 정합성
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
- [ ] 서버 저장 부재 안내 존재 ("어떤 정보도 서버에 저장하지 않습니다")
- [ ] localStorage 자동 저장 부재 (명시 옵션으로만 확장 예정)
- [ ] 외부 API 전송 부재

## 7. 인쇄/보고서

- [ ] `window.print()` 트리거 버튼 존재
- [ ] 인쇄 헤더 화면 hidden / 인쇄 시 block
- [ ] ShareSection, HeroSection, DisplayModeToggle 인쇄 시 숨김 (`print:hidden`)
- [ ] 민감도·리스크·스트레스 섹션 `break-inside-avoid` 적용
- [ ] 표 `print:overflow-visible`, `print:min-w-0` 적용
- [ ] 인쇄 시 4페이지 출력 (헤더/요약/민감도/주의사항)

자동화 매핑: `SimulatorPage.test.tsx` — 인쇄 smoke 보강 (PR 12)

## 8. 인프라

- [ ] `.fablize/`, `.gjc/` 추적 제외 (`.gitignore` 등록)
- [ ] 의존성 추가 없음 (next, react, react-dom + devDeps 유지)
- [ ] 차트 라이브러리 미사용
- [ ] 외부 금융 API 미연동

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
