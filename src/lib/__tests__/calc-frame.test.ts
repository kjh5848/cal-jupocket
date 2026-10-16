/**
 * 리브랜딩 Task 8 — 계산기마다 새 틀(두 칸·비율 막대·소계·자동완성 프리셋)로 옮겼는지.
 * 루틴 한 회차에 한 줄씩 늘린다. 옮긴 계산기는 docs/calc-benchmark.md 에도 한 행이 있어야 한다.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { calcPresets } from "../../data/calc-presets";

const MOVED: { path: string; attrs: string[] }[] = [
  { path: "/freelancer-33/", attrs: ["data-two", "data-seg", "data-won", "data-presets", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/withholding/", attrs: ["data-two", "data-seg", "data-won", "data-presets", "data-receipt", "data-group", "data-bar", "data-dock"] },
  { path: "/vat/", attrs: ["data-two", "data-seg", "data-won", "data-presets", "data-receipt", "data-bar", "data-dock"] },
];

const bench = readFileSync("docs/calc-benchmark.md", "utf-8");

for (const { path, attrs } of MOVED) {
  describe(`${path} 새 틀`, () => {
    it("대조표에 한 행", () => expect(bench).toContain(`| ${path} | https://roberin.com/`));
    it("자동완성 프리셋", () => expect(calcPresets[path]).toBeDefined());
    const file = `dist${path}index.html`;
    it.skipIf(!existsSync(file))("마크업 계약", () => {
      const html = readFileSync(file, "utf-8");
      for (const a of attrs) expect(html, a).toContain(a);
    });
  });
}
