/**
 * 실수령액 시리즈 — 간이세액표 계산이 별표 2 원문 값·산식과 맞는지, 제목·설명의 금액이 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import t from "../../rates/withholding-table-2026.json";
import { takeHomeSeries } from "../../data/series/take-home";
import { simplifiedTax, takeHome, takeHomeFromAnnual, MEAL_ALLOWANCE } from "../take-home";
import { manwon } from "../won";

describe("근로소득 간이세액표", () => {
  it("표는 770천원~10,000천원, 이음매 빈틈 없음, 가족이 늘면 세액이 줄거나 같다", () => {
    expect(t.rows.length).toBe(646);
    expect(t.rows[0].slice(0, 2)).toEqual([770, 775]);
    expect(t.rows[t.rows.length - 1].slice(0, 2)).toEqual([9_980, 10_000]);
    for (let i = 1; i < t.rows.length; i++) expect(t.rows[i][0]).toBe(t.rows[i - 1][1]);
    for (const r of t.rows) for (let c = 3; c < 13; c++) expect(r[c]).toBeLessThanOrEqual(r[c - 1]);
  });
  it("원문 행 그대로 — 3,000천원 이상 3,020천원 미만", () => {
    expect(simplifiedTax(3_000_000)).toBe(74_350);
    expect(simplifiedTax(3_019_999, 3)).toBe(31_940);
    expect(simplifiedTax(769_999)).toBe(0);
  });
  it("1,000만원과 초과 산식", () => {
    expect(simplifiedTax(10_000_000)).toBe(1_507_400);
    expect(simplifiedTax(12_000_000)).toBe(1_507_400 + 25_000 + 2_000_000 * 0.98 * 0.35);
    expect(simplifiedTax(20_000_000)).toBe(1_507_400 + 1_397_000 + 6_000_000 * 0.98 * 0.38);
    expect(simplifiedTax(50_000_000)).toBe(1_507_400 + 13_394_600 + 5_000_000 * 0.42);
  });
  it("자녀 공제(비고 3)·11명 초과(비고 4)", () => {
    expect(simplifiedTax(5_000_000, 3, 1)).toBe(simplifiedTax(5_000_000, 3) - 20_830);
    expect(simplifiedTax(5_000_000, 5, 3)).toBe(simplifiedTax(5_000_000, 5) - 45_830 - 33_330);
    const f10 = simplifiedTax(5_000_000, 10), f11 = simplifiedTax(5_000_000, 11);
    expect(simplifiedTax(5_000_000, 13)).toBe(f11 - (f10 - f11) * 2);
    expect(simplifiedTax(1_500_000, 4, 2)).toBe(0);
  });
  it("실수령액 = 월급 − 4대보험 − 소득세 − 지방소득세(10%)", () => {
    const x = takeHome(3_000_000, { nonTaxable: MEAL_ALLOWANCE });
    expect(x.taxable).toBe(2_800_000);
    expect(x.incomeTax).toBe(simplifiedTax(2_800_000));
    expect(x.localTax).toBe(Math.floor(x.incomeTax / 10));
    expect(x.net).toBe(3_000_000 - x.pension - x.health - x.care - x.employment - x.incomeTax - x.localTax);
  });
});

const approx = (n: number) => `${Math.round(n / 10_000)}만원`;
const opt = { nonTaxable: MEAL_ALLOWANCE };
const money = new Set([
  manwon(MEAL_ALLOWANCE), "4천만원", "5천만원", "300만원",
  approx(takeHomeFromAnnual(40_000_000, opt).net), approx(takeHomeFromAnnual(50_000_000, opt).net),
  approx(takeHomeFromAnnual(100_000_000, opt).net), approx(takeHome(3_000_000, opt).net),
]);

describe("실수령액 시리즈 제목·설명", () => {
  for (const s of [takeHomeSeries.hub, ...takeHomeSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+(?:천)?만원/g)) expect(money, m[0]).toContain(m[0]);
    });
  }
});
