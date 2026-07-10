import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:3001";
const IS_CI = !!process.env.CI;

/**
 * PR 14 — Automated Release QA
 *
 * 기본 프로젝트:
 *   chromium-desktop   — 데스크탑 브라우저 전체 E2E
 *   chromium-mobile-375 — 375px 폭 모바일 시나리오 (mobile.spec.ts만)
 *
 * WebKit/Safari smoke은 macOS/iOS 환경에서 후속 PR 또는 수동 QA로 남긴다.
 * 본 config에는 포함하지 않는다 (PR 14 결정 #2).
 *
 * 포트 참고: 워크스테이션의 Docker/WSL이 3000을 점유 중이므로 3001 사용.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: IS_CI,
  retries: IS_CI ? 1 : 0,
  workers: 2,
  reporter: IS_CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile-375",
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 375, height: 667 },
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start:standalone",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});