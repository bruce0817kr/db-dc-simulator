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

- 현재는 `next start` 기반 정적 호스팅 권장
- `output: 'export'`는 동적 라우트·서버 액션 추가 시 재검토 필요
- 본 PR에서는 `next.config` 변경하지 않음

## 5. 정적 내보내기 옵션

- 모든 페이지가 Static이므로 `next.config`에 `output: 'export'` 추가 검토 가능. 단, 별도 검증 후 적용
- 향후 동적 라우트·서버 액션 추가 시 재검토 필요
- 현재는 `next start` 기반 정적 호스팅 권장
- 본 PR 13에서는 `next.config` 변경하지 않음

## 6. 배포 전 명령

```bash
# 1. 의존성 (프로덕션, lockfile 고정)
pnpm install --frozen-lockfile

# 2. 4-gate
pnpm test       # 253/253 통과 기대
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
pnpm build && pnpm start  # 프로덕션 빌드 QA
```

> `pnpm start`는 `package.json`의 `start` script(`next start`) 존재를 확인한 뒤 문서화했다. 프로덕션 빌드 QA는 이 script를 사용한다.

## 7. 배포 후 검증

- [ ] 프로덕션 URL 접속 → 기본 입력 → 결과 표시
- [ ] 인쇄 버튼 클릭 → 브라우저 인쇄 대화상자에서 PDF로 저장 정상
- [ ] URL 공유 → 새 탭 복원 정상
- [ ] 콘솔 에러 0건
- [ ] 주의 문구 "세전 시뮬레이션입니다" 표시
- [ ] "추천"·"가입" 텍스트 부재

## 8. 롤백 절차

- **Vercel**: 이전 배포 즉시 롤백 버튼 (관리 콘솔)
- **자체 호스팅**: 이전 빌드 산출물(`.next/`)로 교체
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
- CSP/SRI는 호스팅 플랫폼 기본값 사용 (Vercel/Netlify 기본 제공)
- 별도 보안 감사는 본 PR 범위 외

## 11. 변경 이력

| 날짜 | 변경 | 비고 |
|------|------|------|
| 2026-07-07 | 최초 작성 (PR 13) | 배포 환경·롤백·버전 정책 정리 |
