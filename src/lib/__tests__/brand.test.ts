/**
 * 리브랜딩 Task 1 — 메뉴 '도구', 홈 제목·h1, 3D 주머니 로고(파비콘 포함).
 * 설계: docs/superpowers/specs/2026-10-16-jupocket-pocket-rebrand-design.md 11절.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf-8");

describe("브랜드", () => {
  it("상단 메뉴는 도구 · 읽을거리 · 카드뉴스", () => {
    const s = read("src/components/SiteHeader.astro");
    expect(s).toContain('label: "도구"');
    expect(s).not.toContain('label: "계산기"');
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
});
