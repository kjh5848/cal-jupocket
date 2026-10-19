import { describe, it, expect } from "vitest";
import { toDay } from "../date-calc";
import { dayInfo, isLeap, isoWeek } from "../date-day";

const at = (s: string, start: 0 | 1 = 0) => dayInfo(toDay(s)!, start);

describe("날짜 요일 계산기", () => {
  it("요일 · 연중 일수 · 남은 일수 (roberin #74 대조값과 같음)", () => {
    const a = at("2026-10-19");
    expect([a.weekday, a.dayOfYear, a.daysInYear, a.daysLeft, a.calWeek]).toEqual([1, 292, 365, 73, 43]);
    const b = at("2024-02-29");
    expect([b.weekday, b.dayOfYear, b.daysInYear, b.daysLeft, b.leap]).toEqual([4, 60, 366, 306, true]);
    expect(at("2026-12-31").daysLeft).toBe(0);
    expect(at("1900-03-01").weekday).toBe(4);
  });

  it("윤년 — 100의 배수는 400으로 나눠질 때만(USNO)", () => {
    expect([1900, 2000, 2100, 2024, 2026, 1600, 2400].map(isLeap)).toEqual([false, true, false, true, false, true, true]);
    expect(at("2100-03-01").dayOfYear).toBe(60);
    expect(at("2000-02-29").daysLeft).toBe(306);
  });

  it("ISO 주차 — Python isocalendar() 값과 같음, 연 경계에서 ISO 연도가 바뀜", () => {
    expect(isoWeek(toDay("2026-10-19")!)).toEqual({ year: 2026, week: 43 });
    expect(isoWeek(toDay("2021-01-03")!)).toEqual({ year: 2020, week: 53 });
    expect(isoWeek(toDay("2027-01-01")!)).toEqual({ year: 2026, week: 53 });
    expect(isoWeek(toDay("2024-12-30")!)).toEqual({ year: 2025, week: 1 });
    expect(isoWeek(toDay("2026-12-31")!)).toEqual({ year: 2026, week: 53 });
    expect(isoWeek(toDay("2003-12-29")!)).toEqual({ year: 2004, week: 1 });
    expect(at("2021-01-03").isoText).toBe("2020-W53-7");
  });

  it("달력 주차 — 주 시작 요일에 따라 다름(1월 1일이 든 주 = 1주)", () => {
    expect(at("2021-01-03", 0).calWeek).toBe(2); // 일요일 시작: 1/3(일)부터 둘째 주
    expect(at("2021-01-03", 1).calWeek).toBe(1); // 월요일 시작: 1/1~1/3 이 첫 주
    expect(at("2027-01-01").calWeek).toBe(1);
    expect(at("2024-12-30").calWeek).toBe(53);
  });

  it("월 주차(달력 줄)와 몇째 요일", () => {
    const a = at("2026-10-19");
    expect([a.monthWeek, a.nth, a.nthText]).toEqual([4, 3, "셋째 월요일"]);
    expect(at("2024-12-30", 0).monthWeek).toBe(5);
    expect(at("2024-12-30", 1).monthWeek).toBe(6);
    expect(at("2024-12-30", 1).monthWeekText).toBe("12월 여섯째 주");
    expect(a.monthWeekText).toBe("10월 넷째 주");
    expect(at("2026-10-09").nthText).toBe("둘째 금요일");
  });

  it("공휴일 — 목록 범위 안에서만 판정", () => {
    expect(at("2026-10-09").holiday).toBe("한글날");
    expect(at("2026-10-19").holiday).toBe("");
    expect(at("2025-10-09").holiday).toBeNull();
  });

  it("Unix 는 UTC 0시 기준", () => {
    expect(at("2026-10-19").unix).toBe(1792368000);
    expect(at("1900-03-01").unix).toBe(-2203891200);
  });
});
