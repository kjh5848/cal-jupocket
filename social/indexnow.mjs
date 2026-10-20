/**
 * IndexNow — 새로 생긴·바뀐 주소를 Bing·네이버 등에 바로 알린다.
 *
 *   node social/indexnow.mjs              라이브 사이트맵에서 아직 안 알린 주소만 보낸다
 *   node social/indexnow.mjs --all        사이트맵 전체를 다시 보낸다(처음 한 번)
 *   node social/indexnow.mjs <url> …      그 주소만 보낸다(고친 글)
 *
 * 구글 색인이 밀려 있어도 ChatGPT 검색(Bing 색인)·네이버는 이 길로 먼저 들어간다(2026-10-20).
 * api.indexnow.org 에 한 번 보내면 참여 검색엔진(Bing·네이버·Yandex 등)이 같이 받는다.
 *
 * 키는 비밀이 아니다 — 사이트에 공개된 public/<키>.txt 가 소유 증명이다. 보낸 목록은
 * social/indexnow-sent.json 에 남는다(커밋하지 않는다 — social/*.json 규칙).
 * 배포가 끝난 뒤(라이브 200 확인 뒤) 부른다. 배포 전에 보내면 404 를 알리게 된다.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const INDEXNOW_KEY = "9182d004f2df5f48272c4dc9e0bec6f4";
const HOST = "jupocket.com";
const SITE = `https://${HOST}`;
const HERE = dirname(fileURLToPath(import.meta.url));
const SENT = join(HERE, "indexnow-sent.json");

async function locs(url) {
  const xml = await (await fetch(url)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function sitemapUrls() {
  const out = [];
  for (const u of await locs(`${SITE}/sitemap-index.xml`)) out.push(...(u.endsWith(".xml") ? await locs(u) : [u]));
  return out;
}

async function submit(urlList) {
  for (let i = 0; i < urlList.length; i += 10000) {
    const chunk = urlList.slice(i, i + 10000);
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: chunk }),
    });
    // 200 받음 · 202 받음(키 확인 대기) · 400 형식 오류 · 403 키 불일치 · 422 호스트 불일치 · 429 너무 잦음
    console.log(`IndexNow ${res.status} — ${chunk.length}개`);
    if (res.status >= 300) {
      console.error(await res.text().catch(() => ""));
      process.exit(1);
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const sent = new Set(existsSync(SENT) ? JSON.parse(readFileSync(SENT, "utf8")).urls : []);
  let list;
  if (args.some((a) => a.startsWith("http"))) list = args.filter((a) => a.startsWith("http"));
  else {
    const all = await sitemapUrls();
    list = args.includes("--all") ? all : all.filter((u) => !sent.has(u));
  }
  list = list.filter((u) => u.startsWith(SITE));
  if (!list.length) {
    console.log("알릴 새 주소 없음");
    process.exit(0);
  }
  await submit(list);
  for (const u of list) sent.add(u);
  writeFileSync(SENT, JSON.stringify({ at: new Date().toISOString(), urls: [...sent] }, null, 2));
}
