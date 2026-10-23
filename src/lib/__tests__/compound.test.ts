import { describe, it, expect } from "vitest";
import { compound, won, DEFAULT_TAX_PCT, GOAL_CAP_MONTHS } from "../compound";
import { savingsMonthlyInterest } from "../installment-savings";

const base = { principal: 10_000_000, monthly: 300_000, ratePct: 5, months: 120, timing: "start" as const, taxPct: 15.4, inflationPct: 0 };

describe("적립식 복리", () => {
  it("세율 기본값은 이자·배당 원천징수 14% + 지방소득세 1.4% = 15.4%", () => {
    expect(DEFAULT_TAX_PCT).toBe(15.4);
  });

  it("1천만원 + 월 30만원, 연 5%, 10년, 월초 적립 — 닫힌 식과 같다", () => {
    const r = 0.05 / 12;
    const g = Math.pow(1 + r, 120);
    const closed = 10_000_000 * g + 300_000 * ((g - 1) / r) * (1 + r);
    const res = compound(base);
    expect(res.balance).toBeCloseTo(closed, 4);
    expect(won(res.balance)).toBe(63_248_882);
    expect(res.paid).toBe(46_000_000);
    expect(won(res.gain)).toBe(17_248_882);
    expect(won(res.tax)).toBe(2_656_328);
    expect(won(res.afterTax)).toBe(60_592_554);
    expect(res.years).toHaveLength(10);
    expect(won(res.years[0].balance)).toBe(14_210_624);
    expect(won(res.years[0].gain)).toBe(610_624);
    expect(res.years[0].paid).toBe(3_600_000);
  });

  it("월말 적립이면 마지막 달 적립금은 불지 않는다", () => {
    const res = compound({ ...base, timing: "end", goal: 50_000_000 });
    expect(won(res.balance)).toBe(63_054_779);
    expect(won(res.afterTax)).toBe(60_428_343);
    // 8년째(85~96개월) 안에서 처음 5천만원을 넘는다
    expect(res.goalMonth).toBeGreaterThan(84);
    expect(res.goalMonth).toBeLessThanOrEqual(96);
  });

  it("원금 0·월초 적립이면 적금 계산기 월복리 이자와 같다(원 미만만 다름)", () => {
    for (const [m, rate, n] of [[500_000, 4, 12], [300_000, 3.5, 36], [1_000_000, 5, 60]] as const) {
      const res = compound({ principal: 0, monthly: m, ratePct: rate, months: n, timing: "start", taxPct: 0, inflationPct: 0 });
      expect(Math.floor(res.gain + 1e-6)).toBe(savingsMonthlyInterest(m, rate, n));
    }
    expect(won(compound({ principal: 0, monthly: 500_000, ratePct: 4, months: 12, timing: "start", taxPct: 0, inflationPct: 0 }).gain)).toBe(131_602);
  });

  it("수익률 0% — 넣은 돈 그대로, 세금 0", () => {
    const res = compound({ ...base, principal: 1_000_000, monthly: 100_000, ratePct: 0, months: 60 });
    expect(res.balance).toBe(7_000_000);
    expect(res.tax).toBe(0);
  });

  it("음수 수익률 — 손실에는 세금을 매기지 않는다", () => {
    const res = compound({ ...base, principal: 5_000_000, monthly: 200_000, ratePct: -3, months: 36 });
    expect(won(res.balance)).toBe(11_445_650);
    expect(won(res.gain)).toBe(-754_350);
    expect(res.tax).toBe(0);
    expect(res.afterTax).toBe(res.balance);
  });

  it("물가 — 세후 금액 ÷ (1 + 연 물가)^(개월 ÷ 12)", () => {
    const res = compound({ ...base, inflationPct: 2 });
    expect(res.real).toBeCloseTo(res.afterTax / Math.pow(1.02, 10), 6);
    expect(won(res.real)).toBe(49_706_999);
  });

  it("18개월이면 마지막 해는 6개월만 담는다", () => {
    const res = compound({ ...base, principal: 0, monthly: 500_000, ratePct: 4, months: 18, timing: "end", goal: 9_000_000 });
    expect(res.years.map((y) => y.month)).toEqual([12, 18]);
    expect(res.years[1].paid).toBe(3_000_000);
    expect(won(res.balance)).toBe(9_259_591);
    expect(res.goalMonth).toBe(18);
  });

  it("처음 원금이 이미 목표 이상이면 0개월, 기간 0이면 원금 그대로", () => {
    expect(compound({ ...base, goal: 5_000_000 }).goalMonth).toBe(0);
    const z = compound({ ...base, months: 0 });
    expect(z.balance).toBe(10_000_000);
    expect(z.years).toHaveLength(0);
  });

  it("기간 안에 못 닿으면 같은 조건으로 이어서 넣었을 때 목표 도달 개월을 따로 낸다(잔액은 기간까지만)", () => {
    const g = { taxPct: 0, inflationPct: 0, timing: "start" as const, months: 12 };
    // 100만원 + 월 50만원, 연 8% → 5천만원: 75개월째 처음 넘는다(그달 잔액 50,418,068원)
    const a = compound({ ...g, principal: 1_000_000, monthly: 500_000, ratePct: 8, goal: 50_000_000 });
    expect(a.goalMonth).toBeNull();
    expect(a.goalLater).toBe(75);
    expect(compound({ ...g, principal: 1_000_000, monthly: 500_000, ratePct: 8, months: 75 }).balance).toBeGreaterThanOrEqual(50_000_000);
    expect(compound({ ...g, principal: 1_000_000, monthly: 500_000, ratePct: 8, months: 74 }).balance).toBeLessThan(50_000_000);
    expect(won(compound({ ...g, principal: 1_000_000, monthly: 500_000, ratePct: 8, months: 75 }).balance)).toBe(50_418_068);
    expect(a.paid).toBe(7_000_000);
    // 0% 이면 넣은 돈만: 월 30만원으로 1천만원 → 34개월(1,020만원)
    expect(compound({ ...g, principal: 0, monthly: 300_000, ratePct: 0, goal: 10_000_000 }).goalLater).toBe(34);
    // 500만원 + 월 100만원, 연 5% → 1억원: 79개월
    expect(compound({ ...g, principal: 5_000_000, monthly: 1_000_000, ratePct: 5, goal: 100_000_000 }).goalLater).toBe(79);
  });

  it("기간 안에 닿으면 goalLater 는 없고, 상한(1200개월) 안에 못 닿으면 둘 다 null", () => {
    expect(compound({ ...base, goal: 50_000_000 }).goalLater).toBeNull();
    const far = compound({ ...base, principal: 0, monthly: 100_000, ratePct: 0, goal: 1_000_000_000 });
    expect(GOAL_CAP_MONTHS).toBe(1200);
    expect(far.goalMonth).toBeNull();
    expect(far.goalLater).toBeNull();
  });

  it("매달 0원이면 거치식 단순 복리 = 원금 × (1 + 월 수익률)^개월 — 월 수익률은 연 수익률 칸에 × 12", () => {
    const lump = (principal: number, monthlyPct: number, months: number) =>
      compound({ principal, monthly: 0, ratePct: monthlyPct * 12, months, timing: "start", taxPct: 0, inflationPct: 0 });
    // 100만원, 월 1%, 12개월 → 1,126,825원(이익 126,825원)
    expect(won(lump(1_000_000, 1, 12).balance)).toBe(1_126_825);
    expect(won(lump(1_000_000, 1, 12).gain)).toBe(126_825);
    // 500만원, 월 0.8%, 36개월 → 6,661,149원
    expect(won(lump(5_000_000, 0.8, 36).balance)).toBe(6_661_149);
    // 1,234,567원, 월 0.5%, 120개월 → 2,246,167원
    expect(won(lump(1_234_567, 0.5, 120).balance)).toBe(2_246_167);
    // 0%·1개월이면 그대로
    expect(won(lump(10_000_000, 0, 1).balance)).toBe(10_000_000);
    // 월초·월말 적립 구분은 적립이 0원이면 결과를 바꾸지 않는다
    expect(compound({ principal: 1_000_000, monthly: 0, ratePct: 12, months: 12, timing: "end", taxPct: 0, inflationPct: 0 }).balance)
      .toBeCloseTo(lump(1_000_000, 1, 12).balance, 6);
  });
});
