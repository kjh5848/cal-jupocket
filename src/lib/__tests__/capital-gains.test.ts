import { describe, it, expect } from "vitest";
import { longTermRate, taxFor, capitalGains, oneHouseUnmet, rateLabel, majorShareTax, overseasStockTax, preliminaryDue } from "../capital-gains";
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
  it("12억 이하면 비과세", () => expect(capitalGains({ kind: "house", sale: 1_200_000_000, acquisition: 500_000_000, holdYears: 5, residenceYears: 5, oneHouse: true }).exempt).toBe(true));
  it("15억에 팔면 양도차익의 (15억−12억)/15억 = 20%만 과세", () => {
    const x = capitalGains({ kind: "house", sale: 1_500_000_000, acquisition: 500_000_000, holdYears: 10, residenceYears: 10, oneHouse: true });
    expect(x.taxableGain).toBe(200_000_000);
    expect(x.ltDeduction).toBe(160_000_000);
    expect(x.base).toBe(40_000_000 - 2_500_000);
  });
  it("지방소득세는 10분의 1", () => {
    const x = capitalGains({ kind: "land", sale: 300_000_000, acquisition: 200_000_000, holdYears: 5 });
    expect(x.local).toBe(Math.floor(x.tax / 10));
  });
});

describe("1세대 1주택 비과세 기간 요건(제89조 ① 3호·시행령 제154조 ①)", () => {
  // 손계산: 양도차익 3억, 표 1 보유 5년 10% → 3,000만, 과세표준 3억 − 3,000만 − 250만 = 2억6,750만,
  // 기본세율 38% − 누진공제 1,994만 = 8,171만, 지방소득세 817만1천 → 8,988만1천
  it("조정대상지역 취득·거주 1년이면 비과세 아님 — 일반 주택처럼 표 1", () => {
    const x = capitalGains({ kind: "house", sale: 800_000_000, acquisition: 500_000_000, holdYears: 5, residenceYears: 1, oneHouse: true, adjustedAtAcquisition: true });
    expect(x.oneHouseUnmet).toBe("residence");
    expect(x.exempt).toBe(false);
    expect(x.ltRate).toBe(0.1);
    expect(x.total).toBe(89_881_000);
  });
  // 손계산: 보유 1년 6개월 주택 60%(제104조 ① 2호) — (3억 − 250만) × 60% = 1억7,850만 + 1,785만
  it("보유 2년 미만이면 비과세 아님 — 단기세율", () => {
    const x = capitalGains({ kind: "house", sale: 800_000_000, acquisition: 500_000_000, holdYears: 1.5, residenceYears: 1, oneHouse: true });
    expect(x.oneHouseUnmet).toBe("hold");
    expect(x.total).toBe(196_350_000);
  });
  it("조정대상지역이 아니면 거주 0년이어도 보유 2년이면 비과세", () => {
    const x = capitalGains({ kind: "house", sale: 800_000_000, acquisition: 500_000_000, holdYears: 2, oneHouse: true });
    expect(x.oneHouseUnmet).toBeNull();
    expect(x.exempt).toBe(true);
    expect(x.total).toBe(0);
  });
  it("조정대상지역 취득이라도 거주 2년이면 요건 충족", () => expect(oneHouseUnmet({ holdYears: 3, residenceYears: 2, adjustedAtAcquisition: true })).toBeNull());
  it("토지는 1주택 체크를 무시", () => expect(capitalGains({ kind: "land", sale: 800_000_000, acquisition: 500_000_000, holdYears: 5, oneHouse: true }).oneHouseUnmet).toBeNull());
});

describe("적용 세율 표기", () => {
  it("보유 5년 2억5,850만 → 기본 38%", () => expect(rateLabel(258_500_000, { kind: "house", holdYears: 5 })).toBe("기본 38%"));
  it("주택 1년 6개월 → 단기 60%", () => expect(rateLabel(97_500_000, { kind: "house", holdYears: 1.5 })).toBe("단기 60%"));
  it("중과 2주택 → 기본 + 20%p", () => expect(rateLabel(100_000_000, { kind: "house", holdYears: 5, surcharge: 0.2 })).toBe("기본 35% + 20%p"));
  // 토지 1~2년 40% 와 기본 45% + 비사업용 10%p 중 큰 것(제104조 ① 후단): 20억이면 기본 쪽이 크다
  it("큰 쪽을 고른다", () => expect(rateLabel(2_000_000_000, { kind: "land", holdYears: 1.5, nonBusinessLand: true })).toBe("기본 45% + 10%p"));
  it("과세표준 0 이면 —", () => expect(rateLabel(0, { kind: "house", holdYears: 5 })).toBe("—"));
});

describe("남은 기본공제(제103조)와 차익 나눔", () => {
  // 손계산: 과세표준 2억9천만 − 2,900만 − 100만 = 2억6천만, × 38% − 1,994만 = 7,886만 + 788만6천
  it("먼저 판 자산이 150만원을 썼으면 100만원만 뺀다", () => {
    const x = capitalGains({ kind: "house", sale: 800_000_000, acquisition: 500_000_000, expenses: 10_000_000, holdYears: 5, basicLeft: 1_000_000 });
    expect(x.basic).toBe(1_000_000);
    expect(x.total).toBe(86_746_000);
  });
  it("250만원을 넘게 넣어도 250만원, 음수는 0", () => {
    const base = { kind: "land" as const, sale: 300_000_000, acquisition: 200_000_000, holdYears: 5 };
    expect(capitalGains({ ...base, basicLeft: 9_000_000 }).basic).toBe(2_500_000);
    expect(capitalGains({ ...base, basicLeft: -1 }).basic).toBe(0);
  });
  it("양도차익 = 비과세분 + 장기보유특별공제 + 기본공제 + 과세표준", () => {
    for (const sale of [1_200_000_001, 1_300_000_000, 1_500_000_000, 2_345_678_901]) {
      const x = capitalGains({ kind: "house", sale, acquisition: 700_000_000, expenses: 3_333_333, holdYears: 7, residenceYears: 4, oneHouse: true });
      expect(x.exemptPart + x.ltDeduction + x.basic + x.base).toBe(x.gain);
    }
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
