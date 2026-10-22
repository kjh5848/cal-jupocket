/**
 * 일본 年末調整(令和8年分) — rates/jp/year-end-adjustment-2026.json 에 적힌 원문 숫자(2026-10-21 확인)로 고정한다.
 * - 所得税法 別表第五(令和8年12月1日 施行 版) 행: 2,200,000 → 1,460,000 · 2,204,000 → 1,462,800 · 6,340,000 → 4,632,000 · 6,596,000 → 4,836,800
 * - 措法 第29条の4: 741,000円未満 0 · 給与 − 740,000円 · 2,191,000/2,193,000/2,196,000円 → 1,451,000/1,453,000/1,456,000円
 * - 年末調整のしかた 109.pdf 例: 7,654,321 × 90% − 1,100,000 = 5,788,888.9 → 5,788,888円
 * - No.2260 具体例: 課税所得 7,000,000 → 974,000円 · 年末調整のしかた 38쪽 例: 2,696,000 → 172,100円
 * 처음부터 끝까지 이어 계산한 예(5,000,000円 등)는 위 단계 값을 이은 손계산이다(원문 예시 아님).
 */
import { describe, it, expect } from "vitest";
import {
  employmentIncome,
  incomeAdjustment,
  basicDeduction,
  spouseDeduction,
  spouseTotalIncome,
  specifiedRelativeDeduction,
  dependentDeduction,
  calculatedIncomeTax,
  annualTaxWithSurtax,
  yearEndAdjustment,
  emptyInput,
  floorThousand,
} from "../jp/year-end-adjustment";

describe("給与所得控除後の給与等の金額(令和8年分)", () => {
  it("691,000円未満·741,000円未満は 0", () => {
    expect(employmentIncome(0)).toBe(0);
    expect(employmentIncome(690_999)).toBe(0);
    expect(employmentIncome(691_000)).toBe(0);
    expect(employmentIncome(740_999)).toBe(0);
  });

  it("措法 第29条の4 — 給与 − 740,000円·固定 3행", () => {
    expect(employmentIncome(741_000)).toBe(1_000);
    expect(employmentIncome(1_360_000)).toBe(620_000);
    expect(employmentIncome(2_190_999)).toBe(1_450_999);
    expect(employmentIncome(2_191_000)).toBe(1_451_000);
    expect(employmentIncome(2_192_999)).toBe(1_451_000);
    expect(employmentIncome(2_193_000)).toBe(1_453_000);
    expect(employmentIncome(2_196_000)).toBe(1_456_000);
    expect(employmentIncome(2_199_999)).toBe(1_456_000);
  });

  it("別表第五 — 4,000円 구간 하한으로 계산(원문 행)", () => {
    expect(employmentIncome(2_200_000)).toBe(1_460_000);
    expect(employmentIncome(2_203_999)).toBe(1_460_000);
    expect(employmentIncome(2_204_000)).toBe(1_462_800);
    expect(employmentIncome(6_340_000)).toBe(4_632_000);
    expect(employmentIncome(6_343_999)).toBe(4_632_000);
    expect(employmentIncome(6_596_000)).toBe(4_836_800);
    expect(employmentIncome(6_599_999)).toBe(4_836_800);
    // 360万円 — 30%+8万円 과 20%+44万円 이 같은 값
    expect(employmentIncome(3_600_000)).toBe(3_600_000 - 1_160_000);
  });

  it("6,600,000円以上 — × 90% − 1,100,000円(1円未満 切り捨て)·850万円以上 − 1,950,000円", () => {
    expect(employmentIncome(7_654_321)).toBe(5_788_888);
    expect(employmentIncome(6_600_000)).toBe(4_840_000);
    expect(employmentIncome(8_499_999)).toBe(6_549_999);
    expect(employmentIncome(8_500_000)).toBe(6_550_000);
    expect(employmentIncome(12_000_000)).toBe(10_050_000);
  });
});

describe("所得控除", () => {
  it("所得金額調整控除 — 850万円超, 1,000万円 상한, 1円未満 切り上げ", () => {
    expect(incomeAdjustment(9_000_000, false)).toBe(0);
    expect(incomeAdjustment(8_500_000, true)).toBe(0);
    expect(incomeAdjustment(9_000_000, true)).toBe(50_000);
    expect(incomeAdjustment(8_500_005, true)).toBe(1);
    expect(incomeAdjustment(12_000_000, true)).toBe(150_000);
  });

  it("基礎控除 令和8年分 — 489万円以下 104万円·655万円以下 67万円·2,350万円以下 62万円", () => {
    expect(basicDeduction(0)).toBe(1_040_000);
    expect(basicDeduction(4_890_000)).toBe(1_040_000);
    expect(basicDeduction(4_890_001)).toBe(670_000);
    expect(basicDeduction(6_550_000)).toBe(670_000);
    expect(basicDeduction(6_550_001)).toBe(620_000);
    expect(basicDeduction(23_500_001)).toBe(480_000);
    expect(basicDeduction(25_000_001)).toBe(0);
  });

  it("配偶者控除 — 配偶者 62万円以下(給与のみ 136万円以下)", () => {
    expect(spouseTotalIncome(1_360_000, "salary")).toBe(620_000);
    expect(spouseDeduction(5_000_000, 620_000, false)).toEqual({ kind: "spouse", yen: 380_000 });
    expect(spouseDeduction(5_000_000, 0, true)).toEqual({ kind: "spouse", yen: 480_000 });
    expect(spouseDeduction(9_200_000, 0, false)).toEqual({ kind: "spouse", yen: 260_000 });
    expect(spouseDeduction(9_800_000, 0, true)).toEqual({ kind: "spouse", yen: 160_000 });
    expect(spouseDeduction(10_000_001, 0, false)).toEqual({ kind: "none", yen: 0 });
  });

  it("配偶者特別控除 — 62万円超 133万円以下", () => {
    expect(spouseDeduction(5_000_000, 620_001, false)).toEqual({ kind: "special", yen: 380_000 });
    expect(spouseDeduction(5_000_000, 950_001, true)).toEqual({ kind: "special", yen: 360_000 });
    expect(spouseDeduction(9_500_000, 1_200_000, false)).toEqual({ kind: "special", yen: 110_000 });
    expect(spouseDeduction(10_000_000, 1_330_000, false)).toEqual({ kind: "special", yen: 10_000 });
    expect(spouseDeduction(5_000_000, 1_330_001, false)).toEqual({ kind: "none", yen: 0 });
  });

  it("扶養控除·特定親族特別控除", () => {
    expect(dependentDeduction({ general: 1, specified: 1, elderly: 1, elderlyLivingTogether: 1 })).toBe(
      380_000 + 630_000 + 480_000 + 580_000,
    );
    expect(specifiedRelativeDeduction(620_000)).toBe(0);
    expect(specifiedRelativeDeduction(850_000)).toBe(630_000);
    expect(specifiedRelativeDeduction(850_001)).toBe(610_000);
    expect(specifiedRelativeDeduction(1_230_000)).toBe(30_000);
    expect(specifiedRelativeDeduction(1_230_001)).toBe(0);
  });
});

describe("税額", () => {
  it("速算表 — No.2260 例 7,000,000円 → 974,000円·38쪽 例 2,696,000円 → 172,100円", () => {
    expect(calculatedIncomeTax(7_000_000)).toBe(974_000);
    expect(calculatedIncomeTax(2_696_000)).toBe(172_100);
    expect(calculatedIncomeTax(1_949_000)).toBe(97_450);
    expect(calculatedIncomeTax(1_950_000)).toBe(97_500);
    expect(calculatedIncomeTax(18_000_000)).toBe(4_404_000);
    expect(floorThousand(2_696_999)).toBe(2_696_000);
  });

  it("× 102.1% → 100円未満 切り捨て", () => {
    expect(annualTaxWithSurtax(172_100)).toBe(175_700); // 175,714.1
    expect(annualTaxWithSurtax(88_500)).toBe(90_300); // 90,358.5
    expect(annualTaxWithSurtax(0)).toBe(0);
  });
});

describe("年末調整 全体(손계산)", () => {
  it("給与 500万円·社会保険料 75万円 — 還付 29,700円", () => {
    const r = yearEndAdjustment({ ...emptyInput(), salary: 5_000_000, withheld: 120_000, socialInsurance: 750_000 });
    expect(r.notEligible).toBeNull();
    expect(r.employmentIncome).toBe(3_560_000);
    expect(r.basic).toBe(1_040_000);
    expect(r.taxable).toBe(1_770_000);
    expect(r.calculatedTax).toBe(88_500);
    expect(r.annualTax).toBe(90_300);
    expect(r.difference).toBe(29_700);
  });

  it("住宅借入金等特別控除は算出所得税額まで(남는 부분 切り捨て)", () => {
    const r = yearEndAdjustment({
      ...emptyInput(),
      salary: 5_000_000,
      withheld: 120_000,
      socialInsurance: 750_000,
      housingLoanCredit: 200_000,
    });
    expect(r.housingApplied).toBe(88_500);
    expect(r.annualTax).toBe(0);
    expect(r.difference).toBe(120_000);
  });

  it("寡婦·ひとり親は 本人 合計所得 500万円以下, 勤労学生 89万円以下", () => {
    const w = yearEndAdjustment({ ...emptyInput(), salary: 5_000_000, widow: "singleParent", workingStudent: true });
    expect(w.personal).toBe(350_000);
    const hi = yearEndAdjustment({ ...emptyInput(), salary: 8_000_000, widow: "widow" });
    expect(hi.totalIncome).toBe(6_100_000);
    expect(hi.personal).toBe(0);
    const st = yearEndAdjustment({ ...emptyInput(), salary: 1_500_000, workingStudent: true });
    expect(st.totalIncome).toBe(760_000);
    expect(st.personal).toBe(270_000);
  });

  it("給与 2,000万円超は対象外 — 2,000万円 ちょうどは 課税 17,430,000円(18,050,000円以下)", () => {
    expect(yearEndAdjustment({ ...emptyInput(), salary: 20_000_001 }).notEligible).toBe("salaryOver20m");
    const r = yearEndAdjustment({ ...emptyInput(), salary: 20_000_000 });
    expect(r.notEligible).toBeNull();
    // 20,000,000 − 1,950,000 − 基礎控除 620,000 = 17,430,000
    expect(r.taxable).toBe(17_430_000);
  });
});
