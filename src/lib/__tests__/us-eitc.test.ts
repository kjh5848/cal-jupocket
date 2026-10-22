/**
 * 미국 연방 EITC — 26 U.S.C. 32 · Rev. Proc. 2024-40·2025-32 §3.06 · Pub 596 (2025) EIC Table · i1040gi Worksheet A (2026-10-22 확인).
 * 표 값은 rates 의 anchorTests(Pub 596 행·각주)와 evidence 의 각주 8개로 고정한다.
 */
import { describe, it, expect } from "vitest";
import rates from "../../rates/us/eitc-2026.json";
import { ANCHORS, params, tableAmount, computeEitc, type Children, type Status, type Year } from "../us/eitc";

describe("rates", () => {
  it("draft 가 아니고 미확인이 없다", () => {
    expect((rates as Record<string, unknown>).draft).toBeUndefined();
    expect(rates.notVerified).toEqual([]);
  });
  it("Rev. Proc. 금액이 법정 비율과 맞는다(최대 = 비율 × earned income amount, 끝 = 시작 + 최대 ÷ 감소율)", () => {
    for (const year of [2025, 2026] as Year[])
      for (const c of [0, 1, 2, 3] as Children[])
        for (const s of ["mfj", "other"] as Status[]) {
          const p = params(year, s, c);
          expect(Math.round((p.creditPct / 100) * p.earnedIncomeAmount)).toBe(p.maxCredit);
          expect(Math.abs(p.threshold + p.maxCredit / (p.phaseoutPct / 100) - p.completed)).toBeLessThan(1);
        }
  });
  it("2026 숫자", () => {
    expect(params(2026, "other", 3).maxCredit).toBe(8231);
    expect(params(2026, "mfj", 3).completed).toBe(70244);
    expect(params(2026, "other", 0).completed).toBe(19540);
    expect(params(2026, "other", 0).investmentIncomeLimit).toBe(12200);
    expect(params(2025, "other", 0).investmentIncomeLimit).toBe(11950);
  });
});

describe("EIC Table 산식 — Pub 596 (2025)", () => {
  it.each(ANCHORS.map((a) => [a.source, a] as const))("%s", (_, a) => {
    expect(tableAmount(a.year as Year, a.status as Status, a.children as Children, a.lookup)).toBe(a.credit);
  });
  it("마지막 짧은 구간 각주 8개", () => {
    const cases: [Status, Children, number, number][] = [
      ["mfj", 3, 68_660, 3],
      ["other", 0, 19_102, 0],
      ["mfj", 0, 26_205, 1],
      ["other", 1, 50_420, 3],
      ["other", 2, 57_305, 1],
      ["mfj", 1, 57_552, 0],
      ["other", 3, 61_552, 1],
      ["mfj", 2, 64_410, 3],
    ];
    for (const [s, c, x, v] of cases) expect(tableAmount(2025, s, c, x)).toBe(v);
  });
  it("0.5 올림: 1 child $1–$50 → 34% × 25 = 8.5 → 9, $2,455 → 842", () => {
    expect(tableAmount(2025, "other", 1, 1)).toBe(9);
    expect(tableAmount(2025, "other", 1, 2455)).toBe(842);
  });
  it("1 달러 미만·끝 이상은 0, earned income amount 구간은 최대", () => {
    expect(tableAmount(2025, "other", 1, 0.5)).toBe(0);
    expect(tableAmount(2025, "other", 1, 50_434)).toBe(0);
    expect(tableAmount(2025, "other", 1, 12_730)).toBe(4328);
    expect(tableAmount(2026, "other", 3, 20_000)).toBe(8231);
  });
  it("50 의 배수가 아닌 감소 시작(10,620)이 든 구간은 아직 감소하지 않는다", () => {
    expect(tableAmount(2025, "other", 0, 10_610)).toBe(649);
    // 10,650–10,700: 649 − 7.65% × (10,675 − 10,620) = 644.79 → 645
    expect(tableAmount(2025, "other", 0, 10_660)).toBe(645);
  });
});

describe("Worksheet A", () => {
  it("AGI 를 비우면 earned income 표 값", () => {
    const r = computeEitc({ year: 2025, status: "other", children: 1, earned: 2455 });
    expect(r.credit).toBe(842);
    expect(r.byAgi).toBeNull();
  });
  it("AGI 가 감소 시작보다 작으면 earned income 표 값", () => {
    expect(computeEitc({ year: 2025, status: "other", children: 1, earned: 15_000, agi: 20_000 }).credit).toBe(4328);
  });
  it("AGI 가 감소 시작 이상이고 다르면 작은 쪽", () => {
    const r = computeEitc({ year: 2025, status: "other", children: 1, earned: 15_000, agi: 24_575 });
    expect(r.byEarned).toBe(4328);
    expect(r.byAgi).toBe(4132);
    expect(r.credit).toBe(4132);
  });
  it("AGI 가 끝 이상이면 0", () => {
    expect(computeEitc({ year: 2026, status: "other", children: 0, earned: 5000, agi: 19_540 }).credit).toBe(0);
  });
  it("투자소득 한도: 2025 $11,950 까지 됨, 2026 $12,200 넘으면 0", () => {
    expect(computeEitc({ year: 2025, status: "other", children: 1, earned: 10_000, investmentIncome: 11_950 }).reason).toBe("ok");
    const r = computeEitc({ year: 2026, status: "other", children: 1, earned: 10_000, investmentIncome: 12_201 });
    expect([r.credit, r.reason]).toEqual([0, "investment"]);
  });
  it("자녀 없음: 나이 밖이면 0, MFS 는 자녀 없으면 0, 자녀 있으면 other 열", () => {
    expect(computeEitc({ year: 2026, status: "other", children: 0, earned: 9000, ageOk: false }).reason).toBe("age");
    expect(computeEitc({ year: 2026, status: "mfs", children: 0, earned: 9000 }).reason).toBe("mfsNoChild");
    expect(computeEitc({ year: 2026, status: "mfs", children: 2, earned: 30_000 }).credit).toBe(
      computeEitc({ year: 2026, status: "other", children: 2, earned: 30_000 }).credit,
    );
  });
  it("2026 MFJ 자녀 3명 earned 40,000 → 8,231 − 21.06% × (40,025 − 31,160) = 6,364.03 → 6,364", () => {
    expect(computeEitc({ year: 2026, status: "mfj", children: 3, earned: 40_000 }).credit).toBe(6364);
  });
});
