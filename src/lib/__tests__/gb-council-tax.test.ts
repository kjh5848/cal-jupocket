/**
 * 잉글랜드 Council Tax — LGFA 1992 s.5(비율 6:7:8:9:11:13:15:18)·s.36(A × N ÷ D)·s.11(25%·50%) ·
 * SI 1992/613 Sch 1 para 2(5)(6)(파운드 반올림·나머지 첫 회)를 손계산으로 고정.
 * 손계산: Band D £2,280 → C = 2,280 × 8 ÷ 9 = 2,026.666… → £2,026.67 → 10회: 202.667 → A £203, B = 2,026.67 − 9 × 203 = £199.67
 *         12회: 168.889 → A £169, B = 2,026.67 − 11 × 169 = £167.67 · 25% 할인: 2,026.67 × 0.75 = 1,520.0025 → £1,520.00 → 10회 £152 씩.
 * 정확히 50p 인 경우(원문이 정하지 않음)는 테스트로 고정하지 않는다.
 */
import { describe, it, expect } from "vitest";
import rates from "../../rates/gb/council-tax-2026.json";
import {
  BANDS, D_RATIO, SINGLE_DISCOUNT, NONE_DISCOUNT, INSTALMENTS, INSTALMENTS_ON_REQUEST,
  fromBandD, applyDiscount, instalments, gbp, bandRange,
} from "../gb/council-tax";

describe("rates (legislation.gov.uk·gov.uk 2026-10-23)", () => {
  it("초안이 아니고 남은 미확인이 없다", () => {
    expect((rates as Record<string, unknown>).draft).toBeUndefined();
    expect((rates as Record<string, unknown>).notVerified).toBeUndefined();
  });
  it("잉글랜드 비율 6:7:8:9:11:13:15:18 · Band A~H 경계(s.5)", () => {
    expect(BANDS.map((b) => b.ratio)).toEqual([6, 7, 8, 9, 11, 13, 15, 18]);
    expect(BANDS.map((b) => b.valueUpTo)).toEqual([40000, 52000, 68000, 88000, 120000, 160000, 320000, null]);
    expect(D_RATIO).toBe(9);
  });
  it("할인 25%·50%(s.11) · 10회·12회(Sch 1)", () => {
    expect(SINGLE_DISCOUNT).toBe(25);
    expect(NONE_DISCOUNT).toBe(50);
    expect(INSTALMENTS).toBe(10);
    expect(INSTALMENTS_ON_REQUEST).toBe(12);
  });
});

describe("band 금액 = Band D × N ÷ 9 (s.36)", () => {
  it("Band D £2,280 → A £1,520 · D £2,280 · H £4,560 · C £2,026.67", () => {
    expect(fromBandD(228000, "A")).toBe(152000);
    expect(fromBandD(228000, "D")).toBe(228000);
    expect(fromBandD(228000, "H")).toBe(456000);
    expect(fromBandD(228000, "C")).toBe(202667);
  });
  it("Band D £2,000 → B 1,555.555… → £1,555.56 · E 2,444.444… → £2,444.44", () => {
    expect(fromBandD(200000, "B")).toBe(155556);
    expect(fromBandD(200000, "E")).toBe(244444);
  });
});

describe("할인 (s.11)", () => {
  it("£2,026.67 × 25% = 506.6675 → £506.67, 낼 돈 £1,520.00", () => {
    expect(applyDiscount(202667, 25)).toEqual({ discount: 50667, payable: 152000 });
  });
  it("50% · 0%", () => {
    expect(applyDiscount(228000, 50)).toEqual({ discount: 114000, payable: 114000 });
    expect(applyDiscount(228000, 0)).toEqual({ discount: 0, payable: 228000 });
  });
});

describe("분할 (SI 1992/613 Sch 1 para 2(5)(6))", () => {
  it("£2,026.67 ÷ 10 → 첫 회 £199.67 + 9 × £203", () => {
    expect(instalments(202667, 10)).toEqual({ first: 19967, rest: 20300, count: 10, small: false });
  });
  it("£2,026.67 ÷ 12 → 첫 회 £167.67 + 11 × £169", () => {
    expect(instalments(202667, 12)).toEqual({ first: 16767, rest: 16900, count: 12, small: false });
  });
  it("파운드 배수면 그대로: £1,520 ÷ 10 = £152 · £2,280 ÷ 12 = £190", () => {
    expect(instalments(152000, 10)).toEqual({ first: 15200, rest: 15200, count: 10, small: false });
    expect(instalments(228000, 12)).toEqual({ first: 19000, rest: 19000, count: 12, small: false });
  });
  it("내림 쪽: £1,555.56 ÷ 10 = 155.556 → A £156, B = 1,555.56 − 1,404 = £151.56", () => {
    expect(instalments(155556, 10)).toEqual({ first: 15156, rest: 15600, count: 10, small: false });
  });
  it("£2,444.44 ÷ 10 = 244.444 → A £244, B = 2,444.44 − 2,196 = £248.44", () => {
    expect(instalments(244444, 10)).toEqual({ first: 24844, rest: 24400, count: 10, small: false });
  });
  it("합계는 언제나 연액", () => {
    for (let t = 0; t <= 500000; t += 3137) {
      for (const n of [10, 12]) {
        const s = instalments(t, n);
        expect(s.first + (n - 1) * s.rest).toBe(t);
      }
    }
  });
  it("£5 미만 회차 표시(para 2(7))", () => {
    expect(instalments(3000, 10).small).toBe(true);
  });
});

describe("표기", () => {
  it("gbp · bandRange", () => {
    expect(gbp(202667)).toBe("£2,026.67");
    expect(bandRange("A")).toBe("up to £40,000");
    expect(bandRange("D")).toBe("over £68,000 up to £88,000");
    expect(bandRange("H")).toBe("more than £320,000");
  });
});
