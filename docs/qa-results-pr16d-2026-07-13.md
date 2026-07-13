# PR 16D QA 결과 — GHCR 이미지 발행

## 범위

- PR에서는 Docker image build만 검증
- `master`와 향후 `v*` tag에서만 GHCR publish
- commit SHA 추적·SemVer tag와 digest provenance attestation
- Compose local build 및 GHCR image override 병행

## 자동 검증

- `actionlint`: workflow 오류 0건
- `docker compose config --quiet`: 성공
- 기본 image: `db-dc-simulator:local`
- override image: `ghcr.io/bruce0817kr/db-dc-simulator:sha-<40자리 SHA>`
- `pnpm test`: 296/296 passed
- `pnpm lint`: clean
- `pnpm build`: success
- `pnpm e2e`: 49/49 passed
- `pnpm qa`: green
- publish job은 같은 workflow의 `pnpm qa` 성공에 의존
- 잘못된 `v*` tag는 SemVer 검사에서 publish 전에 실패

## Docker 실사용 검증

- `docker compose build`: success
- GHCR 형식의 로컬 smoke tag를 `DB_DC_SIMULATOR_IMAGE`로 지정
- `docker compose up -d --no-build`: success
- healthcheck: `healthy`
- `/`: HTTP 200
- CSS·JS chunk: 모두 HTTP 200
- container process: uid 1001 non-root
- Next.js log: `Ready`, 치명 오류 0건

Chrome 브라우저에서 컨테이너 URL을 직접 열어 기본 결과와 민감도 차트를 확인했다. DC 운용수익률을 7%로 변경했을 때 결과 카드와 `현재 입력 7.0%` 차트 표식이 즉시 갱신됐고 console warning/error는 0건이었다.

## 디버깅 감사

### 가설 1 — workflow 문법 또는 expression context가 잘못됐다

- 구분 증거: `actionlint`가 `.github/workflows/*.yml` 전체를 검사
- 관찰: exit 0, 오류 출력 없음
- 결론: 로컬 정적 검사에서는 반박됨. GitHub PR workflow 실행으로 최종 확인한다.

### 가설 2 — image override가 있어도 Compose가 로컬 build를 요구한다

- 구분 증거: GHCR 형식의 로컬 tag를 지정하고 `docker compose up -d --no-build` 실행
- 관찰: 컨테이너 생성·healthcheck·HTTP 200 성공
- 결론: 반박됨. override 배포 경로는 build 없이 동작한다.

### 가설 3 — Docker context의 로컬 도구 경로가 cold build를 깨뜨린다

- 구분 증거: 첫 cold build의 context와 build error, `.dockerignore` 변경 후 재실행
- 관찰: 첫 실행은 junction `.codegraph` 때문에 `/app/.codegraph` `ENOENT`로 실패했다. `.agents`, `.codex`, `.codegraph` 제외 후 context가 약 162KB에서 6KB로 줄고 같은 build가 성공했다.
- 결론: 확인됨. 원인은 Git에서 제외된 로컬 도구 junction이 Docker context에는 포함된 것이며, context 경계에서 제외해 수정했다.

## 아직 실행할 수 없는 검증

PR에서는 package write 권한을 주지 않으므로 GHCR push와 attestation은 의도적으로 실행하지 않는다. PR 병합 후 `master` container workflow에서 다음을 확인한다.

- `latest`, `sha-<merge commit>` image 발행
- digest와 artifact attestation 생성
- package repository 연결 및 visibility
- GHCR에서 pull한 digest의 healthcheck

## 범위 준수

- 계산 로직·사용자 UI 변경 없음
- 신규 npm 의존성 없음
- Dockerfile·Next.js runtime 변경 없음
- 서버 저장·외부 금융 API 추가 없음
- `v0.1.2` 태그 변경 없음
