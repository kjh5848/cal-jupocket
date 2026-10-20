/**
 * 루틴끼리 같이 쓰는 잠금 — 폴더 만들기(mkdir)는 원자적이라 둘이 동시에 잡을 수 없다.
 * 잠금 폴더: <workspace>/cal-wt/.locks/<이름>/owner (누가·언제)
 *
 *   node scripts/country/lock.mjs acquire main <주인> [기다릴 분=40]
 *   node scripts/country/lock.mjs release main <주인>
 *   node scripts/country/lock.mjs status
 *
 * 잡은 지 STALE_MIN 분이 지나면 멈춘 회차로 보고 빼앗는다(ship 은 보통 5분 안에 끝난다).
 */
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const STALE_MIN = 30;

export function locksDir() {
  if (process.env.CAL_WT) return join(process.env.CAL_WT, ".locks");
  const common = execSync("git rev-parse --git-common-dir", { encoding: "utf8" }).trim();
  return join(resolve(common, "..", ".."), "cal-wt", ".locks");
}

const ageMin = (p) => (Date.now() - statSync(p).mtimeMs) / 60000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function holder(name) {
  const f = join(locksDir(), name, "owner");
  return existsSync(f) ? readFileSync(f, "utf8").trim() : null;
}

export function tryAcquire(name, owner) {
  const dir = join(locksDir(), name);
  mkdirSync(locksDir(), { recursive: true });
  if (existsSync(dir) && ageMin(dir) > STALE_MIN) {
    console.error(`잠금 ${name} 이 ${Math.round(ageMin(dir))}분 묵음(${holder(name)}) — 멈춘 회차로 보고 지움`);
    rmSync(dir, { recursive: true, force: true });
  }
  try {
    mkdirSync(dir);
  } catch {
    return (holder(name) ?? "").startsWith(`${owner} `); // 이미 내 잠금이면 다시 잡은 것으로 친다
  }
  writeFileSync(join(dir, "owner"), `${owner} ${new Date().toISOString()}`);
  return true;
}

export async function acquire(name, owner, waitMin = 40) {
  const until = Date.now() + waitMin * 60000;
  while (Date.now() < until) {
    if (tryAcquire(name, owner)) return true;
    await sleep(15000 + Math.random() * 10000);
  }
  return false;
}

export function release(name, owner) {
  const dir = join(locksDir(), name);
  const h = holder(name);
  if (h && !h.startsWith(`${owner} `)) return false; // 남의 잠금은 풀지 않는다
  rmSync(dir, { recursive: true, force: true });
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const [cmd, name, owner, wait] = process.argv.slice(2);
  if (cmd === "acquire") process.exit((await acquire(name, owner, Number(wait ?? 40))) ? 0 : 1);
  else if (cmd === "release") process.exit(release(name, owner) ? 0 : 1);
  else {
    const d = locksDir();
    for (const n of existsSync(d) ? readdirSync(d) : []) console.log(`${n}: ${holder(n)} (${Math.round(ageMin(join(d, n)))}분)`);
  }
}
