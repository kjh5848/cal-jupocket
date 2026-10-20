/**
 * 미국 연방 최저임금 — 29 U.S.C. 206·207 · 29 CFR 778.113 · Fact Sheet #15 (2026-10-21 확인).
 * 손계산: $7.25, 40시간 넘으면 1.5배($10.875), 월급 × 12 ÷ 52, tipped $2.13 + tip credit $5.12.
 */
import { describe, it, expect } from "vitest";
import {
  FEDERAL_MIN,
  YOUTH_MIN,
  TIPPED_CASH_MIN,
  MAX_TIP_CREDIT,
  OT_HOURS,
  OT_MULT,
  weeklyEquivalent,
  weeklyFloor,
  checkPay,
  payFromHourly,
  checkTipped,
} from "../us/minimum-wage";

describe("연방 숫자", () => {
  it("$7.25 · youth $4.25 · tipped $2.13 · tip credit $5.12 · 40시간 · 1.5배", () => {
    expect(FEDERAL_MIN).toBe(7.25);
    expect(YOUTH_MIN).toBe(4.25);
    expect(TIPPED_CASH_MIN).toBe(2.13);
    expect(MAX_TIP_CREDIT).toBe(5.12);
    expect(FEDERAL_MIN - TIPPED_CASH_MIN).toBeCloseTo(MAX_TIP_CREDIT, 10);
    expect(OT_HOURS).toBe(40);
    expect(OT_MULT).toBe(1.5);
  });
});

describe("778.113 원문 예시", () => {
  it("월 $1,560 · 40시간 → 주 $360 → $9", () => {
    expect(weeklyEquivalent(1560, "monthly")).toBe(360);
    expect(checkPay(1560, "monthly", 40).hourly).toBe(9);
  });
  it("반월 $780 · 40시간 → $9", () => {
    expect(checkPay(780, "semimonthly", 40).hourly).toBe(9);
  });
  it("주 $375 · 40시간 → $9.38 (9.375 반올림)", () => {
    expect(checkPay(375, "weekly", 40).hourly).toBe(9.38);
  });
  it("주 $350 · 35시간 → $10", () => {
    expect(checkPay(350, "weekly", 35).hourly).toBe(10);
  });
});

describe("최저임금 비교", () => {
  it("40시간 최소 주급 $290, 연 $15,080", () => {
    expect(weeklyFloor(40)).toBe(290);
    expect(payFromHourly(7.25)).toEqual({ weekly: 290, biweekly: 580, semimonthly: 628.33, monthly: 1256.67, yearly: 15080 });
  });
  it("45시간: 290 + 5 × 10.875 = 344.375", () => {
    expect(weeklyFloor(45)).toBeCloseTo(344.375, 10);
    const c = checkPay(17_000, "yearly", 45);
    // 17,000 ÷ 52 = 326.92… < 344.375
    expect(c.weekly).toBe(326.92);
    expect(c.floor).toBe(344.38);
    expect(c.meets).toBe(false);
    expect(c.overtimeHours).toBe(5);
    expect(c.margin).toBe(-17.45);
  });
  it("연 $15,080 · 40시간 → 딱 $7.25, 통과", () => {
    const c = checkPay(15_080, "yearly", 40);
    expect(c.hourly).toBe(7.25);
    expect(c.meets).toBe(true);
    expect(c.margin).toBe(0);
  });
  it("격주 $560 · 40시간 → 주 $280 · $7 → 모자람 $10", () => {
    const c = checkPay(560, "biweekly", 40);
    expect(c.hourly).toBe(7);
    expect(c.meets).toBe(false);
    expect(c.margin).toBe(-10);
  });
  it("youth $4.25 비교: 40시간 $170", () => {
    expect(weeklyFloor(40, YOUTH_MIN)).toBe(170);
    expect(checkPay(4.5, "hourly", 40, YOUTH_MIN).meets).toBe(true);
    expect(checkPay(4.5, "hourly", 40).meets).toBe(false);
  });
  it("시급 입력 50시간 → 주급은 1.5배 포함", () => {
    const c = checkPay(10, "hourly", 50);
    expect(c.weekly).toBe(550);
    expect(c.hourly).toBe(10);
    expect(c.meets).toBe(true);
  });
  it("0시간·빈 값은 통과로 보지 않음", () => {
    expect(checkPay(500, "weekly", 0).meets).toBe(false);
    expect(checkPay(0, "weekly", 40).meets).toBe(false);
  });
});

describe("tipped (531.59)", () => {
  it("$2.13 · 40시간 · 팁 $150 → 필요 $290, 받은 $235.20, 사업주 $54.80", () => {
    const t = checkTipped(2.13, 150, 40);
    expect(t.tipCredit).toBe(5.12);
    expect(t.cashOk).toBe(true);
    expect(t.required).toBe(290);
    expect(t.received).toBe(235.2);
    expect(t.makeUp).toBe(54.8);
  });
  it("팁 충분하면 0", () => {
    expect(checkTipped(2.13, 300, 40).makeUp).toBe(0);
  });
  it("현금 $2 는 $2.13 미만", () => {
    expect(checkTipped(2, 500, 40).cashOk).toBe(false);
  });
  it("40시간 넘는 입력은 40시간으로", () => {
    expect(checkTipped(2.13, 0, 50).required).toBe(290);
  });
});
