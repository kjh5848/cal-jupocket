/**
 * 야근수당 계산기 — overtimePay(). 비율은 근로기준법 제56조 ①②③, 4명 이하 제외는 시행령 별표 1, 통상시급은 시행령 제6조 ② 4호.
 * roberin(#14) 같은 입력 대조는 docs/calc-benchmark.md — 아래 'roberin' 값은 2026-10-18 관찰. 차이는 통상시급 단수(우리 버림·roberin 반올림, 총액은 roberin 이 버리기 전 시급으로 곱함).
 */
import { describe, it, expect } from "vitest";
import r from "../../rates/overtime-2026.json";
import { overtimePay, ordinaryHourly, splitHoliday } from "../overtime";

describe("rates — 제56조 원문 숫자", () => {
  it("연장 50% · 야간 50% · 휴일 8시간 이내 50% / 초과 100%", () => {
    expect([r.premium.overtime, r.premium.night, r.premium.holidayWithin8, r.premium.holidayOver8]).toEqual([0.5, 0.5, 0.5, 1]);
    expect(r.premium.holidayLimitHours).toBe(8);
    expect([r.premium.nightStart, r.premium.nightEnd]).toEqual([22, 6]);
    expect(r.overtimeLimit.weeklyHours).toBe(12);
    expect(r.smallBusiness.maxWorkers).toBe(4);
  });
});

describe("통상시급 — 시행령 제6조 ②", () => {
  it("시급은 그 금액", () => {
    expect(ordinaryHourly({ mode: "hourly", wage: 10320 })).toBe(10320);
  });
  it("월급 ÷ 209시간(주 40시간, 고시 관행) — 원 미만 버림", () => {
    expect(ordinaryHourly({ mode: "monthly", wage: 3_000_000 })).toBe(14354); // 14,354.07
    expect(ordinaryHourly({ mode: "monthly", wage: 2_156_880 })).toBe(10320); // 2026 최저 월 환산액
  });
  it("주 30시간 월급은 (30 + 6) × 365 ÷ 7 ÷ 12 = 156.43시간으로 나눔", () => {
    expect(ordinaryHourly({ mode: "monthly", wage: 2_500_000, weeklyHours: 30 })).toBe(15981); // 15,981.7
  });
});

describe("휴일 8시간 나누기 — 하루 단위", () => {
  it("10시간 1일 → 8 + 2", () => expect(splitHoliday(10)).toEqual({ within: 8, over: 2 }));
  it("10시간 3일 → 24 + 6", () => expect(splitHoliday(10, 3)).toEqual({ within: 24, over: 6 }));
  it("8시간 경계는 전부 이내", () => expect(splitHoliday(8, 2)).toEqual({ within: 16, over: 0 }));
  it("0·음수 → 0", () => expect(splitHoliday(-3, 2)).toEqual({ within: 0, over: 0 }));
});

describe("가산수당", () => {
  it("시급 10,320원 · 연장 2시간 → 가산 10,320 · 총 30,960 (roberin 과 같음)", () => {
    const x = overtimePay({ hourly: 10320, overtime: 2, night: 0, holidayWithin: 0, holidayOver: 0 });
    expect(x.premium.overtime).toBe(10320);
    expect(x.premiumTotal).toBe(10320);
    expect(x.total).toBe(30960);
  });
  it("월급 300만 · 연장 10 · 야간 4 → 가산 100,478 (roberin 과 같음), 총 244,018 (roberin 244,019 — 시급 단수)", () => {
    const x = overtimePay({ hourly: ordinaryHourly({ mode: "monthly", wage: 3_000_000 }), overtime: 10, night: 4, holidayWithin: 0, holidayOver: 0 });
    expect(x.premium.overtime).toBe(71770);
    expect(x.premium.night).toBe(28708);
    expect(x.premiumTotal).toBe(100478);
    expect(x.total).toBe(244018);
  });
  it("월급 300만 · 연장 12 · 야간 8 · 휴일 10시간 1일 → 항목별 roberin 과 같음, 합계 1원 차이(229,664 / 229,665)", () => {
    const h = splitHoliday(10);
    const x = overtimePay({ hourly: 14354, overtime: 12, night: 8, holidayWithin: h.within, holidayOver: h.over });
    expect(x.premium).toEqual({ overtime: 86124, night: 57416, holidayWithin: 57416, holidayOver: 28708 });
    expect(x.premiumTotal).toBe(229664);
    expect(x.basePay).toBe(14354 * 22);
    expect(x.total).toBe(545452);
  });
  it("상시 4명 이하 → 가산 0, 일한 시간 임금만(야간 시간은 더하지 않음)", () => {
    const x = overtimePay({ hourly: 14354, overtime: 12, night: 8, holidayWithin: 8, holidayOver: 2, small: true });
    expect(x.premiumTotal).toBe(0);
    expect(x.total).toBe(14354 * 22);
  });
  it("휴일근로는 연장 가산을 겹치지 않음 — 8시간 휴일 = 시급 × 8 × 1.5", () => {
    const x = overtimePay({ hourly: 10000, overtime: 0, night: 0, holidayWithin: 8, holidayOver: 0 });
    expect(x.total).toBe(120000);
  });
  it("1주 12시간 한도 알림(제53조 ①)", () => {
    expect(overtimePay({ hourly: 10000, overtime: 12, night: 0, holidayWithin: 0, holidayOver: 0 }).overWeeklyLimit).toBe(false);
    expect(overtimePay({ hourly: 10000, overtime: 12.5, night: 0, holidayWithin: 0, holidayOver: 0 }).overWeeklyLimit).toBe(true);
  });
  it("0·NaN 입력 → 0", () => {
    const x = overtimePay({ hourly: NaN, overtime: NaN, night: -1, holidayWithin: 0, holidayOver: 0 });
    expect(x.total).toBe(0);
  });
});
