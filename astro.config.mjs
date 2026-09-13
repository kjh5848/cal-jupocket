// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * 사이트맵에서 뺄 경로.
 *
 *  /oauth/*              Threads 인증 코드를 받는 일회성 유틸리티
 *  /cards/<set>/<n>/     스크린샷을 뜨려고 만든 낱장 아트보드
 *  /link/                인스타 바이오 착지용 (홈과 경쟁시킬 이유가 없다)
 *  /design/              내부 토큰 참조
 *
 * /cards/ 갤러리와 /cards/<set>/ 은 공개한다 — 실제로 발행한 카드를
 * 보여주는 콘텐츠다. 페이지 자체에도 noindex 를 걸어 이중으로 막는다.
 */
const ARTBOARD = /\/cards\/[^/]+\/\d+\//;

/**
 * 글마다의 lastmod.
 *
 * 크롤러는 lastmod 로 다시 올지를 정한다. 없으면 전부 같은 취급이라
 * 방금 고친 글이 묻힌다.
 *
 * 날짜를 새로 만들지 않는다 — 각 글이 GuideLayout 에 넘기는 updated 가
 * 원문 확인일이고, 그게 이 사이트에서 유일하게 정직한 날짜다. 빌드할 때
 * 그 값을 그대로 읽는다. 따로 적어두면 반드시 한쪽이 낡는다.
 *
 * 날짜가 없는 페이지(계산기·홈·카드뉴스)는 lastmod 를 비운다. 모르는 걸
 * 오늘로 채우면 배포할 때마다 전부 "오늘 바뀜"이 되어 신호가 죽는다.
 */
function guideDates() {
  const dir = join(process.cwd(), "src", "pages", "guide");
  /** @type {Record<string, string>} */
  const out = {};
  if (!existsSync(dir)) return out;
  for (const slug of readdirSync(dir)) {
    const file = join(dir, slug, "index.astro");
    if (!existsSync(file)) continue;
    const m = readFileSync(file, "utf8").match(/updated="(\d{4}-\d{2}-\d{2})"/);
    if (m) out[`/guide/${slug}/`] = m[1];
  }
  return out;
}

const DATES = guideDates();

export default defineConfig({
  site: "https://jupocket.com",
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/oauth/") &&
        !ARTBOARD.test(page) &&
        !page.includes("/link/") &&
        !page.includes("/design/"),
      serialize(item) {
        const date = DATES[new URL(item.url).pathname];
        if (date) item.lastmod = new Date(`${date}T00:00:00Z`).toISOString();
        return item;
      },
    }),
  ],
});
