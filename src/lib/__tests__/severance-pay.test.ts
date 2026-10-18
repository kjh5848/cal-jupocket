/**
 * 퇴직금(지급액) — 고용노동부 퇴직금 계산 안내 예시와 경계값.
 * roberin 퇴직금계산기 대조(2026-10-18)는 docs/calc-benchmark.md.
 */
import { describe, it, expect } from "vitest";
import r from "../../rates/severance-2026.json";
import { parseDate, serviceDays, oneYearServed, wagePeriod, severancePayByDays } from "../severance-pay";

const d = (s: string) => parseDate(s)!;
const base = { wages3m: 0, annualBonus: 0, leavePay: 0, dailyOrdinary: 0, over15h: true };

describe("퇴직금 — 고용노동부 예시", () => {
  const E = r.pay.byDays.example;
  // 퇴사일자 2017-09-16 = 마지막 근무일 2017-09-15 다음 날
  const x = severancePayByDays({
    ...base, start: d(E.start), lastWorkDay: d("2017-09-15"),
    wages3m: E.wages3m, annualBonus: E.annualBonus, leavePay: 60_000 * 5,
  });
  it("재직일수 1,080일 · 3개월 92일", () => {
    expect(x.serviceDays).toBe(E.serviceDays);
    expect(x.period.days).toBe(E.periodDays);
  });
  it("상여 100만원 · 연차 7만5천원 가산", () => {
    expect(x.bonusAdd).toBe(E.bonusAdd);
    expect(x.leaveAdd).toBe(E.leaveAdd);
  });
  it("1일 평균임금 88,641원 30전대 — 끊지 않는다", () => {
    expect(x.average).toBeCloseTo(8_155_000 / 92, 6);
  });
  it("퇴직금 = 평균임금 × 30 × 1080/365, 원 미만 버림", () => {
    expect(x.amount).toBe(7_868_433);
  });
});

describe("퇴직금 — 경계", () => {
  it("roberin 예시 입력: 1,096일 · 1일 112,500원 → 10,134,246원(roberin 은 반올림 247)", () => {
    const x = severancePayByDays({
      ...base, start: d("2022-01-01"), lastWorkDay: d("2024-12-31"),
      wages3m: 9_600_000, annualBonus: 2_400_000, leavePay: 600_000,
    });
    expect(x.serviceDays).toBe(1096);
    expect(x.average).toBe(112_500);
    expect(x.amount).toBe(10_134_246);
  });
  it("roberin 대조 2·3: 364일 2,926,742원(roberin 740 — 평균임금을 원으로 먼저 반올림) · 통상임금 2,251일 14,801,095원(roberin 096)", () => {
    const a = severancePayByDays({ ...base, start: d("2025-01-02"), lastWorkDay: d("2025-12-31"), wages3m: 9_000_000 });
    expect([a.serviceDays, a.period.days, a.amount, a.eligible]).toEqual([364, 92, 2_926_742, false]);
    const b = severancePayByDays({ ...base, start: d("2020-01-01"), lastWorkDay: d("2026-02-28"), wages3m: 6_000_000, dailyOrdinary: 80_000 });
    expect([b.serviceDays, b.period.days, b.amount, b.usedOrdinary]).toEqual([2251, 90, 14_801_095, true]);
  });
  it("통상임금이 더 크면 통상임금으로", () => {
    const x = severancePayByDays({ ...base, start: d("2025-01-01"), lastWorkDay: d("2025-12-31"), wages3m: 6_000_000, dailyOrdinary: 80_000 });
    expect(x.usedOrdinary).toBe(true);
    expect(x.applied).toBe(80_000);
    expect(x.amount).toBe(2_400_000); // 80,000 × 30 × 365/365
  });
  it("1년이 되는 날: 2025-01-01 입사, 2025-12-31 마지막 근무 → 대상", () => {
    expect(oneYearServed(d("2025-01-01"), d("2025-12-31"))).toBe(true);
    expect(oneYearServed(d("2025-01-01"), d("2025-12-30"))).toBe(false);
    expect(serviceDays(d("2025-01-01"), d("2025-12-31"))).toBe(365);
  });
  it("1년 미만·주 15시간 미만은 법정 퇴직금 대상 아님", () => {
    const short = severancePayByDays({ ...base, start: d("2025-01-02"), lastWorkDay: d("2025-12-31"), wages3m: 9_000_000 });
    expect(short.eligible).toBe(false);
    expect(short.amount).toBeGreaterThan(0); // 참고 금액은 보여 준다
    const part = severancePayByDays({ ...base, start: d("2020-01-01"), lastWorkDay: d("2025-12-31"), wages3m: 9_000_000, over15h: false });
    expect(part.eligible).toBe(false);
  });
  it("2월 말 마지막 근무: 퇴직일 3/1 → 12/1~2/28 90일", () => {
    const p = wagePeriod(d("2020-01-01"), d("2026-02-28"));
    expect(p.days).toBe(90);
    expect(p.from.getMonth()).toBe(11);
    expect(p.from.getDate()).toBe(1);
  });
  it("잘못된 날짜는 null", () => {
    expect(parseDate("2026-02-30")).toBeNull();
    expect(parseDate("abc")).toBeNull();
  });
});
