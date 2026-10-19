import { describe, it, expect } from "vitest";
import { toDay, fromDay } from "../date-calc";
import { dayInfo } from "../date-day";
import { yearLeft, monthFirsts, pctText } from "../year-left";

const d = (s: string) => toDay(s)!;

// 기대값은 Python datetime 으로 따로 뽑았다(date 빼기 · 요일 세기 · 공휴일 목록 대조).
// roberin #84 화면값(10/19 · 9/24 · 매월 1일 표)과도 같다 — 평일에서 공휴일을 빼는 업무일만 우리가 더 센다.
describe("올해 남은 날", () => {
  it("2026-10-19 — 73일 남음 · 오늘 포함 74 · 292번째 · 10주 3일 · 토 10 · 일 10 · 평일 53", () => {
    const r = yearLeft(d("2026-10-19"));
    expect(r.year).toBe(2026);
    expect(r.daysInYear).toBe(365);
    expect(r.dayOfYear).toBe(292);
    expect(r.daysLeft).toBe(73);
    expect(r.daysLeftIncl).toBe(74);
    expect([r.weeks, r.weekRest]).toEqual([10, 3]);
    expect([r.saturdays, r.sundays, r.weekdays]).toEqual([10, 10, 53]);
    expect(r.businessDays).toBe(52); // 12/25 기독탄신일(금)
    expect(r.holidays!.map((h) => fromDay(h.day))).toEqual(["2026-12-25"]);
    expect(r.monthLeft).toBe(12);
    expect(r.quarterLeft).toBe(73);
    expect(r.quarter).toBe(4);
  });

  it("2026-09-24 — 98일 · 99일 · 14주 0일, 남은 공휴일에 추석·개천절 대체공휴일", () => {
    const r = yearLeft(d("2026-09-24"));
    expect([r.dayOfYear, r.daysLeft, r.daysLeftIncl]).toEqual([267, 98, 99]);
    expect([r.weeks, r.weekRest]).toEqual([14, 0]);
    expect([r.saturdays, r.sundays, r.weekdays, r.businessDays]).toEqual([14, 14, 70, 66]);
    expect(r.holidays!.map((h) => fromDay(h.day))).toEqual(["2026-09-25", "2026-09-26", "2026-10-03", "2026-10-05", "2026-10-09", "2026-12-25"]);
    expect(r.monthLeft).toBe(6);
    expect(r.quarterLeft).toBe(6);
  });

  it("1월 1일은 364일 남음, 12월 31일은 0일 · 오늘 포함 1일", () => {
    const a = yearLeft(d("2026-01-01"));
    expect([a.dayOfYear, a.daysLeft, a.daysLeftIncl]).toEqual([1, 364, 365]);
    expect([a.saturdays, a.sundays, a.weekdays, a.businessDays]).toEqual([52, 52, 260, 245]);
    expect(a.progress).toBe(0);
    const z = yearLeft(d("2026-12-31"));
    expect([z.dayOfYear, z.daysLeft, z.daysLeftIncl]).toEqual([365, 0, 1]);
    expect([z.saturdays, z.sundays, z.weekdays, z.businessDays]).toEqual([0, 0, 0, 0]);
    expect(z.holidays).toEqual([]);
    expect(z.monthLeft).toBe(0);
    expect(z.quarterLeft).toBe(0);
  });

  it("윤년 2028 — 366일, 2/29 는 60번째 날 · 12/31 은 366번째. 공휴일 목록 밖이라 업무일은 null", () => {
    const r = yearLeft(d("2028-02-29"));
    expect(r.leap).toBe(true);
    expect([r.daysInYear, r.dayOfYear, r.daysLeft]).toEqual([366, 60, 306]);
    expect([r.saturdays, r.sundays, r.weekdays]).toEqual([44, 44, 218]);
    expect(r.businessDays).toBeNull();
    expect(r.holidays).toBeNull();
    expect(r.monthLeft).toBe(0); // 2월 말일
    expect(r.quarterLeft).toBe(31);
    expect(yearLeft(d("2028-12-31")).dayOfYear).toBe(366);
  });

  it("2027 도 공휴일 목록 안 — 2/28 기준 업무일 208", () => {
    const r = yearLeft(d("2027-02-28"));
    expect([r.dayOfYear, r.daysLeft, r.weekdays, r.businessDays]).toEqual([59, 306, 220, 208]);
    expect(r.holidays!.length).toBe(19);
  });

  it("N일 남은 날 = 12월 31일 − N — 윤년이어도 날짜가 같다", () => {
    expect(yearLeft(d("2026-10-19")).milestones.map((m) => fromDay(m.day))).toEqual(["2026-09-22", "2026-11-11", "2026-12-01", "2026-12-21"]);
    expect(yearLeft(d("2028-01-05")).milestones.map((m) => fromDay(m.day))).toEqual(["2028-09-22", "2028-11-11", "2028-12-01", "2028-12-21"]);
    // 그날 기준으로 다시 세면 정말 N일 남는다
    for (const m of yearLeft(d("2026-03-03")).milestones) expect(yearLeft(m.day).daysLeft).toBe(m.left);
  });

  it("진행률은 시간 기준 — 1/1 0시 0%, 10/19 22:15:15 는 79.98%, 12/31 23:59:59 도 100% 를 넘지 않는다", () => {
    expect(yearLeft(d("2026-10-19"), 22 * 3600 + 15 * 60 + 15).progress).toBeCloseTo(79.98007, 4);
    expect(yearLeft(d("2026-07-02"), 12 * 3600).progress).toBeCloseTo(50, 9); // 182.5일 / 365일
    const end = yearLeft(d("2026-12-31"), 86_399);
    expect(end.progress).toBeLessThan(100);
    expect(pctText(end.progress)).toBe("99.9%");
    expect(pctText(79.98)).toBe("79.9%");
  });

  it("새해까지 초 — 남은 날 + 오늘 남은 시간", () => {
    expect(yearLeft(d("2026-12-31"), 86_399).secondsToNewYear).toBe(1);
    expect(yearLeft(d("2026-12-31")).secondsToNewYear).toBe(86_400);
    // roberin 10/19 22:15:15 의 '연말까지 1,753시간'(내림)과 같다
    expect(Math.floor(yearLeft(d("2026-10-19"), 80_115).secondsToNewYear / 3600)).toBe(1753);
  });

  it("날짜 요일 계산기(dayInfo)와 몇 번째 날 · 남은 날이 어긋나지 않는다", () => {
    for (let n = d("2026-01-01"); n <= d("2028-12-31"); n += 13) {
      const r = yearLeft(n);
      const i = dayInfo(n);
      expect([r.dayOfYear, r.daysLeft], fromDay(n)).toEqual([i.dayOfYear, i.daysLeft]);
      expect(r.saturdays + r.sundays + r.weekdays).toBe(r.daysLeft);
    }
  });

  it("매월 1일 표 — roberin 표와 같은 값(2026)", () => {
    const rows = monthFirsts(2026);
    expect(rows.map((r) => r.dayOfYear)).toEqual([1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]);
    expect(rows.map((r) => r.daysLeft)).toEqual([364, 333, 305, 274, 244, 213, 183, 152, 121, 91, 60, 30]);
  });

  it("12월 24일 — 남은 7일 중 금요일 12/25 하나가 공휴일", () => {
    const r = yearLeft(d("2026-12-24"));
    expect([r.daysLeft, r.weekdays, r.businessDays]).toEqual([7, 5, 4]);
  });
});
