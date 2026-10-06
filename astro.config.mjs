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
 *
 * **처음에 리터럴만 읽었다.** `updated="2026-08-21"` 은 잡고
 * `updated={r.verifiedOn}` 은 못 잡았는데, 새로 쓴 글이 전부 뒤쪽이라
 * 사이트맵 64개 중 50개에 lastmod 가 없었다(2026-10-06 확인). 날짜를
 * 제일 필요로 하는 글에만 날짜가 없었던 셈이다. 그래서 식일 때는 import
 * 를 따라가 그 rates JSON 의 verifiedOn 을 읽는다.
 */
function guideDates() {
  const dir = join(process.cwd(), "src", "pages", "guide");
  /** @type {Record<string, string>} */
  const out = {};
  if (!existsSync(dir)) return out;
  for (const slug of readdirSync(dir)) {
    const file = join(dir, slug, "index.astro");
    if (!existsSync(file)) continue;
    const src = readFileSync(file, "utf8");

    // 리터럴: updated="2026-08-21"
    const lit = src.match(/updated="(\d{4}-\d{2}-\d{2})"/);
    if (lit) {
      out[`/guide/${slug}/`] = lit[1];
      continue;
    }

    // 식: updated={r.verifiedOn} — import 를 따라가 그 JSON 의 verifiedOn 을 읽는다.
    const expr = src.match(/updated=\{(\w+)\.verifiedOn\}/);
    if (!expr) continue;
    // 템플릿 리터럴 안이라 역슬래시를 두 번 쓴다. `\s` 는 그냥 s 가 된다.
    const imp = src.match(
      new RegExp(`import\\s+${expr[1]}\\s+from\\s+["']([^"']+\\.json)["']`),
    );
    if (!imp) continue;
    const json = join(dir, slug, imp[1]);
    if (!existsSync(json)) continue;
    const { verifiedOn } = JSON.parse(readFileSync(json, "utf8"));
    if (/^\d{4}-\d{2}-\d{2}$/.test(verifiedOn ?? "")) out[`/guide/${slug}/`] = verifiedOn;
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
