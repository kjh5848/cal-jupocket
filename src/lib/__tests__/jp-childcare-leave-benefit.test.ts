/**
 * 일본 育児休業等給付 — 厚生労働省 パンフレット 2026(令和8)年8月1日改訂版·Q&A～育児休業等給付～ 예시(2026-10-21 확인).
 * - 상·하한(令和9年7月31日까지): 日額 16,540円·3,203円 → 30日 67% 332,454 / 64,380, 50% 248,100 / 48,045,
 *   出生時 28日 310,290, 支援 28日 60,205 / 11,658
 * - 例: 日額 10,000円(月額 300,000円) → 30日 67% 201,000円, 賃金 120,000円이면 240,000 − 120,000 = 120,000円, 支援 28日 36,400円
 * - 例: 出生時 14日 → 93,800円, 3日 就労 賃金 30,000円이면 112,000 − 30,000 = 82,000円, 支援 14日 18,200円
 * - Q4: 10,000円 × 28日 × 67% = 187,600円 · Q40: + 支援 36,400円 = 224,000円
 */
import { describe, it, expect } from "vitest";
import {
  wageDaily,
  periodBenefit,
  supportBenefit,
  childcareBenefit,
  formatYen,
  DAILY_UPPER,
  DAILY_LOWER,
} from "../jp/childcare-leave-benefit";

describe("休業開始時賃金日額", () => {
  it("6か月の合計 ÷ 180、小数点以下切り捨て", () => {
    expect(wageDaily(1_800_000)).toEqual({ raw: 10_000, applied: 10_000, limit: null });
    expect(wageDaily(1_800_179).raw).toBe(10_000);
    expect(wageDaily(1_800_180).raw).toBe(10_001);
  });
  it("上限 16,540円・下限 3,203円", () => {
    expect(DAILY_UPPER).toBe(16_540);
    expect(DAILY_LOWER).toBe(3_203);
    expect(wageDaily(6_000_000)).toEqual({ raw: 33_333, applied: 16_540, limit: "upper" });
    expect(wageDaily(16_540 * 180).limit).toBe(null);
    expect(wageDaily(300_000)).toEqual({ raw: 1_666, applied: 3_203, limit: "lower" });
    expect(wageDaily(0).applied).toBe(3_203);
  });
});

describe("支給上限額・支給下限額 (パンフレット 16ページ)", () => {
  it("30日 67%・50%", () => {
    expect(periodBenefit(16_540, 30, 67)).toBe(332_454);
    expect(periodBenefit(3_203, 30, 67)).toBe(64_380);
    expect(periodBenefit(16_540, 30, 50)).toBe(248_100);
    expect(periodBenefit(3_203, 30, 50)).toBe(48_045);
  });
  it("出生時 28日 67%・支援 28日 13%", () => {
    expect(periodBenefit(16_540, 28, 67)).toBe(310_290);
    expect(supportBenefit(16_540, 28)).toBe(60_205);
    expect(supportBenefit(3_203, 28)).toBe(11_658);
    expect(supportBenefit(16_540, 40)).toBe(60_205);
  });
});

describe("休業中の賃金 — 80%", () => {
  it("日額 10,000円・30日: 賃金なし 201,000円、120,000円で 120,000円", () => {
    expect(periodBenefit(10_000, 30, 67)).toBe(201_000);
    expect(periodBenefit(10_000, 30, 67, 120_000)).toBe(120_000);
    // 13% 以下は減額なし
    expect(periodBenefit(10_000, 30, 67, 39_000)).toBe(201_000);
    // 80% 以上は不支給
    expect(periodBenefit(10_000, 30, 67, 240_000)).toBe(0);
    expect(periodBenefit(10_000, 30, 67, 300_000)).toBe(0);
    // 50%: 30% 以下は減額なし
    expect(periodBenefit(10_000, 30, 50, 90_000)).toBe(150_000);
    expect(periodBenefit(10_000, 30, 50, 100_000)).toBe(140_000);
  });
  it("出生時 14日: 93,800円、賃金 30,000円で 82,000円、支援 18,200円", () => {
    expect(periodBenefit(10_000, 14, 67)).toBe(93_800);
    expect(periodBenefit(10_000, 14, 67, 30_000)).toBe(82_000);
    expect(supportBenefit(10_000, 14)).toBe(18_200);
  });
});

describe("合計", () => {
  it("Q4・Q40 — 出生時 28日 187,600円 + 支援 36,400円 = 224,000円", () => {
    const r = childcareBenefit({
      sixMonthTotal: 1_800_000,
      leaveMonths: 0,
      leaveExtraDays: 0,
      wagePerPeriod: 0,
      birthLeaveDays: 28,
      supportDays: 28,
    });
    expect(r.birthTime).toBe(187_600);
    expect(r.support).toBe(36_400);
    expect(r.total).toBe(224_000);
  });
  it("育児休業 12か月 — 6か月 67%・7か月目から 50%", () => {
    const r = childcareBenefit({
      sixMonthTotal: 1_800_000,
      leaveMonths: 12,
      leaveExtraDays: 0,
      wagePerPeriod: 0,
      birthLeaveDays: 0,
      supportDays: 0,
    });
    expect(r.periods).toHaveLength(12);
    expect(r.periods[5]).toEqual({ index: 6, days: 30, ratePct: 67, amount: 201_000 });
    expect(r.periods[6]).toEqual({ index: 7, days: 30, ratePct: 50, amount: 150_000 });
    expect(r.childcareTotal).toBe(201_000 * 6 + 150_000 * 6);
    expect(r.perMonthFirst).toBe(201_000);
    expect(r.perMonthAfter).toBe(150_000);
    expect(r.support).toBe(0);
  });
  it("端数の日数は最後の支給単位期間", () => {
    const r = childcareBenefit({
      sixMonthTotal: 1_800_000,
      leaveMonths: 2,
      leaveExtraDays: 15,
      wagePerPeriod: 0,
      birthLeaveDays: 0,
      supportDays: 0,
    });
    expect(r.periods.map((p) => p.days)).toEqual([30, 30, 15]);
    expect(r.periods[2].amount).toBe(100_500);
  });
  it("育児休業給付が 0円なら支援給付金も 0円 (Q41)", () => {
    const r = childcareBenefit({
      sixMonthTotal: 1_800_000,
      leaveMonths: 1,
      leaveExtraDays: 0,
      wagePerPeriod: 240_000,
      birthLeaveDays: 0,
      supportDays: 28,
    });
    expect(r.childcareTotal).toBe(0);
    expect(r.support).toBe(0);
  });
  it("賃金で減額されても支援給付金は減らない", () => {
    const r = childcareBenefit({
      sixMonthTotal: 1_800_000,
      leaveMonths: 1,
      leaveExtraDays: 0,
      wagePerPeriod: 120_000,
      birthLeaveDays: 0,
      supportDays: 28,
    });
    expect(r.childcareTotal).toBe(120_000);
    expect(r.support).toBe(36_400);
  });
  it("formatYen", () => {
    expect(formatYen(332_454)).toBe("332,454円");
  });
});
