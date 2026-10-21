/**
 * 영국 SDLT(잉글랜드·북아일랜드 주거용, 2025-04-01 이후) — GOV.UK 예시 다섯 개 + 손계산 경계.
 * 손계산: 생애최초 £500,001 → 표준 2,500 + 5% × 250,001 = 15,000.05 → £15,000 /
 * higher £40,000 → 5% = £2,000 / 비거주 표준 £40,000 → 2% = £800 / 비거주 생애최초 £500,000 → 2% × 300,000 + 7% × 200,000 = £20,000 /
 * 비거주 higher £300,000 → 7% × 125,000 + 9% × 125,000 + 12% × 50,000 = 8,750 + 11,250 + 6,000 = £26,000 /
 * 표준 £250,000.99 → 2,500 + 5% × 0.99 = 2,500.0495 → £2,500 / £2m → 2,500 + 33,750 + 57,500 + 60,000 = £153,750.
 */
import { describe, it, expect } from "vitest";
import { sdlt, bandsOf, bandTax, SURCHARGE_PCT, HIGHER_MIN, SURCHARGE_MIN, FTB_MAX } from "../gb/stamp-duty";

const P = (pounds: number) => pounds * 100;

describe("표 (FA 2003 s.55(1B) · Sch 4ZA · Sch 6ZA, 2026-10-21)", () => {
  it("표준·higher·생애최초 구간", () => {
    expect(bandsOf("standard").map((b) => [b.from, b.upTo, b.pct])).toEqual([
      [0, 125000, 0],
      [125000, 250000, 2],
      [250000, 925000, 5],
      [925000, 1500000, 10],
      [1500000, null, 12],
    ]);
    expect(bandsOf("higher").map((b) => b.pct)).toEqual([5, 7, 10, 15, 17]);
    expect(bandsOf("firstTimeBuyer").map((b) => [b.from, b.upTo, b.pct])).toEqual([
      [0, 300000, 0],
      [300000, 500000, 5],
    ]);
    expect(SURCHARGE_PCT).toBe(2);
    expect(HIGHER_MIN).toBe(40000);
    expect(SURCHARGE_MIN).toBe(40000);
    expect(FTB_MAX).toBe(500000);
  });
});

describe("GOV.UK 예시", () => {
  it("표준 £295,000 → £4,750 (0 + 2,500 + 2,250)", () => {
    const r = sdlt(P(295000), "standard", false);
    expect(r.total).toBe(4750);
    expect(r.lines.map((l) => l.taxCentiPence / 10000)).toEqual([0, 2500, 2250]);
  });
  it("생애최초 £500,000 → £10,000", () => {
    expect(sdlt(P(500000), "firstTimeBuyer", false).total).toBe(10000);
  });
  it("추가 주택 £300,000 → £20,000 (6,250 + 8,750 + 5,000)", () => {
    const r = sdlt(P(300000), "higher", false);
    expect(r.total).toBe(20000);
    expect(r.lines.map((l) => l.taxCentiPence / 10000)).toEqual([6250, 8750, 5000]);
  });
  it("shared ownership 예시 표준 £280,000 → £4,000 · £260,000 → £3,000", () => {
    expect(sdlt(P(280000), "standard", false).total).toBe(4000);
    expect(sdlt(P(260000), "standard", false).total).toBe(3000);
  });
});

describe("경계·전환", () => {
  it("£125,000 이하 표준 0", () => {
    expect(sdlt(P(125000), "standard", false).total).toBe(0);
    expect(sdlt(P(125000), "standard", false).lines).toHaveLength(1);
    expect(sdlt(0, "standard", false).total).toBe(0);
  });
  it("생애최초 £500,001 → 표준으로, £15,000 (버림)", () => {
    const r = sdlt(P(500001), "firstTimeBuyer", false);
    expect(r.ftbOverLimit).toBe(true);
    expect(r.table).toBe("standard");
    expect(r.total).toBe(15000);
  });
  it("higher £39,999 → 표준 £0 · £40,000 → £2,000", () => {
    const a = sdlt(P(39999), "higher", false);
    expect(a.higherBelowMin).toBe(true);
    expect(a.total).toBe(0);
    expect(sdlt(P(40000), "higher", false).total).toBe(2000);
  });
  it("비거주 표준 £40,000 → £800 · £39,999 → £0", () => {
    expect(sdlt(P(40000), "standard", true).total).toBe(800);
    const b = sdlt(P(39999), "standard", true);
    expect(b.surchargeBelowMin).toBe(true);
    expect(b.total).toBe(0);
  });
  it("비거주 생애최초 £500,000 → £20,000 · 비거주 higher £300,000 → £26,000", () => {
    expect(sdlt(P(500000), "firstTimeBuyer", true).total).toBe(20000);
    const r = sdlt(P(300000), "higher", true);
    expect(r.lines.map((l) => l.pct)).toEqual([7, 9, 12]);
    expect(r.total).toBe(26000);
  });
  it("펜스가 있는 값 £250,000.99 → £2,500 (파운드 미만 버림)", () => {
    expect(sdlt(25000099, "standard", false).total).toBe(2500);
  });
  it("£2m 표준 → £153,750 (12% 구간까지)", () => {
    const r = sdlt(P(2000000), "standard", false);
    expect(r.lines).toHaveLength(5);
    expect(r.total).toBe(153750);
  });
  it("구간 세액 표시", () => {
    expect(bandTax(22500000)).toBe("£2,250");
    expect(bandTax(250005 * 100 * 5)).toBe("£12,500.25");
  });
});
