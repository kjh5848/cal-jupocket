import { describe, it, expect } from "vitest";
import { parkingInterest, splitTiers, DAY_BASIS } from "../parking-account";

const one = { caps: [], rates: [2], tax: "normal" as const };

describe("파킹통장 이자", () => {
  it("나눗셈은 365(광주은행 금리안내 산식)", () => {
    expect(DAY_BASIS).toBe(365);
  });

  it("100만원 연 2% 10일 — 1,000,000 × 0.02 × 10 ÷ 365 = 547.94… → 547원", () => {
    const x = parkingInterest({ ...one, start: "2026-09-01", payDay: "2026-09-11", opening: 1_000_000 });
    expect(x.days).toBe(10);
    expect(x.lastDay).toBe("2026-09-10");
    expect(x.exactInterest).toBeCloseTo(547.945, 3);
    expect(x.grossInterest).toBe(547);
    // 547 × 14% = 76.58 → 76 → 10원 미만 버림 70, 지방소득세 7 → 0
    expect(x.incomeTax).toBe(70);
    expect(x.localTax).toBe(0);
    expect(x.netInterest).toBe(477);
    expect(x.effectiveRate).toBeCloseTo(2, 10);
  });

  it("이자 받는 날은 세지 않는다 — 받는 날 = 첫날이면 오류, 다음 날이면 하루", () => {
    expect(parkingInterest({ ...one, start: "2026-09-01", payDay: "2026-09-01", opening: 1_000_000 }).error).toBe("order");
    expect(parkingInterest({ ...one, start: "2026-09-01", payDay: "2026-08-31", opening: 1_000_000 }).error).toBe("order");
    expect(parkingInterest({ ...one, start: "2026-02-30", payDay: "2026-03-01", opening: 1 }).error).toBe("date");
    const x = parkingInterest({ ...one, start: "2026-09-01", payDay: "2026-09-02", opening: 1_000_000 });
    expect(x.days).toBe(1);
    expect(x.grossInterest).toBe(54);
  });

  it("구간 나누기 — 상한과 같은 잔액은 첫 구간, 1원 넘으면 그 1원만 다음 구간", () => {
    expect(splitTiers(1_000_000, [1_000_000])).toEqual([1_000_000, 0]);
    expect(splitTiers(1_000_001, [1_000_000])).toEqual([1_000_000, 1]);
    expect(splitTiers(1_500_000, [1_000_000, 3_000_000])).toEqual([1_000_000, 500_000, 0]);
    expect(splitTiers(0, [1_000_000])).toEqual([0, 0]);
  });

  it("150만원, 100만원까지 2%·넘는 부분 1% — 하루 (2,000,000 + 500,000)/100 ÷ 365 = 68.49원", () => {
    const x = parkingInterest({ start: "2026-09-01", payDay: "2026-09-02", opening: 1_500_000, caps: [1_000_000], rates: [2, 1], tax: "normal" });
    expect(x.exactInterest).toBeCloseTo(68.493, 3);
    expect(x.grossInterest).toBe(68);
    expect(x.tiers.map((t) => +t.interest.toFixed(3))).toEqual([54.795, 13.699]);
    expect(x.tiers[1].to).toBeNull();
  });

  it("금리 변경일부터 새 금리 — 9/1~10 중 8일부터 3%면 (2%×7일 + 3%×3일) → 630원", () => {
    const x = parkingInterest({ ...one, start: "2026-09-01", payDay: "2026-09-11", opening: 1_000_000, rateChanges: [{ date: "2026-09-08", rates: [3] }] });
    expect(x.exactInterest).toBeCloseTo(630.137, 3);
    expect(x.grossInterest).toBe(630);
  });

  it("첫날 또는 그 전에 바뀐 금리·잔액은 첫날부터 적용", () => {
    const a = parkingInterest({ ...one, start: "2026-09-01", payDay: "2026-09-11", opening: 5, balances: [{ date: "2026-08-20", balance: 1_000_000 }], rateChanges: [{ date: "2026-09-01", rates: [3] }] });
    const b = parkingInterest({ ...one, rates: [3], start: "2026-09-01", payDay: "2026-09-11", opening: 1_000_000 });
    expect(a.grossInterest).toBe(b.grossInterest);
    expect(a.grossInterest).toBe(821);
  });

  it("받는 날 이후 변경과 구간 수가 안 맞는 금리 변경은 쓰지 않고 센다", () => {
    const x = parkingInterest({ ...one, start: "2026-09-01", payDay: "2026-09-11", opening: 1_000_000, balances: [{ date: "2026-09-11", balance: 9_000_000 }], rateChanges: [{ date: "2026-09-05", rates: [3, 1] }] });
    expect(x.ignored).toBe(2);
    expect(x.grossInterest).toBe(547);
  });

  it("roberin 예시 입력 — 9월 한 달, 11일 200만·21일 50만, 16일 금리 2.5%/1.2% → 세전 1,808원(같음)", () => {
    const x = parkingInterest({
      start: "2026-09-01",
      payDay: "2026-10-01",
      opening: 1_000_000,
      caps: [1_000_000],
      rates: [2, 1],
      balances: [
        { date: "2026-09-21", balance: 500_000 },
        { date: "2026-09-11", balance: 2_000_000 },
      ],
      rateChanges: [{ date: "2026-09-16", rates: [2.5, 1.2] }],
      tax: "normal",
    });
    expect(x.days).toBe(30);
    expect(x.avgBalance).toBeCloseTo(1_166_666.67, 1);
    // (2e10 + 1.5e10 + 1.85e10 + 1.25e10) ÷ 3.65e7
    expect(x.exactInterest).toBeCloseTo(1808.219, 3);
    expect(x.grossInterest).toBe(1808);
    // 소득세 253.12 → 253 → 250, 지방소득세 25 → 20 (roberin 은 15.4% 한 번에 278)
    expect(x.incomeTax).toBe(250);
    expect(x.localTax).toBe(20);
    expect(x.netInterest).toBe(1538);
    expect(x.months).toHaveLength(1);
    expect(x.months[0].days).toBe(30);
  });

  it("달이 넘어가면 달별로 나누고, 2028년 2월은 29일", () => {
    const x = parkingInterest({ ...one, start: "2028-02-01", payDay: "2028-04-01", opening: 10_000_000 });
    expect(x.days).toBe(60);
    expect(x.months.map((m) => [m.month, m.days])).toEqual([["2028-02", 29], ["2028-03", 31]]);
    // 윤년도 365로 나눈다: 1천만 × 2% × 60 ÷ 365 = 32,876.71
    expect(x.grossInterest).toBe(32_876);
    const sum = x.months.reduce((a, m) => a + m.interest, 0);
    expect(sum).toBeCloseTo(x.exactInterest, 6);
  });

  it("이자가 작으면 세금이 0원 — 70원 × 14% = 9.8 → 10원 미만 버림", () => {
    const x = parkingInterest({ ...one, start: "2026-09-01", payDay: "2026-09-14", opening: 100_000, rates: [2] });
    expect(x.grossInterest).toBe(71);
    expect(x.tax).toBe(0);
    expect(x.netInterest).toBe(71);
  });

  it("비과세면 세금 0, 잔액 0이면 이자 0", () => {
    expect(parkingInterest({ ...one, tax: "free", start: "2026-09-01", payDay: "2026-10-01", opening: 30_000_000 }).tax).toBe(0);
    const z = parkingInterest({ ...one, start: "2026-09-01", payDay: "2026-10-01", opening: 0 });
    expect(z.grossInterest).toBe(0);
    expect(z.effectiveRate).toBe(0);
  });

  it("상한이 오름차순이 아니거나 금리 수가 다르면 오류, 10년 넘으면 오류", () => {
    expect(parkingInterest({ start: "2026-09-01", payDay: "2026-10-01", opening: 1, caps: [2, 1], rates: [1, 1, 1], tax: "normal" }).error).toBe("tiers");
    expect(parkingInterest({ start: "2026-09-01", payDay: "2026-10-01", opening: 1, caps: [1], rates: [1], tax: "normal" }).error).toBe("tiers");
    expect(parkingInterest({ ...one, start: "2026-01-01", payDay: "2036-12-31", opening: 1 }).error).toBe("long");
  });
});
