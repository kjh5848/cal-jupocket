import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { guideMeta } from "../guide-meta";

/**
 * RSS — 네이버 서치어드바이저에 제출한 피드.
 *
 * 사이트맵 lastmod 와 같은 원칙이다. 날짜의 출처는 글이 들고 있는 원문
 * 확인일이고, 빌드 날짜로 채우지 않는다.
 */
const meta = guideMeta();
const slugs = readdirSync(join(process.cwd(), "src/pages/guide")).filter((s) =>
  existsSync(join(process.cwd(), "src/pages/guide", s, "index.astro")),
);

describe("guideMeta", () => {
  it("가이드 글을 하나도 빠뜨리지 않는다", () => {
    expect(meta.map((m) => m.slug).sort()).toEqual([...slugs].sort());
  });

  it("모든 글의 확인일을 읽는다", () => {
    expect(meta.filter((m) => !m.updated).map((m) => m.slug)).toEqual([]);
  });

  it("최근 확인일이 앞에 온다", () => {
    const dates = meta.map((m) => m.updated ?? "");
    expect(dates).toEqual([...dates].sort().reverse());
  });
});

const FEED = join(process.cwd(), "dist/rss.xml");
const built = existsSync(FEED);
const xml = built ? readFileSync(FEED, "utf-8") : "";

describe.skipIf(!built)("rss.xml", () => {
  it("가이드 글 수만큼 item 이 있다", () => {
    expect((xml.match(/<item>/g) ?? []).length).toBe(slugs.length);
  });

  it("링크가 전부 절대 주소이고 사이트맵에 있는 주소다", () => {
    const links = [...xml.matchAll(/<link>(https:\/\/jupocket\.com\/guide\/[^<]+)<\/link>/g)].map((m) => m[1]);
    expect(links.length).toBe(slugs.length);
    const sm = readFileSync(join(process.cwd(), "dist/sitemap-0.xml"), "utf-8");
    expect(links.filter((l) => !sm.includes(`<loc>${l}</loc>`))).toEqual([]);
  });

  it("pubDate 가 빌드 날짜가 아니라 글의 확인일이다", () => {
    const first = meta[0];
    const want = new Date(`${first.updated}T00:00:00+09:00`).toUTCString();
    expect(xml).toContain(`<pubDate>${want}</pubDate>`);
  });

  it("XML 특수문자가 이스케이프돼 있다", () => {
    // 제목·설명에 & < > 가 들어가도 피드가 깨지지 않아야 한다.
    const items = xml.split("<item>").slice(1).map((x) => x.split("</item>")[0]);
    for (const it of items) {
      const inner = it.replace(/<\/?(title|link|guid|description|pubDate)[^>]*>/g, "");
      expect(inner, it.slice(0, 80)).not.toMatch(/<|&(?!amp;|lt;|gt;|quot;)/);
    }
  });
});
