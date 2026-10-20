/**
 * 미국 FICA 원천징수 — IRS Topic 751·Pub 15 (2026)·Additional Medicare Q&A (2026-10-21 확인).
 * 손계산: 6.2% · 1.45% · 0.9%, Social Security 상한 $184,500, Additional Medicare 원천징수 기준 $200,000.
 */
import { describe, it, expect } from "vitest";
import {
  SS_RATE,
  SS_WAGE_BASE,
  MEDICARE_RATE,
  ADDL_RATE,
  ADDL_WITHHOLD_OVER,
  ADDL_THRESHOLDS,
  MAX_SS_TAX,
  withholding,
  additionalMedicareLiability,
  parseUsd,
  usd,
  usd0,
  pct,
} from "../us/fica";

describe("2026 숫자 (Topic 751 · Pub 15)", () => {
  it("6.2% · 1.45% · 0.9% · $184,500 · $200,000", () => {
    expect(SS_RATE).toBe(0.062);
    expect(MEDICARE_RATE).toBe(0.0145);
    expect(ADDL_RATE).toBe(0.009);
    expect(SS_WAGE_BASE).toBe(184500);
    expect(ADDL_WITHHOLD_OVER).toBe(200000);
  });
  it("신고 유형 기준: MFJ 250,000 · MFS 125,000 · 그 밖 200,000 (Q&A)", () => {
    expect(ADDL_THRESHOLDS).toEqual({
      marriedFilingJointly: 250000,
      marriedFilingSeparately: 125000,
      single: 200000,
      headOfHousehold: 200000,
      qualifyingWidow: 200000,
    });
  });
  it("한 해 Social Security 최대 = 184,500 × 6.2% = 11,439", () => {
    expect(MAX_SS_TAX).toBe(11439);
  });
});

describe("1년치 (ytd 0)", () => {
  it("$50,000 → SS 3,100 + Medicare 725 = 3,825, 사업주도 3,825", () => {
    expect(withholding(50000)).toMatchObject({ ss: 3100, medicare: 725, addl: 0, total: 3825, employerTotal: 3825, capReached: false });
  });
  it("$250,000 → SS 11,439 + Medicare 3,625 + Additional 450 = 15,514, 사업주 15,064(매칭 없음)", () => {
    expect(withholding(250000)).toMatchObject({
      ssWages: 184500,
      ss: 11439,
      medicare: 3625,
      addlWages: 50000,
      addl: 450,
      total: 15514,
      employerSs: 11439,
      employerMedicare: 3625,
      employerTotal: 15064,
      capReached: true,
    });
  });
  it("0 · 음수는 0", () => {
    expect(withholding(0).total).toBe(0);
    expect(withholding(-100).total).toBe(0);
  });
});

describe("지급분 (ytd 있음)", () => {
  it("상한을 지나는 지급: ytd 180,000 + 10,000 → SS 과세 4,500 × 6.2% = 279, Medicare 145", () => {
    expect(withholding(10000, 180000)).toMatchObject({ ssWages: 4500, ss: 279, medicare: 145, addl: 0, total: 424, ytdAfter: 190000, capReached: true });
  });
  it("상한 뒤: ytd 190,000 + 15,000 → SS 0, Medicare 217.50, $200,000 넘는 5,000 × 0.9% = 45", () => {
    expect(withholding(15000, 190000)).toMatchObject({ ss: 0, medicare: 217.5, addlWages: 5000, addl: 45, total: 262.5 });
  });
  it("이미 $200,000 넘음: ytd 210,000 + 4,000 → Additional 36", () => {
    expect(withholding(4000, 210000)).toMatchObject({ ss: 0, medicare: 58, addlWages: 4000, addl: 36, total: 94 });
  });
  it("지급분 25번(10,000씩)을 더하면 1년치 250,000 과 같다", () => {
    let ytd = 0;
    let sum = 0;
    for (let i = 0; i < 25; i++) {
      sum += withholding(10000, ytd).total;
      ytd += 10000;
    }
    expect(Math.round(sum * 100) / 100).toBe(withholding(250000).total);
  });
});

describe("센트 반올림", () => {
  it("$1,234.56 → SS 76.54 (76.54272) · Medicare 17.90 (17.90112)", () => {
    expect(withholding(1234.56)).toMatchObject({ ss: 76.54, medicare: 17.9, total: 94.44 });
  });
});

describe("Additional Medicare 실제 세액 (신고 유형)", () => {
  it("MFJ 부부 합산 300,000 → (300,000 − 250,000) × 0.9% = 450", () => {
    expect(additionalMedicareLiability(300000, "marriedFilingJointly")).toBe(450);
  });
  it("MFS 150,000 → 225 · Single 190,000 → 0 · HOH 220,000 → 180", () => {
    expect(additionalMedicareLiability(150000, "marriedFilingSeparately")).toBe(225);
    expect(additionalMedicareLiability(190000, "single")).toBe(0);
    expect(additionalMedicareLiability(220000, "headOfHousehold")).toBe(180);
  });
});

describe("입력·표기", () => {
  it("parseUsd: $·쉼표 무시, 소수점 하나만", () => {
    expect(parseUsd("$1,234.56")).toBe(1234.56);
    expect(parseUsd("abc")).toBe(0);
    expect(parseUsd("1.2.3")).toBe(1.23);
    expect(parseUsd("-500")).toBe(500);
    expect(parseUsd("")).toBe(0);
  });
  it("usd · usd0 · pct", () => {
    expect(usd(3825)).toBe("$3,825.00");
    expect(usd0(184500)).toBe("$184,500");
    expect(usd0(217.5)).toBe("$217.50");
    expect(pct(0.062)).toBe("6.2%");
    expect(pct(0.0145)).toBe("1.45%");
    expect(pct(0.009)).toBe("0.9%");
  });
});
