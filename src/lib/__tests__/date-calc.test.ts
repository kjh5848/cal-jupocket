/** 날짜 계산기 — 손으로 센 기간·말일 처리·업무일, 공휴일 목록은 규정 제3조로 다시 세어 대조. */
import { describe, it, expect } from "vitest";
import rates from "../../rates/kr-holidays-2026.json";
import {
  toDay, fromDay, weekday, addMonths, span, shift, shiftBusiness, dday, label, spanText, holidayName, isBusinessDay,
  countdown, durationText, timeToSec,
} from "../date-calc";

const d = (s: string) => toDay(s)!;

describe("날짜 읽기", () => {
  it("없는 날짜·형식 오류는 null", () => {
    expect(toDay("2026-02-29")).toBeNull();
    expect(toDay("2026-13-01")).toBeNull();
    expect(toDay("2026/10/19")).toBeNull();
    expect(toDay("2024-02-29")).not.toBeNull();
  });
  it("요일 — 2026-10-19 는 월요일, 1970-01-01 은 목요일", () => {
    expect(weekday(d("2026-10-19"))).toBe(1);
    expect(weekday(0)).toBe(4);
    expect(label(d("2027-01-27"))).toBe("2027-01-27 (수)");
  });
});

describe("개월 더하기 — 없는 날은 말일로", () => {
  it("1/31 + 1개월 = 2/28, 윤년 2/29 + 1년 = 2/28", () => {
    expect(fromDay(addMonths(d("2026-01-31"), 1))).toBe("2026-02-28");
    expect(fromDay(addMonths(d("2024-01-31"), 1))).toBe("2024-02-29");
    expect(fromDay(shift(d("2024-02-29"), 1, "year"))).toBe("2025-02-28");
    expect(fromDay(shift(d("2026-08-31"), 6, "month"))).toBe("2027-02-28");
    expect(fromDay(addMonths(d("2026-03-31"), -1))).toBe("2026-02-28");
  });
  it("일·주 더하기·빼기", () => {
    expect(fromDay(shift(d("2026-10-19"), 100, "day"))).toBe("2027-01-27");
    expect(fromDay(shift(d("2026-10-19"), -30, "day"))).toBe("2026-09-19");
    expect(fromDay(shift(d("2026-10-19"), 2, "week"))).toBe("2026-11-02");
  });
});

describe("두 날짜 사이 기간", () => {
  it("2026-01-01 ~ 2026-12-31: 364일 · 11개월 30일, 포함하면 365일 · 1년", () => {
    const a = span(d("2026-01-01"), d("2026-12-31"), false);
    expect([a.days, a.years, a.months, a.restDays, a.weeks, a.weekRest]).toEqual([364, 0, 11, 30, 52, 0]);
    const b = span(d("2026-01-01"), d("2026-12-31"), true);
    expect([b.days, b.years, b.months, b.restDays, b.weeks, b.weekRest]).toEqual([365, 1, 0, 0, 52, 1]);
    expect(spanText(b)).toBe("1년");
  });
  it("윤년 2월을 건넌다 — 2024-02-28 ~ 03-01 은 2일", () => {
    expect(span(d("2024-02-28"), d("2024-03-01"), false).days).toBe(2);
    expect(span(d("2026-02-28"), d("2026-03-01"), false).days).toBe(1);
  });
  it("1/31 ~ 3/1 은 1개월 1일(1/31 + 1개월 = 2/28 에서 하루)", () => {
    const s = span(d("2026-01-31"), d("2026-03-01"), false);
    expect([s.months, s.restDays]).toEqual([1, 1]);
  });
  it("오늘 → 100일 뒤: 3개월 8일", () => {
    const s = span(d("2026-10-19"), d("2027-01-27"), false);
    expect([s.days, s.months, s.restDays, s.weeks, s.weekRest]).toEqual([100, 3, 8, 14, 2]);
  });
  it("종료일이 앞이면 바꿔 센다", () => {
    const s = span(d("2026-12-31"), d("2026-01-01"), false);
    expect(s.swapped).toBe(true);
    expect(s.days).toBe(364);
  });
  it("같은 날: 0일, 포함하면 1일", () => {
    expect(span(d("2026-10-19"), d("2026-10-19"), false).days).toBe(0);
    expect(span(d("2026-10-19"), d("2026-10-19"), true).days).toBe(1);
    expect(spanText(span(d("2026-10-19"), d("2026-10-19"), false))).toBe("0일");
  });
});

describe("평일·업무일", () => {
  it("2026년 전체(포함): 평일 261, 평일에 걸린 공휴일 16 → 업무일 245", () => {
    const s = span(d("2026-01-01"), d("2026-12-31"), true);
    expect(s.weekdays).toBe(261);
    expect(s.holidaysOnWeekdays.length).toBe(16);
    expect(s.businessDays).toBe(245);
  });
  it("추석·개천절 대체공휴일 구간 2026-09-21 ~ 10-11(포함): 업무일 11", () => {
    const s = span(d("2026-09-21"), d("2026-10-11"), true);
    expect(s.weekdays).toBe(15);
    expect(s.holidaysOnWeekdays.map((h) => h.date)).toEqual(["2026-09-24", "2026-09-25", "2026-10-05", "2026-10-09"]);
    expect(s.businessDays).toBe(11);
  });
  it("설 연휴 2026-02-09 ~ 02-27(포함): 업무일 12", () => {
    expect(span(d("2026-02-09"), d("2026-02-27"), true).businessDays).toBe(12);
  });
  it("공휴일 목록 밖(2028년)은 업무일을 내지 않는다", () => {
    expect(span(d("2027-12-01"), d("2028-01-10"), true).businessDays).toBeNull();
    expect(shiftBusiness(d("2027-12-30"), 5)).toBeNull();
  });
  it("업무일 더하기 — 기준일은 세지 않는다", () => {
    expect(fromDay(shiftBusiness(d("2026-09-21"), 5)!)).toBe("2026-09-30");
    expect(fromDay(shiftBusiness(d("2026-02-13"), 1)!)).toBe("2026-02-19");
    expect(fromDay(shiftBusiness(d("2026-10-06"), -1)!)).toBe("2026-10-02");
  });
  it("노동절(2026-05-01)·제헌절(2026-07-17)은 2026년 개정으로 공휴일", () => {
    expect(holidayName(d("2026-05-01"))).toBe("노동절");
    expect(holidayName(d("2026-07-17"))).toBe("제헌절");
    expect(isBusinessDay(d("2026-06-03"))).toBe(false);
  });
});

describe("공휴일 목록 — 규정 제3조로 대체공휴일을 다시 세어 맞춘다", () => {
  const base = rates.holidays.filter((h) => !h.name.startsWith("대체공휴일"));
  const listedSubs = rates.holidays.filter((h) => h.name.startsWith("대체공휴일")).map((h) => h.date).sort();
  const isHoliday = (n: number) => weekday(n) === 0 || base.some((h) => d(h.date) === n);
  it("대체공휴일 = 제3조 ① 1호(토·일) · 2호(설·추석은 일요일만), 1월 1일·현충일·선거일 제외", () => {
    const subs = new Set<number>();
    const next = (n: number) => {
      let m = n + 1;
      while (isHoliday(m) || subs.has(m) || weekday(m) === 6) m++;
      return m;
    };
    for (const h of base) {
      const n = d(h.date);
      const w = weekday(n);
      const lunar = /설날|추석/.test(h.name);
      const none = /1월 1일|현충일|선거일/.test(h.name);
      if (none) continue;
      if (lunar ? w === 0 : w === 0 || w === 6) subs.add(next(n));
    }
    expect([...subs].map(fromDay).sort()).toEqual(listedSubs);
  });
  it("대체공휴일은 모두 평일에 떨어지고, 토·일 주석이 실제 요일과 맞다", () => {
    for (const h of rates.holidays) {
      const w = weekday(d(h.date));
      if (h.name.startsWith("대체공휴일")) expect(w >= 1 && w <= 5, h.date).toBe(true);
      if (h.basis.includes("(토요일")) expect(w, h.date).toBe(6);
      if (h.basis.includes("(일요일")) expect(w, h.date).toBe(0);
    }
  });
});

describe("D-day", () => {
  it("앞·당일·지남", () => {
    const t = d("2026-10-19");
    expect(dday(d("2027-01-27"), t)).toBe("D-100");
    expect(dday(t, t)).toBe("D-Day");
    expect(dday(d("2026-10-16"), t)).toBe("D+3");
  });
});

describe("#75 날짜 차이 대조 입력 — 기간·시간 환산·며칠 뒤·앞", () => {
  it("2026 전체(미포함) 364일 · 52주 0일 · 8,736시간", () => {
    const s = span(d("2026-01-01"), d("2026-12-31"), false);
    expect([s.days, s.weeks, s.weekRest, s.hours]).toEqual([364, 52, 0, 8736]);
  });
  it("윤년 2/28~3/1 은 2일 · 48시간, 10/19~2027-01-27 은 100일 · 2,400시간", () => {
    expect(span(d("2024-02-28"), d("2024-03-01"), false).hours).toBe(48);
    const s = span(d("2026-10-19"), d("2027-01-27"), false);
    expect([s.days, s.months, s.restDays, s.weeks, s.weekRest, s.hours]).toEqual([100, 3, 8, 14, 2, 2400]);
  });
  it("종료일 포함이면 시간도 하루치 더한다", () => {
    expect(span(d("2026-01-01"), d("2026-12-31"), true).hours).toBe(8760);
  });
  it("3/1 − 30일 = 1/30(금), 2024-02-29 + 365일 = 2025-02-28(금), + 1,000일 = 2029-07-15(일)", () => {
    expect(label(shift(d("2026-03-01"), -30, "day"))).toBe("2026-01-30 (금)");
    expect(label(shift(d("2024-02-29"), 365, "day"))).toBe("2025-02-28 (금)");
    expect(label(shift(d("2026-10-19"), 1000, "day"))).toBe("2029-07-15 (일)");
  });
});

describe("#78 디데이 — 날짜는 D 표시, 시각은 남은 시간", () => {
  const T = 10 * 3600 + 16 * 60; // 기준일 오전 10:16
  it("같은 날은 시각과 상관없이 D-Day, 기준일 포함이면 1일", () => {
    const c = countdown(d("2026-10-19"), null, d("2026-10-19"), T);
    expect([c.dday, c.side, c.days, c.countDays]).toEqual(["D-Day", 0, 0, 1]);
    expect(durationText(c.seconds)).toBe("13시간 44분 0초"); // 그날 끝(다음 날 0시)까지
  });
  it("D-1 · D+1 경계", () => {
    expect(countdown(d("2026-10-20"), null, d("2026-10-19"), 0).dday).toBe("D-1");
    expect(countdown(d("2026-10-18"), null, d("2026-10-19"), 0).dday).toBe("D+1");
  });
  it("100일 뒤(2027-01-27)는 D-100, 기준일 포함 101일", () => {
    const c = countdown(d("2027-01-27"), null, d("2026-10-19"), T);
    expect([c.dday, c.days, c.countDays]).toEqual(["D-100", 100, 101]);
    expect(durationText(c.seconds)).toBe("100일 13시간 44분");
  });
  it("지난 날짜(10/1)는 D+18, 기준일 포함 19일, 그날 끝에서 17일 10시간 16분 지남", () => {
    const c = countdown(d("2026-10-01"), null, d("2026-10-19"), T);
    expect([c.dday, c.side, c.days, c.countDays]).toEqual(["D+18", -1, 18, 19]);
    expect(c.seconds).toBeLessThan(0);
    expect(durationText(c.seconds)).toBe("17일 10시간 16분");
  });
  it("윤일 2028-02-29 는 D-498, 2027-02-29 는 없는 날", () => {
    expect(countdown(d("2028-02-29"), null, d("2026-10-19"), T).dday).toBe("D-498");
    expect(toDay("2027-02-29")).toBeNull();
  });
  it("같은 날 14:00 기준 18:00 은 4시간 남음, 09:00 은 5시간 지남 — 둘 다 D-Day", () => {
    const now = 14 * 3600;
    const a = countdown(d("2026-07-10"), timeToSec("18:00"), d("2026-07-10"), now);
    const b = countdown(d("2026-07-10"), timeToSec("09:00"), d("2026-07-10"), now);
    expect([a.dday, a.seconds, durationText(a.seconds)]).toEqual(["D-Day", 4 * 3600, "4시간 0분 0초"]);
    expect([b.dday, b.seconds, durationText(b.seconds)]).toEqual(["D-Day", -5 * 3600, "5시간 0분 0초"]);
  });
  it("3일 뒤 18:00 — D-3 · 3일 7시간 44분", () => {
    const c = countdown(d("2026-10-22"), timeToSec("18:00"), d("2026-10-19"), T);
    expect([c.dday, durationText(c.seconds)]).toEqual(["D-3", "3일 7시간 44분"]);
  });
  it("시각 형식", () => {
    expect(timeToSec("00:00")).toBe(0);
    expect(timeToSec("23:59")).toBe(86_340);
    expect(timeToSec("24:00")).toBeNull();
    expect(timeToSec("9:00")).toBeNull();
  });
});
