/**
 * Threads 게시 — 큐에서 다음 글 하나를 올린다.
 *
 *   node social/threads-post.mjs              드라이런: 컨테이너만 만들고 멈춤
 *   node social/threads-post.mjs --publish    실제 게시
 *   node social/threads-post.mjs --file 002-vat-january-deadline.md --publish
 *
 * 기본이 드라이런인 이유: 컨테이너 생성까지 가면 토큰·본문·이미지 URL이
 * 전부 검증된다. 게시하지 않은 컨테이너는 그냥 만료되므로 밖으로 나가는
 * 영향이 0이다. 실제 게시는 --publish 를 명시해야만 일어난다.
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
  resolveImage,
  resolveImages,
  resolveLink,
  textLength,
  parseArgs,
  TEXT_WARN,
  TEXT_HARD,
  CAROUSEL_MIN,
  CAROUSEL_MAX,
} from "./parse.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const QUEUE_DIR = join(HERE, "queue");
const LEDGER = join(HERE, "posted.json");

const API = "https://graph.threads.net/v1.0";
/** 문서 권장: 컨테이너 생성 후 게시까지 평균 30초 대기. */
const PUBLISH_DELAY_MS = 30_000;
/** 답글은 본문보다 가볍다. 짧게 기다린다. */
const REPLY_DELAY_MS = 8_000;

const { publish: doPublish, file: pickFile, error: argError } = parseArgs(
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
    throw new Error(`${res.status} ${body.error?.message ?? JSON.stringify(body)}`);
  }
  return body;
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

/** 이미지가 실제로 공개돼 있는지 먼저 본다 — Threads 가 못 받아오면 실패한다. */
async function assertReachable(urls) {
  for (const u of urls) {
    const head = await fetch(u, { method: "HEAD" });
    if (!head.ok) {
      console.error(`\n✖ 이미지 접근 불가 (${head.status}): ${u}\n`);
      process.exit(1);
    }
  }
  console.log(`· 이미지 ${urls.length}장 확인 ✓`);
}

const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : [];
const posted = new Set(ledger.map((e) => e.file));

const queue = existsSync(QUEUE_DIR)
  ? readdirSync(QUEUE_DIR).filter((f) => f.endsWith(".md")).sort()
  : [];

const file = pickFile ?? queue.find((f) => !posted.has(f));
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
const images = resolveImages(meta);
const single = images.length === 0 ? resolveImage(meta.image) : null;
const linkAttachment = resolveLink(meta);
const reply = meta.reply ?? null;
const len = textLength(text);

if (!text) {
  console.error(`\n✖ ${file} 본문이 비었습니다.\n`);
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
if (images.length === 1) {
  console.error(
    `\n✖ 캐러셀은 ${CAROUSEL_MIN}장 이상이어야 합니다. 한 장이면 image: 로 쓰세요.\n`,
  );
  process.exit(1);
}
if (images.length > CAROUSEL_MAX) {
  console.error(`\n✖ 캐러셀은 ${CAROUSEL_MAX}장까지입니다 (지금 ${images.length}장).\n`);
  process.exit(1);
}
if (reply && textLength(reply) > TEXT_HARD) {
  console.error(`\n✖ 답글 ${textLength(reply)}자 — 상한 ${TEXT_HARD}자를 넘습니다.\n`);
  process.exit(1);
}

const kind = images.length ? `캐러셀 ${images.length}장` : single ? "이미지" : "텍스트";
console.log(`\n▶ ${file}  (${kind})`);
console.log("─".repeat(56));
console.log(text);
console.log("─".repeat(56));
for (const u of images) console.log(`  이미지: ${u}`);
if (single) console.log(`이미지: ${single}`);
if (linkAttachment) console.log(`링크 카드: ${linkAttachment}`);
if (reply) console.log(`답글: ${reply}`);
console.log(`${len}자\n`);

const token = await refreshTokenIfDue(env.THREADS_ACCESS_TOKEN);
const userId = env.THREADS_USER_ID;

if (images.length) await assertReachable(images);
else if (single) await assertReachable([single]);

console.log("· 컨테이너 생성 중…");
let containerId;

if (images.length) {
  // 캐러셀: 낱장 컨테이너를 먼저 만들고, 그 id 들을 children 으로 묶는다.
  const children = [];
  for (const [i, url] of images.entries()) {
    const item = await post(`${userId}/threads`, {
      media_type: "IMAGE",
      image_url: url,
      is_carousel_item: "true",
      access_token: token,
    });
    children.push(item.id);
    console.log(`  · ${i + 1}/${images.length} ✓`);
  }
  const carousel = await post(`${userId}/threads`, {
    media_type: "CAROUSEL",
    children: children.join(","),
    text,
    access_token: token,
  });
  containerId = carousel.id;
} else {
  const params = {
    media_type: single ? "IMAGE" : "TEXT",
    text,
    access_token: token,
  };
  if (single) params.image_url = single;
  if (linkAttachment) params.link_attachment = linkAttachment;
  const c = await post(`${userId}/threads`, params);
  containerId = c.id;
}
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
