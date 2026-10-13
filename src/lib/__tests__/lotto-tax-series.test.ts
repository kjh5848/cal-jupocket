/**
 * 로또세금 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 비율·금액이 rates 와 lotteryTax() 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/lottery-2026.json";
import { lottoTaxSeries } from "../../data/series/lotto-tax";
import { lotteryTax } from "../lottery-tax";
import { eokwon } from "../won";

const pct = (v: number) => `${+(v * 100).toFixed(2)}%`;
const percents = new Set([
  pct(r.rate.base), pct(r.rate.overRate), pct(r.local.ratio),
  pct(r.rate.base * r.local.ratio), pct(r.rate.base * (1 + r.local.ratio)), pct(r.rate.overRate * (1 + r.local.ratio)),
]);
const t = lotteryTax;
const money = new Set([
  "0원", eokwon(r.minimum.upTo), eokwon(r.rate.over),
  eokwon(100_000_000), eokwon(t(100_000_000).net),
  eokwon(1_000_000_000), eokwon(t(1_000_000_000).net), eokwon(t(1_000_000_000).total),
  eokwon(2_000_000_000), eokwon(t(2_000_000_000).net),
]);

describe("로또 세금 계산", () => {
  it("200만원까지 0원, 1원 넘으면 전체에 22%", () => {
    expect(t(2_000_000).total).toBe(0);
    expect(t(2_000_001).total).toBe(440_000);
  });
  it("3억원 = 6,600만원, 10억원 = 2억9,700만원, 20억원 실수령 13억7,300만원", () => {
    expect(t(300_000_000).total).toBe(66_000_000);
    expect(t(1_000_000_000).total).toBe(297_000_000);
    expect(eokwon(t(2_000_000_000).net)).toBe("13억7,300만원");
  });
});

describe("로또세금 시리즈 제목·설명", () => {
  for (const s of [lottoTaxSeries.hub, ...lottoTaxSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?:[\d,]+억)?[\d,]+만원|[\d,]+억원|\d+원/g)) expect(money, m[0]).toContain(m[0]);
    });
  }
});
