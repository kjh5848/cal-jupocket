/**
 * 카드 이미지 자동 렌더 — 아트보드를 1080×1350 JPEG 로 뽑는다.
 *
 *   npm run cards                    이미지가 없는 세트만
 *   npm run cards -- --set vat-filing  한 세트만
 *   npm run cards -- --all           전부 다시 (레이아웃을 바꿨을 때)
 *
 * 이게 파이프라인에서 마지막까지 손으로 하던 단계였다. 세트당 4~6번
 * 브라우저를 띄워 찍었는데, 하루 한 편을 내면 매일 그 짓을 해야 한다.
 *
 * dev 서버를 직접 띄운다. 빌드 산출물(dist)을 쓰지 않는 이유는 아트보드가
 * astro.config 에서 사이트맵·색인에서 빠지도록 처리돼 있을 뿐 페이지로는
 * 존재하고, dev 가 더 빠르게 뜨기 때문이다.
 *
 * **인스타는 JPEG 만 받는다.** PNG 로 뽑으면 ig-post 가 content-type 검사에서
 * 멈춘다 — 그래서 여기서 형식을 못박는다.
 */
import { spawn } from "node:child_process";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT = join(ROOT, "public", "cards");

/** 인스타 피드 4:5. 아트보드 CSS 가 이 크기를 전제로 px 로 짜여 있다. */
const W = 1080;
const H = 1350;
const PORT = 4499;
const QUALITY = 92;

const args = process.argv.slice(2);
const all = args.includes("--all");
const si = args.findIndex((a) => a === "--set");
const onlySet = si >= 0 ? args[si + 1] : null;
if (si >= 0 && (!onlySet || onlySet.startsWith("--"))) {
  console.error("\n✖ --set 뒤에 세트 slug 가 필요합니다.\n");
  process.exit(1);
}

// 카드 세트 목록은 소스에서 읽는다 — 여기 따로 적으면 세트가 늘 때 어긋난다.
const cardsSrc = readFileSync(join(ROOT, "src", "data", "cards.ts"), "utf8");
const sets = [...cardsSrc.matchAll(/slug: "([a-z0-9-]+)"/g)].map((m) => m[1]);
const counts = new Map();
for (const slug of sets) {
  const from = cardsSrc.indexOf(`slug: "${slug}"`);
  const to = cardsSrc.indexOf('slug: "', from + 10);
  const block = cardsSrc.slice(from, to === -1 ? undefined : to);
  counts.set(slug, (block.match(/kind: "/g) ?? []).length);
}

let targets = onlySet ? [onlySet] : sets;
if (!onlySet && !all) {
  // 이미 뽑아둔 세트는 건너뛴다. 발행본을 말없이 덮어쓰면 인스타에 나간
  // 그림과 사이트의 그림이 달라진다.
  targets = targets.filter((s) => !existsSync(join(OUT, s, "1.jpg")));
}
if (targets.length === 0) {
  console.log("\n새로 뽑을 세트가 없습니다. 다시 뽑으려면 --all 또는 --set <slug>.\n");
  process.exit(0);
}
for (const s of targets) {
  if (!counts.has(s)) {
    console.error(`\n✖ '${s}' 세트가 cards.ts 에 없습니다.\n`);
    process.exit(1);
  }
}

console.log(`\n▶ ${targets.length}개 세트  (${targets.join(", ")})`);

// ── dev 서버 ──────────────────────────────────────────────
// Astro 7 의 dev 서버는 싱글턴이라 이미 떠 있으면 두 번째가 안 뜬다.
// 그래서 먼저 물어보고, 있으면 그걸 쓰고 없을 때만 띄운다. 우리가 띄운
// 것만 우리가 끈다 — 남의 서버를 끄면 작업 중이던 창이 죽는다.
const win = process.platform === "win32";
const npm = win ? "npm.cmd" : "npm";

function run(cmd, argv) {
  return new Promise((resolve) => {
    const p = spawn(cmd, argv, { cwd: ROOT, shell: win });
    let out = "";
    p.stdout?.on("data", (d) => (out += d));
    p.stderr?.on("data", (d) => (out += d));
    p.on("close", () => resolve(out));
  });
}

/** 이미 떠 있는 dev 서버의 주소. 없으면 null. */
async function runningUrl() {
  const out = await run(npm, ["exec", "--", "astro", "dev", "status"]);
  const m = out.match(/https?:[/][/]localhost:\d+/);
  return m ? m[0] : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let base = await runningUrl();
let dev = null;
let devLog = "";

const stop = () => {
  if (!dev) return; // 남이 띄운 서버는 건드리지 않는다
  try {
    if (win && dev.pid) {
      spawn("taskkill", ["/pid", String(dev.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      dev.kill();
    }
  } catch {}
};
process.on("exit", stop);
process.on("SIGINT", () => {
  stop();
  process.exit(130);
});

if (base) {
  console.log(`· 이미 떠 있는 dev 서버 사용 ${base}`);
} else {
  dev = spawn(npm, ["run", "dev", "--", "--port", String(PORT)], {
    cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], shell: win,
  });
  dev.stdout.on("data", (d) => (devLog += d));
  dev.stderr.on("data", (d) => (devLog += d));
  base = `http://localhost:${PORT}`;

  const until = Date.now() + 60_000;
  let up = false;
  while (Date.now() < until) {
    try {
      const res = await fetch(base, { signal: AbortSignal.timeout(2000) });
      if (res.ok) { up = true; break; }
    } catch {}
    await sleep(500);
  }
  if (!up) {
    console.error(`
✖ dev 서버가 뜨지 않았습니다.
${devLog.slice(-800)}
`);
    process.exit(1);
  }
  console.log("· dev 서버 ✓");
}

// ── 캡처 ──────────────────────────────────────────────────
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});

let made = 0;
for (const slug of targets) {
  const n = counts.get(slug);
  mkdirSync(join(OUT, slug), { recursive: true });
  process.stdout.write(`· ${slug} (${n}장) `);

  for (let i = 1; i <= n; i++) {
    await page.goto(`${base}/cards/${slug}/${i}/`, { waitUntil: "networkidle" });
    // Astro dev 툴바가 아트보드 바닥 가운데에 겹쳐 찍힌다. 발행된 다섯
    // 세트 전부에 이 작은 알약 모양이 박혀 있었는데, 어두운 카드에서는
    // 눈에 잘 안 띄어 한참 몰랐다. dev 서버를 쓰는 한 항상 뜨므로 찍기
    // 직전에 가린다 — config 로 끄면 평소 개발에서도 사라진다.
    await page.addStyleTag({
      content: "astro-dev-toolbar{display:none!important}",
    });
    // 웹폰트가 앉기 전에 찍으면 글자가 밀린다.
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: join(OUT, slug, `${i}.jpg`),
      type: "jpeg",
      quality: QUALITY,
    });
    process.stdout.write("✓");
    made++;
  }
  console.log("");
}

await browser.close();
stop();

console.log(`\n${made}장 → public/cards/`);
console.log("다음: git push 로 배포한 뒤 이미지가 200 인지 확인하고 게시\n");
