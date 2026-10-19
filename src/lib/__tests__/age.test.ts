/** 만 나이 — 민법 제158조(출생일 산입)·제160조 ②③(전날 만료·해당일 없으면 말일)로 손으로 센 값. */
import { describe, it, expect } from "vitest";
import { age, ageOf, dayOfAge } from "../age";
import { toDay, fromDay } from "../date-calc";

const a = (b: string, t: string) => ageOf(b, t)!;

describe("만 나이 — 생일 당일부터 한 살", () => {
  it("생일 전날·당일·다음 날", () => {
    expect(a("1990-10-20", "2026-10-19").years).toBe(35);
    expect(a("1990-10-20", "2026-10-20").years).toBe(36);
    expect(a("1990-10-20", "2026-10-21").years).toBe(36);
  });
  it("연 나이 · 세는 나이는 연도만 본다", () => {
    const x = a("1990-10-20", "2026-10-19");
    expect(x.yearAge).toBe(36);
    expect(x.koreanAge).toBe(37);
    const y = a("2007-12-31", "2026-01-01"); // 청소년 보호법: 19세가 되는 해 1월 1일 — 연 나이 19
    expect(y.yearAge).toBe(19);
    expect(y.years).toBe(18);
  });
  it("태어난 날 — 만 0세 0개월 0일, 1일째", () => {
    const x = a("2026-10-19", "2026-10-19");
    expect([x.years, x.totalMonths, x.days, x.livedDays, x.dayCount, x.yearAge, x.koreanAge]).toEqual([0, 0, 0, 0, 1, 0, 1]);
    expect(x.turnsToday).toBe(false);
    expect(fromDay(x.next)).toBe("2027-10-19");
  });
  it("출생일이 기준일보다 뒤면 null", () => {
    expect(ageOf("2027-01-01", "2026-10-19")).toBeNull();
    expect(ageOf("2026-02-30", "2026-10-19")).toBeNull();
  });
});

describe("2월 29일생 — 평년엔 2월 28일로 기간이 끝나 3월 1일부터 한 살 (제160조 ③)", () => {
  it("평년 2/28 은 아직, 3/1 부터", () => {
    expect(a("2004-02-29", "2025-02-28").years).toBe(20);
    expect(a("2004-02-29", "2025-03-01").years).toBe(21);
    expect(a("2004-02-29", "2025-03-01").turnsToday).toBe(true);
    expect(fromDay(a("2004-02-29", "2025-02-28").next)).toBe("2025-03-01");
  });
  it("윤년엔 2/29 당일", () => {
    expect(a("2004-02-29", "2028-02-28").years).toBe(23);
    expect(a("2004-02-29", "2028-02-29").years).toBe(24);
  });
  it("만 19세 되는 날", () => {
    expect(fromDay(dayOfAge(toDay("2004-02-29")!, 19))).toBe("2023-03-01");
    expect(fromDay(dayOfAge(toDay("2007-05-10")!, 19))).toBe("2026-05-10");
  });
});

describe("개월 수 — 1세 미만은 월수로 (제158조 단서)", () => {
  it("3개월 12일", () => {
    const x = a("2026-07-07", "2026-10-19");
    expect([x.totalMonths, x.months, x.days]).toEqual([3, 3, 12]);
  });
  it("31일생 — 30일까지인 달은 다음 달 1일에 한 달", () => {
    expect([a("2026-01-31", "2026-02-28").totalMonths, a("2026-01-31", "2026-02-28").days]).toEqual([0, 28]);
    expect([a("2026-01-31", "2026-03-01").totalMonths, a("2026-01-31", "2026-03-01").days]).toEqual([1, 0]);
    expect([a("2026-01-31", "2026-03-31").totalMonths, a("2026-01-31", "2026-03-31").days]).toEqual([2, 0]);
    expect([a("2026-01-31", "2026-04-30").totalMonths, a("2026-01-31", "2026-04-30").days]).toEqual([2, 30]);
  });
  it("만 나이 뒤 개월·일 — 1990-10-20 → 2026-10-19 는 35세 11개월 29일", () => {
    const x = a("1990-10-20", "2026-10-19");
    expect([x.years, x.months, x.days, x.totalMonths]).toEqual([35, 11, 29, 431]);
  });
});

describe("roberin #78 대조 입력 — 살아온 날·다음 생일", () => {
  it("1990-10-20 → 2026-10-19: 13,148일, 다음 날 36세", () => {
    const x = a("1990-10-20", "2026-10-19");
    expect(x.livedDays).toBe(13_148);
    expect(fromDay(x.next)).toBe("2026-10-20");
    expect([x.nextAge, x.daysToNext]).toEqual([36, 1]);
  });
  it("2000-01-01 → 2026-10-19: 26세, 9,788일, 다음 2027-01-01 까지 74일", () => {
    const x = a("2000-01-01", "2026-10-19");
    expect([x.years, x.yearAge, x.koreanAge, x.livedDays, x.daysToNext]).toEqual([26, 26, 27, 9_788, 74]);
  });
  it("2004-02-29 → 2028-02-29: 8,766일", () => {
    expect(a("2004-02-29", "2028-02-29").livedDays).toBe(8_766);
  });
  it("생일 당일이면 다음은 1년 뒤", () => {
    const x = age(toDay("1990-10-19")!, toDay("2026-10-19")!)!;
    expect(x.turnsToday).toBe(true);
    expect(fromDay(x.next)).toBe("2027-10-19");
    expect(x.nextAge).toBe(37);
  });
});
