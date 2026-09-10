// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

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

export default defineConfig({
  site: "https://jupocket.com",
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/oauth/") &&
        !ARTBOARD.test(page) &&
        !page.includes("/link/") &&
        !page.includes("/design/"),
    }),
  ],
});
