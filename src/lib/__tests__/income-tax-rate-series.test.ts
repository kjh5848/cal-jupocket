/**
 * 소득세율·과세표준 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 비율·금액이 rates 와 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/income-tax-rate-2026.json";
import tr from "../../rates/2026.json";
import { incomeTaxRateSeries } from "../../data/series/income-tax-rate";
import { earnedTaxByPay, otherIncomeTax, otherIncomeExemptMax, marginalRate } from "../income-tax-rate";
import { eokwon } from "../won";

const pct = (v: number) => `${+(v * 100).toFixed(2)}%`;
const B = tr.incomeTaxBrackets;
const ex = otherIncomeTax(1_000_000);
const exempt = otherIncomeExemptMax();
const manCheon = (v: number) => `${Math.floor(v / 10_000)}만${(v % 10_000) / 1_000}천원`;

const percents = new Set([
  ...B.map((b) => pct(b.rate)), `${pct(B[0].rate).slice(0, -1)}~${pct(B[7].rate)}`,
  `${(earnedTaxByPay(50_000_000).effective * 100).toFixed(2)}%`,
  pct(r.earned.dailyRate), pct(r.business.rate), pct(r.business.rate * r.business.localRatio), pct(r.business.rate * (1 + r.business.localRatio)),
  pct(r.other.rate), pct(r.other.rate * 1.1), pct(r.other.expense60Rate), pct(1 - r.other.expense60Rate), pct(ex.effective),
  pct(marginalRate(60_000_000)), // 과세표준 6천만원 예시의 구간 세율 24%
]);
const money = new Set([
  eokwon(B[0].upTo!), eokwon(B[6].upTo!), eokwon(60_000_000), eokwon(50_000_000), // 예시 과세표준·연봉
  `${r.other.minimum / 10_000}만원`, manCheon(exempt),
]);

describe("소득세율 시리즈 제목·설명", () => {
  it("12만5천원 = 5만원 ÷ 40%", () => expect(exempt).toBe(125_000));

  for (const s of [incomeTaxRateSeries.hub, ...incomeTaxRateSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d.]+(?:~[\d.]+)?%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+만\d천원|[\d,]+억원|[\d,]+천만원|[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
    });
  }
});
