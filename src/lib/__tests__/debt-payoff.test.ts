import { describe, it, expect } from "vitest";
import { payoffPlan, targetOrder, monthLabel, spellMonths, MAX_MONTHS, type Debt } from "../debt-payoff";

const three: Debt[] = [
  { name: "카드론", balance: 3_000_000, ratePct: 15, minPayment: 100_000, priority: 2 },
  { name: "신용대출", balance: 8_000_000, ratePct: 7, minPayment: 150_000, priority: 1 },
  { name: "할부", balance: 1_200_000, ratePct: 4, minPayment: 50_000, priority: 3 },
];

const ok = (r: ReturnType<typeof payoffPlan>) => {
  if (!r.ok) throw new Error(r.reason);
  return r;
};

describe("부채 상환 계획", () => {
  it("1천만원 5% 월 20만 + 추가 10만 — 36개월, 이자는 원 미만 버림", () => {
    const r = ok(payoffPlan({ debts: [{ name: "a", balance: 10_000_000, ratePct: 5, minPayment: 200_000 }], strategy: "avalanche", extra: 100_000, extraGrowthPct: 0 }));
    expect(r.months).toBe(36);
    expect(r.startBudget).toBe(300_000);
    expect(r.rows[0]).toEqual({ month: 1, payment: 300_000, principal: 258_334, interest: 41_666, balance: 9_741_666 });
    expect(r.totalInterest).toBe(788_703);
    // 마지막 달은 남은 잔액만 — 낸 돈 합 = 원금 + 이자
    expect(r.rows.at(-1)!.payment).toBe(288_703);
    expect(r.rows.reduce((s, x) => s + x.payment, 0)).toBe(r.totalPaid);
    expect(r.totalPaid).toBe(10_788_703);
  });

  it("목표 순서 — 눈사태는 이자율, 눈덩이는 처음 잔액, 직접은 번호", () => {
    expect(targetOrder(three, "avalanche")).toEqual([0, 1, 2]);
    expect(targetOrder(three, "snowball")).toEqual([2, 0, 1]);
    expect(targetOrder(three, "custom")).toEqual([1, 0, 2]);
    // 같은 이자율이면 잔액 작은 쪽, 그것도 같으면 입력 순서
    const tie: Debt[] = [
      { name: "x", balance: 500, ratePct: 5, minPayment: 10 },
      { name: "y", balance: 300, ratePct: 5, minPayment: 10 },
      { name: "z", balance: 300, ratePct: 5, minPayment: 10 },
    ];
    expect(targetOrder(tie, "avalanche")).toEqual([1, 2, 0]);
  });

  it("빚 3개 + 추가 20만 — 전략별 완납 개월·총 이자", () => {
    const run = (s: "avalanche" | "snowball" | "custom") => ok(payoffPlan({ debts: three, strategy: s, extra: 200_000, extraGrowthPct: 0 }));
    const a = run("avalanche");
    const s = run("snowball");
    const c = run("custom");
    expect([a.months, a.totalInterest]).toEqual([27, 1_092_229]);
    expect([s.months, s.totalInterest]).toEqual([27, 1_188_582]);
    expect([c.months, c.totalInterest]).toEqual([28, 1_363_855]);
    // 눈사태: 카드론 11개월째 → 할부 26 → 신용대출 27
    expect(a.debts.map((d) => [d.order, d.payoffMonth])).toEqual([[1, 11], [2, 27], [3, 26]]);
    // 눈덩이: 할부가 5개월째 먼저 끝난다
    expect(s.debts[2].payoffMonth).toBe(5);
    expect(a.startBudget).toBe(500_000);
    // 끝난 빚의 최소 상환액은 다음 목표로 넘어가 예산이 그대로다
    for (const row of a.rows.slice(0, -1)) expect(row.payment).toBe(500_000);
    for (const r of [a, s, c]) expect(r.debts.reduce((x, d) => x + d.paid, 0)).toBe(r.totalPaid);
  });

  it("추가 상환액은 12개월마다 증가율만큼 늘린다", () => {
    const r = ok(payoffPlan({ debts: [{ name: "x", balance: 5_000_000, ratePct: 12, minPayment: 60_000 }], strategy: "avalanche", extra: 30_000, extraGrowthPct: 10 }));
    expect(r.rows[11].payment).toBe(90_000);
    expect(r.rows[12].payment).toBe(93_000);
    expect(r.rows[24].payment).toBe(96_300);
    expect(r.months).toBe(73);
    expect(r.totalInterest).toBe(2_142_796);
  });

  it("최소 상환액이 첫 달 이자 이하면 오류, 넘으면 오래 걸려도 계산", () => {
    const at = payoffPlan({ debts: [{ name: "x", balance: 5_000_000, ratePct: 12, minPayment: 50_000 }], strategy: "avalanche", extra: 0, extraGrowthPct: 0 });
    expect(at).toEqual({ ok: false, reason: "min-too-low", index: 0, firstInterest: 50_000 });
    const just = ok(payoffPlan({ debts: [{ name: "x", balance: 5_000_000, ratePct: 12, minPayment: 51_000 }], strategy: "avalanche", extra: 0, extraGrowthPct: 0 }));
    expect(just.months).toBe(396);
    expect(just.totalInterest).toBe(15_149_943);
  });

  it("빈 줄은 빼고, 다 비면 empty, 600개월을 넘으면 too-long", () => {
    expect(payoffPlan({ debts: [{ name: "", balance: 0, ratePct: 5, minPayment: 0 }], strategy: "avalanche", extra: 0, extraGrowthPct: 0 })).toEqual({ ok: false, reason: "empty" });
    const r = ok(payoffPlan({ debts: [{ name: "", balance: 0, ratePct: 0, minPayment: 0 }, { name: "b", balance: 1_000, ratePct: 0, minPayment: 300 }], strategy: "snowball", extra: 0, extraGrowthPct: 0 }));
    expect(r.months).toBe(4);
    expect(r.totalInterest).toBe(0);
    expect(r.debts).toHaveLength(1);
    const long = payoffPlan({ debts: [{ name: "x", balance: 100_000_000, ratePct: 12, minPayment: 1_000_001 }], strategy: "avalanche", extra: 0, extraGrowthPct: 0 });
    expect(long).toEqual({ ok: false, reason: "too-long" });
    expect(MAX_MONTHS).toBe(600);
  });

  it("몇 번째 달 → 연월, 개월 → 몇 년 몇 개월", () => {
    expect(monthLabel(2026, 11, 1)).toBe("2026년 11월");
    expect(monthLabel(2026, 11, 3)).toBe("2027년 1월");
    expect(monthLabel(2026, 11, 36)).toBe("2029년 10월");
    expect(spellMonths(27)).toBe("2년 3개월");
    expect(spellMonths(12)).toBe("1년");
    expect(spellMonths(5)).toBe("5개월");
  });
});
