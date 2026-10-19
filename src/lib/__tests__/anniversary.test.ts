import { describe, it, expect } from "vitest";
import { toDay, fromDay } from "../date-calc";
import { anniversary, nthDay, dayCount, monthMark, yearMark, upcoming } from "../anniversary";

const d = (s: string) => toDay(s)!;
const TODAY = d("2026-10-19");

describe("커플 기념일 계산기", () => {
  it("시작일 = 1일째 — N일은 시작일 + (N − 1) (roberin #85 대조값과 같음)", () => {
    const s = d("2026-02-28");
    expect(fromDay(nthDay(s, 100))).toBe("2026-06-07");
    expect(fromDay(nthDay(s, 300))).toBe("2026-12-24");
    expect(fromDay(nthDay(s, 1000))).toBe("2028-11-23");
    expect(fromDay(nthDay(d("2026-10-19"), 100))).toBe("2027-01-26");
    expect(dayCount(s, TODAY)).toBe(234);
    expect(dayCount(TODAY, TODAY)).toBe(1);
  });

  it("시작일을 0일로 고르면 하루씩 뒤로", () => {
    const s = d("2026-02-28");
    expect(fromDay(nthDay(s, 100, false))).toBe("2026-06-08");
    expect(dayCount(s, TODAY, false)).toBe(233);
    expect(dayCount(TODAY, TODAY, false)).toBe(0);
  });

  it("개월·주년은 달력 날짜 — 시작일에서 매번 더하고 없는 날은 말일", () => {
    const jan31 = d("2026-01-31");
    expect([8, 9, 10, 1].map((k) => fromDay(monthMark(jan31, k).day))).toEqual(["2026-09-30", "2026-10-31", "2026-11-30", "2026-02-28"]);
    const feb29 = d("2024-02-29");
    expect([1, 2, 3, 4].map((k) => fromDay(yearMark(feb29, k).day))).toEqual(["2025-02-28", "2026-02-28", "2027-02-28", "2028-02-29"]);
    expect(fromDay(monthMark(feb29, 31).day)).toBe("2026-09-29");
    expect(fromDay(monthMark(feb29, 32).day)).toBe("2026-10-29");
  });

  it("1주년과 365일은 다른 날", () => {
    const s = d("2025-10-20");
    expect(dayCount(s, TODAY)).toBe(365);
    expect(fromDay(yearMark(s, 1).day)).toBe("2026-10-20");
    expect(dayCount(s, yearMark(s, 1).day)).toBe(366);
  });

  it("함께한 기간은 간격 — roberin 과 같은 년·개월·일·주", () => {
    const a = anniversary(d("2026-02-28"), TODAY);
    expect([a.count, a.years, a.months, a.restDays, a.weeks]).toEqual([234, 0, 7, 21, 33]);
    const b = anniversary(d("2024-02-29"), TODAY);
    // roberin 은 2년 7개월 21일 — 2주년(2/28)에서 개월을 이어 더한 셈. 우리는 시작일 + 31개월(9/29, roberin 표의 31개월과 같은 날) + 20일
    expect([b.count, b.years, b.months, b.restDays, b.weeks]).toEqual([964, 2, 7, 20, 137]);
    const c = anniversary(d("2026-01-31"), TODAY);
    expect([c.count, c.months, c.restDays, c.weeks]).toEqual([262, 8, 19, 37]);
    const t = anniversary(TODAY, TODAY);
    expect([t.count, t.years, t.months, t.restDays, t.weeks]).toEqual([1, 0, 0, 0, 0]);
  });

  it("가장 가까운 기념일 — 오늘 포함, 같은 날은 주년이 먼저", () => {
    expect(anniversary(d("2026-02-28"), TODAY).next).toMatchObject({ name: "8개월", day: d("2026-10-28") });
    expect(anniversary(d("2026-01-31"), TODAY).next).toMatchObject({ name: "9개월", day: d("2026-10-31") });
    expect(anniversary(d("2025-10-20"), TODAY).next).toMatchObject({ name: "365일", day: TODAY });
    expect(upcoming(d("2025-10-19"), TODAY, true, 1)[0]).toMatchObject({ name: "1주년", kind: "year", day: TODAY });
    const v = upcoming(d("2024-02-29"), TODAY, true, 3).map((m) => m.name);
    expect(v).toEqual(["32개월", "1,000일", "33개월"]);
  });

  it("시작일이 오늘보다 뒤면 며칠째는 비우고 남은 날을 준다", () => {
    const a = anniversary(d("2026-12-25"), TODAY);
    expect(a.count).toBeNull();
    expect(a.untilStart).toBe(67);
    expect(fromDay(a.d100)).toBe("2027-04-03");
    expect(a.next).toMatchObject({ name: "22일" });
  });
});
