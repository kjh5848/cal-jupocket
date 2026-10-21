/**
 * 미국 연방 의료비 항목별 공제 — 26 U.S.C. 213(a) · Schedule A line 1–4 · Pub 502 · Pub 501 · Rev. Proc. 2025-32 (2026-10-21 확인).
 * 손계산: 공제 = max(0, 의료비 − AGI × 7.5%), 주행 21¢ / 20.5¢·23.5¢, LTC 나이 한도, 표준공제 + 박스 추가액.
 */
import { describe, it, expect } from "vitest";
import {
  AGI_PERCENT,
  MILEAGE,
  agiFloor,
  medicalDeduction,
  mileageAmount,
  ltcLimit,
  ltcIncludible,
  standardDeduction,
  computeMedical,
} from "../us/medical-expense";

describe("연방 숫자", () => {
  it("7.5% · 주행 21¢ · 20.5¢ · 23.5¢", () => {
    expect(AGI_PERCENT).toBe(7.5);
    expect(MILEAGE[2025]).toBe(0.21);
    expect(MILEAGE[2026].firstHalf).toBe(0.205);
    expect(MILEAGE[2026].secondHalf).toBe(0.235);
  });
});

describe("Schedule A line 3·4", () => {
  it("AGI 60,000 · 의료비 7,000 → line 3 4,500 · line 4 2,500", () => {
    expect(agiFloor(60_000)).toBe(4500);
    expect(medicalDeduction(60_000, 7000)).toBe(2500);
  });
  it("AGI 80,000 · 의료비 5,000 → 0 (line 3 이 더 크면 -0-)", () => {
    expect(agiFloor(80_000)).toBe(6000);
    expect(medicalDeduction(80_000, 5000)).toBe(0);
  });
  it("센트: AGI 54,321.10 → 4,074.08, 의료비 5,000 → 925.92", () => {
    expect(agiFloor(54_321.1)).toBe(4074.08);
    expect(medicalDeduction(54_321.1, 5000)).toBe(925.92);
  });
});

describe("주행", () => {
  it("Pub 502 원문 예시: 2025 2,800마일 × 21¢ + 주차·통행료 100 = 688", () => {
    expect(mileageAmount(2025, 2800, 100)).toBe(688);
  });
  it("2026 1~6월 1,000마일 205 + 7~12월 1,000마일 235 = 440", () => {
    expect(mileageAmount(2026, 1000, 0, 1000)).toBe(440);
  });
  it("2025 는 7~12월 칸을 쓰지 않는다", () => {
    expect(mileageAmount(2025, 1000, 0, 1000)).toBe(210);
  });
});

describe("LTC 보험료 한도", () => {
  it("2026 45세 1,200 → 930 · 2025 45세 → 900", () => {
    expect(ltcIncludible(2026, 45, 1200)).toBe(930);
    expect(ltcIncludible(2025, 45, 1200)).toBe(900);
  });
  it("구간 경계 2026: 40 → 500 · 41 → 930 · 60 → 1,860 · 70 → 4,960 · 71 → 6,200", () => {
    expect(ltcLimit(2026, 40)).toBe(500);
    expect(ltcLimit(2026, 41)).toBe(930);
    expect(ltcLimit(2026, 60)).toBe(1860);
    expect(ltcLimit(2026, 70)).toBe(4960);
    expect(ltcLimit(2026, 71)).toBe(6200);
  });
  it("한도보다 적게 냈으면 낸 만큼", () => {
    expect(ltcIncludible(2026, 75, 3000)).toBe(3000);
  });
});

describe("표준공제", () => {
  it("2026 Rev. Proc. 2025-32: 16,100 · 32,200 · 24,150 · MFS 16,100 · QSS 32,200", () => {
    expect(standardDeduction(2026, "single")).toBe(16_100);
    expect(standardDeduction(2026, "marriedFilingJointly")).toBe(32_200);
    expect(standardDeduction(2026, "headOfHousehold")).toBe(24_150);
    expect(standardDeduction(2026, "marriedFilingSeparately")).toBe(16_100);
    expect(standardDeduction(2026, "qualifyingSurvivingSpouse")).toBe(32_200);
  });
  it("2026 박스: Single 1 → 18,150 · HOH 2 → 28,250 · MFJ 2 → 35,500 · QSS 1 → 33,850", () => {
    expect(standardDeduction(2026, "single", 1)).toBe(18_150);
    expect(standardDeduction(2026, "headOfHousehold", 2)).toBe(28_250);
    expect(standardDeduction(2026, "marriedFilingJointly", 2)).toBe(35_500);
    expect(standardDeduction(2026, "qualifyingSurvivingSpouse", 1)).toBe(33_850);
  });
  it("Pub 501 (2025) Table 7 원문 값: Single 1 17,750 · MFJ 1 33,100 · MFJ 2 34,700 · QSS 1 33,100 · MFS 4 22,150 · HOH 2 27,625", () => {
    expect(standardDeduction(2025, "single", 1)).toBe(17_750);
    expect(standardDeduction(2025, "marriedFilingJointly", 1)).toBe(33_100);
    expect(standardDeduction(2025, "marriedFilingJointly", 2)).toBe(34_700);
    expect(standardDeduction(2025, "qualifyingSurvivingSpouse", 1)).toBe(33_100);
    expect(standardDeduction(2025, "marriedFilingSeparately", 4)).toBe(22_150);
    expect(standardDeduction(2025, "headOfHousehold", 2)).toBe(27_625);
  });
  it("박스는 신고 유형 최대까지: Single 4 → 2 박스", () => {
    expect(standardDeduction(2025, "single", 4)).toBe(19_750);
  });
  it("MFS 이고 배우자가 항목별 공제 → 0", () => {
    expect(standardDeduction(2026, "marriedFilingSeparately", 0, true)).toBe(0);
    expect(standardDeduction(2026, "single", 0, true)).toBe(16_100);
  });
});

describe("합쳐서", () => {
  it("2026 MFJ AGI 90,000 · 의료비 9,000 · 주행 500+500 · LTC 68세 5,000 · 다른 항목 25,000", () => {
    const r = computeMedical({
      year: 2026,
      status: "marriedFilingJointly",
      agi: 90_000,
      expenses: 9000,
      miles: 500,
      milesLate: 500,
      tollsParking: 30,
      ltc: [[68, 5000]],
      otherItemized: 25_000,
    });
    // 주행 102.50 + 117.50 + 30 = 250, LTC min(5,000, 4,960) = 4,960
    expect(r.mileage).toBe(250);
    expect(r.ltc).toBe(4960);
    expect(r.line1).toBe(14_210);
    expect(r.floor).toBe(6750);
    expect(r.deduction).toBe(7460);
    expect(r.itemizedTotal).toBe(32_460);
    expect(r.standard).toBe(32_200);
    expect(r.difference).toBe(260);
  });
});
