/**
 * 건강보험 피부양자 시리즈 — 제목·설명의 금액·일수가 health-dependent-2026.json(시행규칙 별표 1의2)과 같은지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/health-dependent-2026.json";
import { healthDependentSeries } from "../../data/series/health-dependent";
import { checkDependent } from "../health-dependent";
import { eokwon } from "../won";

const I = r.income;
const P = r.property;

describe("피부양자 판정", () => {
  it("소득 2천만원 이하·재산 5억4천만원 이하", () => {
    expect(checkDependent({ income: 20_000_000, propertyBase: 540_000_000 }).eligible).toBe(true);
    expect(checkDependent({ income: 20_000_001, propertyBase: 0 }).eligible).toBe(false);
  });
  it("재산 5억4천~9억원은 소득 1천만원 이하만", () => {
    expect(checkDependent({ income: 10_000_000, propertyBase: 900_000_000 }).eligible).toBe(true);
    expect(checkDependent({ income: 10_000_001, propertyBase: 700_000_000 }).eligible).toBe(false);
  });
  it("사업자등록 없이 사업소득 500만원 이하는 없는 것으로", () => {
    expect(checkDependent({ income: 5_000_000, business: 5_000_000, propertyBase: 0 }).eligible).toBe(true);
    expect(checkDependent({ income: 5_000_000, business: 5_000_000, registered: true, propertyBase: 0 }).eligible).toBe(false);
  });
  it("형제자매 재산 1억8천만원", () => {
    expect(checkDependent({ income: 0, propertyBase: 180_000_001, sibling: true }).eligible).toBe(false);
  });
});

const money = new Set([eokwon(I.limit), eokwon(P.base), eokwon(P.upper), eokwon(P.upperIncome), eokwon(P.siblings), eokwon(I.businessAllow), "9억원", "5억4천"]);
describe("피부양자 시리즈 제목·설명", () => {
  for (const s of [healthDependentSeries.hub, ...healthDependentSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/\d+억(?:\d+천)?만원|\d+억원|\d+천만원|\d+만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<!\d)\d+일/g)) expect([`${r.registration.days}일`], m[0]).toContain(m[0]);
    });
  }
});
