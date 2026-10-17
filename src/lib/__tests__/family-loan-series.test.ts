/**
 * 가족간 차용증 시리즈 — 증여이익 계산이 상증법 제41조의4·시행령 제31조의4대로인지,
 * 제목·설명의 금액·비율이 family-loan-2026.json 과 family-loan.ts 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/family-loan-2026.json";
import { familyLoanSeries } from "../../data/series/family-loan";
import { loanGain, loanGiftTax, noGiftPrincipal, interestWithholding, giftTaxStartYear, minNoGiftRate } from "../family-loan";
import { relationCap, computeGift } from "../gift";
import { manwon, eokwon } from "../won";

const approxEok = (n: number) => eokwon(Math.floor(n / 10_000) * 10_000);

describe("금전 무상대출 증여이익", () => {
  it("적정 이자율 4.6%, 기준금액 1천만원", () => {
    expect(r.loanGift.rate).toBe(0.046);
    expect(r.loanGift.threshold).toBe(10_000_000);
  });
  it("무이자 3억 — 1,380만원, 1천만원 이상이라 전액 증여재산가액", () => {
    expect(loanGain(300_000_000)).toEqual({ fair: 13_800_000, interest: 0, gain: 13_800_000, taxable: true, giftValue: 13_800_000 });
  });
  it("무이자 2억 — 920만원, 1천만원 미만이라 제외", () => {
    const g = loanGain(200_000_000);
    expect([g.gain, g.taxable, g.giftValue]).toEqual([9_200_000, false, 0]);
  });
  it("증여가 안 되는 한도 — 경계 바로 위는 1천만원 이상", () => {
    for (const x of [0, 0.01, 0.02, 0.03, 0.04]) {
      const p = noGiftPrincipal(x);
      expect(loanGain(p, x).gain).toBeLessThan(10_000_000);
      expect(loanGain(p + 1, x).gain).toBeGreaterThanOrEqual(10_000_000);
    }
    expect(noGiftPrincipal(0.046)).toBe(Infinity);
  });
  it("첫해는 공제 안이라 0원 — 이익이 10년 합산(제47조)돼 몇 년째부터 증여세", () => {
    expect(relationCap("ascendant")).toBe(50_000_000);
    expect(loanGiftTax(300_000_000).tax?.payable).toBe(0);
    expect(giftTaxStartYear(300_000_000, 0)).toBe(4); // 1,380만 × 4 = 5,520만
    expect(giftTaxStartYear(500_000_000, 0.02)).toBe(4); // 1,300만 × 4 = 5,200만
    expect(giftTaxStartYear(500_000_000, 0)).toBe(3); // 2,300만 × 3 = 6,900만
    expect(giftTaxStartYear(1_000_000_000, 0)).toBe(2); // 4,600만 × 2 = 9,200만
    expect(giftTaxStartYear(200_000_000, 0)).toBe(Infinity); // 920만 — 해마다 제외
    // 4년째 — 앞선 3년이 공제 4,140만원을 이미 썼으면 그해 세금은 0보다 크다
    expect(loanGiftTax(300_000_000, 0, "ascendant", 13_800_000 * 3).tax?.payable).toBeGreaterThan(0);
  });
  it("역산 — 이 금액이면 연 몇 %를 넘겨야 증여가 아닌가(1천만원 '미만', 경계 금액은 증여)", () => {
    // 5억: 2,300만 − 1,000만 = 1,300만 → 이자 1,300만원 1원 넘게. 2.6% 정확히는 이익 1,000만원이라 증여
    expect(minNoGiftRate(500_000_000)).toEqual({ minInterest: 13_000_001, rate: 0.0261 });
    expect(loanGain(500_000_000, 0.026).taxable).toBe(true);
    // 3억: 1,380만 − 1,000만 → 380만원 1원 넘게 → 1.27%(1.26%는 1,002만원)
    expect(minNoGiftRate(300_000_000)).toEqual({ minInterest: 3_800_001, rate: 0.0127 });
    expect(loanGain(300_000_000, 0.0126).taxable).toBe(true);
    expect(minNoGiftRate(1_000_000_000)).toEqual({ minInterest: 36_000_001, rate: 0.0361 });
    expect(minNoGiftRate(200_000_000)).toEqual({ minInterest: 0, rate: 0 }); // 920만 — 무이자여도 제외
    for (const p of [217_391_305, 250_000_000, 777_777_777, 3_000_000_000]) {
      const m = minNoGiftRate(p);
      expect(loanGain(p, m.rate).taxable, String(p)).toBe(false);
      expect(loanGain(p, m.rate - 0.0001).taxable, String(p)).toBe(true);
    }
  });
  it("증여세 시작 연차 = 10년 합산(gift.ts priorGifts)으로 그해 세금이 처음 생기는 해", () => {
    for (const [p, x, rel] of [[300_000_000, 0, "ascendant"], [500_000_000, 0.02, "ascendant"], [300_000_000, 0, "relative"], [1_000_000_000, 0, "spouse"]] as const) {
      const g = loanGain(p, x);
      const first = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find((k) => computeGift({ amount: g.giftValue, relation: rel, priorGifts: (k - 1) * g.giftValue }).payable > 0) ?? Infinity;
      expect(giftTaxStartYear(p, x, rel), `${p} ${x} ${rel}`).toBe(first);
    }
  });
  it("형제·친척(공제 1천만원)에게 무이자 3억 — 첫해부터 증여세", () => {
    // 1,380만 − 1,000만 = 380만 × 10% = 38만, 신고세액공제 3% 11,400 → 368,600
    expect(loanGiftTax(300_000_000, 0, "relative").tax?.payable).toBe(368_600);
    expect(giftTaxStartYear(300_000_000, 0, "relative")).toBe(1);
    expect(giftTaxStartYear(1_000_000_000, 0.01, "spouse")).toBe(Infinity); // 3,600만 × 10 < 6억
  });
  it("이자 원천징수 — 비영업대금 25% + 지방소득세 10%", () => {
    expect(interestWithholding(10_000_000)).toEqual({ tax: 2_500_000, localTax: 250_000, net: 7_250_000 });
  });
});

const money = new Set([manwon(r.loanGift.threshold), eokwon(r.loanGift.threshold), eokwon(relationCap("ascendant")), approxEok(noGiftPrincipal(0)), approxEok(noGiftPrincipal(0.02)), manwon(relationCap("ascendant"))]);
const pcts = new Set(["4.6%", "2%", "25%"]);

describe("가족간 차용증 시리즈 제목·설명", () => {
  for (const s of [familyLoanSeries.hub, ...familyLoanSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+억[\d,]*만원|[\d,]+(?:천)?만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(pcts, m[0]).toContain(m[0]);
    });
  }
});
