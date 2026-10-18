import { describe, it, expect } from "vitest";
import { prepaymentFee, proratedFee, LEGAL_YEARS } from "../prepayment-fee";
import { toDay, fromDay } from "../date-calc";

const d = (s: string) => toDay(s)!;
const base = { amount: 200_000_000, ratePct: 1.2, start: d("2026-01-05"), maturity: d("2036-01-05"), payDate: d("2027-04-05") };

describe("중도상환수수료", () => {
  it("법이 정한 기한은 3년(금융소비자보호법 제20조 ① 4호 나목 1))", () => {
    expect(LEGAL_YEARS).toBe(3);
  });

  it("2억 1.2% · 실행 15개월 뒤 상환 — 641일 ÷ 1,096일 (roberin 예시와 같음)", () => {
    const x = prepaymentFee(base);
    expect(x.error).toBeNull();
    expect(fromDay(x.windowEnd)).toBe("2029-01-05");
    expect(x.windowDays).toBe(1096); // 2028 윤년 포함
    expect(x.daysLeft).toBe(641);
    expect(x.fee).toBe(1_403_649);
    expect(x.total).toBe(201_403_649);
    expect(x.saving30).toBe(65_693);
  });

  it("실행 당일 상환이면 원금 × 요율 전부", () => {
    expect(prepaymentFee({ ...base, payDate: base.start }).fee).toBe(2_400_000);
  });

  it("3년 끝날과 그 뒤는 0원", () => {
    expect(prepaymentFee({ ...base, payDate: d("2029-01-05") }).fee).toBe(0);
    expect(prepaymentFee({ ...base, payDate: d("2029-01-04") }).fee).toBe(2_189); // 2,400,000 × 1/1096
    expect(prepaymentFee({ ...base, payDate: d("2031-06-30") }).fee).toBe(0);
  });

  it("만기가 3년보다 이르면 만기까지가 부과기간", () => {
    const x = prepaymentFee({ ...base, maturity: d("2027-01-05"), payDate: d("2026-07-05") });
    expect(x.endsAtMaturity).toBe(true);
    expect(x.windowDays).toBe(365);
    expect(x.daysLeft).toBe(184);
    expect(x.fee).toBe(1_209_863);
  });

  it("roberin 같은 입력 — 5천만 0.7% 1년 만기 · 2/29 실행 남은 1일", () => {
    const a = prepaymentFee({ amount: 50_000_000, ratePct: 0.7, start: d("2026-03-10"), maturity: d("2027-03-10"), payDate: d("2026-09-01") });
    expect([a.windowDays, a.daysLeft, a.fee, a.saving30]).toEqual([365, 190, 182_191, 28_767]);
    const b = prepaymentFee({ amount: 100_000_000, ratePct: 0.54, start: d("2028-02-29"), maturity: d("2058-02-28"), payDate: d("2031-02-27") });
    expect([b.windowDays, b.daysLeft, b.fee]).toEqual([1095, 1, 493]);
  });

  it("만기를 모르면 3년만 본다", () => {
    expect(prepaymentFee({ ...base, maturity: null }).fee).toBe(1_403_649);
  });

  it("2월 29일 실행 → 3년 끝날은 2월 28일(민법 제160조 ③)", () => {
    const x = prepaymentFee({ ...base, start: d("2028-02-29"), maturity: null, payDate: d("2028-02-29") });
    expect(fromDay(x.legalEnd)).toBe("2031-02-28");
    expect(x.windowDays).toBe(1095);
  });

  it("요율 소수는 정수로 바꿔 1원 오차가 없다", () => {
    expect(proratedFee(100_000_000, 0.54, 1096, 1096)).toBe(540_000);
    expect(proratedFee(123_456_789, 0.59, 500, 1096)).toBe(332_297); // 123,456,789 × 0.0059 × 500 ÷ 1096 = 332,297.01…
    expect(proratedFee(0, 1.2, 10, 100)).toBe(0);
  });

  it("날짜가 앞뒤로 맞지 않으면 안내만 하고 0원", () => {
    expect(prepaymentFee({ ...base, payDate: d("2025-12-31") }).error).toBe("pay-before-start");
    expect(prepaymentFee({ ...base, maturity: d("2025-01-01") }).error).toBe("maturity-before-start");
    const x = prepaymentFee({ ...base, maturity: d("2027-01-05"), payDate: d("2027-03-01") });
    expect(x.error).toBe("pay-after-maturity");
    expect(x.fee).toBe(0);
  });
});
