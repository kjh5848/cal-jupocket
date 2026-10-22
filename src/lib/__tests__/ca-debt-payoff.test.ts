/**
 * 캐나다판 부채 상환(/en-ca/tools/debt-payoff/) — 공유 lib(lib/debt-payoff.ts)이 FCAC 원문 예시를 재현하는지 고정한다.
 * FCAC "Paying off your credit card" Table 1(https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/pay-off-credit-card.html,
 * dcterms.modified 2025-10-15, 확인 2026-10-23): 잔액 $2,000 · 연 18%
 *   월 $60  → 3 years, 11 months · 이자 $793 · 총 $2,793
 *   월 $160 → 1 year, 2 months  · 이자 $231 · 총 $2,231
 * 금액은 센트. FCAC 는 달러 단위로 반올림해 적는다.
 */
import { describe, expect, it } from "vitest";
import { payoffPlan } from "../debt-payoff";

const card = (minPayment: number) =>
  payoffPlan({
    debts: [{ name: "Card", balance: 200_000, ratePct: 18, minPayment, priority: 1 }],
    strategy: "avalanche",
    extra: 0,
    extraGrowthPct: 0,
  });

describe("ca debt payoff — FCAC Table 1", () => {
  it("$2,000 at 18%, $60 a month: 3 years 11 months, $793 interest, $2,793 total", () => {
    const r = card(6_000);
    if (!r.ok) throw new Error("not ok");
    expect(r.months).toBe(47);
    expect(Math.round(r.totalInterest / 100)).toBe(793);
    expect(Math.round(r.totalPaid / 100)).toBe(2_793);
  });

  it("$2,000 at 18%, $160 a month: 1 year 2 months, $231 interest, $2,231 total", () => {
    const r = card(16_000);
    if (!r.ok) throw new Error("not ok");
    expect(r.months).toBe(14);
    expect(Math.round(r.totalInterest / 100)).toBe(231);
    expect(Math.round(r.totalPaid / 100)).toBe(2_231);
  });
});
