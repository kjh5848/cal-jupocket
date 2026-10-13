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
