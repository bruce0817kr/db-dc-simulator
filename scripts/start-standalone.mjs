// PR 16C — standalone 프로덕션 서버 실행기.
//
// next.config.ts 의 output:"standalone" 은 .next/standalone/server.js 를 생성하지만
// 정적 자산(.next/static, public)은 standalone 디렉터리에 포함되지 않는다.
// Dockerfile 이 COPY 단계로 이를 보충하듯, 본 스크립트도 로컬에서 동일하게 복사한 뒤
// standalone 서버를 실행한다.
//
// E2E(playwright webServer)와 로컬 프로덕션 QA 모두 이 서버를 사용해
// 프로덕션 아티팩트(Docker 와 동일)를 검증한다.
// `next start` 는 output:"standalone" 에서 경고를 내므로 사용하지 않는다.
//
// 사용: pnpm build && pnpm start:standalone
// 환경변수: PORT(기본 3001), HOSTNAME(기본 0.0.0.0)

import { access, cp, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = resolve(root, ".next/standalone");

try {
  await access(resolve(standaloneDir, "server.js"));
} catch {
  console.error(
    "[start-standalone] .next/standalone/server.js 가 없습니다. 먼저 `pnpm build` 를 실행하세요.",
  );
  process.exit(1);
}

const PORT = process.env.PORT ?? "3001";
const HOSTNAME = process.env.HOSTNAME ?? "0.0.0.0";

// 정적 자산 복사 (Dockerfile COPY 단계와 동일).
await mkdir(resolve(standaloneDir, ".next"), { recursive: true });
await cp(resolve(root, ".next/static"), resolve(standaloneDir, ".next/static"), {
  recursive: true,
});
await cp(resolve(root, "public"), resolve(standaloneDir, "public"), {
  recursive: true,
});

const child = spawn("node", ["server.js"], {
  cwd: standaloneDir,
  stdio: "inherit",
  env: { ...process.env, PORT, HOSTNAME },
});

const killChild = (signal) => () => {
  try {
    child.kill(signal);
  } catch {
    // 이미 종료된 경우 무시
  }
};
process.on("SIGTERM", killChild("SIGTERM"));
process.on("SIGINT", killChild("SIGINT"));
child.on("exit", (code) => process.exit(code ?? 0));
