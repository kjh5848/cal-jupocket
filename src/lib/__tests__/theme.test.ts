/** 리브랜딩 Task 2 — 테마 선택 저장(실패해도 기기 설정), 첫 그림 전 data-theme. */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { readTheme, writeTheme, nextTheme } from "../theme";

const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } } as unknown as Storage;
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as unknown as Storage; };

describe("테마 저장", () => {
  it("막힌 저장소 → system, 쓰기 false", () => {
    expect(readTheme(throwing)).toBe("system");
    expect(writeTheme("dark", throwing)).toBe(false);
    expect(readTheme(null)).toBe("system");
  });
  it("이상한 값 → system, 저장한 값은 그대로", () => {
    const s = mem();
    s.setItem("jp-theme", "blue");
    expect(readTheme(s)).toBe("system");
    expect(writeTheme("dark", s)).toBe(true);
    expect(readTheme(s)).toBe("dark");
  });
  it("전환 순서 light → dark → system → light", () => {
    expect([nextTheme("light"), nextTheme("dark"), nextTheme("system")]).toEqual(["dark", "system", "light"]);
  });
  it("BaseHead 인라인 스크립트가 스타일보다 먼저 data-theme 를 정한다", () => {
    const s = readFileSync("src/components/BaseHead.astro", "utf-8");
    const script = s.indexOf("jp-theme");
    expect(script).toBeGreaterThan(-1);
    expect(s.slice(0, script)).toMatch(/<script is:inline>/);
    const css = s.indexOf('rel="stylesheet"');
    if (css > -1) expect(script).toBeLessThan(css);
  });
});
