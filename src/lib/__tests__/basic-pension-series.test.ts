/**
 * 기초연금 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 금액이 basic-pension-2026.json(보건복지부고시 제2026-156호)과 basic-pension.ts 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/basic-pension-2026.json";
import { basicPensionSeries } from "../../data/series/basic-pension";
import { basicPension, propertyIncome, workIncome, npsFullUpTo, npsFloor } from "../basic-pension";
import { won, eokwon } from "../won";

describe("기초연금 계산", () => {
  it("2026 기준연금액 349,700원, 부부 각 279,760원", () => {
    expect(basicPension({ recognized: 0, couple: false }).total).toBe(349_700);
    expect(basicPension({ recognized: 0, couple: true }).each).toBe(279_760);
  });
  it("선정기준액 247만원 초과면 대상 아님, 경계에서는 최소 10%(34,970원)", () => {
    expect(basicPension({ recognized: 2_470_001, couple: false }).eligible).toBe(false);
    expect(basicPension({ recognized: 2_470_000, couple: false }).total).toBe(34_970);
    expect(basicPension({ recognized: 2_300_000, couple: false }).total).toBe(170_000);
  });
  it("재산 환산(대도시 3억·예금 5천만원 → 월 650,000원), 근로 200만원 → 588,000원", () => {
    expect(propertyIncome({ general: 300_000_000, financial: 50_000_000, region: "metro" })).toBe(650_000);
    expect(workIncome(2_000_000)).toBe(588_000);
  });
  it("국민연금 150% 경계 524,550원, 바닥 174,850원", () => {
    expect([npsFullUpTo(), npsFloor()]).toEqual([524_550, 174_850]);
  });
});

const money = new Set([
  won(r.basePension), won(279_760), won(npsFullUpTo()), won(npsFloor()),
  eokwon(r.selection.single), eokwon(r.selection.couple), `${Math.floor(r.selection.couple / 10_000)}만${(r.selection.couple % 10_000) / 1000}천원`, eokwon(r.property.basic.metro), eokwon(r.property.financialDeduction),
]);

describe("기초연금 시리즈 제목·설명", () => {
  for (const s of [basicPensionSeries.hub, ...basicPensionSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/(?:\d+억)?[\d,]+(?:만(?:[\d,]+천)?)?원/g)) expect(money, m[0]).toContain(m[0]);
    });
  }
});
