/**
 * 대출이자 계산 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 법령 숫자가 없는 시리즈라 제목·설명에 금액·비율을 넣지 않는다(금액은 본문에서 loanSchedule() 이 낸다).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/loan-2026.json";
import { loanSeries } from "../../data/series/loan";

describe("대출이자 계산 시리즈 제목·설명", () => {
  it("rates 에 세 방식·월 이자·단수 문장이 있다", () => {
    expect(Object.keys(r.methods)).toEqual(["level", "principal", "bullet"]);
    expect(r.monthlyInterest).toContain("÷ 12");
    expect(r.rounding).toContain("원 미만 버림");
  });

  for (const s of [loanSeries.hub, ...loanSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      expect(head).not.toMatch(/\d+%/);
      expect(head).not.toMatch(/[\d,]+(원|억|만원)/);
      // 숫자는 월 이자의 "12분의 1"·"÷ 12"만
      expect(head.replace(/12분의 1|÷ 12/g, "")).not.toMatch(/\d/);
    });
  }
});
