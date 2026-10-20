/**
 * 리브랜딩 Task 1 — 메뉴 '도구', 홈 제목·h1, 3D 주머니 로고(파비콘 포함).
 * 설계: docs/superpowers/specs/2026-10-16-jupocket-pocket-rebrand-design.md 11절.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf-8");

describe("브랜드", () => {
  it("상단 메뉴는 도구 · 읽을거리 · 카드뉴스", () => {
    // 메뉴 말은 언어 사전(src/i18n/ui.ts)에 있다 — 일본어판과 같은 틀을 쓰려고 옮겼다(2026-10-19)
    const s = read("src/components/SiteHeader.astro");
    const dict = read("src/i18n/ui.ts");
    expect(dict).toContain('navTools: "도구"');
    expect(dict).not.toContain('"계산기"');
    expect(s).toContain("label: T.navTools");
    expect(s).toContain("BrandPocket");
  });
  it("홈 title·h1", () => {
    const s = read("src/pages/index.astro");
    expect(s).toContain('const title = "주포켓 — 세금·급여부터 날짜·사진까지, 필요한 도구 모음";');
    expect(s).toMatch(/<span class="hero-brand">주포켓<\/span> 뭐가 필요하세요\?/);
  });
  it("파비콘은 3D 주머니(bp- 그라데이션)", () => {
    expect(read("public/favicon.svg")).toMatch(/id="bp-base"/);
  });
  it("홈 구조화 데이터 — 발행 주체 로고는 3D 주머니 PNG 512, 설명은 도구 모음 문구(Task 9)", () => {
    // Organization 은 src/data/org.ts 한 곳(2026-10-20 GEO — 홈·글·소개가 같은 @id 를 쓴다)
    const s = read("src/pages/index.astro");
    const org = read("src/data/org.ts");
    expect(s).toContain("organization(siteUrl)");
    expect(org).toContain("`${siteUrl}/#org`");
    expect(org).toContain("logo: `${siteUrl}/icon-512.png`");
    const desc = s.match(/const description =\s*"([^"]+)";/)?.[1] ?? "";
    expect(desc).toContain("도구");
    const png = readFileSync("public/icon-512.png");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([512, 512]);
  });
  it("카드뉴스 표지·CTA 로고는 3D 주머니(₩ 글자 아님)", () => {
    const s = read("src/components/CardArtboard.astro");
    expect(s).toContain('import BrandPocket from "./BrandPocket.astro"');
    expect(s).toMatch(/class="cover-brand">\s*<BrandPocket/);
    expect(s).toMatch(/class="cta-mark">\s*<BrandPocket/);
    expect(s).not.toContain('<div class="mark">₩</div>');
  });
});
