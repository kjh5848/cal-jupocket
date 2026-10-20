/**
 * GEO·AEO 기초(2026-10-20) — AI 답변·검색엔진이 "누가 어떤 근거로 쓴 숫자인가"를 기계로 읽게 한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error — node 스크립트(.mjs)
import { INDEXNOW_KEY } from "../../../social/indexnow.mjs";
import { organization, ORG_ID } from "../../data/org";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("운영자·검증 원칙", () => {
  it("Organization 은 한 @id, 검증 원칙(/about/)과 계정을 가리킨다", () => {
    const o = organization("https://jupocket.com");
    expect(o["@id"]).toBe(ORG_ID("https://jupocket.com"));
    expect(o.publishingPrinciples).toBe("https://jupocket.com/about/");
    expect(o.sameAs.length).toBeGreaterThan(0);
    expect(existsSync(join(root, "src/pages/about.astro"))).toBe(true);
  });
  it("홈과 글이 같은 Organization 을 쓴다(이름을 따로 적지 않는다)", () => {
    expect(read("src/pages/index.astro")).toContain("organization(siteUrl)");
    expect(read("src/layouts/GuideLayout.astro")).toContain("ORG_ID(siteUrl)");
  });
  it("푸터에서 소개로 갈 수 있다", () => {
    expect(read("src/components/SiteFooter.astro")).toContain('href="/about/"');
  });
});

describe("IndexNow", () => {
  it("공개 키 파일이 스크립트의 키와 같다(소유 증명)", () => {
    expect(INDEXNOW_KEY).toMatch(/^[0-9a-f]{32}$/);
    expect(read(`public/${INDEXNOW_KEY}.txt`)).toBe(INDEXNOW_KEY);
  });
});

describe("llms.txt", () => {
  it("엔드포인트가 있고 검증 원칙을 가리킨다", () => {
    const s = read("src/pages/llms.txt.ts");
    expect(s).toContain("/about/");
  });
});
