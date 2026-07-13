# PR 16D 설계 — GHCR Docker 이미지 발행

## 1. 목표

Docker self-host 배포 산출물을 GitHub Container Registry(GHCR)에 자동 발행한다.
소스 checkout 후 서버에서 다시 빌드하는 기존 방식은 유지하고, 검증된 이미지를 digest 또는 commit 추적용 SHA 태그로 바로 배포하는 경로를 추가한다.

이 PR은 계산 로직, 사용자 UI, 개인정보 처리, `v0.1.2` 태그를 변경하지 않는다.

## 2. 이벤트와 권한 계약

| 이벤트 | 동작 | 레지스트리 로그인 | 권한 |
|--------|------|-------------------|------|
| pull request | Docker 이미지 빌드만 검증 | 안 함 | `contents: read` |
| `master` push | 빌드 후 GHCR 발행 | `GITHUB_TOKEN` | `contents: read`, `packages: write`, `attestations: write`, `id-token: write` |
| `v*` tag push | 버전 태그 이미지 발행 | `GITHUB_TOKEN` | 위와 동일 |

PR job과 publish job을 분리해 외부 PR 코드가 package write 권한을 받지 않도록 한다.
publish job은 같은 workflow의 `pnpm qa` 성공에 의존하며, QA가 실패하면 image login·push·attestation을 실행하지 않는다.
`v*` tag는 발행 전에 SemVer 형식을 검사해 `v1.2.3` 또는 `v1.2.3-rc.1` 형태가 아니면 실패한다.
수동 실행은 발행 경로에서 제외해 잘못된 ref의 이미지가 우발적으로 올라가는 것을 막는다.

## 3. 이미지·태그 계약

이미지 이름은 `ghcr.io/<owner>/<repository>`다.

- 모든 발행: `sha-<40자리 commit SHA>`
- `master` push: `latest`
- `v1.2.3` tag push: `1.2.3`, `1.2`
- prerelease tag: 정확한 prerelease 버전만 발행하고 안정 버전 alias를 만들지 않는다.

Docker metadata action의 자동 `latest` 생성을 끄고 `master` 전용 raw rule만 사용한다. 따라서 version tag push가 `latest`를 바꾸지 않는다.

`sha-*`는 source commit을 찾기 위한 추적용 태그이며 registry에서 덮어쓸 수 있다. 운영 배포와 롤백의 엄격한 불변성에는 digest를 사용한다.
`v0.1.2`는 기존 Docker self-host 릴리스로 유지하며 이 workflow를 소급 실행하거나 태그를 다시 만들지 않는다.

## 4. 공급망·패키지 연결

- 신규 workflow의 모든 Actions는 immutable commit SHA로 고정하고 옆에 release 버전을 기록한다.
- OCI metadata에 source repository와 revision을 포함해 GHCR package를 저장소에 연결한다.
- 발행된 digest에 GitHub artifact attestation을 생성하고 registry에 push한다.
- 빌드 캐시는 GitHub Actions cache backend만 사용하며 이미지에 secret을 넣지 않는다.
- registry password는 별도 PAT 대신 job-scoped `GITHUB_TOKEN`을 사용한다.

GHCR package visibility는 저장소 visibility와 별도다. 최초 발행 후 package 설정에서 public 또는 private 정책을 명시적으로 결정해야 한다. public package만 익명 pull이 가능하다.

## 5. Compose 배포 계약

기존 `docker compose build` 흐름은 그대로 동작한다.
`DB_DC_SIMULATOR_IMAGE` 환경변수로 이미지 이름을 덮어쓰면 GHCR 이미지를 pull한 뒤 `--no-build`로 실행할 수 있다.

```bash
export DB_DC_SIMULATOR_IMAGE=ghcr.io/bruce0817kr/db-dc-simulator:sha-<commit>
docker compose pull
docker compose up -d --no-build
```

digest 고정 배포도 허용한다.

```bash
export DB_DC_SIMULATOR_IMAGE=ghcr.io/bruce0817kr/db-dc-simulator@sha256:<digest>
```

## 6. 검증 계약

- workflow YAML 구문 및 Action pin 검증
- PR event에서 publish step이 실행되지 않는지 확인
- 로컬 `docker compose build`
- 컨테이너 healthcheck `healthy`
- `/`, CSS, JS, favicon HTTP 200
- 컨테이너가 non-root 사용자로 실행되는지 확인
- `pnpm qa` 전체 통과
- PR 생성 후 container workflow의 PR build job과 기존 CI green 확인

실제 GHCR push, attestation, 익명 pull은 PR 병합 후 `master` workflow에서 최종 검증한다. 실패 시 package artifact를 배포에 사용하지 않고 기존 로컬 build 방식을 유지한다.

## 7. 공식 근거

- [GitHub Docs — Publishing Docker images](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images)
- [GitHub Docs — Artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)
- [GitHub Docs — Package access and visibility](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility)
- [Docker metadata-action](https://github.com/docker/metadata-action)
