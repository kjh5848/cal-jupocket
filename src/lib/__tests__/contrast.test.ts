/** 리브랜딩 Task 2 — 다크·라이트 토큰 대비(WCAG), 두 다크 블록(기기 설정·직접 선택)의 값이 같은지. */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("src/styles/global.css", "utf-8");
function block(selectorRe: RegExp): Record<string, string> {
  const m = css.match(selectorRe);
  if (!m) throw new Error("block not found: " + selectorRe);
  const out: Record<string, string> = {};
  for (const [, k, v] of m[1].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out[k] = v.trim();
  return out;
}
const light = block(/^:root\s*\{([\s\S]*?)\n\}/m);
const darkMedia = block(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \{([\s\S]*?)\n  \}/);
const darkPick = block(/^:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/m);

const lum = (hex: string) => {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

describe("토큰 대비", () => {
  for (const [name, t] of [["light", light], ["dark", darkMedia]] as const) {
    it(name, () => {
      expect(ratio(t["--text"], t["--surface"])).toBeGreaterThanOrEqual(7);
      expect(ratio(t["--muted"], t["--surface"])).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t["--link"], t["--surface"])).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t["--text"], t["--bg"])).toBeGreaterThanOrEqual(7);
    });
  }
  it("다크 토큰은 설계 6-5 값", () => {
    expect(darkMedia).toMatchObject({ "--bg": "#0d1220", "--surface": "#161d2e", "--surface-2": "#222b40", "--accent-bg": "#222b40", "--rule": "#2f3a52", "--text": "#e7ebf3", "--muted": "#a9b3c7", "--link": "#8fb8ff", "--brand": "#8fb8ff", "--brand-wash": "#1b2a47" });
  });
  it("기기 설정 다크와 직접 고른 다크가 같은 값", () => {
    expect(darkPick).toEqual(darkMedia);
  });
});
