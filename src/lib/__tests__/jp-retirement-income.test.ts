/**
 * 일본 退職所得 源泉徴収 — 国税庁 No.1420·No.2732·別紙 速算表·No.2735 [令和8年4月1日現在法令等] 예시(2026-10-21 확인).
 * - No.2732 例1: 800万円·10年2か月 → 11年·控除 440万円·課税 180万円·91,890円
 * - No.2732 例2: 2,300万円·29年2か月 → 30年·控除 1,500万円·課税 400万円·380,322.5円 → 380,322円
 * - No.2732 申告書なし: 800万円 × 20.42% = 1,633,600円
 * - 別紙: 課税 700万円 → (700万円 × 23% − 636,000円) × 102.1% = 994,454円
 * - No.2735: A社 400万円·9年 → 10,210円, B社 합산 580万円·10年 → 45,945円 − 10,210円 = 35,735円
 */
import { describe, it, expect } from "vitest";
import {
  BRACKETS,
  serviceYears,
  retirementDeduction,
  retirementIncome,
  floorThousand,
  withholdingTax,
  noDeclarationTax,
  retirementTax,
  formatYen,
} from "../jp/retirement-income";

describe("退職所得 (国税庁 No.1420·No.2732)", () => {
  it("勤続年数は1年未満を切り上げ", () => {
    expect(serviceYears(10, 2)).toBe(11);
    expect(serviceYears(29, 2)).toBe(30);
    expect(serviceYears(30, 0)).toBe(30);
    expect(serviceYears(0, 1)).toBe(1);
    expect(serviceYears(9, 4)).toBe(10);
  });

  it("退職所得控除額 — 20年以下・20年超・80万円・障害者", () => {
    expect(retirementDeduction(11)).toBe(4_400_000);
    expect(retirementDeduction(30)).toBe(15_000_000);
    expect(retirementDeduction(20)).toBe(8_000_000);
    expect(retirementDeduction(21)).toBe(8_700_000);
    expect(retirementDeduction(1)).toBe(800_000);
    expect(retirementDeduction(2)).toBe(800_000);
    expect(retirementDeduction(3)).toBe(1_200_000);
    // 80万円 최저 뒤에 100万円
    expect(retirementDeduction(1, true)).toBe(1_800_000);
    expect(retirementDeduction(11, true)).toBe(5_400_000);
  });

  it("No.2732 例1 — 91,890円", () => {
    const r = retirementTax({ payment: 8_000_000, years: 10, months: 2, category: "general", disability: false });
    expect(r.serviceYears).toBe(11);
    expect(r.deduction).toBe(4_400_000);
    expect(r.taxable).toBe(1_800_000);
    expect(r.bracket).toEqual({ pct: 5, deductionYen: 0 });
    expect(r.tax).toBe(91_890);
    expect(r.taxNoDeclaration).toBe(1_633_600);
  });

  it("No.2732 例2 — 380,322.5円 → 380,322円", () => {
    const r = retirementTax({ payment: 23_000_000, years: 29, months: 2, category: "general", disability: false });
    expect(r.serviceYears).toBe(30);
    expect(r.deduction).toBe(15_000_000);
    expect(r.taxable).toBe(4_000_000);
    expect(r.tax).toBe(380_322);
  });

  it("別紙 速算表の例 — 課税 700万円 → 994,454円", () => {
    expect(withholdingTax(7_000_000)).toBe(994_454);
  });

  it("申告書なし — 20.42%", () => {
    expect(noDeclarationTax(8_000_000)).toBe(1_633_600);
    expect(noDeclarationTax(1_234_567)).toBe(Math.floor((1_234_567 * 2042) / 10000));
  });

  it("No.2735 — 同じ年に2か所", () => {
    const a = withholdingTax(floorThousand(retirementIncome(4_000_000, retirementDeduction(9), "general")));
    expect(a).toBe(10_210);
    const ded = retirementDeduction(serviceYears(9, 4));
    expect(ded).toBe(4_000_000);
    const b = withholdingTax(floorThousand(retirementIncome(5_800_000, ded, "general")));
    expect(b).toBe(45_945);
    expect(b - a).toBe(35_735);
  });

  it("課税退職所得金額は1,000円未満切り捨て", () => {
    // (800万 − 440万 + 1,999) / 2 → 1,800,999.5 → 1,800,000
    const r = retirementTax({ payment: 8_001_999, years: 10, months: 2, category: "general", disability: false });
    expect(r.taxable).toBe(1_800_000);
    expect(r.tax).toBe(91_890);
  });

  it("特定役員 — 1/2 なし", () => {
    const r = retirementTax({ payment: 8_000_000, years: 4, months: 3, category: "specifiedOfficer", disability: false });
    expect(r.deduction).toBe(2_000_000);
    expect(r.taxable).toBe(6_000_000);
    expect(r.tax).toBe(Math.floor(((6_000_000 * 20 - 427_500 * 100) * 1021) / 100000));
  });

  it("短期 — 300万円以下は1/2、超える部分は1/2 なし", () => {
    // 3年: 控除 120万円. 支給 400万円 → 残 280万円 ≦ 300万円 → 140万円
    expect(retirementIncome(4_000_000, 1_200_000, "shortTerm")).toBe(1_400_000);
    // 支給 1,000万円 → 残 880万円 > 300万円 → 150万円 + (1,000万円 − 420万円) = 730万円
    expect(retirementIncome(10_000_000, 1_200_000, "shortTerm")).toBe(7_300_000);
    // 境目 残 300万円 → 150万円 (どちらの式でも同じ)
    expect(retirementIncome(4_200_000, 1_200_000, "shortTerm")).toBe(1_500_000);
    // 一般なら 440万円
    expect(retirementIncome(10_000_000, 1_200_000, "general")).toBe(4_400_000);
  });

  it("控除額以下なら税額 0円", () => {
    const r = retirementTax({ payment: 3_000_000, years: 10, months: 0, category: "general", disability: false });
    expect(r.taxable).toBe(0);
    expect(r.bracket).toBeNull();
    expect(r.tax).toBe(0);
  });

  it("速算表は境目で両側の式が同じ値（表の打ち間違い検出）", () => {
    for (let i = 0; i < BRACKETS.length - 1; i++) {
      const u = BRACKETS[i].upToYen!;
      const left = u * BRACKETS[i].pct - BRACKETS[i].deductionYen * 100;
      const right = u * BRACKETS[i + 1].pct - BRACKETS[i + 1].deductionYen * 100;
      expect(right).toBe(left);
    }
    expect(withholdingTax(1_950_000)).toBe(99_547); // 97,500 × 1.021 = 99,547.5 → 切り捨て
    expect(withholdingTax(1_951_000)).toBe(Math.floor(((1_951_000 * 10 - 97_500 * 100) * 1021) / 100000));
  });

  it("負の値・NaN は 0", () => {
    const r = retirementTax({ payment: NaN, years: -3, months: NaN, category: "general", disability: false });
    expect(r.tax).toBe(0);
    expect(r.taxNoDeclaration).toBe(0);
    expect(formatYen(91_890)).toBe("91,890円");
  });
});
