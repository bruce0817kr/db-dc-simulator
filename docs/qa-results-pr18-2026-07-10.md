# PR 18 QA 결과 — DB/DC 민감도 차트

## 범위

- 현재 임금상승률 기준 DB/DC 예상 퇴직급여 비교선
- 손익분기 수익률과 현재 입력 수익률 표시
- 기존 수익률별 정확한 금액 표 유지
- 색상 외 선·점 모양 구분, 스크린 리더 설명, 반응형, 인쇄

## 자동 검증

- `pnpm test`: 294/294 passed
- `pnpm lint`: clean
- `pnpm build`: success
- `pnpm e2e`: 49/49 passed
- 차트 전용 E2E: 9/9 passed
- axe WCAG 2.1 A/AA critical·serious 위반 0건 (`color-contrast` 기존 제외 정책 유지)
- 375px, 768px, 1280px 가로 오버플로·SVG 라벨 잘림 0건, 차트 높이 240px 이상
- 인쇄 미디어에서 차트와 정확한 수치 표 표시
- 입력 변경 중 console error·page error 0건

## 실브라우저 QA

BrowserOS로 standalone 프로덕션 서버를 직접 확인했다.

- 기본 입력: 차트, 손익분기선, 현재 입력, DB 9점, DC 9점, 수치 표 표시
- DC 수익률 7%: `현재 입력 7.0%` 표식으로 즉시 갱신
- DC 수익률 12%: 축 끝으로 왜곡하지 않고 표식을 제거한 뒤 범위 밖 안내 표시
- 페이지 가로 오버플로 없음
- 375px 실제 캡처에서 발견한 SVG 글자·선 축소를 모바일 글자 보정, 240px 최소 높이와 `non-scaling-stroke`로 수정 후 재확인
- 스크린 리더 설명에 DB/DC 변화 방향을 포함하고, 근접한 직접 라벨의 충돌을 분리 배치
- Git Bash의 자동 `HOSTNAME` 주입으로 Playwright가 loopback 서버를 찾지 못하는 현상을 런타임 로그로 확인하고, 로컬 실행기를 `STANDALONE_HOSTNAME` 전용 설정으로 분리한 뒤 `pnpm qa` 재통과

## 범위 준수

- `src/calculator/**` 변경 없음
- 계산식 변경 없음
- 차트 라이브러리 및 기타 의존성 추가 없음
- 서버 저장·외부 API·분석 이벤트 추가 없음
- 태그 변경 없음
