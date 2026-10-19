/**
 * 사이트맵 등록 · 색인 상태 — Search Console 사이트맵 목록 + URL 검사.
 *
 *   node social/index-status.mjs                 사이트맵 상태 + 사이트맵 안 주소 전부 URL 검사
 *   node social/index-status.mjs --sitemaps      사이트맵 상태만(빠름)
 *   node social/index-status.mjs --only /ja/     그 접두어로 시작하는 주소만 검사
 *
 * `npm run seo` 가 "검색에서 무엇이 걸리나"(성과)라면 이것은 "구글이 우리 페이지를 갖고 있나"(색인)다.
 * 성과 보고서에는 색인 안 된 페이지가 아예 안 나온다 — 0 노출과 미색인이 구분되지 않아서 따로 둔다.
 *
 * URL 검사 API 는 속성당 하루 2,000건·분당 600건이 한도라 동시에 5건씩만 보낸다.
 * 결과는 social/index-status.json 에 남는다(커밋하지 않는다 — social/*.json 규칙).
 * 인증은 seo.mjs 와 같은 서비스 계정(.secrets/google.json), 읽기 전용 범위만 쓴다.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readEnv } from "./env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY_FILE = join(HERE, "..", ".secrets", "google.json");
const OUT = join(HERE, "index-status.json");
const SITE = "https://jupocket.com";

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const arg = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const env = readEnv();
const siteUrl = env.GSC_SITE_URL;
if (!siteUrl) {
  console.error("✖ GSC_SITE_URL 이 .env 에 없습니다(npm run seo -- --check 로 먼저 확인).");
  process.exit(1);
}
if (!existsSync(KEY_FILE)) {
  console.error("✖ 키 파일이 없습니다: .secrets/google.json");
  process.exit(1);
}

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function token() {
  const key = JSON.parse(readFileSync(KEY_FILE, "utf8"));
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );
  const s = createSign("RSA-SHA256");
  s.update(`${head}.${claim}`);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${head}.${claim}.${b64url(s.sign(key.private_key))}`,
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(`✖ 토큰 발급 실패 (${res.status}) ${body.error ?? ""}`);
    process.exit(1);
  }
  return body.access_token;
}

async function api(url, tok, body) {
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${tok}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { ok: res.ok, status: res.status, json: await res.json().catch(() => ({})) };
}

const tok = await token();
const enc = encodeURIComponent(siteUrl);

/* ---------------------------------------------------------------- 사이트맵 */
const sm = await api(`https://searchconsole.googleapis.com/webmasters/v3/sites/${enc}/sitemaps`, tok);
if (!sm.ok) {
  console.error(`✖ 사이트맵 목록 실패 (${sm.status}) ${sm.json.error?.message ?? ""}`);
  process.exit(1);
}
const sitemaps = sm.json.sitemap ?? [];
console.log(`\n사이트맵 ${sitemaps.length}개 (${siteUrl})`);
for (const s of sitemaps) {
  const sub = (s.contents ?? []).map((c) => `${c.type} 제출 ${c.submitted}`).join(", ");
  console.log(
    `  · ${s.path}\n    제출 ${s.lastSubmitted?.slice(0, 10) ?? "-"} · 구글이 읽음 ${s.lastDownloaded?.slice(0, 10) ?? "아직"}` +
      ` · 대기 ${s.isPending ? "예" : "아니오"} · 오류 ${s.errors ?? 0} · 경고 ${s.warnings ?? 0}${sub ? ` · ${sub}` : ""}`,
  );
}
if (has("--sitemaps")) process.exit(0);

/* ------------------------------------------------- 라이브 사이트맵 안 주소 */
async function locs(url) {
  const xml = await (await fetch(url)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}
const top = await locs(`${SITE}/sitemap-index.xml`);
const urls = [];
for (const u of top) urls.push(...(u.endsWith(".xml") ? await locs(u) : [u]));
const only = arg("--only", "");
const targets = urls.filter((u) => !only || new URL(u).pathname.startsWith(only));
console.log(`\n라이브 사이트맵 주소 ${urls.length}개 · 이번에 검사 ${targets.length}개`);

/* ---------------------------------------------------------------- URL 검사 */
const results = [];
let i = 0;
async function worker() {
  while (i < targets.length) {
    const url = targets[i++];
    const r = await api("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", tok, {
      inspectionUrl: url,
      siteUrl,
      languageCode: "ko-KR",
    });
    const x = r.json.inspectionResult?.indexStatusResult ?? {};
    results.push({
      url,
      ok: r.ok,
      error: r.ok ? undefined : `${r.status} ${r.json.error?.message ?? ""}`,
      verdict: x.verdict,
      coverage: x.coverageState,
      lastCrawl: x.lastCrawlTime?.slice(0, 10),
      googleCanonical: x.googleCanonical,
      inSitemap: (x.sitemap ?? []).length > 0,
    });
    if (results.length % 25 === 0) process.stdout.write(`  … ${results.length}/${targets.length}\n`);
  }
}
await Promise.all(Array.from({ length: 5 }, worker));

const errors = results.filter((r) => !r.ok);
const byCov = {};
for (const r of results.filter((r) => r.ok)) byCov[r.coverage ?? "(없음)"] = (byCov[r.coverage ?? "(없음)"] ?? 0) + 1;
console.log(`\n색인 상태 (구글 표기 그대로)`);
for (const [k, v] of Object.entries(byCov).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
if (errors.length) console.log(`  검사 실패 ${errors.length}개 — 예: ${errors[0].error}`);

/** 주소 갈래별 — 홈·계산기·글·도구·일본어판 */
const group = (p) =>
  p.startsWith("/ja/") || p === "/ja" ? "일본어판 /ja/" : p.startsWith("/guide/") ? "글 /guide/" : p.startsWith("/tools/") ? "범용 도구 /tools/" : p.startsWith("/cards/") ? "카드뉴스 /cards/" : "홈·계산기·기타";
const g = {};
for (const r of results.filter((r) => r.ok)) {
  const k = group(new URL(r.url).pathname);
  g[k] ??= { all: 0, pass: 0 };
  g[k].all++;
  if (r.verdict === "PASS") g[k].pass++;
}
console.log(`\n갈래별 색인됨(PASS) / 검사`);
for (const [k, v] of Object.entries(g)) console.log(`  ${k.padEnd(18)} ${v.pass} / ${v.all}`);

writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), siteUrl, sitemaps, results }, null, 2));
console.log(`\n자세한 결과: social/index-status.json`);
