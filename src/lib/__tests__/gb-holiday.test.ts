/**
 * 영국 법정 유급휴가 — GOV.UK Holiday entitlement 예시와 WTR 1998 reg 13A·14·15A·15B 끝수 규칙을 손계산으로 고정.
 * 28 ÷ 12 × 3 = 7 은 부동소수로 7.000…01 이 되어 반나절 올림이면 7.5 가 나오는 함정 — 정수 계산이라 7.
 */
import { describe, it, expect } from "vitest";
import rates from "../../rates/gb/holiday-entitlement-2026.json";
import { annualDays, annualHours, firstYearAccrued, leaving, irregularAccrued, WEEKS, CAP_DAYS, IRREGULAR_RATE } from "../gb/holiday";

describe("rates (gov.uk·legislation.gov.uk 2026-10-21)", () => {
  it("초안이 아니고 남은 미확인이 없다", () => {
    expect((rates as Record<string, unknown>).draft).toBeUndefined();
    expect((rates as Record<string, unknown>).notVerified).toBeUndefined();
  });
  it("5.6주 · 28일 · 12.07%", () => {
    expect(WEEKS).toBe(5.6);
    expect(CAP_DAYS).toBe(28);
    expect(IRREGULAR_RATE).toBe(0.1207);
  });
});

describe("1년 법정 휴가 = min(주 근무일 × 5.6, 28)", () => {
  it("GOV.UK: 주 5일 28일 · 주 3일 16.8일 · 주 6일 28일(상한)", () => {
    expect(annualDays(5)).toEqual({ days: 28, capped: false, uncapped: 28 });
    expect(annualDays(3).days).toBe(16.8);
    expect(annualDays(6)).toEqual({ days: 28, capped: true, uncapped: 33.6 });
  });
  it("주 4일 22.4 · 2.5일 14 · 0 이하는 0", () => {
    expect(annualDays(4).days).toBe(22.4);
    expect(annualDays(2.5).days).toBe(14);
    expect(annualDays(0).days).toBe(0);
  });
  it("시간: 주 22.5시간 × 5.6 = 126 · 주 37.5시간 × 5.6 = 210 · 주 6일은 null", () => {
    expect(annualHours(3, 22.5)).toBe(126);
    expect(annualHours(5, 37.5)).toBe(210);
    expect(annualHours(6, 45)).toBeNull();
  });
});

describe("첫해 발생 — 1/12 씩, 반나절 단위 올림(reg 15A(3))", () => {
  it("GOV.UK: 주 5일 1개월 2.5일(28 ÷ 12 = 2.33) · 3개월 7일", () => {
    expect(firstYearAccrued(5, 1)).toBe(2.5);
    expect(firstYearAccrued(5, 3)).toBe(7);
  });
  it("주 5일 2개월 5(4.67) · 4개월 9.5(9.33) · 12개월 28", () => {
    expect(firstYearAccrued(5, 2)).toBe(5);
    expect(firstYearAccrued(5, 4)).toBe(9.5);
    expect(firstYearAccrued(5, 12)).toBe(28);
  });
  it("주 3일 1개월 1.5(1.4) · 6개월 8.5(8.4)", () => {
    expect(firstYearAccrued(3, 1)).toBe(1.5);
    expect(firstYearAccrued(3, 6)).toBe(8.5);
  });
});

describe("퇴사 (A × B) − C (reg 14(3)(b))", () => {
  it("1/1 시작, 7/1 퇴사(181일 지남 / 365), 10일 씀 → 28 × 181/365 − 10", () => {
    const r = leaving(5, "2026-01-01", "2026-07-01", 10)!;
    expect(r.elapsedDays).toBe(181);
    expect(r.yearDays).toBe(365);
    expect(r.owed).toBeCloseTo((28 * 181) / 365 - 10, 10);
  });
  it("윤년이 낀 leave year 는 366일", () => {
    expect(leaving(5, "2027-04-01", "2027-10-01", 0)!.yearDays).toBe(366);
  });
  it("leave year 밖이면 null", () => {
    expect(leaving(5, "2026-01-01", "2027-01-01", 0)).toBeNull();
    expect(leaving(5, "2026-01-01", "2025-12-31", 0)).toBeNull();
    expect(leaving(5, "2026-02-30", "2026-03-01", 0)).toBeNull();
  });
  it("더 쓰면 음수", () => {
    expect(leaving(5, "2026-01-01", "2026-02-01", 5)!.owed).toBeLessThan(0);
  });
});

describe("irregular hours (GB reg 15B) — 시간 × 12.07%, 30분 끝수", () => {
  it("GOV.UK: 30시간 → 3.621 → 4시간", () => {
    const r = irregularAccrued(30);
    expect(r.raw).toBeCloseTo(3.621, 10);
    expect(r.hours).toBe(4);
  });
  it("20시간 2.414 → 2 · 25시간 3.0175 → 3 · 29시간 3.5003 → 4 · 0", () => {
    expect(irregularAccrued(20).hours).toBe(2);
    // 25시간 × 12.07% = 3.0175 → 3
    expect(irregularAccrued(25).hours).toBe(3);
    // 29시간 × 12.07% = 3.5003 → 30분 이상 → 4
    expect(irregularAccrued(29).hours).toBe(4);
    expect(irregularAccrued(0).hours).toBe(0);
  });
});
