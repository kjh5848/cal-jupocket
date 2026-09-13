/**
 * 게시물 성과 수집 — "반응 좋은 글"을 감이 아니라 숫자로 고르기 위해.
 *
 *   node social/stats.mjs           수집해서 stats.json 에 쌓고 표로 보여준다
 *   node social/stats.mjs --show    수집하지 않고 쌓인 것만 본다
 *
 * 원장(posted.json·ig-posted.json)에 있는 id 를 그대로 조회한다. 게시 직후
 * 한 번 보고 끝내면 안 된다 — 인스타는 며칠에 걸쳐 오르기 때문에, 이 스크립트를
 * 주기적으로 돌려 같은 글의 값을 여러 시점에 쌓는다. 덮어쓰지 않고 append 하는
 * 이유가 그것이다(증가 곡선 자체가 신호다).
 *
 * insights 는 2026-09-13 기준 지금 쓰는 토큰으로 양쪽 다 조회된다(대시보드에서
 * 발급한 토큰이 조회 권한을 함께 갖고 있었다). 토큰을 다시 발급하다 권한이
 * 빠지면 조용히 0 이 되는 게 아니라 무엇이 막혔는지 말하게 해 뒀다.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readEnv } from "./env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const LEDGERS = [
  { platform: "threads", file: join(HERE, "posted.json") },
  { platform: "instagram", file: join(HERE, "ig-posted.json") },
];
const STATS = join(HERE, "stats.json");

const THREADS_API = "https://graph.threads.net/v1.0";
const IG_API = "https://graph.instagram.com/v23.0";

/** 스레드는 지표를 metric 파라미터로 골라 받는다. */
const THREADS_METRICS = ["views", "likes", "replies", "reposts", "quotes", "shares"];
/** 인스타 캐러셀에서 의미 있는 것들. saved 가 "나중에 볼 만함"의 대리지표다. */
const IG_METRICS = ["views", "reach", "likes", "comments", "saved", "shares"];

const showOnly = process.argv.slice(2).includes("--show");

const readJson = (p, fallback) =>
  existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback;

const history = readJson(STATS, []);

function table(rows) {
  if (rows.length === 0) return "  (아직 쌓인 기록이 없습니다)";
  const cols = ["at", "platform", "file", "views", "likes", "saved", "shares"];
  const w = (c) => (c === "file" ? 32 : c === "at" ? 12 : 10);
  const head = cols.map((c) => c.padEnd(w(c))).join("");
  const body = rows.map((r) =>
    cols
      .map((c) => {
        const v = c === "at" ? String(r.at).slice(0, 10) : (r[c] ?? "·");
        return String(v).padEnd(w(c));
      })
      .join(""),
  );
  return ["  " + head, ...body.map((b) => "  " + b)].join("\n");
}

if (showOnly) {
  console.log(`\n쌓인 기록 ${history.length}건\n`);
  console.log(table(history));
  console.log("");
  process.exit(0);
}

async function fetchJson(url) {
  const res = await fetch(url);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${res.status} 응답이 JSON이 아님: ${text.slice(0, 200)}`);
  }
  if (!res.ok || body.error) {
    const e = body.error ?? body;
    throw new Error(`${res.status} ${e.message ?? JSON.stringify(e)}`);
  }
  return body;
}

/** insights 응답은 [{name, values:[{value}]}] 꼴이다 — 납작하게 편다. */
function flatten(data) {
  const out = {};
  for (const m of data ?? []) {
    const v = m.values?.[0]?.value ?? m.total_value?.value;
    if (v !== undefined) out[m.name] = v;
  }
  return out;
}

const env = readEnv();
const at = new Date().toISOString();
const collected = [];
const problems = [];

for (const { platform, file } of LEDGERS) {
  const ledger = readJson(file, []);
  if (ledger.length === 0) continue;

  const token =
    platform === "threads" ? env.THREADS_ACCESS_TOKEN : env.IG_ACCESS_TOKEN;
  if (!token) {
    problems.push(`${platform}: 토큰이 .env 에 없습니다`);
    continue;
  }

  const api = platform === "threads" ? THREADS_API : IG_API;
  const metrics = platform === "threads" ? THREADS_METRICS : IG_METRICS;

  for (const entry of ledger) {
    try {
      const body = await fetchJson(
        `${api}/${entry.id}/insights?` +
          new URLSearchParams({ metric: metrics.join(","), access_token: token }),
      );
      collected.push({
        at,
        platform,
        file: entry.file,
        id: entry.id,
        permalink: entry.permalink ?? null,
        postedAt: entry.at ?? null,
        ...flatten(body.data),
      });
      console.log(`  ✓ ${platform} ${entry.file}`);
    } catch (e) {
      problems.push(`${platform} ${entry.file}: ${e.message}`);
      console.log(`  ✖ ${platform} ${entry.file}`);
    }
  }
}

if (collected.length > 0) {
  history.push(...collected);
  writeFileSync(STATS, JSON.stringify(history, null, 2) + "\n", "utf8");
  console.log(`\n${collected.length}건 수집 → social/stats.json (누적 ${history.length}건)\n`);
  console.log(table(collected));
}

if (problems.length > 0) {
  console.log(`\n못 가져온 것 ${problems.length}건:`);
  for (const p of problems) console.log(`  · ${p}`);
  console.log(
    `\n  권한 문제라면 앱 설정에서` +
      `\n  threads_manage_insights / instagram_business_manage_insights 를 확인하고` +
      `\n  토큰을 다시 발급한 뒤(social:setup / ig:setup) 다시 실행하세요.\n`,
  );
}

if (collected.length === 0 && problems.length === 0) {
  console.log("\n원장이 비어 있습니다 — 아직 올린 글이 없습니다.\n");
}
