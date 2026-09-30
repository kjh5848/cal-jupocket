/**
 * 주간 보고 — 흩어진 계측을 한 화면으로 모은다.
 *
 *   node social/report.mjs          터미널에 찍는다
 *   node social/report.mjs --json   social/report.json 으로도 남긴다
 *
 * **왜 사이트에 안 올리나.** jupocket.com 은 서버가 없는 정적 사이트다.
 * GA4·GSC 를 읽으려면 서비스 계정 키가 필요한데 그 키를 브라우저에 두면
 * 누구나 우리 데이터를 읽는다. 관리자 페이지를 사이트에 올리는 것도
 * 그 자체가 공개다. 그래서 **로컬에서 돌고 로컬에 남긴다.**
 *
 * **왜 seo.mjs 와 따로 두나.** seo 는 "지금 무엇이 걸렸나" 를 훑는
 * 도구이고, 이건 "지난주보다 나아졌나" 를 묻는 도구다. 묻는 것이 다르면
 * 화면도 달라야 한다. 숫자는 이미 쌓아 둔 파일에서 읽고, 새로 부르는
 * 것은 GA4 뿐이다.
 *
 * 읽는 것:
 *   social/seo-history.json   검색어·페이지 (날짜별, --track 이 쌓는다)
 *   social/stats.json         스레드·인스타 게시물 성과
 *   social/posted.json        무엇을 언제 올렸나
 *   GA4                       세션 (실시간에 가깝다)
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readEnv } from "./env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY_FILE = join(HERE, "..", ".secrets", "google.json");
const WANT_JSON = process.argv.includes("--json");

const read = (p, fb) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fb);
const hist = read(join(HERE, "seo-history.json"), { rows: [] });
const stats = read(join(HERE, "stats.json"), []);
const posted = read(join(HERE, "posted.json"), []);

const ymd = (d) => d.toISOString().slice(0, 10);
const ago = (n) => ymd(new Date(Date.now() - n * 864e5));
const won = (n) => n.toLocaleString("ko-KR");

/* ---------------------------------------------------------------- GA4 */

async function ga4(propId, body) {
  if (!existsSync(KEY_FILE)) return null;
  const key = JSON.parse(readFileSync(KEY_FILE, "utf8"));
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(key.private_key, "base64url");
  const tr = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${sig}`,
    }),
  });
  const token = (await tr.json()).access_token;
  if (!token) return null;
  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propId}:runReport`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return r.ok ? r.json() : null;
}

/* ------------------------------------------------------------ 집계 */

/** 두 구간을 잘라 비교한다. 이 파일의 유일한 일이다. */
function split(rows, pick, dateOf, days = 7) {
  const to = ago(0);
  const mid = ago(days);
  const from = ago(days * 2);
  const now = rows.filter((r) => dateOf(r) > mid && dateOf(r) <= to);
  const prev = rows.filter((r) => dateOf(r) > from && dateOf(r) <= mid);
  const sum = (a) => a.reduce((s, r) => s + pick(r), 0);
  return { now: sum(now), prev: sum(prev), from, mid, to };
}

const delta = (a) => {
  const d = a.now - a.prev;
  if (a.prev === 0) return d > 0 ? "신규" : "—";
  return `${d >= 0 ? "+" : ""}${Math.round((d / a.prev) * 100)}%`;
};

const queries = hist.rows.filter((r) => r.kind === "query");
const pages = hist.rows.filter((r) => r.kind === "page");
const OURS = /jupocket\.com\/(guide|vat|withholding|inheritance|penalty|income-tax-refund|freelancer-33|national-pension-premium|property-tax|vehicle-tax|acquisition-tax|link|cards)/;
const ourPages = pages.filter((r) => OURS.test(r.key) && !/insurance-claims/.test(r.key));

const impr = split(ourPages, (r) => r.impressions, (r) => r.date);
const clicks = split(ourPages, (r) => r.clicks, (r) => r.date);

/** 이번 주 처음 걸린 한국어 검색어. */
const korean = queries.filter((r) => /[가-힣]/.test(r.key));
const seenBefore = new Set(korean.filter((r) => r.date <= ago(7)).map((r) => r.key));
const freshKo = [
  ...new Map(
    korean
      .filter((r) => r.date > ago(7) && !seenBefore.has(r.key))
      .map((r) => [r.key, r]),
  ).values(),
].sort((a, b) => b.impressions - a.impressions);

/** 스레드 — 파일별 최신 스냅샷. */
const threads = stats.filter((r) => r.platform === "threads");
const latest = {};
for (const r of threads) if (!latest[r.file] || r.at > latest[r.file].at) latest[r.file] = r;
const tRows = Object.values(latest);
const postedAt = (f) => posted.find((e) => e.file === f)?.at?.slice(0, 10) ?? "";
const tSplit = split(tRows, (r) => r.views || 0, (r) => postedAt(r.file));
const tPosts = split(tRows, () => 1, (r) => postedAt(r.file));

const sumAll = (k) => tRows.reduce((s, r) => s + (r[k] || 0), 0);

/* -------------------------------------------------------------- 출력 */

const env = readEnv();
const ga = env.GA4_PROPERTY_ID
  ? await ga4(env.GA4_PROPERTY_ID, {
      dateRanges: [
        { startDate: "7daysAgo", endDate: "today", name: "now" },
        { startDate: "14daysAgo", endDate: "8daysAgo", name: "prev" },
      ],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
    })
  : null;

const gaBy = { now: {}, prev: {} };
for (const row of ga?.rows ?? []) {
  const range = row.dimensionValues[1]?.value ?? "now";
  gaBy[range][row.dimensionValues[0].value] = Number(row.metricValues[0].value);
}
const gaSum = (o) => Object.values(o).reduce((s, v) => s + v, 0);

const line = "─".repeat(64);
const out = [];
out.push(`\n주간 보고 — ${ago(7)} ~ ${ago(0)}\n${line}`);

out.push(`\n■ 검색 (GSC · 3일 지연)`);
out.push(`  노출   ${String(impr.now).padStart(5)}  (지난주 ${impr.prev} · ${delta(impr)})`);
out.push(`  클릭   ${String(clicks.now).padStart(5)}  (지난주 ${clicks.prev} · ${delta(clicks)})`);
if (freshKo.length) {
  out.push(`\n  이번 주 처음 걸린 한국어 검색어 ${freshKo.length}개`);
  for (const r of freshKo.slice(0, 8))
    out.push(`    ${String(r.impressions).padStart(3)}노출 ${String(Math.round(r.position)).padStart(3)}위  ${r.key}`);
} else {
  out.push(`\n  이번 주 새로 걸린 한국어 검색어는 없습니다.`);
}

out.push(`\n■ 방문 (GA4)`);
if (ga) {
  out.push(`  세션   ${String(gaSum(gaBy.now)).padStart(5)}  (지난주 ${gaSum(gaBy.prev)})`);
  const src = Object.entries(gaBy.now).sort((a, b) => b[1] - a[1]).slice(0, 5);
  for (const [k, v] of src) out.push(`    ${String(v).padStart(4)}  ${k}`);
  out.push(`  ※ (direct) 에는 봇과 우리 자신이 섞여 있습니다.`);
} else {
  out.push(`  GA4 를 읽지 못했습니다 (.secrets/google.json · GA4_PROPERTY_ID 확인)`);
}

out.push(`\n■ 스레드`);
out.push(`  이번 주 게시 ${tPosts.now}편 (지난주 ${tPosts.prev}편)`);
out.push(`  이번 주 글 조회 ${won(tSplit.now)} (지난주 ${won(tSplit.prev)} · ${delta(tSplit)})`);
out.push(`  누적  ${tRows.length}편 · 조회 ${won(sumAll("views"))} · 좋아요 ${sumAll("likes")} · 공유 ${sumAll("shares")}`);
const reply = tRows.reduce((s, r) => s + (r.replyViews || 0), 0);
const body = tRows.reduce((s, r) => s + (r.views || 0), 0);
if (reply) out.push(`  본문 → 답글  ${((reply / body) * 100).toFixed(1)}%  (${won(reply)} / ${won(body)})`);

out.push(`\n■ 이번 주에 볼 것`);
if (clicks.now === 0 && impr.now > 0)
  out.push(`  · 노출은 있는데 클릭이 0 입니다 — 순위가 뒤이거나 제목이 안 맞습니다.`);
if (impr.now === 0)
  out.push(`  · 검색 노출이 0 입니다. 새 글은 색인에 2~3주 걸립니다.`);
if (tPosts.now === 0) out.push(`  · 이번 주 스레드가 없습니다. 큐를 확인하세요 — npm run queue`);
if (freshKo.length > 0)
  out.push(`  · 새로 걸린 말이 있습니다. 그 주제를 더 팔 값어치가 있는지 보세요.`);
out.push(`  · 원자료: npm run seo -- --trend · npm run stats -- --show · npm run queue`);
out.push(`${line}\n`);

console.log(out.join("\n"));

if (WANT_JSON) {
  const p = join(HERE, "report.json");
  writeFileSync(
    p,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        window: { from: ago(7), to: ago(0) },
        search: { impressions: impr, clicks, freshKoreanQueries: freshKo.slice(0, 20) },
        ga4: ga ? { now: gaBy.now, prev: gaBy.prev } : null,
        threads: {
          postsThisWeek: tPosts.now,
          viewsThisWeek: tSplit.now,
          total: {
            posts: tRows.length,
            views: sumAll("views"),
            likes: sumAll("likes"),
            replyViews: reply,
          },
        },
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  console.log(`  → social/report.json\n`);
}
