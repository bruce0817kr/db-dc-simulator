# 배포 노트 (Deployment Notes)

본 문서는 DB/DC 퇴직연금 전환 시뮬레이터의 빌드 산출물, 런타임 요구사항, 호스팅 옵션, 롤백 절차를 정의한다.

> 본 PR 13은 배포 환경 문서화만 제공한다. 실제 배포 실행은 별도 세션에서 수행한다.

---

## 1. 빌드 산출물

- 명령: `pnpm build`
- 출력 디렉터리: `.next/` (Turbopack, 정적 프리렌더)
- 라우트:
  - `/` (Static) — 시뮬레이터 단일 페이지
  - `/_not-found` (Static)
- 빌드 시 표시되는 First Load JS 크기 기준으로 산출물 크기 확인
- `.next/`는 `.gitignore` 추적 제외

## 2. 런타임 요구사항

- Node.js 20+ (`package.json` devDeps `@types/node ^20` 기준)
- 패키지 매니저: pnpm 권장 (npm/yarn 호환)
- 브라우저: ES2022 지원 (Next.js 16 기본값)
- 런타임에 외부 API 의존성 없음

## 3. 환경 변수

- 현재 필수 환경 변수 없음
- 외부 API 미연동
- `.env*`는 `.gitignore` 추적 제외
- 향후 환경 변수 추가 시 본 절 갱신

## 4. 호스팅 후보

| 플랫폼 | 적합성 | 비고 |
|--------|--------|------|
| Vercel | 권장 | Next.js 공식, zero-config, 정적 호스팅 무료 |
| Netlify | 가능 | Next.js adapter 필요 |
| 자체 호스팅 | 가능 | `next start` 또는 standalone output |
| 정적 내보내기 | 검토 가능 | 모든 페이지 Static이므로 `output: 'export'` 옵션 검토 가능. 단, 별도 검증 후 적용 |

- **기본 배포 경로: Docker self-host** (`docker compose`) — PR 16B. Vercel/Netlify는 더 이상 권장하지 않는다.
- Docker 이미지는 `output: "standalone"` 기반. 빌드·실행 절차는 아래 "6-2. Docker Self-host 배포" 절 참조.
- 정적 내보내기(`output: 'export'`)는 동적 라우트·서버 액션 추가 시 별도 검토.


## 5. 정적 내보내기 옵션

- 모든 페이지가 Static이므로 `next.config`에 `output: 'export'` 추가 검토 가능. 단, 별도 검증 후 적용
- 향후 동적 라우트·서버 액션 추가 시 재검토 필요
- 현재는 standalone 서버(`output:"standalone"`) 기반 호스팅 — `pnpm start:standalone` 또는 Docker (`next start`는 standalone 설정에서 경고)
- 본 PR 13에서는 `next.config` 변경하지 않음

## 6. 배포 전 명령

```bash
# 1. 의존성 (프로덕션, lockfile 고정)
pnpm install --frozen-lockfile

# 2. 4-gate
pnpm test       # 294/294 통과 기대
pnpm lint       # 오류·경고 없음
pnpm build      # 정적 프리렌더 / 완료 + TS 검사 통과

# 2-1. E2E 게이트 (PR 14)
pnpm exec playwright install chromium   # 최초 1회
pnpm e2e                                  # Playwright 33건
# 또는 통합
pnpm qa                                    # test + lint + build + e2e

# 3. 수동 QA (docs/manual-qa.md 18개 시나리오)
pnpm dev        # 로컬 QA
# 또는
pnpm build && pnpm start:standalone  # 프로덕션 빌드 QA (standalone 서버, Docker 와 동일)
```

> `pnpm start:standalone`은 `output:"standalone"` 빌드 산출물(`.next/standalone/server.js`)로 서버를 실행한다. `next start`(`pnpm start`)는 standalone 설정에서 경고를 내므로 사용하지 않는다. E2E webServer도 동일 서버를 사용한다 (PR 16C).
> 로컬 실행기의 바인딩 주소는 `STANDALONE_HOSTNAME`으로 재정의할 수 있으며 기본값은 `0.0.0.0`이다. 범용 `HOSTNAME`은 Git Bash 등이 컴퓨터 이름을 자동 주입할 수 있어 사용하지 않는다.

## 6-1. CI 게이트 (GitHub Actions) — PR 16A

PR/push마다 `pnpm qa`(test + lint + build + e2e)가 GitHub Actions ubuntu 러너에서 자동 실행된다.

- **워크플로우 파일**: `.github/workflows/ci.yml`
- **트리거**: `push` to `master`, `pull_request`, `workflow_dispatch`(수동)
- **런타임**: Node.js 20, pnpm 10
- **의존성 설치**: `pnpm install --frozen-lockfile` (lockfile drift 시 CI 실패)
- **Playwright**: `pnpm exec playwright install chromium --with-deps` (chromium + 시스템 라이브러리)
- **게이트**: `pnpm qa` 단일 실행 (test → lint → build → e2e, 첫 실패에서 정지)
- **webServer**: `playwright.config.ts` — `pnpm build && pnpm start:standalone` (standalone 서버, PR 16C). `next start` standalone 경고 제거 + 프로덕션 아티팩트(Docker 와 동일) 검증
- **artifact**: 실패 시에만 `test-results/` 업로드 (trace/screenshot/video, 보존 14일)
- **동시성**: PR은 이전 실행 취소, master push는 취소하지 않음 (릴리스 게이트 무결성)

**로컬 재현**:

```bash
pnpm qa
```

> CI 자체 검증은 실제 PR/push로 Actions가 실행된 후에만 최종 확인 가능하다. 로컬 `pnpm qa` green은 필요조건이다.

## 6-2. Docker Self-host 배포 (PR 16B)

Next.js 앱을 Docker 이미지로 빌드(`output: "standalone"`)하여 서버에서 `docker compose`로 실행한다. Vercel은 폐기.

**이미지 특성**:
- `node:20-alpine` 기반 multi-stage(3단계) — runner에는 devDeps·소스·`.next` 전체 미포함
- **이미지는 README·docs를 포함하지 않는다** (`.dockerignore` 제외 + standalone runner는 `.next`/`public`만 복사)
- non-root 사용자(`nextjs`, uid 1001)로 실행
- `127.0.0.1:3000` 에만 바인딩 — 외부 공개는 reverse proxy

**서버 요구사항**:
- Docker Engine 24+, Docker Compose plugin(V2)
- **아웃바운드 네트워크**: 최초 `docker compose build` 시 `node:20-alpine` 베이스 이미지 + npm registry(pnpm 의존성) + corepack(pnpm) 다운로드에 인터넷 접근이 필요하다. 이후 빌드는 캐시로 오프라인 가능.
- 3000번 내부 포트 (127.0.0.1)
- reverse proxy(Nginx/Caddy) — 외부 공개 시

**초기 배포**:
```bash
git clone <repo> && cd db-dc-simulator
# pnpm qa는 로컬 또는 CI(PR 16A)에서 수행 — 서버에 Node/pnpm 불필요
docker compose build
docker compose up -d
docker compose logs -f      # "Ready" 확인
```

**업데이트**:
```bash
git pull
docker compose build --pull   # 베이스 이미지 최신화
docker compose up -d          # 이미지 변경 시 재생성
```

**롤백**:
```bash
git checkout <tag>            # 예: v0.1.2
docker compose build
docker compose up -d
```

**운영 명령**:
- `docker compose ps` — 상태(health) 확인
- `docker compose logs --tail=100` — 로그
- `docker compose restart` — 재시작
- `docker image prune` — 미사용 이미지 정리 (`--all` 주의: 사용 중 이미지까지 삭제 가능)

> healthcheck는 Node `fetch` 기반(`compose.yaml`). `restart: unless-stopped`는 프로세스 종료 시에만 재시작하며, unhealthy 자동 재시작은 별도 워처(`autoheal` 등)가 필요하다(범위 밖).



## 7. 배포 후 검증

- [ ] 프로덕션 URL 접속 → 기본 입력 → 결과 표시
- [ ] 인쇄 버튼 클릭 → 브라우저 인쇄 대화상자에서 PDF로 저장 정상
- [ ] URL 공유 → 새 탭 복원 정상
- [ ] 콘솔 에러 0건
- [ ] 주의 문구 "세전 시뮬레이션입니다" 표시
- [ ] "추천"·"가입" 텍스트 부재

## 8. 롤백 절차

- **Docker (기본)**: `git checkout <tag>` → `docker compose build` → `docker compose up -d` (이전 태그 이미지로 재빌드·교체)
- **이전 이미지 보존 시**: `docker image ls db-dc-simulator`로 태그 확인 후 재빌드 없이 교체 가능
- Vercel 롤백은 미사용(폐기)

- **치명 이슈**: `v0.1.0-rc.1` 태그 회수 및 `v0.1.0` 릴리스 연기
- **롤백 조건**: `docs/release-checklist.md` 10절 참조

## 9. 버전 정책

- `v0.1.0-rc.1`: 릴리스 후보 (자동화 4-gate 통과 기준)
- `v0.1.0`: 수동 QA 18개 시나리오 PASS 후 최종 릴리스
- Semantic Versioning 준수
- `package.json`의 `version` 필드와 태그 일치 유지 (현재 `0.1.0`)

## 10. 보안/개인정보

- 서버 저장 없음 (모든 계산 브라우저 내 수행)
- 외부 전송 없음
- URL 공유 시 재무 정보 포함 경고문 UI 존재
- localStorage 자동 저장 부재 (명시 옵션으로만 향후 확장)
- **CSP/SRI 자동 미제공** — Docker self-host에서는 reverse proxy(Nginx/Caddy) 헤더 또는 Next.js `headers()`로 별도 설정 필요 (Vercel/Netlify와 달리 플랫폼 기본값 없음)

- 별도 보안 감사는 본 PR 범위 외

## 11. 변경 이력

| 날짜 | 변경 | 비고 |
|------|------|------|
| 2026-07-07 | 최초 작성 (PR 13) | 배포 환경·롤백·버전 정책 정리 |
| 2026-07-09 | CI 게이트 절 추가 (PR 16A) | GitHub Actions `pnpm qa` 자동화, Node 20/pnpm 10/frozen-lockfile |
| 2026-07-10 | Docker self-host 배포 절 추가 (PR 16B) | Vercel 폐기, `output:"standalone"` Docker 이미지·compose·롤백 갱신. 이미지는 README/docs 미포함, 빌드 시 npm registry 아웃바운드 필요 |
| 2026-07-10 | webServer standalone 정합 (PR 16C) | E2E webServer·로컬 QA 명령을 `next start` → standalone 서버(`pnpm start:standalone`)로 변경. `next start` standalone 경고 제거, Docker 와 동일 아티팩트 검증 |
| 2026-07-10 | standalone 로컬 바인딩 안정화 (PR 18 후속 수정) | Git Bash의 자동 `HOSTNAME` 주입과 Playwright `127.0.0.1` 불일치 제거. 로컬 전용 `STANDALONE_HOSTNAME` 도입, Docker 실행 경로 불변 |
