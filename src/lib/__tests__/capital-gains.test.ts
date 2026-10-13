import { describe, it, expect } from "vitest";
import { longTermRate, taxFor, capitalGains, majorShareTax, overseasStockTax, preliminaryDue } from "../capital-gains";
import { taxOn } from "../deduction";

/** 양도소득세 — 소득세법 제95조 표 1·2, 제104조, 시행령 제160조와 손으로 대조한 값. */
describe("장기보유특별공제(제95조 ②)", () => {
  it("3년 미만은 0", () => expect(longTermRate({ holdYears: 2.9 })).toBe(0));
  it("표 1: 3년 6%, 10년 20%, 15년 30%, 20년도 30%", () => {
    expect(longTermRate({ holdYears: 3 })).toBe(0.06);
    expect(longTermRate({ holdYears: 10 })).toBe(0.2);
    expect(longTermRate({ holdYears: 15 })).toBe(0.3);
    expect(longTermRate({ holdYears: 20 })).toBe(0.3);
  });
  it("표 2: 1세대 1주택 보유 10년·거주 10년이면 80%", () => expect(longTermRate({ holdYears: 10, residenceYears: 10, oneHouse: true })).toBe(0.8));
  it("표 2: 보유 5년·거주 2년 → 20% + 8% = 28%", () => expect(longTermRate({ holdYears: 5, residenceYears: 2, oneHouse: true })).toBe(0.28));
  it("표 2: 보유 5년·거주 3년 → 20% + 12% = 32%", () => expect(longTermRate({ holdYears: 5, residenceYears: 3, oneHouse: true })).toBe(0.32));
  it("1주택이라도 거주 2년 미만이면 표 1", () => expect(longTermRate({ holdYears: 10, residenceYears: 1, oneHouse: true })).toBe(0.2));
  it("다주택 중과 대상은 0", () => expect(longTermRate({ holdYears: 10, excluded: true })).toBe(0));
});

describe("세율(제104조)", () => {
  it("2년 이상 보유 일반: 기본세율", () => expect(taxFor(100_000_000, { kind: "land", holdYears: 5 })).toBe(taxOn(100_000_000)));
  it("주택 1년 미만 70%", () => expect(taxFor(100_000_000, { kind: "house", holdYears: 0.5 })).toBe(70_000_000));
  it("주택 1~2년 60%", () => expect(taxFor(100_000_000, { kind: "house", holdYears: 1.5 })).toBe(60_000_000));
  it("토지 1년 미만 50%", () => expect(taxFor(100_000_000, { kind: "land", holdYears: 0.5 })).toBe(50_000_000));
  it("비사업용 토지: 기본세율 + 10%p (1,400만원 이하 16%)", () => expect(taxFor(10_000_000, { kind: "land", holdYears: 5, nonBusinessLand: true })).toBe(1_600_000));
  it("조정 2주택 중과: 기본세율 + 20%p", () => expect(taxFor(100_000_000, { kind: "house", holdYears: 5, surcharge: 0.2 })).toBe(taxOn(100_000_000) + 20_000_000));
});

describe("1세대 1주택 고가주택(시행령 제160조)", () => {
  it("12억 이하면 비과세", () => expect(capitalGains({ kind: "house", sale: 1_200_000_000, acquisition: 500_000_000, holdYears: 5, residenceYears: 5, oneHouseExempt: true }).exempt).toBe(true));
  it("15억에 팔면 양도차익의 (15억−12억)/15억 = 20%만 과세", () => {
    const x = capitalGains({ kind: "house", sale: 1_500_000_000, acquisition: 500_000_000, holdYears: 10, residenceYears: 10, oneHouseExempt: true });
    expect(x.taxableGain).toBe(200_000_000);
    expect(x.ltDeduction).toBe(160_000_000);
    expect(x.base).toBe(40_000_000 - 2_500_000);
  });
  it("지방소득세는 10분의 1", () => {
    const x = capitalGains({ kind: "land", sale: 300_000_000, acquisition: 200_000_000, holdYears: 5 });
    expect(x.local).toBe(Math.floor(x.tax / 10));
  });
});

describe("주식", () => {
  it("대주주 3억 이하 20%", () => expect(majorShareTax(300_000_000)).toBe(60_000_000));
  it("대주주 3억 초과분 25%", () => expect(majorShareTax(400_000_000)).toBe(85_000_000));
  it("해외주식 1,000만원 이익 → (1,000만 − 250만) × 20% = 150만 + 지방세 15만", () => {
    const x = overseasStockTax(10_000_000);
    expect(x.tax).toBe(1_500_000);
    expect(x.total).toBe(1_650_000);
  });
  it("250만원 이하면 0", () => expect(overseasStockTax(2_500_000).total).toBe(0));
});

describe("예정신고기한(제105조)", () => {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  it("부동산 10월 13일 양도 → 12월 31일", () => expect(iso(preliminaryDue(2026, 10, "realEstate"))).toBe("2026-12-31"));
  it("부동산 12월 양도 → 다음 해 2월 말일", () => expect(iso(preliminaryDue(2026, 12, "realEstate"))).toBe("2027-02-28"));
  it("국내 주식 하반기 양도 → 다음 해 2월 말일", () => expect(iso(preliminaryDue(2026, 9, "shares"))).toBe("2027-02-28"));
  it("국내 주식 상반기 양도 → 8월 31일", () => expect(iso(preliminaryDue(2026, 3, "shares"))).toBe("2026-08-31"));
});
