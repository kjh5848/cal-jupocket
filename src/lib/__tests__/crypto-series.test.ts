/**
 * 코인 세금 시리즈 — 제목·설명의 금액·비율·날짜가 crypto-2026.json 과 cryptoTax() 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/crypto-2026.json";
import { cryptoSeries } from "../../data/series/crypto";
import { cryptoTax } from "../crypto-tax";
import { eokwon } from "../won";

describe("코인 세금 계산", () => {
  it("250만원 이하 0원, 1천만원 이익 165만원", () => {
    expect(cryptoTax({ proceeds: 2_500_000, cost: 0 }).total).toBe(0);
    expect(cryptoTax({ proceeds: 20_000_000, cost: 10_000_000 }).total).toBe(1_650_000);
  });
  it("2026년 말 시가가 크면 그걸로 — 1,045만원 → 385만원", () => {
    expect(cryptoTax({ proceeds: 60_000_000, preCost: 10_000_000 }).total).toBe(10_450_000);
    expect(cryptoTax({ proceeds: 60_000_000, preCost: 10_000_000, preFairValue: 40_000_000 }).total).toBe(3_850_000);
  });
  it("시가 비교는 2027년 전 보유분에만 — 이후 매수분은 그대로 더한다", () => {
    expect(cryptoTax({ proceeds: 100_000_000, cost: 30_000_000, preCost: 10_000_000, preFairValue: 40_000_000 }).basis).toBe(70_000_000);
  });
  it("시행 2027-01-01, 개정 세 번", () => {
    expect(r.start).toBe("2027-01-01");
    expect(r.delays).toHaveLength(3);
  });
});

const pct = (v: number) => `${Math.round(v * 100)}%`;
const percents = new Set([pct(r.rate), pct(r.localRate), pct(r.rate + r.localRate)]);
const money = new Set([eokwon(r.deduction), "1천만원", "6천만원", "4천만원", eokwon(10_450_000), eokwon(3_850_000)]);

describe("코인 세금 시리즈 제목·설명", () => {
  for (const s of [cryptoSeries.hub, ...cryptoSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/\d+%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d,]+(?:천)?만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/20\d\d년(?: \d+월(?: \d+일)?)?/g)) expect(["2027년 1월 1일", "2026년 12월 31일", "2021년 12월", "2022년 12월", "2024년 12월", "2027년", "2026년", "2021년", "2022년", "2024년"], m[0]).toContain(m[0]);
    });
  }
});
