/**
 * 올리기 — 루틴이 만든 커밋을 main 에 안전하게 올린다. 모든 루틴(한국 kr·나라판)이 이것으로만 push 한다.
 *
 *   node scripts/country/ship.mjs <code> [--shared] [--live <주소>…] [--hold]
 *
 *   1. main 잠금을 잡는다(다른 루틴이 올리는 중이면 기다린다 — 최대 40분)
 *   2. git fetch → git rebase origin/main          충돌이면 rebase --abort, 종료 코드 2
 *   3. 바뀐 파일 검사(scripts/country/paths.mjs)    내 파일 밖이면 종료 코드 4
 *   4. node_modules 가 package-lock 보다 낡았으면 npm ci
 *   5. npm run build → npx vitest run(전체)          실패면 종료 코드 3
 *   6. git push origin HEAD:main                     잠금 안이라 거절될 일이 거의 없다 — 거절되면 1번부터 한 번 더
 *   7. 잠금을 푼다
 *   8. --live 주소가 200 이 될 때까지 기다리고(최대 12분) IndexNow 로 알린다
 *
 * --shared : 공유 산술 스크립트(src/scripts/*.ts 등)를 고친 커밋. 이때는 **고치기 전에** 잠금을 먼저 잡아야
 *            한다(node scripts/country/lock.mjs acquire main <code>) — 그래야 남이 같은 파일을 동시에 못 고친다.
 *            ship 은 같은 주인의 잠금이면 그대로 이어 쓴다.
 * --hold   : 끝나도 잠금을 풀지 않는다(이어서 또 올릴 때).
 *
 * 왜 이렇게 하나(2026-10-20): 13개 루틴이 각자 rebase·테스트·push 하다 같은 공유 파일에서 충돌했고(독일·프랑스·
 * 스페인·인도네시아), 홍콩 회차는 커밋을 올리지도 기록하지도 못한 채 끝났다. 올리는 구간을 한 줄로 세운다.
 * 테스트·빌드 출력은 out-ship.txt(무시 파일)에 남는다.
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, statSync, writeFileSync, appendFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { acquire, release } from "./lock.mjs";
import { checkPaths, localeTable } from "./paths.mjs";

const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
const sh = (cmd) => execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const LOG = join(root, "out-ship.txt");
const log = (s) => {
  console.log(s);
  appendFileSync(LOG, s + "\n");
};
function step(label, cmd, args) {
  log(`… ${label}`);
  const r = spawnSync(cmd, args, { cwd: root, encoding: "utf8", shell: true, maxBuffer: 1 << 28 });
  appendFileSync(LOG, `$ ${cmd} ${args.join(" ")}\n${r.stdout ?? ""}${r.stderr ?? ""}\n`);
  return r.status === 0;
}

export async function ship(code, { shared = false, live = [], hold = false } = {}) {
  writeFileSync(LOG, `ship ${code} ${new Date().toISOString()}\n`);
  const owner = code;
  const locale = localeTable(root)[code] ?? code;
  if (!(await acquire("main", owner, 40))) {
    log("✖ main 잠금을 40분 안에 못 잡음 — 이번 회차는 올리지 않고 기록만");
    return 5;
  }
  let code_ = 0;
  try {
    if (sh("git status --porcelain --untracked-files=no")) {
      log("✖ 커밋 안 한 변경이 있다 — 먼저 커밋하거나 되돌린다(git status)");
      return (code_ = 7);
    }
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (!step("fetch", "git", ["fetch", "origin"])) return (code_ = 6);
      if (!step("rebase origin/main", "git", ["rebase", "origin/main"])) {
        step("rebase 되돌리기", "git", ["rebase", "--abort"]);
        log("✖ rebase 충돌 — 커밋은 그대로 두었다. 새 main 위에서 다시 만들어야 한다");
        return (code_ = 2);
      }
      const files = sh("git diff --name-only origin/main...HEAD").split("\n").filter(Boolean);
      if (!files.length) {
        log("올릴 커밋 없음");
        return (code_ = 0);
      }
      const chk = checkPaths(code, locale, files, { allowShared: shared || code === "kr" });
      if (!chk.ok) {
        log(`✖ 내 파일 밖을 고침(${code}): ${chk.bad.join(", ")}${chk.bad.some((f) => /^src\/(scripts|lib)\//.test(f)) ? " — 공유 파일이면 잠금을 먼저 잡고 --shared" : ""}`);
        return (code_ = 4);
      }
      const nm = join(root, "node_modules", ".package-lock.json");
      if (!existsSync(nm) || statSync(nm).mtimeMs < statSync(join(root, "package-lock.json")).mtimeMs) {
        if (!step("npm ci", "npm", ["ci"])) return (code_ = 3);
      }
      if (!step("build", "npm", ["run", "build"])) {
        log("✖ 빌드 실패 — out-ship.txt");
        return (code_ = 3);
      }
      if (!step("vitest 전체", "npx", ["vitest", "run"])) {
        log("✖ 테스트 실패 — out-ship.txt");
        return (code_ = 3);
      }
      if (step("push", "git", ["push", "origin", "HEAD:main"])) {
        log(`✓ 올림 ${sh("git log --oneline -1")}`);
        break;
      }
      if (attempt === 2) {
        log("✖ push 두 번 거절");
        return (code_ = 6);
      }
      log("push 거절 — 잠금을 안 쓰는 누군가가 올렸다. 처음부터 한 번 더");
    }
  } finally {
    if (!hold || code_ !== 0) release("main", owner);
  }
  for (const u of live) {
    let okLive = false;
    for (let i = 0; i < 24 && !okLive; i++) {
      const r = await fetch(u, { method: "HEAD" }).catch(() => null);
      okLive = r?.status === 200;
      if (!okLive) await new Promise((r) => setTimeout(r, 30000));
    }
    log(`${okLive ? "✓" : "✖"} 라이브 ${u}`);
    if (okLive) step("IndexNow", "node", ["social/indexnow.mjs", u]);
  }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const a = process.argv.slice(2);
  const code = a[0];
  if (!code) {
    console.error("사용: node scripts/country/ship.mjs <code> [--shared] [--live <주소>…] [--hold]");
    process.exit(1);
  }
  const live = [];
  for (let i = 1; i < a.length; i++) if (a[i] === "--live") while (a[i + 1] && !a[i + 1].startsWith("--")) live.push(a[++i]);
  process.exit(await ship(code, { shared: a.includes("--shared"), live, hold: a.includes("--hold") }));
}
