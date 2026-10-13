/**
 * 금융소득 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 비율·금액이 financial-income-2026.json 과 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/financial-income-2026.json";
import { financialIncomeSeries } from "../../data/series/financial-income";
import { financialTax, highDividendTax } from "../financial-income";
import { eokwon } from "../won";

const pct = (v: number) => `${+(v * 100).toFixed(2)}%`;
const W = r.withholding;
const L = r.local.ratio;
const H = r.highDividend.brackets;
const percents = new Set([
  pct(W.interest), pct(W.interest * L), pct(W.interest * (1 + L)), pct(W.nonBusinessLoan), pct(W.nonBusinessLoan * (1 + L)),
  pct(r.grossUp.rate), `${+(H[0].rate * 100).toFixed(2)}~${pct(H[3].rate)}`,
]);
const money = new Set([eokwon(r.threshold.amount), "100만원", "15만4천원", "84만6천원"]);

describe("금융소득 계산", () => {
  it("다른 소득이 없으면 이자 3천만원도 14%에서 끝난다", () => {
    expect(financialTax({ interest: 30_000_000 }).extra).toBe(0);
  });
  it("다른 과세표준 5천만원 + 이자 3천만원 → 소득세 100만원 증가", () => {
    expect(financialTax({ interest: 30_000_000, otherBase: 50_000_000 }).extra).toBe(1_000_000);
  });
  it("2천만원 이하는 종합과세 아님", () => {
    expect(financialTax({ interest: 20_000_000, otherBase: 100_000_000 }).comprehensive).toBe(false);
  });
  it("고배당 세율표 구간 기본세액(280만원·5,880만원·12억3,380만원)", () => {
    expect(highDividendTax(20_000_000)).toBe(2_800_000);
    expect(highDividendTax(300_000_000)).toBe(58_800_000);
    expect(highDividendTax(5_000_000_000)).toBe(1_233_800_000);
  });
  it("이자 100만원 → 15만4천원 떼고 84만6천원", () => {
    const t = Math.floor(1_000_000 * W.interest);
    expect(t + Math.floor(t * L)).toBe(154_000);
  });
});

describe("금융소득 시리즈 제목·설명", () => {
  for (const s of [financialIncomeSeries.hub, ...financialIncomeSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d.]+(?:~[\d.]+)?%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d,]+만(?:[\d,]+천)?원|[\d,]+천만원/g)) expect(money, m[0]).toContain(m[0]);
    });
  }
});
