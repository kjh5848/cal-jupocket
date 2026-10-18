/**
 * 중개보수 계산기 — brokerageFee(). 경계값은 별표 1 'A 이상 B 미만', 월세 70배 판정은 ×100 합으로 한다(제20조 ⑤ 1호).
 * roberin(#56) 같은 입력 대조는 docs/calc-benchmark.md — 아래 'roberin 과 같음' 값은 2026-10-18 관찰.
 */
import { describe, it, expect } from "vitest";
import r from "../../rates/brokerage-fee-2026.json";
import { brokerageFee, monthlyRentBase, housingBand } from "../brokerage-fee";

const fee = (property: "housing" | "officetel" | "other", deal: "sale" | "jeonse" | "monthly", amount: number, extra: object = {}) =>
  brokerageFee({ property, deal, amount, ...extra }).maxFee;

describe("rates — 별표 1·2 원문 숫자", () => {
  it("매매 6구간·임대차 6구간", () => {
    expect(r.housing.sale.map((b) => [b.below, b.permille, b.cap])).toEqual([
      [50_000_000, 6, 250_000],
      [200_000_000, 5, 800_000],
      [900_000_000, 4, null],
      [1_200_000_000, 5, null],
      [1_500_000_000, 6, null],
      [null, 7, null],
    ]);
    expect(r.housing.lease.map((b) => [b.below, b.permille, b.cap])).toEqual([
      [50_000_000, 5, 200_000],
      [100_000_000, 4, 300_000],
      [600_000_000, 3, null],
      [1_200_000_000, 4, null],
      [1_500_000_000, 5, null],
      [null, 6, null],
    ]);
    expect([r.officetel.salePermille, r.officetel.leasePermille, r.other.permille]).toEqual([5, 4, 9]);
  });
});

describe("주택 매매 — 구간 경계", () => {
  it("5천만 미만 0.6%·한도 25만", () => {
    expect(fee("housing", "sale", 30_000_000)).toBe(180_000);
    expect(fee("housing", "sale", 49_999_999)).toBe(250_000); // 299,999 → 한도
    expect(fee("housing", "sale", 49_990_000)).toBe(250_000); // roberin 과 같음
  });
  it("5천만원부터 0.5%·한도 80만", () => {
    expect(housingBand(50_000_000, false).permille).toBe(5);
    expect(fee("housing", "sale", 50_000_000)).toBe(250_000);
    expect(fee("housing", "sale", 150_000_000)).toBe(750_000); // roberin 과 같음
    expect(fee("housing", "sale", 199_999_999)).toBe(800_000);
  });
  it("2억·9억·12억·15억 경계", () => {
    expect(fee("housing", "sale", 200_000_000)).toBe(800_000);
    expect(fee("housing", "sale", 500_000_000)).toBe(2_000_000);
    expect(fee("housing", "sale", 899_999_999)).toBe(3_599_999);
    expect(fee("housing", "sale", 900_000_000)).toBe(4_500_000); // roberin 과 같음
    expect(fee("housing", "sale", 1_200_000_000)).toBe(7_200_000);
    expect(fee("housing", "sale", 1_500_000_000)).toBe(10_500_000); // roberin 과 같음
  });
});

describe("주택 전세 — 구간 경계", () => {
  it("5천만 미만 0.5%·한도 20만, 1억 미만 0.4%·한도 30만", () => {
    expect(fee("housing", "jeonse", 30_000_000)).toBe(150_000);
    expect(fee("housing", "jeonse", 50_000_000)).toBe(200_000);
    expect(fee("housing", "jeonse", 99_990_000)).toBe(300_000); // roberin 과 같음
  });
  it("1억·6억·12억·15억 경계", () => {
    expect(fee("housing", "jeonse", 100_000_000)).toBe(300_000); // roberin 과 같음
    expect(fee("housing", "jeonse", 600_000_000)).toBe(2_400_000);
    expect(fee("housing", "jeonse", 1_200_000_000)).toBe(6_000_000); // roberin 과 같음
    expect(fee("housing", "jeonse", 1_500_000_000)).toBe(9_000_000);
  });
});

describe("월세 — 제20조 ⑤ 1호", () => {
  it("×100 합이 5천만 미만이면 ×70", () => {
    expect(monthlyRentBase(10_000_000, 300_000)).toEqual({ base: 31_000_000, multiplier: 70 });
    expect(fee("housing", "monthly", 0, { deposit: 10_000_000, monthlyRent: 300_000 })).toBe(155_000); // roberin 과 같음
  });
  it("×100 합이 정확히 5천만이면 ×100 그대로 — 한 원 적으면 ×70", () => {
    expect(monthlyRentBase(10_000_000, 400_000)).toEqual({ base: 50_000_000, multiplier: 100 });
    expect(fee("housing", "monthly", 0, { deposit: 10_000_000, monthlyRent: 400_000 })).toBe(200_000);
    expect(monthlyRentBase(10_000_000, 399_999)).toEqual({ base: 37_999_930, multiplier: 70 });
    expect(fee("housing", "monthly", 0, { deposit: 10_000_000, monthlyRent: 399_999 })).toBe(189_999);
  });
  it("roberin 과 같음 — 2천/100만 → 1.2억 0.3%, 500/50만 → 5,500만 0.4%", () => {
    expect(fee("housing", "monthly", 0, { deposit: 20_000_000, monthlyRent: 1_000_000 })).toBe(360_000);
    expect(fee("housing", "monthly", 0, { deposit: 5_000_000, monthlyRent: 500_000 })).toBe(220_000);
  });
});

describe("오피스텔·그 밖", () => {
  it("요건 갖춘 오피스텔 매매 0.5%·임대차 0.4% — 한도 없음", () => {
    expect(fee("officetel", "sale", 300_000_000)).toBe(1_500_000);
    expect(fee("officetel", "jeonse", 200_000_000)).toBe(800_000);
    expect(fee("officetel", "sale", 40_000_000)).toBe(200_000);
  });
  it("상가·토지 등 0.9% 이내", () => {
    expect(fee("other", "sale", 300_000_000)).toBe(2_700_000);
    expect(fee("other", "monthly", 0, { deposit: 10_000_000, monthlyRent: 300_000 })).toBe(279_000);
  });
});

describe("협의 요율·부가세·쌍방", () => {
  it("협의 요율은 상한 안에서만", () => {
    const x = brokerageFee({ property: "housing", deal: "sale", amount: 500_000_000, agreedPct: 0.3 });
    expect([x.fee, x.appliedPct, x.agreedClamped, x.maxFee]).toEqual([1_500_000, 0.3, false, 2_000_000]);
    const y = brokerageFee({ property: "housing", deal: "sale", amount: 500_000_000, agreedPct: 0.9 });
    expect([y.fee, y.appliedPct, y.agreedClamped]).toEqual([2_000_000, 0.4, true]);
    const z = brokerageFee({ property: "housing", deal: "sale", amount: 150_000_000, agreedPct: 0.35 });
    expect(z.fee).toBe(525_000);
  });
  it("협의 요율도 구간 한도액을 넘지 않는다", () => {
    const x = brokerageFee({ property: "housing", deal: "sale", amount: 199_000_000, agreedPct: 0.45 });
    expect(x.fee).toBe(800_000);
  });
  it("부가세 10%·쌍방 합계", () => {
    const x = brokerageFee({ property: "housing", deal: "sale", amount: 500_000_000 });
    expect([x.vat, x.feeWithVat, x.bothSides]).toEqual([200_000, 2_200_000, 4_000_000]);
    expect(brokerageFee({ property: "housing", deal: "sale", amount: 150_000_000 }).hitCap).toBe(false);
    expect(brokerageFee({ property: "housing", deal: "sale", amount: 199_000_000 }).hitCap).toBe(true);
  });
  it("0원·빈 입력", () => {
    expect(brokerageFee({ property: "housing", deal: "sale" }).fee).toBe(0);
  });
});
