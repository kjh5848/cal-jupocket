/**
 * DSR 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 제목·설명에 쓰는 숫자가 dsr-2026.json(감독규정 별표 6 제4장 4. 가목 40%·1억원, 세칙 별표 18 <표 3> 신용대출 ÷ 5년)과 맞는지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/dsr-2026.json";
import { dsrSeries } from "../../data/series/dsr";

const eok = (n: number) => `${n / 100_000_000}억원`;
const allowed = new Set([
  `${r.bankLimit.ratioPct}%`,
  eok(r.bankLimit.totalLoanOver),
  "5년", // <표 3> 신용대출 분할상환 외 ÷ 5년
  `${r.maxTermYears}년`, // 세칙 별표 18 제12-2호 사목 만기 상한
  "18", // 세칙 별표 18
  "6", // 감독규정 별표 6
]);

describe("DSR 시리즈 제목·설명", () => {
  it("rates 숫자", () => {
    expect(r.bankLimit.ratioPct).toBe(40);
    expect(r.bankLimit.totalLoanOver).toBe(100_000_000);
    expect(r.maxTermYears).toBe(40);
  });

  for (const s of [dsrSeries.hub, ...dsrSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/\d[\d,]*(?:%|억원|년)?/g)) expect(allowed.has(m[0]), m[0]).toBe(true);
    });
  }
});
