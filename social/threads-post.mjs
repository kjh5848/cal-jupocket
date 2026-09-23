/**
 * Threads 게시 — 큐에서 다음 글 하나를 올린다. 글만 올린다.
 *
 *   node social/threads-post.mjs              드라이런: 컨테이너만 만들고 멈춤
 *   node social/threads-post.mjs --publish    실제 게시
 *   node social/threads-post.mjs --due --publish   예약 시각이 된 것 하나
 *   node social/threads-post.mjs --file 003-….md --publish
 *
 * images: 가 있으면 이미지로, 없으면 텍스트로 나간다. 전에는 텍스트만
 * 올렸다 — 스레드 API 는 IMAGE·CAROUSEL 을 받는데 우리가 안 보냈고,
 * 이미 만들어 둔 카드가 인스타로만 나가고 있었다.
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
  resolveImages,
  textLength,
  parseArgs,
  isDue,
  findBodyLink,
  resolveReply,
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
/** 답글 재시도 간격. 갓 게시된 글은 잠깐 조회가 안 된다. */
const REPLY_RETRY_MS = [8_000, 20_000, 45_000];

const REPLY_DELAY_MS = 8_000;

const {
  publish: doPublish,
  file: pickFile,
  due: dueOnly,
  replyMissing,
  error: argError,
} = parseArgs(process.argv.slice(2));
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

/*
 * 스레드 이미지 규격 (developers.facebook.com/docs/threads/posts, 2026-09-23 확인)
 *
 *   형식     JPEG · PNG      (인스타는 JPEG 만 받는다 — 여기가 더 넓다)
 *   용량     8MB 이하
 *   가로     320~1440px      (우리 카드가 1080 이라 안쪽)
 *   비율     10:1 까지
 *   캐러셀   2~20장
 *
 * 인스타(ig-post.mjs)와 달리 PNG 도 되지만, 같은 카드를 양쪽에 쓰므로
 * 좁은 쪽(JPEG)에 맞춰 만든다. 여기서는 형식을 막지 않고 알리기만 한다.
 */
const CAROUSEL_MAX_ITEMS = 20;

/**
 * 게시 전에 이미지가 실제로 열리는지 본다.
 *
 * 메타 서버가 URL 을 가져가는 구조라, 배포가 안 끝났으면 404 를 받고
 * 그림 없이 나간다. 한 번 나가면 회수할 수 없어서 여기서 멈춘다 —
 * 제작 순서 9단계의 200 확인을 코드로 옮긴 것이다.
 */
async function assertImages(urls) {
  for (const u of urls) {
    let head;
    try {
      head = await fetch(u, { method: "HEAD" });
    } catch (e) {
      console.error(`\n✖ 이미지에 접근할 수 없습니다: ${u}\n  ${e.message}\n`);
      process.exit(1);
    }
    if (!head.ok) {
      console.error(
        `\n✖ 이미지 접근 불가 (${head.status}): ${u}\n` +
          `  배포가 끝났는지 확인하세요 — 메타 서버가 이 URL 을 직접 가져갑니다.\n`,
      );
      process.exit(1);
    }
    const type = head.headers.get("content-type") ?? "";
    if (!/jpeg|png/.test(type)) {
      console.error(`\n✖ 스레드는 JPEG·PNG 만 받습니다. ${u} 는 ${type}\n`);
      process.exit(1);
    }
    const size = Number(head.headers.get("content-length") ?? 0);
    if (size > 8 * 1024 * 1024) {
      console.error(`\n✖ 8MB 를 넘습니다 (${(size / 1048576).toFixed(1)}MB): ${u}\n`);
      process.exit(1);
    }
  }
  console.log(`· 이미지 ${urls.length}장 확인 ✓`);
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
 * --reply-missing: 본문은 나갔는데 답글이 안 붙은 글에 답글만 붙인다.
 *
 * 답글이 실패해도 본문 기록은 남기도록 바꾼 뒤로, 원장에 replyId 가 null
 * 인 줄이 생긴다. 그 줄들이 여기서 처리된다. 본문을 다시 올리지 않는다 —
 * 이미 나간 글에 링크 안내만 붙이는 것이다.
 */
if (replyMissing) {
  const pending = ledger.filter((e) => !e.replyId);
  if (!pending.length) {
    console.log("\n답글이 빠진 글이 없습니다.\n");
    process.exit(0);
  }
  const token = await refreshTokenIfDue(env.THREADS_ACCESS_TOKEN);
  const userId = env.THREADS_USER_ID;
  const save = () =>
    writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n", "utf8");

  console.log(`\n답글이 빠진 글 ${pending.length}건\n`);
  for (const e of pending) {
    const path = join(QUEUE_DIR, e.file);
    if (!existsSync(path)) {
      console.log(`· ${e.file} — 큐 파일이 없습니다. 건너뜁니다.`);
      continue;
    }
    const { meta } = parsePost(readFileSync(path, "utf8"));
    const replyText = resolveReply(meta, { platform: "threads", file: e.file });
    if (!replyText) {
      console.log(`· ${e.file} — reply: 가 없습니다. 건너뜁니다.`);
      continue;
    }
    console.log(`· ${e.file} → ${e.id}`);
    if (!doPublish) {
      console.log(`    (드라이런) ${replyText}`);
      continue;
    }
    try {
      const rc = await post(`${userId}/threads`, {
        media_type: "TEXT",
        text: replyText,
        reply_to_id: e.id,
        access_token: token,
      });
      await waitReady(rc.id, token);
      const rp = await post(`${userId}/threads_publish`, {
        creation_id: rc.id,
        access_token: token,
      });
      e.replyId = rp.id;
      save();
      console.log(`    ✓ ${rp.id}`);
    } catch (err) {
      console.log(`    ✖ ${err.message}`);
    }
  }
  console.log(
    doPublish
      ? "\n끝났습니다.\n"
      : "\n드라이런입니다. 실제로 붙이려면 --publish 를 붙이세요.\n",
  );
  process.exit(0);
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
const images = resolveImages(meta);
const linkAttachment = resolveLink(meta);
const reply = resolveReply(meta, { platform: "threads", file });
const len = textLength(text);

if (!text) {
  console.error(`\n✖ ${file} 본문이 비었습니다.\n`);
  process.exit(1);
}

/*
 * 본문 링크 — 기본은 거부, 글 단위로만 연다.
 *
 * "본문에 링크가 있으면 도달이 죽는다"는 업계 통설이고 우리가 잰 적이 없다.
 * 메타 쪽 입장도 바뀌었다(Mosseri, 2025-06: "links have been working much
 * better"). 그래서 시험해 볼 값어치가 있는데, **검사 자체를 빼면 안 된다** —
 * 이 가드는 실수로 들어간 링크도 잡고, 실험하려고 뺀 검사는 영영 안 돌아온다.
 *
 * 그래서 옵트인으로 만든다. frontmatter 에 `allow_body_link: true` 를 적은
 * 글만 통과하고, 나머지는 전과 똑같이 거부한다. npm run queue 가 켜 둔 글을
 * 따로 표시한다.
 *
 * 왜 이걸 재는가: 답글 조회가 본문의 1.7% 뿐이다(2026-09-22 측정).
 * 링크를 본 사람의 6.8% 가 누르는데 그 "본 사람"이 너무 적다.
 * 자세한 설계는 docs/threads-findings.md 6절.
 */
const stray = findBodyLink(text);
const bodyLinkAllowed = String(meta.allow_body_link ?? "").toLowerCase() === "true";
if (stray && !bodyLinkAllowed) {
  console.error(`\n✖ ${file} 본문에 링크가 있습니다: ${stray}`);
  console.error(`  Threads 는 본문 링크가 있으면 도달이 줄어든다고 알려져 있습니다.`);
  console.error(`  본문에서 빼고 frontmatter 의 reply: 로 옮기세요.`);
  console.error(`  일부러 시험하는 글이면 frontmatter 에 allow_body_link: true 를 적으세요.\n`);
  process.exit(1);
}
if (stray && bodyLinkAllowed) {
  console.log(`⚠ ${file} — 본문 링크를 일부러 켠 글입니다 (allow_body_link): ${stray}`);
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

/*
 * 컨테이너를 만든다 — 이미지 수에 따라 세 갈래다.
 *
 *   0장   TEXT
 *   1장   IMAGE   (text 를 같이 보낼 수 있다)
 *   2~20  CAROUSEL — 낱장을 is_carousel_item 으로 먼저 만들고 묶는다
 *
 * link_attachment 는 텍스트 글에만 붙는다. 이미지가 있으면 parse.mjs 의
 * resolveLink 가 이미 null 로 만든다 — 둘 다 보내면 API 가 거절한다.
 */
let containerId;

if (images.length > CAROUSEL_MAX_ITEMS) {
  console.error(
    `\n✖ 캐러셀은 ${CAROUSEL_MAX_ITEMS}장까지입니다. ${file} 은 ${images.length}장입니다.\n`,
  );
  process.exit(1);
}

if (images.length === 0) {
  const params = { media_type: "TEXT", text, access_token: token };
  if (linkAttachment) params.link_attachment = linkAttachment;
  const c = await post(`${userId}/threads`, params);
  containerId = c.id;
} else if (images.length === 1) {
  await assertImages(images);
  const c = await post(`${userId}/threads`, {
    media_type: "IMAGE",
    image_url: images[0],
    text,
    access_token: token,
  });
  containerId = c.id;
} else {
  await assertImages(images);
  const children = [];
  for (const [i, url] of images.entries()) {
    const item = await post(`${userId}/threads`, {
      media_type: "IMAGE",
      image_url: url,
      is_carousel_item: "true",
      access_token: token,
    });
    await waitReady(item.id, token);
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
}

const kind =
  images.length === 0 ? "텍스트" : images.length === 1 ? "이미지" : `캐러셀 ${images.length}장`;
console.log(`· 컨테이너 ✓ id=${containerId} (${kind})`);

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

  // ── 원장을 여기서 쓴다. 답글보다 먼저다. ──────────────────
  //
  // 예전에는 답글까지 끝난 뒤에 썼는데, 답글이 실패하면 프로세스가 죽으면서
  // 원장이 비었다. 그러면 30분 뒤 스케줄러가 "아직 안 올렸다"고 보고 본문을
  // 또 올린다. 실제로 같은 글이 2~3번 나갔다.
  //
  // 본문이 나간 것은 되돌릴 수 없다. 되돌릴 수 없는 일이 끝났으면 그
  // 사실부터 적는다. 답글은 실패해도 나중에 다시 붙일 수 있다.
  const entry = {
    file,
    id: published.id,
    replyId: null,
    permalink: null,
    at: new Date().toISOString(),
  };
  ledger.push(entry);
  const save = () =>
    writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n", "utf8");
  save();

  console.log(`\n✓ 게시 완료  id=${published.id}  (원장 기록됨)`);

  try {
    const info = await callJson(
      `${API}/${published.id}?` +
        new URLSearchParams({ fields: "permalink", access_token: token }),
    );
    entry.permalink = info.permalink ?? null;
    save();
  } catch {
    // permalink 조회 실패는 게시 성공에 영향이 없다.
  }

  // 링크·프로필 안내는 본문이 아니라 답글로 — 본문에 링크를 달면 도달이 준다.
  //
  // 갓 게시된 글은 잠깐 조회가 안 된다("미디어를 찾을 수 없음"). 8초로는
  // 부족할 때가 있어 간격을 늘려 가며 다시 시도한다.
  if (reply) {
    for (const wait of REPLY_RETRY_MS) {
      console.log(`· 답글 준비 ${wait / 1000}초 대기…`);
      await sleep(wait);
      try {
        const rc = await post(`${userId}/threads`, {
          media_type: "TEXT",
          text: reply,
          reply_to_id: published.id,
          access_token: token,
        });
        // 본문은 컨테이너를 만들고 30초를 기다린 뒤에 게시한다. 답글도
        // 같은 컨테이너 API 를 쓰는데 여기만 곧바로 게시하고 있었다.
        // 그래서 "미디어를 찾을 수 없음" 이 났다 — 답글 문제가 아니라
        // 기다리지 않은 문제다.
        //
        // 눈감고 30초 세는 대신 상태를 물어본다. waitReady 는 캐러셀을
        // 걷어내면서 쓰이지 않게 된 함수인데, 정확히 이 일을 한다.
        console.log("· 답글 컨테이너 준비 대기…");
        await waitReady(rc.id, token);
        const rp = await post(`${userId}/threads_publish`, {
          creation_id: rc.id,
          access_token: token,
        });
        entry.replyId = rp.id;
        save();
        console.log(`· 답글 ✓ id=${entry.replyId}`);
        break;
      } catch (err) {
        console.log(`· 답글 실패 — ${err.message}`);
      }
    }
    if (!entry.replyId) {
      // 여기서 죽으면 안 된다. 본문은 이미 나갔고 원장에도 적혔다.
      // 죽으면 .cmd 의 다음 줄(인스타)까지 못 돈다.
      console.log(
        "\n⚠ 답글을 붙이지 못했습니다. 본문은 정상이고 원장에도 적혔습니다." +
          "\n  나중에 `npm run social:reply -- --publish` 로 붙입니다.",
      );
    }
  }

  if (entry.permalink) console.log(`  ${entry.permalink}`);
  console.log("  기록 → social/posted.json\n");
}
