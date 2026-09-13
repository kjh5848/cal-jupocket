/**
 * Threads 게시 — 큐에서 다음 글 하나를 올린다. 글만 올린다.
 *
 *   node social/threads-post.mjs              드라이런: 컨테이너만 만들고 멈춤
 *   node social/threads-post.mjs --publish    실제 게시
 *   node social/threads-post.mjs --due --publish   예약 시각이 된 것 하나
 *   node social/threads-post.mjs --file 003-….md --publish
 *
 * 이미지를 올리지 않는다. Threads 는 글이 먼저인 곳이고, 카드 렌더링이
 * 빠지면 하루에 여러 편을 낼 수 있다. 카드뉴스는 인스타가 맡는다 —
 * 같은 큐 파일을 쓰되 images: 는 ig-post.mjs 만 본다.
 *
 * 기본이 드라이런인 이유: 컨테이너 생성까지 가면 토큰과 본문이 전부
 * 검증된다. 게시하지 않은 컨테이너는 그냥 만료되므로 밖으로 나가는
 * 영향이 0이다. 실제 게시는 --publish 를 명시해야만 일어난다.
 *
 * --due 는 한 번에 하나만 올린다. 30분마다 돌리면 큐 글의 at: 에 맞춰
 * 저절로 벌어진다 — 하루치를 한꺼번에 쏟으면 같은 타임라인에 연달아
 * 붙어서 사람도 알고리즘도 반복으로 본다.
 *
 * 본문에 링크를 달면 도달이 줄어든다. 그래서 링크·프로필 안내는 본문이
 * 아니라 첫 답글로 보낸다(frontmatter 의 reply). 본문은 내용만 담는다.
 *
 * 토큰 갱신도 여기서 한다. 장기 토큰은 24시간 이상 됐고 아직 안 죽었을 때만
 * 연장할 수 있고, 60일 방치하면 영영 못 살린다. 갱신을 별도 스케줄러로
 * 빼면 비밀값 쓰기 권한이 있는 인프라가 필요해지므로, 글 올릴 때 겸사
 * 갱신하는 쪽이 훨씬 단순하다 — 60일에 한 번만 올려도 스스로 유지된다.
 *
 * 문서: https://developers.facebook.com/docs/threads/posts
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readEnv, updateEnv, requireEnv } from "./env.mjs";
import {
  parsePost,
  resolveLink,
  textLength,
  parseArgs,
  isDue,
  findBodyLink,
  TEXT_WARN,
  TEXT_HARD,
} from "./parse.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const QUEUE_DIR = join(HERE, "queue");
const LEDGER = join(HERE, "posted.json");

const API = "https://graph.threads.net/v1.0";
/** 문서 권장: 컨테이너 생성 후 게시까지 평균 30초 대기. */
const PUBLISH_DELAY_MS = 30_000;
/** 답글은 본문보다 가볍다. 짧게 기다린다. */
const REPLY_DELAY_MS = 8_000;

const { publish: doPublish, file: pickFile, due: dueOnly, error: argError } = parseArgs(
  process.argv.slice(2),
);
if (argError) {
  console.error(`\n✖ ${argError}\n`);
  process.exit(1);
}

const env = readEnv();
// 앱 시크릿은 필요 없다 — 갱신 엔드포인트(th_refresh_token)는 액세스 토큰만
// 받는다. 시크릿은 OAuth 단기→장기 교환(threads-auth.mjs)에만 쓴다.
requireEnv(env, ["THREADS_ACCESS_TOKEN", "THREADS_USER_ID"]);

async function callJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${res.status} 응답이 JSON이 아님: ${text.slice(0, 300)}`);
  }
  if (!res.ok || body.error) {
    // Meta 는 message 만으로는 원인을 알기 어렵게 답할 때가 많다.
    // error 객체를 통째로 남겨야 무엇이 잘못됐는지 추적할 수 있다.
    const e = body.error ?? body;
    throw new Error(`${res.status} ${e.message ?? ""} ${JSON.stringify(e)}`);
  }
  return body;
}

/**
 * 낱장 컨테이너가 준비될 때까지 기다린다.
 *
 * 캐러셀로 묶기 전에 각 장이 FINISHED 여야 한다. 바로 되는 경우가
 * 대부분이지만 이미지를 막 배포한 직후에는 Threads 가 아직 받아오는 중일
 * 수 있고, 그때 묶으면 "Invalid parameter" 로 떨어진다.
 */
async function waitReady(id, token, tries = 10) {
  for (let i = 0; i < tries; i++) {
    const s = await callJson(
      `${API}/${id}?` +
        new URLSearchParams({ fields: "status,error_message", access_token: token }),
    );
    if (s.status === "FINISHED") return;
    if (s.status === "ERROR") {
      throw new Error(`컨테이너 ${id} 처리 실패: ${s.error_message ?? "(사유 없음)"}`);
    }
    await sleep(2000);
  }
  throw new Error(`컨테이너 ${id} 가 준비되지 않았습니다`);
}

const post = (path, params) =>
  callJson(`${API}/${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 토큰이 24시간 이상 됐으면 60일 더 연장하고 .env 에 다시 쓴다. */
async function refreshTokenIfDue(token) {
  const at = env.THREADS_TOKEN_REFRESHED_AT
    ? Date.parse(env.THREADS_TOKEN_REFRESHED_AT)
    : 0;
  const ageHours = (Date.now() - at) / 3_600_000;
  if (!(ageHours >= 24)) {
    console.log(`· 토큰 갱신 생략 (발급 ${ageHours.toFixed(1)}시간 전 — 24시간 필요)`);
    return token;
  }
  try {
    const r = await callJson(
      "https://graph.threads.net/refresh_access_token?" +
        new URLSearchParams({ grant_type: "th_refresh_token", access_token: token }),
    );
    updateEnv({
      THREADS_ACCESS_TOKEN: r.access_token,
      THREADS_TOKEN_REFRESHED_AT: new Date().toISOString(),
    });
    console.log(`· 토큰 갱신 ✓ (${Math.round((r.expires_in ?? 0) / 86400)}일 연장)`);
    return r.access_token;
  } catch (e) {
    // 갱신 실패가 곧 게시 실패는 아니다 — 토큰이 아직 살아 있으면 진행한다.
    console.warn(`· 토큰 갱신 실패 (계속 진행): ${e.message}`);
    return token;
  }
}

const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : [];
const posted = new Set(ledger.map((e) => e.file));

const queue = existsSync(QUEUE_DIR)
  ? readdirSync(QUEUE_DIR).filter((f) => f.endsWith(".md")).sort()
  : [];

/** 큐 글의 예약 시각(at: "09:00"). 없으면 null. */
function atOf(f) {
  const { meta } = parsePost(readFileSync(join(QUEUE_DIR, f), "utf8"));
  return meta.at ?? null;
}

/**
 * --due: 예약 시각이 지난 것 중 가장 이른 것 하나만 고른다.
 *
 * 한 번에 하나만 올리는 게 핵심이다 — 하루치를 한꺼번에 쏟으면 같은
 * 타임라인에 열 편이 연달아 붙어서 사람도 알고리즘도 반복으로 본다.
 * 30분마다 한 번씩 돌리면 예약한 시간대에 맞춰 저절로 벌어진다.
 */
let file;
if (pickFile) {
  file = pickFile;
} else if (dueOnly) {
  const now = new Date();
  file = queue.filter((f) => !posted.has(f) && isDue(atOf(f), now))[0];
  if (!file) {
    const waiting = queue.filter((f) => !posted.has(f) && atOf(f));
    console.log(
      waiting.length
        ? `\n아직 시각이 안 됐습니다. 대기 ${waiting.length}건 — 다음 ${waiting[0]} (at ${atOf(waiting[0])})\n`
        : "\n예약된 글이 없습니다. 큐 글에 at: 09:00 을 넣으세요.\n",
    );
    process.exit(0);
  }
} else {
  file = queue.find((f) => !posted.has(f));
}
if (!file) {
  console.log("\n큐에 올릴 글이 없습니다. social/queue/ 에 .md 를 추가하세요.\n");
  process.exit(0);
}
if (!existsSync(join(QUEUE_DIR, file))) {
  console.error(`\n✖ social/queue/${file} 이 없습니다.\n`);
  process.exit(1);
}
if (!pickFile && posted.has(file)) {
  console.log(`\n${file} 은 이미 게시됨.\n`);
  process.exit(0);
}

const { meta, text } = parsePost(readFileSync(join(QUEUE_DIR, file), "utf8"));
const linkAttachment = resolveLink(meta);
const reply = meta.reply ?? null;
const len = textLength(text);

if (!text) {
  console.error(`\n✖ ${file} 본문이 비었습니다.\n`);
  process.exit(1);
}

// 본문에 링크가 있으면 도달이 죽는다. 링크는 두 번째 스레드(reply)로만
// 나간다 — 한 번 올라가면 회수할 수 없으므로 여기서 멈춘다.
const stray = findBodyLink(text);
if (stray) {
  console.error(`\n✖ ${file} 본문에 링크가 있습니다: ${stray}`);
  console.error(`  Threads 는 본문 링크가 있으면 도달이 줄어듭니다.`);
  console.error(`  본문에서 빼고 frontmatter 의 reply: 로 옮기세요.\n`);
  process.exit(1);
}
if (linkAttachment) {
  console.error(`\n✖ ${file} 에 link: 가 있습니다 — 본문에 링크 카드가 붙습니다.`);
  console.error(`  링크는 두 번째 스레드부터입니다. reply: 로 옮기세요.\n`);
  process.exit(1);
}
if (len > TEXT_HARD) {
  console.error(`\n✖ 본문 ${len}자 — Threads 상한 ${TEXT_HARD}자를 넘습니다.\n`);
  process.exit(1);
}
if (len > TEXT_WARN) {
  console.warn(
    `⚠ 본문 ${len}자 — 상한(${TEXT_HARD}자)에 근접. 한글/이모지 계산 방식이 문서상 모호하니 거절되면 줄이세요.`,
  );
}
if (reply && textLength(reply) > TEXT_HARD) {
  console.error(`\n✖ 답글 ${textLength(reply)}자 — 상한 ${TEXT_HARD}자를 넘습니다.\n`);
  process.exit(1);
}

console.log(`\n▶ ${file}  (텍스트${meta.at ? ` · 예약 ${meta.at}` : ""})`);
console.log("─".repeat(56));
console.log(text);
console.log("─".repeat(56));
if (linkAttachment) console.log(`링크 카드: ${linkAttachment}`);
if (reply) console.log(`답글: ${reply}`);
console.log(`${len}자\n`);

const token = await refreshTokenIfDue(env.THREADS_ACCESS_TOKEN);
const userId = env.THREADS_USER_ID;

console.log("· 컨테이너 생성 중…");

const params = { media_type: "TEXT", text, access_token: token };
if (linkAttachment) params.link_attachment = linkAttachment;
const c = await post(`${userId}/threads`, params);
const containerId = c.id;
console.log(`· 컨테이너 ✓ id=${containerId}`);

if (!doPublish) {
  console.log("\n드라이런 종료 — 실제 게시하지 않았습니다. (컨테이너는 두면 만료됩니다)");
  console.log("실제로 올리려면 --publish 를 붙여 다시 실행하세요.\n");
} else {
  console.log(`· 게시 전 ${PUBLISH_DELAY_MS / 1000}초 대기 (문서 권장)…`);
  await sleep(PUBLISH_DELAY_MS);

  console.log("· 게시 중…");
  const published = await post(`${userId}/threads_publish`, {
    creation_id: containerId,
    access_token: token,
  });

  let permalink = null;
  try {
    const info = await callJson(
      `${API}/${published.id}?` +
        new URLSearchParams({ fields: "permalink", access_token: token }),
    );
    permalink = info.permalink ?? null;
  } catch {
    // permalink 조회 실패는 게시 성공에 영향이 없다.
  }

  // 링크·프로필 안내는 본문이 아니라 답글로 — 본문에 링크를 달면 도달이 준다.
  let replyId = null;
  if (reply) {
    console.log(`· 답글 준비 ${REPLY_DELAY_MS / 1000}초 대기…`);
    await sleep(REPLY_DELAY_MS);
    const rc = await post(`${userId}/threads`, {
      media_type: "TEXT",
      text: reply,
      reply_to_id: published.id,
      access_token: token,
    });
    const rp = await post(`${userId}/threads_publish`, {
      creation_id: rc.id,
      access_token: token,
    });
    replyId = rp.id;
    console.log(`· 답글 ✓ id=${replyId}`);
  }

  ledger.push({
    file,
    id: published.id,
    replyId,
    permalink,
    at: new Date().toISOString(),
  });
  writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n", "utf8");

  console.log(`\n✓ 게시 완료  id=${published.id}`);
  if (permalink) console.log(`  ${permalink}`);
  console.log("  기록 → social/posted.json\n");
}
