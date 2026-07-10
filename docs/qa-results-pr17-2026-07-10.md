# PR 17 QA 결과 — URL 공유 고급 설정 옵트인

- 검증일: 2026-07-10
- 브랜치: `pr-17/url-share-advanced-opt-in`
- 범위: 고급 임금 시나리오와 평균임금 직접 입력의 명시적 URL 공유·복원

## 자동 검증

- `pnpm test`: 283/283 통과
- `pnpm lint`: 통과
- `pnpm build`: 통과
- `pnpm e2e`: 40/40 통과
- `pnpm exec tsc --noEmit`: 통과

## 핵심 시나리오

- 고급 설정이 있어도 옵트인 전 URL에는 `advanced`, `salaryMode`, `salaries`, `dbAverageSalary` 미포함
- `YEARLY_CUSTOM` 옵트인 후 2년치 연봉과 평균임금이 새 페이지에서 동일하게 복원
- `WAGE_PEAK`, `STEP_UP`은 활성 모드에 필요한 파라미터만 직렬화·복원
- `advanced=1` 없는 고급 파라미터는 무시
- 포함 승인 후 고급 값 변경 시 체크박스 자동 미선택
- 복사 성공 후 승인 소진, A→B→A 변경에서도 이전 승인 부활 없음
- 손상 URL의 원자적 기본 폴백, 남은 근속연수·목록 80개와 query 8KB 상한
- production 공유 URL 직접 진입 시 console/page error 0건. 서버와 첫 클라이언트 렌더는 기본값으로 일치시키고 hydration 후 URL 값을 복원한다.

## 런타임 디버깅 가설

1. 이전 동의가 고급 값 변경 후 부활할 수 있다: A→B→A와 복사 성공 후 상태 테스트로 재현 후, keyed remount와 성공 시 해제로 차단했다.
2. `advanced=1` 없이 고급 값이 복원될 수 있다: 플래그 없는 고급 파라미터 무시 테스트로 복원되지 않음을 확인했다.
3. 손상·과도한 URL이 부분 모드 복원이나 대량 렌더를 일으킬 수 있다: 빈 항목·필수값 누락·81개·8KB 초과 단위 테스트와 실제 브라우저 폴백 E2E로 차단을 확인했다.

추가 실행 QA에서 유효한 고급 URL이 React hydration error #418을 내는 문제를 발견했다. E2E console 단정을 red로 고정한 뒤 hydration 후 복원으로 수정했고, 기본·고급·손상 URL 모두 오류 0건을 확인했다.

## 실제 브라우저 QA

- production standalone 서버와 Playwright CLI Chromium 사용
- 375px, 768px, 1280px에서 공유 영역 렌더 확인
- 세 viewport 모두 `documentElement.scrollWidth === innerWidth`로 가로 넘침 없음
- 체크박스의 기본 미선택, 선택 상태, 민감정보 경고문 전환 확인
- WCAG 2.1 AA critical/serious 위반 0건은 전체 E2E 접근성 스캔으로 확인

## 비차단 환경 메모

- 전역 `typescript-language-server` 실행 파일이 없어 편집 훅 LSP는 시작되지 않았다.
- 프로젝트 로컬 `tsc`, Next.js build, ESLint가 TypeScript 및 정적 검증을 대체해 모두 통과했다.
- 기존 `NO_COLOR`/`FORCE_COLOR` 경고는 그대로이며 PR 17 범위 밖이다.
