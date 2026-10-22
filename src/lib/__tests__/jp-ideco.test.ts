/**
 * 일본 iDeCo·小規模企業共済 節税額과 拠出限度額 — rates/jp/ideco-deduction-2026.json 원문 숫자(2026-10-23 확인)로 고정한다.
 * - 確定拠出年金法施行令 第36条 현행: 1号·4号 68,000 · 2号 企業年金なし 23,000 · 2号 그 밖 20,000(35,000 초과분 차감) · 3号 23,000
 * - 令和7年政令第442号(2026-12-01): 1号·4号 75,000 · 2号 62,000 − 事業主掛金·他制度掛金相当額 · 3号 23,000
 * - 厚生労働省 Q&A No.227~230-2: 最低 5,000円·1,000円 단위, 付加保険料 400円 → 67,000円(원문 예시)
 * - 小規模企業共済法 第4条: 1,000~70,000円, 500円 단위
 * 節税額 예(年収 500万円 등)는 年末調整 lib 의 단계 값을 이은 손계산이다(원문 예시 아님).
 * 2026-12-01 개정 뒤 付加保険料가 있을 때 1,000円 단위 처리(74,600 → 74,000?)는 원문 미확인이라 고정하지 않는다 — 개정 뒤 Q&A 로 확인.
 */
import { describe, it, expect } from "vitest";
import { legalLimit, maxContribution, checkIdeco, checkSmb, taxSaving } from "../jp/ideco";

describe("拠出限度額 — 現行(2026年11月まで)", () => {
  it("第1号は 68,000円、付加保険料 400円 なら 67,000円(Q&A 例)", () => {
    expect(legalLimit("cat1", "current")).toBe(68_000);
    expect(legalLimit("cat1", "current", { addOn: 400 })).toBe(67_600);
    expect(maxContribution("cat1", "current", { addOn: 400 })).toBe(67_000);
  });
  it("第2号 企業年金なし 23,000円・第3号 23,000円", () => {
    expect(maxContribution("cat2None", "current")).toBe(23_000);
    expect(maxContribution("cat3", "current")).toBe(23_000);
  });
  it("第2号 企業型DC — 事業主掛金が 35,000円を超えた分を 20,000円から引く", () => {
    expect(legalLimit("cat2DC", "current", { employer: 35_000 })).toBe(20_000);
    expect(legalLimit("cat2DC", "current", { employer: 40_000 })).toBe(15_000);
    expect(legalLimit("cat2DC", "current", { employer: 55_000 })).toBe(0);
    expect(maxContribution("cat2DC", "current", { employer: 51_000 })).toBe(0); // 4,000円 < 5,000円
  });
  it("第2号 他制度あり・公務員(共済 8,000円)", () => {
    expect(legalLimit("cat2Other", "current", { employer: 20_000, other: 20_000 })).toBe(15_000);
    expect(legalLimit("cat2Public", "current", { other: 8_000 })).toBe(20_000);
  });
});

describe("拠出限度額 — 2026年12月から(令和7年政令第442号)", () => {
  it("第1号 75,000円・第2号 62,000円・第3号 23,000円", () => {
    expect(legalLimit("cat1", "dec2026")).toBe(75_000);
    expect(legalLimit("cat2None", "dec2026")).toBe(62_000);
    expect(legalLimit("cat3", "dec2026")).toBe(23_000);
    expect(legalLimit("cat1", "dec2026", { addOn: 400 })).toBe(74_600);
  });
  it("第2号は 62,000円 − 事業主掛金 − 他制度掛金相当額", () => {
    expect(legalLimit("cat2DC", "dec2026", { employer: 40_000 })).toBe(22_000);
    expect(legalLimit("cat2Public", "dec2026", { other: 8_000 })).toBe(54_000);
    expect(legalLimit("cat2Other", "dec2026", { employer: 30_000, other: 30_000 })).toBe(2_000);
    expect(maxContribution("cat2Other", "dec2026", { employer: 30_000, other: 30_000 })).toBe(0);
  });
});

describe("掛金の確認", () => {
  it("iDeCo は 5,000円以上・1,000円単位・上限以下", () => {
    expect(checkIdeco(0, 23_000)).toBe("ok");
    expect(checkIdeco(4_000, 23_000)).toBe("belowMin");
    expect(checkIdeco(12_500, 23_000)).toBe("notStep");
    expect(checkIdeco(24_000, 23_000)).toBe("overLimit");
    expect(checkIdeco(23_000, 23_000)).toBe("ok");
  });
  it("小規模企業共済は 1,000〜70,000円・500円単位", () => {
    expect(checkSmb(500)).toBe("belowMin");
    expect(checkSmb(1_500)).toBe("ok");
    expect(checkSmb(1_250)).toBe("notStep");
    expect(checkSmb(70_500)).toBe("overLimit");
  });
});

describe("節税額(令和8年分)", () => {
  it("給与 500万円・社会保険料 75万円・月 23,000円 × 12", () => {
    const r = taxSaving({ kind: "salary", amount: 5_000_000, socialInsurance: 750_000, otherDeductions: 0, annualContribution: 276_000 });
    expect(r.totalIncome).toBe(3_560_000);
    expect(r.basic).toBe(1_040_000);
    expect(r.taxableBefore).toBe(1_770_000);
    expect(r.taxableAfter).toBe(1_494_000);
    expect(r.incomeTaxBefore).toBe(90_300); // 88,500 × 102.1% = 90,358.5 → 90,300
    expect(r.incomeTaxAfter).toBe(76_200); // 74,700 × 102.1% = 76,268.7 → 76,200
    expect(r.incomeTaxSaving).toBe(14_100);
    expect(r.marginalPct).toBe(5);
    expect(r.residentSaving).toBe(27_600);
    expect(r.total).toBe(41_700);
  });
  it("合計所得 400万円(自営業)・社会保険料 60万円・月 68,000円 × 12 — 10% から 5% にまたがる", () => {
    const r = taxSaving({ kind: "income", amount: 4_000_000, socialInsurance: 600_000, otherDeductions: 0, annualContribution: 816_000 });
    expect(r.taxableBefore).toBe(2_360_000);
    expect(r.incomeTaxBefore).toBe(141_400); // 2,360,000 × 10% − 97,500 = 138,500 → 141,408.5 → 141,400
    expect(r.taxableAfter).toBe(1_544_000);
    expect(r.incomeTaxAfter).toBe(78_800); // 77,200 → 78,821.2 → 78,800
    expect(r.incomeTaxSaving).toBe(62_600);
    expect(r.marginalPct).toBe(10);
    expect(r.residentSaving).toBe(81_600);
  });
  it("課税所得が 0 なら所得税は減らない", () => {
    const r = taxSaving({ kind: "salary", amount: 1_500_000, socialInsurance: 0, otherDeductions: 0, annualContribution: 60_000 });
    expect(r.taxableBefore).toBe(0);
    expect(r.incomeTaxSaving).toBe(0);
    expect(r.marginalPct).toBe(0);
  });
});
