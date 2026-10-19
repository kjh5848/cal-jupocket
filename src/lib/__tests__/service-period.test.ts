/**
 * 근속 기간 — 기대값은 민법 제160조 ②③ 손계산 + Python datetime 일수(roberin 숫자를 정답으로 쓰지 않음).
 * UTC 일련번호로 세므로 기기 시간대와 상관없이 같아야 한다(TZ=America/New_York 에서도 확인).
 */
import { describe, it, expect } from "vitest";
import { servicePeriodOf, periodText } from "../service-period";
import { fromDay } from "../date-calc";
import { parseDate, oneYearServed } from "../severance-pay";

const sp = (a: string, b: string, retireMode = false) => {
  const r = servicePeriodOf(a, b, retireMode);
  if (r === null) throw new Error(`${a} ${b}`);
  return r;
};
const ymd = (a: string, b: string) => {
  const r = sp(a, b);
  return [r.years, r.months, r.days];
};

describe("년·개월·일 (민법 제160조)", () => {
  it("2020-03-15 입사 ~ 2026-10-18 마지막 근무 = 6년 7개월 4일, 재직 2,409일", () => {
    const r = sp("2020-03-15", "2026-10-18");
    expect([r.years, r.months, r.days]).toEqual([6, 7, 4]);
    expect(r.serviceDays).toBe(2409);
    expect(r.totalMonths).toBe(79);
    expect(r.yearsDecimal).toBe(6.6);
    expect(fromDay(r.retire)).toBe("2026-10-19");
  });
  it("1년 꼭 채움 — 2025-10-20 ~ 2026-10-19 = 1년, 365일", () => {
    const r = sp("2025-10-20", "2026-10-19");
    expect([r.years, r.months, r.days]).toEqual([1, 0, 0]);
    expect(r.serviceDays).toBe(365);
    expect(r.oneYear).toBe(true);
  });
  it("하루 모자람 — 2025-10-20 ~ 2026-10-18 = 11개월 29일, 1년 미만", () => {
    const r = sp("2025-10-20", "2026-10-18");
    expect([r.years, r.months, r.days]).toEqual([0, 11, 29]);
    expect(r.oneYear).toBe(false);
  });
  it("1/31 입사: 2월 말일까지 일해야 1개월(제160조 ③) — 2024-02-28 은 29일, 2024-02-29 는 1개월", () => {
    expect(ymd("2024-01-31", "2024-02-28")).toEqual([0, 0, 29]);
    expect(ymd("2024-01-31", "2024-02-29")).toEqual([0, 1, 0]);
    expect(ymd("2025-01-31", "2025-02-28")).toEqual([0, 1, 0]);
  });
  it("3/31 입사 → 4/30 까지 1개월, 5/1 은 1개월 1일", () => {
    expect(ymd("2026-03-31", "2026-04-30")).toEqual([0, 1, 0]);
    expect(ymd("2026-03-31", "2026-05-01")).toEqual([0, 1, 1]);
  });
  it("2/29 입사: 평년 2/28 까지 일하면 1년, 2/27 까지면 11개월 30일", () => {
    expect(ymd("2024-02-29", "2025-02-28")).toEqual([1, 0, 0]);
    expect(ymd("2024-02-29", "2025-02-27")).toEqual([0, 11, 30]);
    expect(sp("2024-02-29", "2025-02-28").serviceDays).toBe(366);
  });
  it("입사 당일 퇴사 = 1일", () => {
    const r = sp("2026-10-19", "2026-10-19");
    expect([r.years, r.months, r.days, r.serviceDays]).toEqual([0, 0, 1, 1]);
    expect(periodText(r)).toBe("1일");
  });
  it("마지막 근무일이 입사일보다 앞이면 null, 없는 날짜도 null", () => {
    expect(servicePeriodOf("2026-10-19", "2026-10-18")).toBeNull();
    expect(servicePeriodOf("2026-02-30", "2026-10-18")).toBeNull();
  });
});

describe("퇴직일 입력 · 부가 결과", () => {
  it("퇴직일(마지막 근무일 다음 날)로 넣으면 하루 앞당겨 센다", () => {
    expect(sp("2020-03-15", "2026-10-19", true)).toEqual(sp("2020-03-15", "2026-10-18"));
  });
  it("주 환산 — 2,409일 = 344주 1일", () => {
    const r = sp("2020-03-15", "2026-10-18");
    expect([r.weeks, r.weekRest]).toEqual([344, 1]);
  });
  it("다음 만 1년 — 2026-03-02 입사면 2027-03-01 까지 근무, 2026-10-19 기준 133일 남음", () => {
    const r = sp("2026-03-02", "2026-10-19");
    expect(r.nextYears).toBe(1);
    expect(fromDay(r.nextLastDay)).toBe("2027-03-01");
    expect(r.daysToNext).toBe(133);
  });
  it("2/29 입사의 다음 만 1년 마지막 근무일은 평년 2/28", () => {
    expect(fromDay(sp("2024-02-29", "2024-10-01").nextLastDay)).toBe("2025-02-28");
  });
  it("periodText — 0인 칸은 뺀다", () => {
    expect(periodText({ years: 2, months: 0, days: 5 })).toBe("2년 5일");
    expect(periodText({ years: 0, months: 3, days: 0 })).toBe("3개월");
  });
});

describe("퇴직금 계산기와 같은 '1년 이상' 판정", () => {
  const cases: [string, string][] = [
    ["2024-02-29", "2025-02-27"],
    ["2024-02-29", "2025-02-28"],
    ["2025-10-20", "2026-10-18"],
    ["2025-10-20", "2026-10-19"],
    ["2025-01-31", "2026-01-30"],
    ["2020-03-15", "2026-10-18"],
  ];
  for (const [a, b] of cases) {
    it(`${a} ~ ${b}`, () => {
      expect(sp(a, b).oneYear).toBe(oneYearServed(parseDate(a)!, parseDate(b)!));
    });
  }
});
