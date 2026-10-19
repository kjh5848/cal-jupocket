/**
 * 일본 消費税 — 国税庁 No.6303(10%·8%)·No.6902(11,000円（税抜価格10,000円）) · 消費税法施行令 第70条の10(× 10/110·8/108).
 * 끝수는 손계산으로 고정: 1,000 × 10/110 = 90.90… / 1,000 × 8/108 = 74.07… / 1,234 × 8% = 98.72.
 */
import { describe, it, expect } from "vitest";
import { fromExclusive, fromInclusive, STANDARD, REDUCED } from "../jp/consumption-tax";

describe("세율 (No.6303 令和8年4月1日現在)", () => {
  it("標準 10% · 軽減 8%", () => {
    expect(STANDARD).toBe(10);
    expect(REDUCED).toBe(8);
  });
});

describe("税抜 → 税込", () => {
  it("No.6902 예시: 10,000円 → 税込 11,000円, うち消費税額等 1,000円", () => {
    expect(fromExclusive(10000, 10)).toEqual({ exclusive: 10000, tax: 1000, inclusive: 11000 });
  });
  it("軽減 8%: 10,000円 → 10,800円", () => {
    expect(fromExclusive(10000, 8)).toEqual({ exclusive: 10000, tax: 800, inclusive: 10800 });
  });
  it("끝수: 1,234円 × 8% = 98.72円", () => {
    expect(fromExclusive(1234, 8, "floor").tax).toBe(98);
    expect(fromExclusive(1234, 8, "round").tax).toBe(99);
    expect(fromExclusive(1234, 8, "ceil").tax).toBe(99);
  });
  it("四捨五入 경계: 5円 × 10% = 0.5円 → 1円, 4円 × 10% = 0.4円 → 0円", () => {
    expect(fromExclusive(5, 10, "round").tax).toBe(1);
    expect(fromExclusive(4, 10, "round").tax).toBe(0);
    expect(fromExclusive(4, 10, "ceil").tax).toBe(1);
  });
  it("0円은 0円", () => {
    expect(fromExclusive(0, 10)).toEqual({ exclusive: 0, tax: 0, inclusive: 0 });
  });
});

describe("税込 → 税抜 (× 10/110 · 8/108)", () => {
  it("No.6902 예시: 11,000円 → 税抜 10,000円, 消費税 1,000円", () => {
    expect(fromInclusive(11000, 10)).toEqual({ exclusive: 10000, tax: 1000, inclusive: 11000 });
  });
  it("10,800円(8%) → 10,000円", () => {
    expect(fromInclusive(10800, 8)).toEqual({ exclusive: 10000, tax: 800, inclusive: 10800 });
  });
  it("1,000円(10%): 90.90…円 → 切捨て 90/910, 切上げ·四捨五入 91/909", () => {
    expect(fromInclusive(1000, 10, "floor")).toEqual({ exclusive: 910, tax: 90, inclusive: 1000 });
    expect(fromInclusive(1000, 10, "ceil")).toEqual({ exclusive: 909, tax: 91, inclusive: 1000 });
    expect(fromInclusive(1000, 10, "round")).toEqual({ exclusive: 909, tax: 91, inclusive: 1000 });
  });
  it("1,000円(8%): 74.07…円 → 切捨て·四捨五入 74, 切上げ 75", () => {
    expect(fromInclusive(1000, 8, "floor").tax).toBe(74);
    expect(fromInclusive(1000, 8, "round").tax).toBe(74);
    expect(fromInclusive(1000, 8, "ceil").tax).toBe(75);
  });
  it("넣은 税込 금액은 그대로 남는다", () => {
    for (const v of [1, 99, 108, 1980, 123457]) {
      for (const r of ["floor", "round", "ceil"] as const) {
        const s = fromInclusive(v, 10, r);
        expect(s.exclusive + s.tax).toBe(v);
      }
    }
  });
  it("부동소수 오차 없음: 税込 110円 → 10円 정확히", () => {
    expect(fromInclusive(110, 10, "floor").tax).toBe(10);
    expect(fromInclusive(108, 8, "floor").tax).toBe(8);
  });
});
