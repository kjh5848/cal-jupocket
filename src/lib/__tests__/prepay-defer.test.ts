import { describe, it, expect } from "vitest";
import r from "../../rates/installment-savings-2026.json";
import { prepayDefer, parseGroups, addMonths, dayNo, isoOf, type PrepayDeferResult } from "../prepay-defer";
import { installmentSavings } from "../installment-savings";

const base = { start: "2026-01-10", months: 12, monthly: 100_000, ratePct: 5, method: "simple" as const };
const ok = (x: ReturnType<typeof prepayDefer>) => {
  if (!x.ok) throw new Error(x.reason);
  return x as PrepayDeferResult;
};

describe("날짜", () => {
  it("말일 가입은 그 날짜가 없는 달에 말일", () => {
    const s = dayNo("2026-01-31");
    expect(isoOf(addMonths(s, 1))).toBe("2026-02-28");
    expect(isoOf(addMonths(s, 2))).toBe("2026-03-31");
    expect(isoOf(addMonths(s, 13))).toBe("2027-02-28");
    expect(isoOf(addMonths(dayNo("2027-11-30"), 3))).toBe("2028-02-29");
  });
  it("없는 날짜·형식 오류는 NaN", () => {
    expect(dayNo("2026-02-30")).toBeNaN();
    expect(dayNo("2026/01/10")).toBeNaN();
  });
  it("묶음 읽기", () => {
    expect(parseGroups("6-1-5")).toEqual([6, 1, 5]);
    expect(parseGroups(" 1 - 11 ")).toEqual([1, 11]);
    expect(parseGroups("6-0-6")).toBeNull();
    expect(parseGroups("6-a")).toBeNull();
  });
});

describe("선납이연 — roberin 같은 입력(2026-10-24 관찰) 날짜 항목", () => {
  it("6-1-5, 마지막 묶음 만기 전날: 선납 451 · 지연 454 · 순지연 +3 · 월평균 0.25", () => {
    const x = ok(prepayDefer({ ...base, groups: [6, 1, 5], lastDate: "2027-01-09" }));
    expect(x.rows.map((w) => w.early)).toEqual([0, 31, 59, 90, 120, 151, 0, 0, 0, 0, 0, 0]);
    expect(x.rows.map((w) => w.late)).toEqual([0, 0, 0, 0, 0, 0, 0, 152, 121, 91, 60, 30]);
    expect([x.totalEarly, x.totalLate, x.net]).toEqual([451, 454, 3]);
    expect(x.avgDelay).toBe(0.25);
    expect(x.maturity).toBe("2027-01-10");
    expect([x.delayedFloor, x.delayedCeil]).toEqual(["2027-01-10", "2027-01-11"]);
    // 이틀 당기면 순지연 −2 → 만기 안 늦어짐
    expect(x.latestLastDate).toBe("2027-01-08");
  });
  it("1-6-5(2회차 날 6회분): 선납 446 · 지연 454 · 순지연 +8", () => {
    // roberin 1-6-5 는 1회분, 2회차 날 6회분, 만기 전날 5회분
    const x = ok(prepayDefer({ ...base, groups: [1, 6, 5], lastDate: "2027-01-09" }));
    expect([x.totalEarly, x.totalLate, x.net]).toEqual([446, 454, 8]);
  });
  it("매달 약정일: 0 · 0 · 0", () => {
    const x = ok(prepayDefer({ ...base, groups: Array(12).fill(1) }));
    expect([x.totalEarly, x.totalLate, x.net, x.avgDelay]).toEqual([0, 0, 0, 0]);
    expect(x.lastDate).toBe("2026-12-10");
  });
});

describe("선납이연 — 마지막 묶음 날 자동", () => {
  it("비우면 순지연 0 이하인 가장 늦은 날, 하루 늦으면 순지연 양수", () => {
    for (const groups of [[6, 1, 5], [6, 6], [1, 11], [4, 4, 4]]) {
      const x = ok(prepayDefer({ ...base, groups }));
      expect(x.net).toBeLessThanOrEqual(0);
      expect(x.lastDate).toBe(x.latestLastDate);
      const next = isoOf(dayNo(x.lastDate) + 1);
      if (next < x.maturity) expect(ok(prepayDefer({ ...base, groups, lastDate: next })).net).toBeGreaterThan(0);
    }
  });
  it("1-11 은 남은 11회분을 7회차 무렵에", () => {
    expect(ok(prepayDefer({ ...base, groups: [1, 11] })).lastDate).toBe("2026-07-10");
  });
  it("만기 전날을 넘지 않는다(선납만 있을 때)", () => {
    const x = ok(prepayDefer({ ...base, groups: [11, 1] }));
    expect(x.lastDate).toBe("2027-01-09");
    expect(x.net).toBeLessThan(0);
    expect(x.avgDelay).toBe(0);
  });
  it("만기일 이후·앞 묶음보다 이른 날은 표시", () => {
    expect(ok(prepayDefer({ ...base, groups: [6, 6], lastDate: "2027-01-10" })).afterMaturity).toBe(true);
    expect(ok(prepayDefer({ ...base, groups: [6, 1, 5], lastDate: "2026-06-01" })).beforePrevious).toBe(true);
  });
});

describe("이자 — 약관 제4조 ①④: 계약금액(매달 약정일에 낸 이자)", () => {
  it("선납·이연과 상관없이 installmentSavings 와 같다", () => {
    const plain = installmentSavings({ monthly: 100_000, ratePct: 5, months: 12, method: "simple", tax: "normal" });
    const x = ok(prepayDefer({ ...base, groups: [6, 1, 5] }));
    expect(x.savings.grossInterest).toBe(32_500);
    expect(x.savings.netInterest).toBe(plain.netInterest);
    expect(x.savings.maturity).toBe(1_227_500);
  });
});

describe("오류", () => {
  it("합이 개월 수와 다르면 sum", () => {
    expect(prepayDefer({ ...base, groups: [6, 6, 1] })).toEqual({ ok: false, reason: "sum" });
    expect(prepayDefer({ ...base, start: "2026-02-30", groups: [12] })).toEqual({ ok: false, reason: "date" });
  });
});

describe("rates", () => {
  it("약관 제4조 ③④·제7조 ③ 원문을 담는다", () => {
    expect(r.prepayDefer.verifiedOn).toBe("2026-10-24");
    expect(r.prepayDefer.clause3).toContain("순지연일수");
    expect(r.prepayDefer.clause4).toContain("계약금액만");
    expect(r.prepayDefer.free).toContain("제7조");
  });
});
