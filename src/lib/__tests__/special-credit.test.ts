import { describe, it, expect } from "vitest";
import { medicalCredit, educationCredit, donationCredit, hometownCredit, politicalCredit } from "../special-credit";
import r from "../../rates/special-credit-2026.json";

/** 의료비·교육비·기부금 세액공제 — 소득세법 제59조의4, 조특법 제58조·제76조와 손으로 대조한 값. */
describe("의료비(제59조의4 ②)", () => {
  it("총급여 5,000만원이면 3%인 150만원을 넘는 부분부터", () => {
    const x = medicalCredit({ pay: 50_000_000, general: 2_500_000 });
    expect(x.threshold).toBe(1_500_000);
    expect(x.gBase).toBe(1_000_000);
    expect(x.credit).toBe(150_000);
  });
  it("일반 의료비는 700만원 한도", () => expect(medicalCredit({ pay: 50_000_000, general: 20_000_000 }).gBase).toBe(7_000_000));
  it("본인·65세 이상 의료비는 한도가 없다", () => expect(medicalCredit({ pay: 50_000_000, special: 20_000_000 }).sBase).toBe(18_500_000));
  it("일반 의료비가 3%에 못 미치면 그 미달액을 본인 의료비에서 뺀다", () => {
    const x = medicalCredit({ pay: 50_000_000, general: 1_000_000, special: 3_000_000 });
    expect(x.gBase).toBe(0);
    expect(x.sBase).toBe(2_500_000);
  });
  it("난임시술 30%", () => expect(medicalCredit({ pay: 30_000_000, special: 900_000, infertility: 1_000_000 }).credit).toBe(300_000));
  it("미숙아 20%", () => expect(medicalCredit({ pay: 30_000_000, special: 900_000, premature: 1_000_000 }).credit).toBe(200_000));
  // 2026-10-17 조문 손계산(roberin 에 의료비 계산기 없음 — calc-benchmark '없음')
  it("3% 미달액이 제2호를 지나 제4호 난임시술비까지 내려간다", () => {
    const x = medicalCredit({ pay: 50_000_000, special: 1_000_000, infertility: 1_000_000 });
    expect([x.sBase, x.fBase, x.credit]).toEqual([0, 500_000, 150_000]);
    expect([x.absorbed, x.over, x.toThreshold]).toEqual([1_500_000, 0, 0]);
  });
  it("가족 의료비가 정확히 3% + 700만원이면 한도로 빠지는 돈 0, 1원 넘으면 1원", () => {
    const x = medicalCredit({ pay: 40_000_000, general: 8_200_000 });
    expect([x.gBase, x.over, x.credit]).toEqual([7_000_000, 0, 1_050_000]);
    expect(medicalCredit({ pay: 40_000_000, general: 8_200_001 }).over).toBe(1);
  });
  it("의료비 합이 정확히 3%면 공제 0원, 3%까지 남은 금액도 0원", () => {
    const x = medicalCredit({ pay: 30_000_000, general: 400_000, special: 500_000 });
    expect([x.base, x.credit, x.absorbed, x.toThreshold]).toEqual([0, 0, 900_000, 0]);
    expect(medicalCredit({ pay: 30_000_000, general: 400_000 }).toThreshold).toBe(500_000);
  });
  it("끝자리 있는 금액: 공제 대상 + 3%로 빠진 돈 + 한도로 빠진 돈 = 낸 의료비", () => {
    const i = { pay: 33_333_333, general: 1_234_567, special: 2_345_678, premature: 345_679, infertility: 456_789 };
    const x = medicalCredit(i);
    expect(x.threshold).toBe(999_999);
    expect([x.gBase, x.sBase, x.pBase, x.fBase]).toEqual([234_568, 2_345_678, 345_679, 456_789]);
    expect(x.credit).toBe(593_209); // 35,185.2 + 351,851.7 + 69,135.8 + 137,036.7 = 593,209.4
    expect(x.base + x.absorbed + x.over).toBe(i.general + i.special + i.premature + i.infertility);
    const big = medicalCredit({ pay: 50_000_000, general: 12_345_678, special: 1_111_111 });
    expect(big.base + big.absorbed + big.over).toBe(12_345_678 + 1_111_111);
  });
  it("안경 50만원, 산후조리원 200만원 한도를 rates 에 적었다", () => {
    expect(r.medical.scope.glassesCap).toBe(500_000);
    expect(r.medical.scope.postnatalCap).toBe(2_000_000);
  });
});

describe("교육비(제59조의4 ③)", () => {
  it("초중고 1명 300만원 한도 × 15%", () => expect(educationCredit([{ kind: "school", amount: 5_000_000 }]).credit).toBe(450_000));
  it("대학생 900만원 한도", () => expect(educationCredit([{ kind: "university", amount: 10_000_000 }]).base).toBe(9_000_000));
  it("본인은 한도 없음", () => expect(educationCredit([{ kind: "self", amount: 12_000_000 }]).credit).toBe(1_800_000));
  it("2026년 지급분부터 기본공제대상자 소득과 관계없다(부칙 제5조)", () => {
    expect(r.education.amended.changes[0]).toContain("나이 및 소득");
    expect(r.education.amended.applies).toContain("2026. 1. 1.");
  });
});

describe("기부금(제59조의4 ④)", () => {
  it("종교단체 없으면 소득금액 30% 한도", () => {
    const x = donationCredit({ income: 40_000_000, general: 20_000_000 });
    expect(x.limit).toBe(12_000_000);
    expect(x.generalIn).toBe(12_000_000);
    expect(x.carry).toBe(8_000_000);
  });
  it("종교단체가 있으면 10% + min(20%, 종교단체 외)", () => {
    const x = donationCredit({ income: 40_000_000, religious: 10_000_000, general: 1_000_000 });
    expect(x.limit).toBe(4_000_000 + 1_000_000);
  });
  it("1천만원까지 15%, 넘는 부분 30%", () => {
    expect(donationCredit({ income: 100_000_000, general: 10_000_000 }).credit).toBe(1_500_000);
    expect(donationCredit({ income: 100_000_000, general: 12_000_000 }).credit).toBe(2_100_000);
  });
});

describe("고향사랑·정치자금(조특법 제58조·제76조)", () => {
  it("고향사랑 10만원 → 90,909원", () => expect(hometownCredit(100_000)).toBe(90_909));
  it("고향사랑 20만원 → 90,909 + 40,000", () => expect(hometownCredit(200_000)).toBe(130_909));
  it("고향사랑 30만원 → 130,909 + 15,000", () => expect(hometownCredit(300_000)).toBe(145_909));
  it("정치자금 10만원 → 90,909원", () => expect(politicalCredit(100_000)).toBe(90_909));
  it("정치자금 20만원 → 90,909 + 15,000", () => expect(politicalCredit(200_000)).toBe(105_909));
});
