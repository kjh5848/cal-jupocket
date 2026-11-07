/** 리브랜딩 Task 4 — 홈 검색 히어로와 도구 도감(빌드 결과 dist/index.html 기준). */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { liveTools, nextTools, toolCount } from "../../data/tools";

const FILE = "dist/index.html";
const built = existsSync(FILE);
const html = built ? readFileSync(FILE, "utf-8") : "";
const hero = html.match(/<section class="home-hero"[\s\S]*?<\/section>/)?.[0] ?? "";

describe.skipIf(!built)("홈", () => {
  it("히어로에 사진·버튼 대신 검색창", () => {
    expect(html).not.toContain("hero.webp");
    expect(hero).toMatch(/<input[^>]*id="tool-q"[^>]*type="search"|<input[^>]*type="search"[^>]*id="tool-q"/);
    expect(hero).toContain('placeholder="실수령액, 퇴직금, 3.3%…"');
    expect(hero).toMatch(/id="tool-pop"[^>]*hidden/);
    expect(hero).not.toContain("계산기 바로가기");
  });
  it("자주 찾는 말 5개", () => {
    expect([...hero.matchAll(/<a[^>]*class="quick"/g)].length).toBe(5);
  });
  it("담긴 수는 레지스트리 숫자", () => {
    const { live, total } = toolCount();
    expect(hero).toContain(`도구 <b>${live}</b>개 담김 · <b>${total}</b>개 채우는 중`);
  });
  // 2026-11-07 홈 개편: 도감 카드 → 한 줄 목록. 공개 도구만, 번호·곧 담길 칸 없음
  it("전체 계산기·도구 — 공개 도구만 한 줄 목록, 번호 없음", () => {
    expect(html).toContain('<h2 id="tools-h" class="home-h">전체 계산기·도구</h2>');
    const rows = [...html.matchAll(/<a class="tool-card tool-row"[^>]*data-type="[a-z]+"/g)];
    expect(rows.length).toBe(liveTools.length);
    expect(html).not.toContain("dex-unseen");
    expect(html).not.toMatch(/No\.\d{3}/);
  });
  it("분류 버튼은 공개 도구가 있는 분류만", () => {
    const kinds = new Set(liveTools.map((t) => t.type));
    expect([...html.matchAll(/<button[^>]*data-type="[a-z]+"/g)].length).toBe(kinds.size);
  });
  it("고민 입구 카드 4장", () => {
    expect([...html.matchAll(/class="entry-card"/g)].length).toBe(4);
  });
});
