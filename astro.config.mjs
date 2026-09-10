// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
export default defineConfig({
  site: "https://jupocket.com",
  integrations: [
    sitemap({
      // /oauth/* 는 Threads 인증 코드를 받는 일회성 유틸리티 페이지,
      // /cards/* 는 스크린샷을 뜨기 위한 아트보드다. 둘 다 검색 결과에
      // 나올 이유가 없으므로 사이트맵에서 제외한다.
      // (페이지 자체에도 noindex가 걸려 있다 — 이중 방어)
      filter: (page) => !page.includes("/oauth/") && !page.includes("/cards/"),
    }),
  ],
});
