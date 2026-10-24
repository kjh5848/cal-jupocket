/**
 * 미국 연방 복권·도박 당첨금 — 26 U.S.C. 3402(q)·1(j)(2)(F) · W-2G 지침(Rev. January 2026) · Rev. Proc. 2025-32 §4.01·§4.14 (2026-10-24 확인).
 * rates 의 anchorTests 5개(W-2G 지침 Form 5754 예시 + 손계산)와 게임 종류·구간 경계 손계산으로 고정한다.
 */
import { describe, it, expect } from "vitest";
import rates from "../../rates/us/gambling-winnings-2026.json";
import {
  ANCHORS,
  brackets,
  computeLottery,
  noncashPayerPaidWithholding,
  regularWithholding,
  standardDeduction,
  taxFromTable,
  type Status,
} from "../us/gambling-winnings";

describe("rates", () => {
  it("draft 가 아니고 미확인이 없다", () => {
    expect((rates as Record<string, unknown>).draft).toBeUndefined();
    expect(rates.notVerified).toEqual([]);
  });
  it("2026 표준공제(Rev. Proc. 2025-32 §4.14)", () => {
    expect([standardDeduction("single"), standardDeduction("mfj"), standardDeduction("hoh"), standardDeduction("mfs")]).toEqual([
      16100, 32200, 24150, 16100,
    ]);
  });
  it.each(["single", "mfj", "hoh", "mfs"] as Status[])("%s 세율표 구간 base 가 앞 구간 누적 세액과 같다", (s) => {
    const b = brackets(s);
    for (let n = 1; n < b.length; n++) {
      const prev = b[n - 1];
      expect(Math.round((prev.base + prev.rate * (prev.upTo! - prev.over)) * 100) / 100).toBe(b[n].base);
    }
  });
});

describe("anchorTests", () => {
  const [a1, a2, a3, a4, a5] = ANCHORS as unknown as Record<string, number>[];
  it("앵커가 5개", () => expect(ANCHORS).toHaveLength(5));
  it("W-2G 지침 Form 5754 예시 — $5,002, 베팅 $1 → $1,200.24", () => {
    expect(regularWithholding(5002, 1)).toBe(a1.withholding);
  });
  it("주 복권 $5,000 — 'more than $5,000' 아님 → 0", () => {
    expect(regularWithholding(5000, 0)).toBe(a2.withholding);
  });
  it("Single, 다른 과세소득 $50,000, 일시금 $1,000,000, 베팅 $2", () => {
    const r = computeLottery({ status: "single", game: "lottery", winnings: 1_000_000, wager: 2, otherIncome: 66_100 });
    expect(r.withholding).toBe(a3.withholding);
    expect(r.taxWithout).toBe(a3.taxWithout);
    expect(r.taxWith).toBe(a3.taxWith);
    expect(r.additionalTax).toBe(a3.additionalTax);
    expect(r.balanceDue).toBe(a3.balanceDue);
    expect(r.topRate).toBe(0.37);
  });
  it("MFJ, 다른 소득 없음, 표준공제, $100,000, 베팅 $2", () => {
    const r = computeLottery({ status: "mfj", game: "lottery", winnings: 100_000, wager: 2, otherIncome: 0 });
    expect(r.withholding).toBe(a4.withholding);
    expect(r.taxableWith).toBe(a4.taxableIncome);
    expect(r.additionalTax).toBe(a4.additionalTax);
    expect(r.balanceDue).toBe(a4.balanceDue);
  });
  it("현물 FMV $30,000, 베팅 $1, 지급자 부담 31.58%", () => {
    expect(noncashPayerPaidWithholding(30_000, 1)).toBe(a5.withholding);
  });
});

describe("게임 종류·경계 손계산", () => {
  it("그 밖 베팅: proceeds $5,990 ≥ 300 × $10 → 24% = $1,437.60", () => {
    expect(regularWithholding(6000, 10, "wager")).toBe(1437.6);
  });
  it("그 밖 베팅: proceeds $24,900 < 300 × $100 → 0", () => {
    expect(regularWithholding(25_000, 100, "wager")).toBe(0);
  });
  it("slot·keno·bingo 는 정규 원천징수 없음", () => {
    expect(regularWithholding(50_000, 5, "slots")).toBe(0);
  });
  it("세율표 경계: single $12,400 → $1,240, hoh $640,600 → $191,171, mfs $384,350 → $103,291.75, 0 → 0", () => {
    expect(taxFromTable("single", 12_400)).toBe(1240);
    expect(taxFromTable("hoh", 640_600)).toBe(191_171);
    expect(taxFromTable("mfs", 384_350)).toBe(103_291.75);
    expect(taxFromTable("single", 0)).toBe(0);
  });
  it("공제를 직접 넣으면 그 값, 다른 소득이 공제보다 작으면 남은 공제가 당첨금을 줄인다", () => {
    const r = computeLottery({ status: "single", game: "lottery", winnings: 10_000, wager: 0, otherIncome: 6_100, deduction: 16_100 });
    expect(r.taxableWithout).toBe(0);
    expect(r.taxableWith).toBe(0);
    expect(r.additionalTax).toBe(0);
    expect(r.balanceDue).toBe(-2400);
  });
  it("W-2G: $2,000 이상(복권), slot 은 표시 안 함", () => {
    expect(computeLottery({ status: "single", game: "lottery", winnings: 2000, wager: 0, otherIncome: 0 }).w2g).toBe(true);
    expect(computeLottery({ status: "single", game: "lottery", winnings: 1999, wager: 0, otherIncome: 0 }).w2g).toBe(false);
  });
});
