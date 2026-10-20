/**
 * 영국 ShPP — GOV.UK 예시(NWE £300 → £194.32, SMP 22주 → 17주)와 reg 40(2) 1p 올림·reg 32(4) 월급 환산을 손계산으로 고정.
 */
import { describe, it, expect } from "vitest";
import rates from "../../rates/gb/shared-parental-pay-2026.json";
import { weeklyRate, nweWeekly, nweMonthly, nweDays, weeksLeft, CAP_PENCE, PAY_WEEKS } from "../gb/shared-parental-pay";
import { parsePence } from "../gb/vat";

describe("rates (gov.uk·legislation.gov.uk 2026-10-21)", () => {
  it("초안이 아니고 남은 미확인이 없다", () => {
    expect((rates as Record<string, unknown>).draft).toBeUndefined();
    expect((rates as Record<string, unknown>).notVerified).toBeUndefined();
  });
  it("£194.32 · 90% · 39주", () => {
    expect(CAP_PENCE).toBe(19432);
    expect(rates.weeklyRate.percentOfNwe).toBe(90);
    expect(PAY_WEEKS).toBe(39);
  });
});

describe("주 지급액 = min(£194.32, NWE × 90%), 1p 올림(reg 40)", () => {
  it("GOV.UK: NWE £300 → 90% £270 이지만 ShPP 는 £194.32", () => {
    const r = weeklyRate(nweWeekly(30000));
    expect(r.ninety).toBe(27000);
    expect(r).toMatchObject({ weekly: 19432, capped: true, daily: 2776 });
  });
  it("경계: £215.91 → 90% 194.319 올림 £194.32 · £215.92 → 상한 £194.32", () => {
    expect(weeklyRate(nweWeekly(21591))).toMatchObject({ weekly: 19432, capped: false });
    expect(weeklyRate(nweWeekly(21592))).toMatchObject({ weekly: 19432, capped: true });
  });
  it("£123.45 → 111.105 올림 £111.11 · 하루치 111.105 ÷ 7 = 15.872… → £15.88", () => {
    expect(weeklyRate(nweWeekly(12345))).toEqual({ weekly: 11111, capped: false, ninety: 11111, daily: 1588 });
  });
  it("£150 → £135 · 하루치 135 ÷ 7 = 19.285… → £19.29", () => {
    expect(weeklyRate(nweWeekly(15000))).toEqual({ weekly: 13500, capped: false, ninety: 13500, daily: 1929 });
  });
  it("입력은 parsePence(£, 쉼표)", () => {
    expect(weeklyRate(nweWeekly(parsePence("£1,000")))).toMatchObject({ weekly: 19432 });
  });
});

describe("NWE(reg 32(4)(5)) — 반올림하지 않음", () => {
  it("월급 £2,000 × 2개월 → 4000 × 12 ÷ 52 ÷ 2 = 461.538… → ShPP 상한", () => {
    const n = nweMonthly(400000, 2)!;
    expect(n.num / n.den).toBeCloseTo(46153.846, 2);
    expect(weeklyRate(n).weekly).toBe(19432);
  });
  it("월급 £800 × 2개월 → 184.615… × 90% = 166.153… → £166.16", () => {
    const n = nweMonthly(160000, 2)!;
    expect(weeklyRate(n)).toMatchObject({ weekly: 16616, capped: false });
  });
  it("개월 수는 가장 가까운 정수: 1.6 → 2, 0.4 → null", () => {
    expect(nweMonthly(160000, 1.6)).toEqual(nweMonthly(160000, 2));
    expect(nweMonthly(160000, 0.4)).toBeNull();
  });
  it("날 수: £1,200 ÷ 56일 × 7 = £150", () => {
    const n = nweDays(120000, 56)!;
    expect(n.num / n.den).toBe(15000);
    expect(weeklyRate(n).weekly).toBe(13500);
  });
});

describe("남은 ShPP 주 수 = 39 − SMP/MA − 상대 신청(reg 10)", () => {
  it("GOV.UK: SMP 22주 → 17주", () => {
    expect(weeksLeft(22, 0)).toMatchObject({ weeks: 17, smp: 22, raisedToMin: false });
  });
  it("일부 주는 한 주(10(12)): 22.5 → 23 → 16", () => {
    expect(weeksLeft(22.5, 0).weeks).toBe(16);
  });
  it("상대가 10주 신청 → 7주", () => {
    expect(weeksLeft(22, 10).weeks).toBe(7);
  });
  it("SMP 0·1 주는 2 로(합산 최대 37주) · 넘치면 0", () => {
    expect(weeksLeft(0, 0)).toMatchObject({ weeks: 37, smp: 2, raisedToMin: true });
    expect(weeksLeft(30, 20).weeks).toBe(0);
  });
});
