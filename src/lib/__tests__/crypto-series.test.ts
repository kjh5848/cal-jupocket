/**
 * 코인 세금 시리즈 — 제목·설명의 금액·비율·날짜가 crypto-2026.json 과 cryptoTax() 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/crypto-2026.json";
import { cryptoSeries } from "../../data/series/crypto";
import { cryptoTax, cryptoPage } from "../crypto-tax";
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

describe("코인 세금 계산기 화면 (cryptoPage)", () => {
  // 제37조 ①3호·⑤, 제64조의3 ②, 제84조 3호, 지방세법 제93조 ⑱ 손계산
  it("2027년 전 보유분 — 시가 4천만원으로 취득가액 3천만원 늘고 세금 660만원 줄어듦", () => {
    const x = cryptoPage({ proceeds: 60_000_000, preCost: 10_000_000, preFairValue: 40_000_000 });
    expect([x.preBasis, x.stepUp, x.total, x.stepUpSaving]).toEqual([40_000_000, 30_000_000, 3_850_000, 6_600_000]);
    expect([x.kept, x.effectiveRate, x.room]).toEqual([16_150_000, 19.25, 0]);
    expect(x.deductionSaving).toBe(550_000);
  });
  it("이후 매수·수수료까지 — 소득금액 2,900만원, 세금 583만원", () => {
    const x = cryptoPage({ proceeds: 100_000_000, cost: 30_000_000, preCost: 10_000_000, preFairValue: 40_000_000, fees: 1_000_000 });
    expect([x.income, x.taxable, x.tax, x.local, x.total]).toEqual([29_000_000, 26_500_000, 5_300_000, 530_000, 5_830_000]);
    expect(x.effectiveRate).toBe(20.1);
  });
  it("250만원 이하 — 세금 0원, 공제로 줄어든 세금은 그 이익의 22%, 남은 이익", () => {
    const x = cryptoPage({ proceeds: 2_000_000 });
    expect([x.total, x.deductionSaving, x.room]).toEqual([0, 440_000, 500_000]);
    expect(cryptoPage({ proceeds: 2_500_001 }).total).toBe(0); // 과세 대상 1원 × 22% → 원 미만 버림
  });
  it("손실 — 세금 0원, 손실만큼 올해 더 낼 수 있는 이익이 커짐", () => {
    const x = cryptoPage({ proceeds: 5_000_000, cost: 8_000_000 });
    expect([x.loss, x.total, x.kept, x.room, x.deductionSaving]).toEqual([true, 0, 0, 5_500_000, 0]);
  });
  it("원 미만 버림 — 33,333,333원 이익이면 6,166,666 + 616,666", () => {
    expect(cryptoTax({ proceeds: 33_333_333 }).total).toBe(6_783_332);
  });
  it("정수 계산 — 1원 단위 0~5만, 1만원 단위 0~50억 전수: 세금 = ⌊과세 대상 × 20 ÷ 100⌋ + ⌊× 2 ÷ 100⌋", () => {
    let bad = 0;
    const check = (g: number) => {
      const t = g - r.deduction;
      const want = g <= r.deduction ? 0 : Math.floor((t * 20) / 100) + Math.floor((t * 2) / 100);
      if (cryptoTax({ proceeds: g }).total !== want) bad++;
    };
    for (let g = 2_500_000; g <= 2_550_000; g++) check(g);
    for (let g = 0; g <= 5_000_000_000; g += 10_000) check(g);
    expect(bad).toBe(0);
  });
});
