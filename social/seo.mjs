/**
 * 검색 성과 수집 — Search Console + GA4.
 *
 *   node social/seo.mjs --check     자격증명·권한만 확인한다(가장 먼저 이것)
 *   node social/seo.mjs             최근 28일 쿼리·페이지 성과를 본다
 *   node social/seo.mjs --days 7    기간을 바꾼다
 *
 * 스레드·인스타 지표(stats.mjs)가 "우리가 밀어서 온 사람"이라면 여기 숫자는
 * "검색으로 찾아온 사람"이다. 둘은 성격이 달라서 같은 표에 넣지 않는다.
 *
 * 인증은 서비스 계정 JWT 를 직접 서명해서 만든다 — googleapis 패키지를 넣지
 * 않는 이유는 이 저장소의 다른 API 호출(threads·instagram)도 전부 원시 HTTP 라
 * 관례를 맞추기 위해서다. 서명은 node:crypto 로 끝난다.
 *
 * 키 파일은 .secrets/google.json 이고 .gitignore 에 걸려 있다. 이 파일이
 * 유출되면 GA4·GSC 데이터가 통째로 열리므로 커밋하지 않는다.
 *
 * GSC 는 "데이터가 없음" 과 "권한이 없음" 이 둘 다 빈 결과로 보이기 쉽다.
 * 그래서 --check 를 따로 두고, 접근 가능한 속성 목록을 먼저 보여준다.
 */
import { readFileSync, existsSync } from "node:fs";
import { createSign } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readEnv } from "./env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY_FILE = join(HERE, "..", ".secrets", "google.json");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_API = "https://searchconsole.googleapis.com/webmasters/v3";
const GA4_API = "https://analyticsdata.googleapis.com/v1beta";

const SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
].join(" ");

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const arg = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const DAYS = Number(arg("--days", "28"));

/* ------------------------------------------------------------------ 인증 */

function loadKey() {
  if (!existsSync(KEY_FILE)) {
    console.error(
      `\n✖ 키 파일이 없습니다: .secrets/google.json\n\n` +
        `  Google Cloud 콘솔 > IAM 및 관리자 > 서비스 계정 >\n` +
        `  jupocket-analytics > 키 > 키 추가 > 새 키 만들기 > JSON\n` +
        `  받은 파일을 .secrets/google.json 으로 옮기세요.\n`,
    );
    process.exit(1);
  }
  const k = JSON.parse(readFileSync(KEY_FILE, "utf8"));
  if (!k.client_email || !k.private_key) {
    console.error("\n✖ 키 파일에 client_email 또는 private_key 가 없습니다.\n");
    process.exit(1);
  }
  return k;
}

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/**
 * 서비스 계정 JWT 로 액세스 토큰을 받는다.
 *
 * 만료를 1시간으로 두는 건 구글 상한이라서다. 스크립트가 그보다 오래 돌 일이
 * 없으므로 갱신 로직은 두지 않았다 — 필요해지면 그때 넣는다.
 */
async function getAccessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: key.client_email,
      scope: SCOPES,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const sig = b64url(signer.sign(key.private_key));

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${sig}`,
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(`\n✖ 토큰 발급 실패 (${res.status})`);
    console.error(`  ${body.error ?? ""} ${body.error_description ?? ""}`);
    console.error(`  API 두 개가 사용 설정됐는지 확인하세요 — Google Analytics Data API · Google Search Console API\n`);
    process.exit(1);
  }
  return body.access_token;
}

async function api(url, token, body) {
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

/* ------------------------------------------------------------------ 날짜 */

const ymd = (d) => d.toISOString().slice(0, 10);
const ago = (n) => ymd(new Date(Date.now() - n * 86400000));

/**
 * 두 서비스의 최신성이 다르므로 기간을 따로 잡는다.
 *
 * GSC 는 보통 2~3일 지연돼서 어제까지 달라고 하면 빈 날이 섞인다.
 * GA4 는 거의 실시간이라 같은 지연을 적용하면 최근 며칠이 통째로 빠진다 —
 * 실제로 그렇게 두었다가 트래픽이 있는데도 세션 0 으로 보고했다.
 */
const GSC_LAG = 3;
const endDate = ago(GSC_LAG);
const startDate = ago(DAYS + GSC_LAG);
const gaEndDate = ago(0);
const gaStartDate = ago(DAYS);

/* ------------------------------------------------------------------ 표 */

function table(rows, cols) {
  if (!rows.length) return "  (행이 없습니다)";
  const w = cols.map((c) =>
    Math.max(c.label.length, ...rows.map((r) => String(c.get(r)).length)),
  );
  const line = (cells) =>
    "  " + cells.map((v, i) => String(v).padEnd(w[i] + 2)).join("");
  return [
    line(cols.map((c) => c.label)),
    line(cols.map((_, i) => "─".repeat(w[i]))),
    ...rows.map((r) => line(cols.map((c) => c.get(r)))),
  ].join("\n");
}

const pct = (n) => `${(n * 100).toFixed(1)}%`;
const pos = (n) => n.toFixed(1);

/* ------------------------------------------------------------------ 실행 */

const key = loadKey();
const token = await getAccessToken(key);
const env = readEnv();

console.log(`\n서비스 계정  ${key.client_email}`);
console.log(`기간         GSC ${startDate} ~ ${endDate} (지연 ${GSC_LAG}일) · GA4 ${gaStartDate} ~ ${gaEndDate}\n`);

/* --- 접근 가능한 GSC 속성 --- */
const sites = await api(`${GSC_API}/sites`, token);
if (!sites.ok) {
  console.error(`✖ GSC 속성 목록 실패 (${sites.status}) ${JSON.stringify(sites.json).slice(0, 200)}\n`);
} else {
  const list = sites.json.siteEntry ?? [];
  console.log(`Search Console 접근 가능한 속성 ${list.length}개`);
  for (const s of list) console.log(`  · ${s.siteUrl}  [${s.permissionLevel}]`);
  if (!list.length) {
    console.log(
      `  아직 없습니다 — search.google.com/search-console 에서\n` +
        `  설정 > 사용자 및 권한 > 사용자 추가 로 아래 주소를 '전체' 권한으로 넣으세요:\n` +
        `    ${key.client_email}`,
    );
  }
  console.log("");
}

if (has("--check")) {
  const propId = env.GA4_PROPERTY_ID;
  if (!propId) {
    console.log(
      `GA4 속성 ID 가 .env 에 없습니다.\n` +
        `  GA4 > 관리 > 속성 설정 에서 '속성 ID'(숫자)를 확인해 .env 에 넣으세요:\n` +
        `    GA4_PROPERTY_ID=123456789\n` +
        `  그리고 GA4 > 관리 > 속성 액세스 관리 에서 아래 주소를 '뷰어'로 추가하세요:\n` +
        `    ${key.client_email}\n`,
    );
  } else {
    const probe = await api(`${GA4_API}/properties/${propId}:runReport`, token, {
      dateRanges: [{ startDate: gaStartDate, endDate: gaEndDate }],
      metrics: [{ name: "sessions" }],
    });
    console.log(
      probe.ok
        ? `GA4 속성 ${propId} 접근 ✓ (세션 ${probe.json.rows?.[0]?.metricValues?.[0]?.value ?? 0})\n`
        : `✖ GA4 접근 실패 (${probe.status}) — 속성 액세스 관리에 서비스 계정을 뷰어로 추가했는지 확인하세요\n`,
    );
  }
  process.exit(0);
}

/* --- GSC 성과 --- */
const siteUrl = env.GSC_SITE_URL;
if (!siteUrl) {
  console.log(
    `GSC_SITE_URL 이 .env 에 없습니다. 위 목록에서 골라 넣으세요 — 예:\n` +
      `  GSC_SITE_URL=sc-domain:jupocket.com\n`,
  );
} else {
  const q = await api(
    `${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    token,
    { startDate, endDate, dimensions: ["query"], rowLimit: 25 },
  );
  if (!q.ok) {
    console.error(`✖ GSC 쿼리 실패 (${q.status}) ${JSON.stringify(q.json).slice(0, 200)}\n`);
  } else {
    const rows = q.json.rows ?? [];
    const tot = rows.reduce(
      (a, r) => ({ c: a.c + r.clicks, i: a.i + r.impressions }),
      { c: 0, i: 0 },
    );
    console.log(`검색어 상위 ${rows.length}개 — 클릭 ${tot.c} · 노출 ${tot.i}`);
    console.log(
      table(rows, [
        { label: "검색어", get: (r) => r.keys[0] },
        { label: "클릭", get: (r) => r.clicks },
        { label: "노출", get: (r) => r.impressions },
        { label: "CTR", get: (r) => pct(r.ctr) },
        { label: "평균순위", get: (r) => pos(r.position) },
      ]),
    );
    console.log("");

    const p = await api(
      `${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      token,
      { startDate, endDate, dimensions: ["page"], rowLimit: 20 },
    );
    if (p.ok) {
      const prows = p.json.rows ?? [];
      console.log(`페이지 상위 ${prows.length}개`);
      console.log(
        table(prows, [
          { label: "페이지", get: (r) => r.keys[0].replace("https://jupocket.com", "") },
          { label: "클릭", get: (r) => r.clicks },
          { label: "노출", get: (r) => r.impressions },
          { label: "평균순위", get: (r) => pos(r.position) },
        ]),
      );
      console.log("");
    }
  }
}

/* --- GA4 성과 --- */
const propId = env.GA4_PROPERTY_ID;
if (!propId) {
  console.log(`GA4_PROPERTY_ID 가 .env 에 없어 GA4 는 건너뜁니다.\n`);
} else {
  const g = await api(`${GA4_API}/properties/${propId}:runReport`, token, {
    dateRanges: [{ startDate: gaStartDate, endDate: gaEndDate }],
    dimensions: [{ name: "landingPage" }],
    metrics: [
      { name: "sessions" },
      { name: "engagedSessions" },
      { name: "screenPageViewsPerSession" },
      { name: "averageSessionDuration" },
    ],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 20,
  });
  if (!g.ok) {
    console.error(`✖ GA4 실패 (${g.status}) ${JSON.stringify(g.json).slice(0, 200)}\n`);
  } else {
    const rows = (g.json.rows ?? []).map((r) => ({
      page: r.dimensionValues[0].value,
      sessions: Number(r.metricValues[0].value),
      engaged: Number(r.metricValues[1].value),
      perSession: Number(r.metricValues[2].value),
      dur: Number(r.metricValues[3].value),
    }));
    const tot = rows.reduce((a, r) => a + r.sessions, 0);
    console.log(`GA4 방문 페이지 상위 ${rows.length}개 — 세션 합계 ${tot}`);
    console.log(
      table(rows, [
        { label: "방문 페이지", get: (r) => r.page },
        { label: "세션", get: (r) => r.sessions },
        // 세션 수만 보면 "왔다"까지만 안다. 참여 세션(10초 이상 머물거나
        // 두 쪽 이상 본 세션)이 "읽었나"를 가른다 — 실제로 /link 는 6세션에
        // 참여 4인데 글 페이지들은 참여 0이었다. 그 차이가 세션 수에는
        // 전혀 보이지 않았다.
        { label: "참여", get: (r) => r.engaged },
        { label: "쪽/세션", get: (r) => r.perSession.toFixed(1) },
        { label: "평균체류", get: (r) => `${Math.round(r.dur)}초` },
      ]),
    );
    console.log("");
  }

  /*
   * 유입 출처 — 어느 글이 사람을 데려왔나.
   *
   * 방문 페이지만 보면 "무엇을 봤나"까지만 안다. 스레드 조회 9,237 에
   * 세션 25 였던 걸(2026-09-16) 알아도, 그 25 를 어느 글이 만들었는지는
   * 알 수 없었다. 큐 글의 답글 링크에 utm_campaign(큐 번호)을 달았으니
   * 여기서 글 단위로 갈린다.
   *
   * 인스타는 캡션 URL 이 눌리지 않아 프로필 링크로만 온다 — 글 단위
   * 귀속이 원리상 불가능하다. instagram 행은 합계로만 읽는다.
   */
  const src = await api(`${GA4_API}/properties/${propId}:runReport`, token, {
    dateRanges: [{ startDate: gaStartDate, endDate: gaEndDate }],
    dimensions: [
      { name: "sessionSource" },
      { name: "sessionMedium" },
      { name: "sessionCampaignName" },
    ],
    metrics: [{ name: "sessions" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 25,
  });
  if (!src.ok) {
    console.error(
      `✖ GA4 유입 출처 실패 (${src.status}) ${JSON.stringify(src.json).slice(0, 300)}\n`,
    );
  } else {
    const rows = (src.json.rows ?? []).map((r) => ({
      source: r.dimensionValues[0].value,
      medium: r.dimensionValues[1].value,
      campaign: r.dimensionValues[2].value,
      sessions: Number(r.metricValues[0].value),
      users: Number(r.metricValues[1].value),
    }));
    const tot = rows.reduce((a, r) => a + r.sessions, 0);
    console.log(`GA4 유입 출처 ${rows.length}줄 — 세션 합계 ${tot}`);
    console.log(
      table(rows, [
        { label: "출처", get: (r) => r.source },
        { label: "매체", get: (r) => r.medium },
        { label: "캠페인(큐 번호)", get: (r) => r.campaign },
        { label: "세션", get: (r) => r.sessions },
        { label: "사용자", get: (r) => r.users },
      ]),
    );
    const tagged = rows.filter((r) => r.medium === "social");
    if (tagged.length === 0) {
      console.log(
        "\n  utm_medium=social 행이 아직 없습니다. 태그를 단 뒤 올린 글이" +
          "\n  도달하기까지 기다리거나, 답글에 utm 이 실제로 붙었는지 보세요.",
      );
    }
    console.log("");
  }
}
