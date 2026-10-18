/**
 * 마이너스통장 일할 이자 — 기대값은 식으로 쓴다(사용 금액 × 연 이자율 × 날수 ÷ 해의 날수, 회차마다 원 미만 버림).
 * roberin 같은 입력 5개와 회차별 금액이 같았다(docs/calc-benchmark.md) — 그 숫자를 정답으로 쓰지 않는다.
 */
import { describe, it, expect } from "vitest";
import { overdraftInterest, nextBill, parseDate, splitDays, fmtDate } from "../overdraft";

const f = Math.floor;

describe("날짜 도우미", () => {
  it("잘못된 날짜는 NaN", () => {
    expect(parseDate("2026-02-30")).toBeNaN();
    expect(parseDate("2026/01/01")).toBeNaN();
  });
  it("결제일은 시작일보다 뒤 — 시작일이 결제일이면 다음 달", () => {
    expect(fmtDate(nextBill(parseDate("2026-01-01"), 25))).toBe("2026-01-25");
    expect(fmtDate(nextBill(parseDate("2026-01-25"), 25))).toBe("2026-02-25");
  });
  it("말일 결제 — 1월 31일 시작이면 2월 28일", () => {
    expect(fmtDate(nextBill(parseDate("2026-01-31"), "last"))).toBe("2026-02-28");
    expect(fmtDate(nextBill(parseDate("2028-02-10"), "last"))).toBe("2028-02-29");
  });
  it("해를 넘는 구간은 평년·윤년 날수로 나뉜다", () => {
    expect(splitDays(parseDate("2027-12-25"), parseDate("2028-01-25"))).toEqual({ common: 7, leap: 24 });
  });
});

describe("마이너스통장 이자", () => {
  it("1천만원 5% 30일, 결제일 25일 — 24일 + 6일 두 회차", () => {
    const x = overdraftInterest({ amount: 10_000_000, ratePct: 5, days: 30, start: "2026-01-01", payDay: 25 });
    expect(x.rows.map((r) => [r.billDate, r.days])).toEqual([["2026-01-25", 24], ["2026-01-31", 6]]);
    const a = f((10_000_000 * 5 * 24) / (100 * 365));
    const b = f((10_000_000 * 5 * 6) / (100 * 365));
    expect(x.rows.map((r) => r.interest)).toEqual([a, b]);
    expect(x.totalInterest).toBe(a + b);
    expect(x.lastDay).toBe("2026-01-30");
    expect(x.dailyInterest).toBe(f((10_000_000 * 0.05) / 365));
  });

  it("총 이자는 회차 합 — 한 번에 버린 값보다 작거나 같다", () => {
    const x = overdraftInterest({ amount: 30_000_000, ratePct: 7, days: 90, start: "2026-03-10", payDay: "last" });
    expect(x.rows.map((r) => r.days)).toEqual([21, 30, 31, 8]);
    expect(x.totalInterest).toBe(x.rows.reduce((s, r) => s + r.interest, 0));
    expect(x.totalInterest).toBeLessThanOrEqual(f((30_000_000 * 7 * 90) / (100 * 365)));
    expect(x.rows[0].interest).toBe(f((30_000_000 * 7 * 21) / (100 * 365)));
  });

  it("윤년 날은 366으로 나눈다 — 2028년 1월 31일", () => {
    const x = overdraftInterest({ amount: 50_000_000, ratePct: 8.25, days: 365, start: "2027-12-15", payDay: 1 });
    expect(x.rows).toHaveLength(13);
    expect(x.rows[0].interest).toBe(f(50_000_000 * 0.0825 * 17 / 365));
    expect(x.rows[1].interest).toBe(f(50_000_000 * 0.0825 * 31 / 366));
    expect(x.rows[2].leapDays).toBe(29);
    expect(x.endDate).toBe("2028-12-14");
  });

  it("해를 넘는 회차는 나눠 더한 뒤 한 번만 버린다", () => {
    const x = overdraftInterest({ amount: 10_000_000, ratePct: 6.5, days: 40, start: "2027-12-20", payDay: 25 });
    expect(x.rows.map((r) => r.days)).toEqual([5, 31, 4]);
    expect(x.rows[1].interest).toBe(f(650_000 * (7 / 365 + 24 / 366)));
    expect(x.rows[1].leapDays).toBe(24);
  });

  it("끝날이 결제일이면 마지막 회차가 따로 생기지 않는다", () => {
    const x = overdraftInterest({ amount: 10_000_000, ratePct: 5, days: 24, start: "2026-01-01", payDay: 25 });
    expect(x.rows).toHaveLength(1);
    expect(x.rows[0].billDate).toBe("2026-01-25");
  });

  it("0% 이자는 0원, 하루만 써도 한 회차", () => {
    expect(overdraftInterest({ amount: 10_000_000, ratePct: 0, days: 10, start: "2026-01-01", payDay: 25 }).totalInterest).toBe(0);
    const one = overdraftInterest({ amount: 10_000_000, ratePct: 5, days: 1, start: "2026-01-01", payDay: 25 });
    expect(one.rows).toHaveLength(1);
    expect(one.totalInterest).toBe(f(500_000 / 365));
  });
});
