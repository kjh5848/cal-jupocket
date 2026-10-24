/**
 * 대시보드 데이터 — Search Console·GA4·색인 점검 결과를 대시보드에 붙일 JSON 파일로 뽑는다.
 *
 *   node social/dashboard-data.mjs [출력 폴더=social/dashboard]
 *
 * 키(.secrets/google.json)는 이 컴퓨터에만 있다 — 대시보드 페이지가 구글을 직접 부르지 않고, 여기서 뽑은 숫자를
 * 파일로 올린다(키를 브라우저에 두지 않는다). 색인 숫자는 social/index-status.json(npm run seo:index)을 읽는다.
 * 색인 추이는 social/index-history.json 에 날짜별로 쌓는다(커밋하지 않는다 — social/*.json 규칙).
 *
 * 나오는 파일(행 배열 JSON):
 *   gsc_daily     date · clicks · impressions · ctr · position     (최근 90일, GSC 3일 지연)
 *   ga_daily      date · sessions · views · users                    (최근 90일)
 *   ga_channels   channel · sessions                                 (최근 28일)
 *   ga_editions   edition · sessions · views                         (최근 28일, 방문 페이지 접두어로 판 구분)
 *   ga_pages      page · edition · sessions · views                  (최근 28일 상위 30)
 *   ga_ai         source · page · sessions                           (최근 28일, AI 답변 유입)
 *   gsc_queries   query · clicks · impressions · ctr · position      (최근 28일 상위 30)
 *   index_groups  group · indexed · discovered · unknown · other · total
 *   index_history date · indexed · discovered · unknown · total
 *   sitemaps      path · submitted · lastRead · urls · errors · warnings
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { createSign } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readEnv } from "./env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] ?? join(HERE, "dashboard");
mkdirSync(OUT, { recursive: true });
const env = readEnv();
const site = env.GSC_SITE_URL;
const prop = env.GA4_PROPERTY_ID;

const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function token() {
  const key = JSON.parse(readFileSync(join(HERE, "..", ".secrets", "google.json"), "utf8"));
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now,
  }));
  const s = createSign("RSA-SHA256");
  s.update(`${head}.${claim}`);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${b64url(s.sign(key.private_key))}` }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`토큰 실패 ${res.status} ${j.error ?? ""}`);
  return j.access_token;
}
const tok = await token();
async function post(url, body) {
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(`${url} ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return j;
}
async function get(url) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } });
  return r.json();
}
const ymd = (d) => d.toISOString().slice(0, 10);
const ago = (n) => ymd(new Date(Date.now() - n * 86400000));
const save = (name, rows) => {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(rows));
  console.log(`${name}: ${rows.length}행`);
};

/** 주소 → 판 이름(한국어판은 'ko') */
const EDITIONS = ["ja", "en-us", "en-gb", "en-ca", "en-au", "en-sg", "de", "fr", "es", "zh-tw", "zh-hk", "zh-cn", "id"];
const editionOf = (p) => EDITIONS.find((e) => p === `/${e}` || p.startsWith(`/${e}/`)) ?? "ko";

/* ---------- Search Console ---------- */
const GSC = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
const gd = await post(GSC, { startDate: ago(93), endDate: ago(3), dimensions: ["date"], rowLimit: 200 });
save("gsc_daily", (gd.rows ?? []).map((r) => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: +r.ctr.toFixed(4), position: +r.position.toFixed(1) })));
const gq = await post(GSC, { startDate: ago(31), endDate: ago(3), dimensions: ["query"], rowLimit: 30 });
save("gsc_queries", (gq.rows ?? []).map((r) => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: +r.ctr.toFixed(4), position: +r.position.toFixed(1) })));

/* ---------- GA4 ---------- */
const GA = `https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`;
const rows = (j) => (j.rows ?? []).map((r) => [...r.dimensionValues.map((d) => d.value), ...r.metricValues.map((m) => Number(m.value))]);
const gaD = await post(GA, { dateRanges: [{ startDate: ago(90), endDate: ago(0) }], dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }, { name: "screenPageViews" }, { name: "activeUsers" }], orderBys: [{ dimension: { dimensionName: "date" } }], limit: 200 });
save("ga_daily", rows(gaD).map(([d, s, v, u]) => ({ date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`, sessions: s, views: v, users: u })));
const gaC = await post(GA, { dateRanges: [{ startDate: ago(28), endDate: ago(0) }], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 20 });
save("ga_channels", rows(gaC).map(([c, s]) => ({ channel: c, sessions: s })));
const gaP = await post(GA, { dateRanges: [{ startDate: ago(28), endDate: ago(0) }], dimensions: [{ name: "landingPage" }], metrics: [{ name: "sessions" }, { name: "screenPageViews" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 2000 });
const pages = rows(gaP).filter(([p]) => p.startsWith("/")).map(([p, s, v]) => ({ page: p, edition: editionOf(p), sessions: s, views: v }));
save("ga_pages", pages.slice(0, 30));
const ed = new Map();
for (const p of pages) {
  const e = ed.get(p.edition) ?? { edition: p.edition, sessions: 0, views: 0 };
  e.sessions += p.sessions; e.views += p.views; ed.set(p.edition, e);
}
save("ga_editions", [...ed.values()].sort((a, b) => b.sessions - a.sessions));
const AI = "chatgpt|openai|perplexity|gemini|bard|copilot|claude|anthropic|you\\.com|phind";
const gaA = await post(GA, {
  dateRanges: [{ startDate: ago(28), endDate: ago(0) }], dimensions: [{ name: "sessionSource" }, { name: "landingPage" }], metrics: [{ name: "sessions" }],
  dimensionFilter: { filter: { fieldName: "sessionSource", stringFilter: { matchType: "FULL_REGEXP", value: `.*(${AI}).*`, caseSensitive: false } } }, limit: 100,
});
save("ga_ai", rows(gaA).map(([s, p, n]) => ({ source: s, page: p, sessions: n })));

/* ---------- 색인 ---------- */
const idxFile = join(HERE, "index-status.json");
if (existsSync(idxFile)) {
  const idx = JSON.parse(readFileSync(idxFile, "utf8"));
  const group = (p) => {
    const e = editionOf(p);
    if (e !== "ko") return `${e} 판`;
    return p.startsWith("/guide/") ? "한국어 글" : p.startsWith("/tools/") ? "한국어 범용 도구" : p.startsWith("/cards/") ? "카드뉴스" : "한국어 홈·계산기";
  };
  const kind = (r) => (r.verdict === "PASS" ? "indexed" : /발견됨|Discovered/.test(r.coverage ?? "") ? "discovered" : /알려지지|unknown/i.test(r.coverage ?? "") ? "unknown" : "other");
  const g = new Map();
  for (const r of idx.results.filter((x) => x.ok)) {
    const k = group(new URL(r.url).pathname);
    const e = g.get(k) ?? { group: k, indexed: 0, discovered: 0, unknown: 0, other: 0, total: 0 };
    e[kind(r)]++; e.total++; g.set(k, e);
  }
  save("index_groups", [...g.values()].sort((a, b) => b.total - a.total));
  const tot = [...g.values()].reduce((a, e) => ({ indexed: a.indexed + e.indexed, discovered: a.discovered + e.discovered, unknown: a.unknown + e.unknown, total: a.total + e.total }), { indexed: 0, discovered: 0, unknown: 0, total: 0 });
  const histFile = join(HERE, "index-history.json");
  // 첫 기준선: 2026-10-20 점검(색인 64 · 발견됨 118 · 모름 169 · 351개)
  const hist = existsSync(histFile) ? JSON.parse(readFileSync(histFile, "utf8")) : [{ date: "2026-10-20", indexed: 64, discovered: 118, unknown: 169, total: 351 }];
  const day = idx.at.slice(0, 10);
  const next = [...hist.filter((h) => h.date !== day), { date: day, ...tot }].sort((a, b) => a.date.localeCompare(b.date));
  writeFileSync(histFile, JSON.stringify(next, null, 2));
  save("index_history", next);
  save("sitemaps", (idx.sitemaps ?? []).map((s) => ({
    path: s.path, submitted: (s.lastSubmitted ?? "").slice(0, 10), lastRead: (s.lastDownloaded ?? "").slice(0, 10),
    urls: Number((s.contents ?? [])[0]?.submitted ?? 0), errors: Number(s.errors ?? 0), warnings: Number(s.warnings ?? 0),
  })));
} else console.log("색인 점검 결과 없음 — npm run seo:index 먼저");
console.log(`→ ${OUT}`);
