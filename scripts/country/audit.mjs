/**
 * 루틴 작업 폴더 점검 — 배차 루틴이 회차 앞뒤로 돌린다. 멈춘 회차·올리지 못한 커밋·남은 변경을 찾는다.
 *
 *   node scripts/country/audit.mjs          보고만
 *   node scripts/country/audit.mjs --fix    고친다:
 *       · 90분 넘은 작업 폴더 잠금(.routine-lock)은 지운다
 *       · 잠금 없는데 남은 변경·올리지 못한 커밋이 있으면 브랜치 wip/<code>-<시각> 에 커밋해 보관하고
 *         폴더를 origin/main 으로 되돌린다(git stash 는 쓰지 않는다 — 모든 작업 폴더가 한 stash 를 같이 써서
 *         남의 것을 꺼낼 수 있다)
 *       · 30분 넘은 공용 잠금(.locks/*)은 지운다
 *
 * 남은 wip 브랜치는 그 나라 다음 회차가 먼저 집어 새 main 위에 다시 올린다(country-routine 0단계).
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, statSync, rmSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { locksDir, STALE_MIN } from "./lock.mjs";

const fix = process.argv.includes("--fix");
const common = execSync("git rev-parse --git-common-dir", { encoding: "utf8" }).trim();
const WT = join(resolve(common, "..", ".."), "cal-wt");
const IGNORE = /^(\?\? )?(social\/[^/]+\.json|out(-ship)?\.txt)$/;
const g = (dir, cmd) => execSync(`git ${cmd}`, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const ageMin = (p) => (Date.now() - statSync(p).mtimeMs) / 60000;
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");

let problems = 0;
for (const name of readdirSync(WT).filter((n) => /^[a-z]{2}$/.test(n))) {
  const dir = join(WT, name);
  if (!existsSync(join(dir, ".git"))) continue;
  const lock = join(dir, ".routine-lock");
  const locked = existsSync(lock);
  const lockAge = locked ? Math.round(ageMin(lock)) : 0;
  g(dir, "fetch -q origin");
  const dirty = g(dir, "status --porcelain").split("\n").filter((l) => l && !IGNORE.test(l.trim()) && !IGNORE.test(l.slice(3)));
  const unpushed = g(dir, "log --oneline origin/main..HEAD").split("\n").filter(Boolean);
  const line = `${name}: ${locked ? `잠금 ${lockAge}분` : "쉼"} · 남은 변경 ${dirty.length} · 안 올린 커밋 ${unpushed.length}`;
  if (!dirty.length && !unpushed.length && !(locked && lockAge > 90)) {
    console.log(`✓ ${line}`);
    continue;
  }
  problems++;
  console.log(`! ${line}`);
  if (!fix) continue;
  if (locked && lockAge <= 90) {
    console.log("  → 돌고 있는 회차 — 건드리지 않음");
    continue;
  }
  if (locked) rmSync(lock);
  try { g(dir, "rebase --abort"); } catch { /* rebase 중 아님 */ }
  if (dirty.length || unpushed.length) {
    const br = `wip/${name}-${stamp}`;
    g(dir, `checkout -q -b ${br}`);
    if (dirty.length) {
      g(dir, "add -A -- . ':!social/*.json' ':!out.txt' ':!out-ship.txt'");
      g(dir, `commit -q -m "wip(${name}): 멈춘 회차가 남긴 변경 — audit 이 보관(${stamp})"`);
    }
    g(dir, "checkout -q --detach origin/main");
    console.log(`  → ${br} 에 보관하고 origin/main 으로 되돌림`);
  }
}

const L = locksDir();
for (const n of existsSync(L) ? readdirSync(L) : []) {
  const p = join(L, n);
  const age = Math.round(ageMin(p));
  const who = existsSync(join(p, "owner")) ? readFileSync(join(p, "owner"), "utf8").trim() : "?";
  console.log(`${age > STALE_MIN ? "!" : "·"} 공용 잠금 ${n}: ${who} (${age}분)`);
  if (fix && age > STALE_MIN) rmSync(p, { recursive: true, force: true });
}

const wips = execSync("git branch --list wip/*", { encoding: "utf8" }).split("\n").map((s) => s.trim()).filter(Boolean);
if (wips.length) console.log(`보관 브랜치 ${wips.length}개: ${wips.join(" ")}`);
process.exit(problems && !fix ? 1 : 0);
