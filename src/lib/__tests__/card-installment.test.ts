import { describe, it, expect } from "vitest";
import { installmentPlan, approxTotalFee, monthlyFee, billAfter, type InstallmentInput } from "../card-installment";
import { parseDate } from "../overdraft";

const ok = (inp: InstallmentInput) => {
  const r = installmentPlan(inp);
  if (!r.ok) throw new Error(r.reason);
  return r;
};

describe("신용카드 할부 수수료", () => {
  it("30만원 3개월 12% — 잔액 × 연율 ÷ 12, 우리은행 근사식과 같은 6,000원", () => {
    const r = ok({ amount: 300_000, months: 3, ratePct: 12, mode: "normal" });
    expect(r.rows.map((x) => x.fee)).toEqual([3_000, 2_000, 1_000]);
    expect(r.totalFee).toBe(6_000);
    expect(approxTotalFee(300_000, 3, 12)).toBe(6_000);
    expect(r.totalPaid).toBe(306_000);
    expect(r.firstPayment).toBe(103_000);
  });

  it("100만원 12개월 15% — 나머지 원금 4원은 1회차에(은행 계산기 안내), 회차마다 원 미만 버림", () => {
    const r = ok({ amount: 1_000_000, months: 12, ratePct: 15, mode: "normal" });
    expect(r.rows[0]).toMatchObject({ balance: 1_000_000, principal: 83_337, fee: 12_500, payment: 95_837 });
    expect(r.rows[11]).toMatchObject({ balance: 83_333, principal: 83_333, fee: 1_041 });
    expect(r.rows.reduce((s, x) => s + x.principal, 0)).toBe(1_000_000);
    expect(r.totalFee).toBe(81_243);
    // 근사식은 버림 없이 81,250 — 회차 버림만큼 몇 원 적다
    expect(approxTotalFee(1_000_000, 12, 15)).toBe(81_250);
  });

  it("연율 19.9% 를 부동소수로 나누지 않는다 — 300만원 첫 회차 49,750원", () => {
    expect(monthlyFee(3_000_000, 19.9)).toBe(49_750);
    const r = ok({ amount: 3_000_000, months: 24, ratePct: 19.9, mode: "normal" });
    expect(r.totalFee).toBe(621_864);
  });

  it("부분무이자 — 앞 회차만 고객 부담(신한 슬림할부 12개월 1~5회차)", () => {
    const r = ok({ amount: 1_000_000, months: 12, ratePct: 15, mode: "partial", paidTerms: 5 });
    expect(r.rows.slice(0, 5).every((x) => !x.free && x.fee > 0)).toBe(true);
    expect(r.rows.slice(5).every((x) => x.free && x.fee === 0)).toBe(true);
    expect(r.totalFee).toBe(52_081);
    expect(r.normalFee).toBe(81_243);
  });

  it("전액 무이자 — 수수료 0, 원금만", () => {
    const r = ok({ amount: 500_000, months: 10, ratePct: 15, mode: "free" });
    expect(r.totalFee).toBe(0);
    expect(r.totalPaid).toBe(500_000);
    expect(r.rows.every((x) => x.payment === 50_000)).toBe(true);
  });

  it("날짜로 — 1회차는 이용일~첫 결제일, 그다음은 결제일 사이 날수 ÷ 365", () => {
    const r = ok({ amount: 1_000_000, months: 3, ratePct: 15, mode: "normal", dates: { use: "2026-10-23", firstBill: "2026-11-14" } });
    expect(r.rows.map((x) => x.days)).toEqual([22, 30, 31]);
    expect(r.rows.map((x) => x.bill)).toEqual(["2026-11-14", "2026-12-14", "2027-01-14"]);
    expect(r.rows.map((x) => x.fee)).toEqual([9_041, 8_219, 4_246]);
  });

  it("날짜로 — 윤년 날은 366 으로 나누고, 31일 결제일은 2월 말일로", () => {
    const r = ok({ amount: 1_200_000, months: 3, ratePct: 18, mode: "normal", dates: { use: "2027-12-20", firstBill: "2028-01-31" } });
    expect(r.rows.map((x) => x.bill)).toEqual(["2028-01-31", "2028-02-29", "2028-03-31"]);
    expect(r.rows.map((x) => x.days)).toEqual([42, 29, 31]);
    expect(r.rows.map((x) => x.fee)).toEqual([24_806, 11_409, 6_098]);
    expect(billAfter(parseDate("2026-01-31"), 1)).toBe(parseDate("2026-02-28"));
  });

  it("잘못된 입력", () => {
    expect(installmentPlan({ amount: 0, months: 3, ratePct: 10, mode: "normal" })).toEqual({ ok: false, reason: "amount" });
    expect(installmentPlan({ amount: 100_000, months: 1, ratePct: 10, mode: "normal" })).toEqual({ ok: false, reason: "months" });
    expect(installmentPlan({ amount: 100_000, months: 3, ratePct: -1, mode: "normal" })).toEqual({ ok: false, reason: "rate" });
    expect(installmentPlan({ amount: 100_000, months: 3, ratePct: 10, mode: "partial", paidTerms: 3 })).toEqual({ ok: false, reason: "paid-terms" });
    expect(installmentPlan({ amount: 100_000, months: 3, ratePct: 10, mode: "normal", dates: { use: "2026-11-14", firstBill: "2026-11-14" } })).toEqual({ ok: false, reason: "dates" });
  });
});
