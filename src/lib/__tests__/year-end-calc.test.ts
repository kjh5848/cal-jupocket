import { describe, it, expect } from "vitest";
import { earnedIncomeDeduction, earnedIncomeTaxCredit, yearEnd } from "../year-end-calc";
import { taxOn } from "../deduction";

/** 연말정산 어림 계산 — 조문 표와 손으로 대조한 값. */
describe("근로소득공제(제47조)", () => {
  it("500만원 이하 70%", () => expect(earnedIncomeDeduction(4_000_000)).toBe(2_800_000));
  it("1,500만원 → 350만 + 1,000만×40% = 750만", () => expect(earnedIncomeDeduction(15_000_000)).toBe(7_500_000));
  it("4,500만원 → 750만 + 3,000만×15% = 1,200만", () => expect(earnedIncomeDeduction(45_000_000)).toBe(12_000_000));
  it("5,000만원 → 1,200만 + 500만×5% = 1,225만", () => expect(earnedIncomeDeduction(50_000_000)).toBe(12_250_000));
  it("한도 2천만원", () => expect(earnedIncomeDeduction(1_000_000_000)).toBe(20_000_000));
});

describe("근로소득세액공제(제59조)", () => {
  it("산출세액 100만원 → 55%", () => expect(earnedIncomeTaxCredit(1_000_000, 30_000_000)).toBe(550_000));
  it("총급여 3,300만원 이하 한도 74만원", () => expect(earnedIncomeTaxCredit(3_000_000, 30_000_000)).toBe(740_000));
  it("총급여 5,000만원 → 74만 − 1,700만×0.8% = 60.4만이라 바닥 66만", () =>
    expect(earnedIncomeTaxCredit(3_000_000, 50_000_000)).toBe(660_000));
  it("총급여 8,000만원 → 바닥 50만", () => expect(earnedIncomeTaxCredit(5_000_000, 80_000_000)).toBe(500_000));
});

describe("연말정산 어림", () => {
  it("총급여 5,000만원, 혼자, 보험료 없이 — 단계별 값", () => {
    const r = yearEnd({ pay: 50_000_000, persons: 1, pensionInsurance: 0, socialInsurance: 0, prepaid: 3_000_000 });
    expect(r.earnedDeduction).toBe(12_250_000);
    expect(r.base).toBe(36_250_000);
    expect(r.computedTax).toBe(taxOn(36_250_000));
    expect(r.earnedCredit).toBe(660_000);
    expect(r.standard).toBe(130_000);
    expect(r.decided).toBe(r.computedTax - 660_000 - 130_000);
    expect(r.diff).toBe(r.decided - 3_000_000);
  });
  it("IRP 300만원을 넣으면 15% 구간이라 45만원이 더 줄어든다", () => {
    const a = yearEnd({ pay: 50_000_000, persons: 1, pensionInsurance: 0, socialInsurance: 0, prepaid: 0 });
    const b = yearEnd({ pay: 50_000_000, persons: 1, pensionInsurance: 0, socialInsurance: 0, irp: 3_000_000, prepaid: 0 });
    expect(a.decided - b.decided).toBe(450_000);
  });
  it("세액공제는 산출세액을 넘지 않는다(제61조)", () => {
    const r = yearEnd({ pay: 15_000_000, persons: 3, pensionInsurance: 0, socialInsurance: 0, irp: 9_000_000, prepaid: 0 });
    expect(r.decided).toBeGreaterThanOrEqual(0);
  });
});
