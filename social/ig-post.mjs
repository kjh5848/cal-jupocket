/**
 * Instagram 게시 — 큐에서 다음 카드 세트를 올린다.
 *
 *   node social/ig-post.mjs              드라이런: 컨테이너만 만들고 멈춤
 *   node social/ig-post.mjs --publish    실제 게시
 *   node social/ig-post.mjs --file 002-vat-january-deadline.md --publish
 *
 * 스레드와 같은 큐(social/queue)를 쓰되 기록은 따로 남긴다(ig-posted.json).
 * 같은 글을 두 플랫폼에 올리는 게 정상이므로 한쪽 기록으로 다른 쪽을
 * 막으면 안 된다.
 *
 * 인스타는 캡션의 URL 이 클릭되지 않는다. 그래서 링크를 본문에서 빼는
 * 스레드 전략이 여기서는 자동으로 성립하고, 대신 "프로필 링크에서 N번 글"
 * 안내(frontmatter 의 reply)를 캡션 끝에 붙인다.
 *
 * 이미지는 반드시 공개 URL 이어야 한다 — 인스타 서버가 직접 받아간다.
 * JPEG 만 받는다.
 *
 * 문서: https://developers.facebook.com/docs/instagram-platform/content-publishing
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readEnv, updateEnv, requireEnv } from "./env.mjs";
import {
  parsePost,
  resolveImage,
  resolveImages,
  parseArgs,
  CAROUSEL_MIN,
  CAROUSEL_MAX,
} from "./parse.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const QUEUE_DIR = join(HERE, "queue");
const LEDGER = join(HERE, "ig-posted.json");

const API = "https://graph.instagram.com/v23.0";
const PUBLISH_DELAY_MS = 20_000;
/** 인스타 캡션 상한. */
const CAPTION_HARD = 2200;

const { publish: doPublish, file: pickFile, error: argError } = parseArgs(
  process.argv.slice(2),
);
if (argError) {
  console.error(`\n✖ ${argError}\n`);
  process.exit(1);
}

const env = readEnv();
requireEnv(env, ["IG_ACCESS_TOKEN", "IG_USER_ID"]);

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
    const e = body.error ?? body;
    throw new Error(`${res.status} ${e.message ?? ""} ${JSON.stringify(e)}`);
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

/** 인스타 장기 토큰도 60일. 24시간 지나면 연장할 수 있다. */
async function refreshTokenIfDue(token) {
  const at = env.IG_TOKEN_REFRESHED_AT ? Date.parse(env.IG_TOKEN_REFRESHED_AT) : 0;
  const ageHours = (Date.now() - at) / 3_600_000;
  if (!(ageHours >= 24)) {
    console.log(`· 토큰 갱신 생략 (발급 ${ageHours.toFixed(1)}시간 전 — 24시간 필요)`);
    return token;
  }
  try {
    const r = await callJson(
      "https://graph.instagram.com/refresh_access_token?" +
        new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token }),
    );
    updateEnv({
      IG_ACCESS_TOKEN: r.access_token,
      IG_TOKEN_REFRESHED_AT: new Date().toISOString(),
    });
    console.log(`· 토큰 갱신 ✓ (${Math.round((r.expires_in ?? 0) / 86400)}일 연장)`);
    return r.access_token;
  } catch (e) {
    console.warn(`· 토큰 갱신 실패 (계속 진행): ${e.message}`);
    return token;
  }
}

/** 컨테이너가 FINISHED 될 때까지 기다린다. 인스타는 처리에 시간이 더 걸린다. */
async function waitReady(id, token, tries = 20) {
  for (let i = 0; i < tries; i++) {
    const s = await callJson(
      `${API}/${id}?` +
        new URLSearchParams({ fields: "status_code,status", access_token: token }),
    );
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") {
      throw new Error(`컨테이너 ${id} ${s.status_code}: ${s.status ?? ""}`);
    }
    await sleep(3000);
  }
  throw new Error(`컨테이너 ${id} 가 준비되지 않았습니다`);
}

async function assertJpeg(urls) {
  for (const u of urls) {
    const head = await fetch(u, { method: "HEAD" });
    if (!head.ok) {
      console.error(`\n✖ 이미지 접근 불가 (${head.status}): ${u}\n`);
      process.exit(1);
    }
    const type = head.headers.get("content-type") ?? "";
    if (!type.includes("jpeg")) {
      console.error(`\n✖ 인스타는 JPEG만 받습니다. ${u} 는 ${type}\n`);
      process.exit(1);
    }
  }
  console.log(`· 이미지 ${urls.length}장 확인 ✓ (JPEG)`);
}

const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : [];
const posted = new Set(ledger.map((e) => e.file));

const queue = existsSync(QUEUE_DIR)
  ? readdirSync(QUEUE_DIR).filter((f) => f.endsWith(".md")).sort()
  : [];

/** 인스타는 이미지가 있어야 올릴 수 있다 — 텍스트 전용 글은 건너뛴다. */
function hasImages(f) {
  const { meta } = parsePost(readFileSync(join(QUEUE_DIR, f), "utf8"));
  return resolveImages(meta).length > 0 || Boolean(meta.image);
}

const file = pickFile ?? queue.find((f) => !posted.has(f) && hasImages(f));
if (!file) {
  console.log("\n올릴 카드 세트가 없습니다. 큐 글에 images: 를 넣으세요.\n");
  process.exit(0);
}
if (!existsSync(join(QUEUE_DIR, file))) {
  console.error(`\n✖ social/queue/${file} 이 없습니다.\n`);
  process.exit(1);
}
if (!pickFile && posted.has(file)) {
  console.log(`\n${file} 은 이미 인스타에 게시됨.\n`);
  process.exit(0);
}

const { meta, text } = parsePost(readFileSync(join(QUEUE_DIR, file), "utf8"));
const images = resolveImages(meta);
const single = images.length === 0 ? resolveImage(meta.image) : null;

if (!images.length && !single) {
  console.error(`\n✖ ${file} 에 이미지가 없습니다. 인스타는 이미지가 필요합니다.\n`);
  process.exit(1);
}
if (images.length === 1) {
  console.error(`\n✖ 캐러셀은 ${CAROUSEL_MIN}장 이상이어야 합니다.\n`);
  process.exit(1);
}
if (images.length > CAROUSEL_MAX) {
  console.error(`\n✖ 캐러셀은 ${CAROUSEL_MAX}장까지입니다 (지금 ${images.length}장).\n`);
  process.exit(1);
}

// 캡션 = 본문 + 프로필 안내. 인스타는 캡션 URL 이 클릭되지 않으므로
// 링크를 본문에서 빼는 스레드 전략이 여기서는 자동으로 성립한다.
const caption = [text, meta.reply].filter(Boolean).join("\n\n");
if ([...caption].length > CAPTION_HARD) {
  console.error(`\n✖ 캡션 ${[...caption].length}자 — 상한 ${CAPTION_HARD}자를 넘습니다.\n`);
  process.exit(1);
}

console.log(`\n▶ ${file}  (${images.length ? `캐러셀 ${images.length}장` : "이미지"})`);
console.log("─".repeat(56));
console.log(caption);
console.log("─".repeat(56));
for (const u of images) console.log(`  ${u}`);
if (single) console.log(`  ${single}`);
console.log(`캡션 ${[...caption].length}자\n`);

const token = await refreshTokenIfDue(env.IG_ACCESS_TOKEN);
const igId = env.IG_USER_ID;

await assertJpeg(images.length ? images : [single]);

console.log("· 컨테이너 생성 중…");
let containerId;

if (images.length) {
  const children = [];
  for (const [i, url] of images.entries()) {
    const item = await post(`${igId}/media`, {
      image_url: url,
      is_carousel_item: "true",
      access_token: token,
    });
    await waitReady(item.id, token);
    children.push(item.id);
    console.log(`  · ${i + 1}/${images.length} ✓`);
  }
  const carousel = await post(`${igId}/media`, {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption,
    access_token: token,
  });
  containerId = carousel.id;
} else {
  const c = await post(`${igId}/media`, {
    image_url: single,
    caption,
    access_token: token,
  });
  containerId = c.id;
}
await waitReady(containerId, token);
console.log(`· 컨테이너 ✓ id=${containerId}`);

if (!doPublish) {
  console.log("\n드라이런 종료 — 실제 게시하지 않았습니다. (컨테이너는 두면 만료됩니다)");
  console.log("실제로 올리려면 --publish 를 붙여 다시 실행하세요.\n");
} else {
  console.log(`· 게시 전 ${PUBLISH_DELAY_MS / 1000}초 대기…`);
  await sleep(PUBLISH_DELAY_MS);

  console.log("· 게시 중…");
  const published = await post(`${igId}/media_publish`, {
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

  ledger.push({ file, id: published.id, permalink, at: new Date().toISOString() });
  writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n", "utf8");

  console.log(`\n✓ 게시 완료  id=${published.id}`);
  if (permalink) console.log(`  ${permalink}`);
  console.log("  기록 → social/ig-posted.json\n");
}
