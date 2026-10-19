import { describe, it, expect } from "vitest";
import { toDay, fromDay, weekday } from "../date-calc";
import { birthdayDday, birthdayIn, nextBirthday, prevBirthday, upcomingBirthdays, validMonthDay } from "../birthday-dday";
import { age } from "../age";

const d = (s: string) => toDay(s)!;
const TODAY = d("2026-10-19");

// 기대값은 Python datetime 으로 따로 뽑았다(date 빼기). roberin #81 화면값과도 같다(2월 29일 기본 규칙만 다름 — 아래).
describe("생일 디데이", () => {
  it("보통 생일 — 다음 생일 · D-몇 · 이번 생일 나이 · 살아온 날 · 진행률", () => {
    const r = birthdayDday(3, 14, 1995, TODAY)!;
    expect(fromDay(r.next)).toBe("2027-03-14");
    expect(weekday(r.next)).toBe(0); // 일요일
    expect(r.daysLeft).toBe(146);
    expect(r.turningAge).toBe(32);
    expect(r.currentAge).toBe(31);
    expect(r.livedDays).toBe(11542);
    expect(fromDay(r.prev)).toBe("2026-03-14");
    expect(r.progress).toBeCloseTo(60, 6);
  });

  it("오늘이 생일이면 D-Day 이고 내년으로 넘어가지 않는다 · 진행률 100%", () => {
    const r = birthdayDday(10, 19, 2000, TODAY)!;
    expect(r.next).toBe(TODAY);
    expect(r.daysLeft).toBe(0);
    expect(r.turningAge).toBe(26);
    expect(r.currentAge).toBe(26);
    expect(r.livedDays).toBe(9496);
    expect(r.progress).toBe(100);
    const t = birthdayDday(10, 20, 2000, TODAY)!;
    expect(t.daysLeft).toBe(1);
    expect(t.currentAge).toBe(25);
  });

  it("연말·연초 경계 — 12/31 · 1/1, 올해 태어난 아기", () => {
    const a = birthdayDday(12, 31, 1990, TODAY)!;
    expect(fromDay(a.next)).toBe("2026-12-31");
    expect(a.daysLeft).toBe(73);
    expect(a.turningAge).toBe(36);
    expect(a.livedDays).toBe(13076);
    const b = birthdayDday(1, 1, 2026, TODAY)!;
    expect(fromDay(b.next)).toBe("2027-01-01");
    expect(b.daysLeft).toBe(74);
    expect(b.turningAge).toBe(1);
    expect(b.currentAge).toBe(0);
    expect(b.livedDays).toBe(291);
    expect(fromDay(b.prev)).toBe("2026-01-01");
  });

  it("2월 29일생 — 기본은 3월 1일(민법 제160조 ③, 만 나이 계산기와 같은 날)", () => {
    const r = birthdayDday(2, 29, 2004, TODAY)!;
    expect(fromDay(r.next)).toBe("2027-03-01");
    expect(r.daysLeft).toBe(133);
    expect(r.turningAge).toBe(23);
    expect(r.livedDays).toBe(8268);
    expect(r.progress).toBeCloseTo((232 / 365) * 100, 6);
    // 만 나이 계산기가 한 살 더 먹는 날과 같다
    expect(age(d("2004-02-29"), d("2027-02-28"))!.years).toBe(22);
    expect(age(d("2004-02-29"), d("2027-03-01"))!.years).toBe(23);
    expect(age(d("2004-02-29"), TODAY)!.next).toBe(r.next);
  });

  it("2월 29일생 — 2월 28일(관습) · 실제 2월 29일만(4년 주기, 2100년은 평년)", () => {
    const f = birthdayDday(2, 29, 2004, TODAY, "feb28")!;
    expect(fromDay(f.next)).toBe("2027-02-28");
    expect(f.daysLeft).toBe(132);
    // 축하하는 날이 2/28 이어도 지금 만 나이는 법대로(3월 1일에 한 살)
    expect(birthdayDday(2, 29, 2004, d("2027-02-28"), "feb28")!.currentAge).toBe(22);
    const only = birthdayDday(2, 29, 2004, TODAY, "feb29")!;
    expect(fromDay(only.next)).toBe("2028-02-29");
    expect(only.daysLeft).toBe(498);
    expect(only.turningAge).toBe(24);
    expect(fromDay(only.prev)).toBe("2024-02-29");
    expect(only.progress).toBeCloseTo((963 / 1461) * 100, 6);
    expect(fromDay(prevBirthday(2, 29, d("2104-02-29"), "feb29"))).toBe("2096-02-29");
    expect(birthdayIn(2100, 2, 29, "feb29")).toBeNull();
  });

  it("윤년 2월 29일 당일은 세 규칙 모두 D-Day", () => {
    const leap = d("2028-02-29");
    for (const rule of ["mar1", "feb28", "feb29"] as const) {
      expect(nextBirthday(2, 29, leap, rule), rule).toBe(leap);
    }
  });

  it("태어난 해 비우기 · 없는 날짜 · 기준일보다 늦게 태어남", () => {
    const r = birthdayDday(3, 14, null, TODAY)!;
    expect(r.daysLeft).toBe(146);
    expect(r.turningAge).toBeNull();
    expect(r.currentAge).toBeNull();
    expect(r.livedDays).toBeNull();
    expect(validMonthDay(4, 31)).toBe(false);
    expect(validMonthDay(2, 30)).toBe(false);
    expect(validMonthDay(2, 29)).toBe(true);
    expect(birthdayDday(4, 31, null, TODAY)).toBeNull();
    expect(birthdayDday(2, 29, 2023, TODAY)).toBeNull(); // 2023년엔 2월 29일이 없다
    expect(birthdayDday(12, 1, 2026, TODAY)).toBeNull(); // 아직 안 태어남
  });

  it("앞으로 생일 목록 — 다음 생일부터 차례로", () => {
    const list = upcomingBirthdays(3, 14, TODAY, "mar1", 3).map(fromDay);
    expect(list).toEqual(["2027-03-14", "2028-03-14", "2029-03-14"]);
    const leap = upcomingBirthdays(2, 29, TODAY, "feb29", 2).map(fromDay);
    expect(leap).toEqual(["2028-02-29", "2032-02-29"]);
  });
});
