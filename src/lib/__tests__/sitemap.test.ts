import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * 사이트맵 — lastmod 가 붙어야 할 곳에 붙었는지.
 *
 * 2026-10-06 에 발견한 구멍이다. `astro.config.mjs` 의 `guideDates()` 가
 * `updated="2026-08-21"` 리터럴만 읽고 `updated={r.verifiedOn}` 식은
 * 못 읽었다. 새로 쓴 글이 전부 식 쪽이라 **64개 중 50개에 lastmod 가
 * 없었다** — 날짜가 제일 필요한 글에만 날짜가 없었다.
 *
 * 크롤러는 lastmod 로 다시 올지를 정하므로, 이건 조용히 새 글만 손해를
 * 보는 종류의 버그다. 빌드 산출물에서 직접 센다.
 */
const SITEMAP = join(process.cwd(), "dist/sitemap-0.xml");
const built = existsSync(SITEMAP);
const xml = built ? readFileSync(SITEMAP, "utf-8") : "";

type Entry = { loc: string; lastmod: string | null };
const entries: Entry[] = [
  ...xml.matchAll(/<url><loc>(.*?)<\/loc>(?:<lastmod>(.*?)<\/lastmod>)?/g),
].map((m) => ({ loc: m[1], lastmod: m[2] ?? null }));

const guideSlugs = (() => {
  const dir = join(process.cwd(), "src/pages/guide");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((s) => existsSync(join(dir, s, "index.astro")));
})();

describe.skipIf(!built)("사이트맵", () => {
  it("가이드 글이 빠짐없이 들어 있다", () => {
    const inMap = new Set(entries.map((e) => e.loc));
    const missing = guideSlugs.filter((s) => !inMap.has(`https://jupocket.com/guide/${s}/`));
    expect(missing).toEqual([]);
  });

  it("모든 가이드 글에 lastmod 가 있다", () => {
    // 하나라도 비면 guideDates() 가 그 글의 updated 형태를 못 읽은 것이다.
    const naked = entries
      .filter((e) => e.loc.includes("/guide/") && !e.lastmod)
      .map((e) => e.loc.replace("https://jupocket.com", ""));
    expect(naked).toEqual([]);
  });

  it("lastmod 가 글의 updated(원문 확인일)와 같다", () => {
    // 빌드 때 오늘 날짜로 채우면 배포할 때마다 전부 '오늘 바뀜'이 되어
    // 신호가 죽는다. 날짜의 출처는 언제나 글이 들고 있는 확인일이다.
    const dir = join(process.cwd(), "src/pages/guide");
    const wrong: string[] = [];
    for (const slug of guideSlugs) {
      const src = readFileSync(join(dir, slug, "index.astro"), "utf-8");
      let want = src.match(/updated="(\d{4}-\d{2}-\d{2})"/)?.[1];
      if (!want) {
        const ident = src.match(/updated=\{(\w+)\.verifiedOn\}/)?.[1];
        const rel = ident
          ? src.match(new RegExp(`import\\s+${ident}\\s+from\\s+["']([^"']+\\.json)["']`))?.[1]
          : undefined;
        if (rel) want = JSON.parse(readFileSync(join(dir, slug, rel), "utf-8")).verifiedOn;
      }
      if (!want) continue;
      const got = entries.find((e) => e.loc === `https://jupocket.com/guide/${slug}/`)?.lastmod;
      if (got?.slice(0, 10) !== want) wrong.push(`${slug}: 사이트맵 ${got} ≠ 글 ${want}`);
    }
    expect(wrong).toEqual([]);
  });

  it("robots 로 막은 경로가 사이트맵에 없다", () => {
    const blocked = entries.filter((e) => /\/(oauth|design|link)\//.test(e.loc));
    expect(blocked.map((e) => e.loc)).toEqual([]);
  });

  it("낱장 아트보드가 사이트맵에 없다", () => {
    const boards = entries.filter((e) => /\/cards\/[^/]+\/\d+\//.test(e.loc));
    expect(boards.map((e) => e.loc)).toEqual([]);
  });
});
