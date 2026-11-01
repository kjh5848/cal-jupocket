/**
 * 클릭률 빈틈 — "노출은 많은데 클릭이 거의 없는" 페이지와 그 검색어.
 *
 *   node social/ctr-gaps.mjs              최근 28일(3일 지연) 상위 30개 표 + social/ctr-gaps.json
 *   node social/ctr-gaps.mjs --top 50     표에 보일 개수
 *   node social/ctr-gaps.mjs --days 14    기간
 *
 * 기준: 페이지 평균 순위 ≤ 20, 노출 ≥ 20, 실제 클릭률이 그 순위 기대치의 절반 미만.
 * 정렬: (기대 클릭 − 실제 클릭) 큰 순. 페이지마다 노출 많은 검색어 상위 5개를 붙인다.
 * 쓰임: 한국 루틴 보강 회차가 이 목록 위쪽부터 제목·설명·첫 문단을 검색 의도에 맞게 고친다(docs/ctr-fixes.md).
 *
 * 인증은 index-status.mjs 와 같은 서비스 계정 JWT(읽기 전용 webmasters.readonly).
 * 키·.env 는 저장소 루트(.secrets/google.json, .env)에 있다. worktree 에서 시험할 때는
 * CAL_ROOT=<메인 폴더> 로 키·.env 위치를 바꾼다(그 폴더에는 아무것도 쓰지 않는다).
 * 결과 JSON 은 커밋하지 않는다(.gitignore).
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.CAL_ROOT ?? join(HERE, "..");
if (process.env.CAL_ROOT && !process.env.SOCIAL_ENV_PATH) {
  process.env.SOCIAL_ENV_PATH = join(ROOT, ".env");
}
const { readEnv } = await import("./env.mjs");
const KEY_FILE = join(ROOT, ".secrets", "google.json");
const OUT = join(HERE, "ctr-gaps.json");

const argv = process.argv.slice(2);
const arg = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const DAYS = Number(arg("--days", 28));
const TOP = Number(arg("--top", 30));
const MAX_POS = 20;
const MIN_IMPR = 20;
/** 실제 클릭률이 기대치의 이 비율보다 낮으면 "크게 낮다"로 본다. */
const GAP_RATIO = 0.5;

/**
 * 순위별 기대 클릭률 — 업계 조사 대략치, 판단용(정확한 값이 아니다).
 * 사이 순위는 선형 보간, 20위 뒤는 0.7% 로 둔다.
 */
const CURVE = [
  [1, 0.25],
  [3, 0.1],
  [5, 0.06],
  [10, 0.025],
  [15, 0.01],
  [20, 0.007],
];
export function expectedCtr(pos) {
  if (pos <= CURVE[0][0]) return CURVE[0][1];
  for (let i = 1; i < CURVE.length; i++) {
    const [p1, c1] = CURVE[i - 1];
    const [p2, c2] = CURVE[i];
    if (pos <= p2) return c1 + ((c2 - c1) * (pos - p1)) / (p2 - p1);
  }
  return CURVE[CURVE.length - 1][1];
}

const env = readEnv();
const siteUrl = env.GSC_SITE_URL;
if (!siteUrl) {
  console.error("✖ GSC_SITE_URL 이 .env 에 없습니다(메인 폴더에서 돌리거나 CAL_ROOT 를 주세요).");
  process.exit(1);
}
if (!existsSync(KEY_FILE)) {
  console.error("✖ 키 파일이 없습니다: .secrets/google.json (CAL_ROOT 확인)");
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

const ymd = (d) => d.toISOString().slice(0, 10);
const ago = (n) => ymd(new Date(Date.now() - n * 86400000));
const GSC_LAG = 3;
const endDate = ago(GSC_LAG);
const startDate = ago(DAYS - 1 + GSC_LAG);

async function query(tok, dimensions) {
  const out = [];
  for (let startRow = 0; ; startRow += 25000) {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 25000, startRow }),
      },
    );
    const body = await res.json();
    if (!res.ok) {
      console.error(`✖ GSC ${dimensions.join("+")} 실패 (${res.status}) ${body.error?.message ?? ""}`);
      process.exit(1);
    }
    const rows = body.rows ?? [];
    out.push(...rows);
    if (rows.length < 25000) return out;
  }
}

const tok = await token();
const [pqRows, pageRows] = await Promise.all([
  query(tok, ["page", "query"]),
  query(tok, ["page"]),
]);

const queriesByPage = new Map();
for (const r of pqRows) {
  const [page, q] = r.keys;
  if (!queriesByPage.has(page)) queriesByPage.set(page, []);
  queriesByPage.get(page).push({
    query: q,
    impressions: r.impressions,
    clicks: r.clicks,
    position: +r.position.toFixed(1),
  });
}

const gaps = [];
for (const r of pageRows) {
  const page = r.keys[0];
  if (r.position > MAX_POS || r.impressions < MIN_IMPR) continue;
  const exp = expectedCtr(r.position);
  if (r.ctr >= exp * GAP_RATIO) continue;
  const expClicks = r.impressions * exp;
  gaps.push({
    page: page.replace(/^https?:\/\/[^/]+/, ""),
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: +(r.ctr * 100).toFixed(2),
    position: +r.position.toFixed(1),
    expectedCtr: +(exp * 100).toFixed(2),
    expectedClicks: +expClicks.toFixed(1),
    gap: +(expClicks - r.clicks).toFixed(1),
    topQueries: (queriesByPage.get(page) ?? [])
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5),
  });
}
gaps.sort((a, b) => b.gap - a.gap);

writeFileSync(
  OUT,
  JSON.stringify({ startDate, endDate, generatedAt: new Date().toISOString(), gaps }, null, 2) + "\n",
);

console.log(`\n클릭률 빈틈 — GSC ${startDate} ~ ${endDate} · 순위 ≤ ${MAX_POS} · 노출 ≥ ${MIN_IMPR} · 클릭률 < 기대치×${GAP_RATIO}`);
console.log(`해당 ${gaps.length}개 페이지 (상위 ${Math.min(TOP, gaps.length)}개 표시) · 기대 클릭률은 업계 대략치\n`);
gaps.slice(0, TOP).forEach((g, i) => {
  console.log(
    `${String(i + 1).padStart(2)}. ${g.page}\n    노출 ${g.impressions} · 클릭 ${g.clicks} · 순위 ${g.position} · 클릭률 ${g.ctr}% (기대 ${g.expectedCtr}%) · 빈틈 ${g.gap}`,
  );
  for (const q of g.topQueries) {
    console.log(`      - ${q.query}  (노출 ${q.impressions} · 클릭 ${q.clicks} · 순위 ${q.position})`);
  }
});
console.log(`\n→ ${OUT}`);
