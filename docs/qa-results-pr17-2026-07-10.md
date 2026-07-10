# PR 17 QA 결과 — URL 공유 고급 설정 옵트인

- 검증일: 2026-07-10
- 브랜치: `pr-17/url-share-advanced-opt-in`
- 범위: 고급 임금 시나리오와 평균임금 직접 입력의 명시적 URL 공유·복원

## 자동 검증

- `pnpm test`: 278/278 통과
- `pnpm lint`: 통과
- `pnpm build`: 통과
- `pnpm e2e`: 39/39 통과
- `pnpm exec tsc --noEmit`: 통과

## 핵심 시나리오

- 고급 설정이 있어도 옵트인 전 URL에는 `advanced`, `salaryMode`, `salaries`, `dbAverageSalary` 미포함
- `YEARLY_CUSTOM` 옵트인 후 2년치 연봉과 평균임금이 새 페이지에서 동일하게 복원
- `WAGE_PEAK`, `STEP_UP`은 활성 모드에 필요한 파라미터만 직렬화·복원
- `advanced=1` 없는 고급 파라미터는 무시
- 포함 승인 후 고급 값 변경 시 체크박스 자동 미선택

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
