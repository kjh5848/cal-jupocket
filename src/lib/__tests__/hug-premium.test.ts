import { describe, it, expect } from "vitest";
import { hugGuarantee, hugPremium } from "../hug-jeonse";
import r from "../../rates/hug-jeonse-2026.json";

// 손계산 기준값 — HUG 전세반환보증 상품개요 보증료율 표(2026-11-08 확인)
const prem = (x: Parameters<typeof hugGuarantee>[0], days = 730, extra: Partial<Parameters<typeof hugPremium>[0]> = {}) => {
  const g = hugGuarantee(x);
  return hugPremium({ type: x.type, deposit: x.deposit, seniorTotal: g.seniorTotal, housePrice: g.housePrice, days, ...extra });
};

describe("hugPremium — 요율표", () => {
  it("표가 4구간 × 3 부채비율, 원문 범위 0.097~0.211%", () => {
    const t = r.premium.rateTable.rateMilliPct;
    for (const k of ["apartment", "other"] as const) {
      expect(t[k]).toHaveLength(4);
      for (const row of t[k]) expect(row).toHaveLength(3);
    }
    const all = [...t.apartment, ...t.other].flat();
    expect(Math.min(...all) / 1000).toBe(r.guarantee.premiumRateRangePct.min);
    expect(Math.max(...all) / 1000).toBe(r.guarantee.premiumRateRangePct.max);
  });

  it("아파트 보증금 3억·시세 5억·근저당 1억, 2년 → 부채비율 88.9%, 연 0.154%, 924,000원", () => {
    const p = prem({ type: "apartment", capital: true, deposit: 3e8, senior: 1e8, basis: "market", price: 5e8 });
    expect(p.debtRatioPct).toBe(88.9);
    expect(p.rateMilli).toBe(154);
    expect(p.base).toBe(924_000);
    expect(p.surchargeApplied).toBe(false);
    expect(p.total).toBe(924_000);
  });

  it("수도권 빌라 보증금 2억·공시가격 1억 8천·근저당 없음 → 연 0.184%, 736,000원", () => {
    const p = prem({ type: "row", capital: true, deposit: 2e8, senior: 0, basis: "public", price: 1.8e8 });
    expect(p.debtRatioPct).toBe(88.2);
    expect(p.rateMilli).toBe(184);
    expect(p.base).toBe(736_000);
  });

  it("오피스텔은 아파트가 아닌 쪽 요율", () => {
    const a = prem({ type: "apartment", capital: true, deposit: 1e8, senior: 0, basis: "market", price: 5e8 });
    const o = prem({ type: "officetel", capital: true, deposit: 1e8, senior: 0, basis: "market", price: 5e8 });
    expect(a.rateMilli).toBe(97);
    expect(o.rateMilli).toBe(111);
  });

  it("보증금 경계는 이하 — 정확히 1억·2억·5억", () => {
    const at = (deposit: number) => prem({ type: "apartment", capital: true, deposit, senior: 0, basis: "market", price: 1e10 }).rateMilli;
    expect(at(1e8)).toBe(97);
    expect(at(1e8 + 1)).toBe(102);
    expect(at(2e8)).toBe(102);
    expect(at(5e8)).toBe(107);
    expect(at(5e8 + 1)).toBe(113);
  });

  it("부채비율 경계는 이하 — 정확히 70%·80%", () => {
    // 집값 10억 → 90% 선 9억. 70% = 6.3억, 80% = 7.2억
    const at = (deposit: number) => prem({ type: "apartment", capital: true, deposit, senior: 0, basis: "market", price: 1e9 }).debtBand;
    expect(at(6.3e8)).toBe(0);
    expect(at(6.3e8 + 1)).toBe(1);
    expect(at(7.2e8)).toBe(1);
    expect(at(7.2e8 + 1)).toBe(2);
  });

  it("선순위가 90% 선의 절반을 넘으면 10% 할증", () => {
    // 집값 10억 → 9억 선의 절반 4.5억
    const at = (senior: number) => prem({ type: "apartment", capital: true, deposit: 3e8, senior, basis: "market", price: 1e9 });
    expect(at(4.5e8).surchargeApplied).toBe(false);
    const p = at(4.5e8 + 1);
    expect(p.surchargeApplied).toBe(true);
    expect(p.surcharge).toBe(Math.floor(p.base / 10));
  });

  it("할인 하나 + 대출보증 부분", () => {
    const p = prem({ type: "apartment", capital: true, deposit: 3e8, senior: 1e8, basis: "market", price: 5e8 }, 730, { discount: "lowIncome", loan: 2e8 });
    expect(p.discountPct).toBe(60);
    expect(p.discountAmount).toBe(554_400);
    expect(p.loanPart).toBe(124_000); // 2억 × 0.031% × 2년
    expect(p.total).toBe(924_000 - 554_400 + 124_000);
  });

  it("단독·다가구가 다른 세입자 계약 확인서를 안 내면 그 구간 최고요율", () => {
    const p = prem({ type: "multi", capital: true, deposit: 1e8, senior: 0, otherDeposits: 0, basis: "market", price: 1e9 }, 730, { othersConfirmed: false });
    expect(p.rateMilli).toBe(172);
  });
});
