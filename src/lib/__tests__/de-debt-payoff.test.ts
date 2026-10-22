import { describe, it, expect } from "vitest";
import { centsDe, euroCentDe, monthLabelDe, spellMonthsDe } from "../de/debt-payoff";
import { payoffPlan, type Debt } from "../debt-payoff";

describe("독일어판 부채 상환 표기", () => {
  it("유로 입력 → 센트", () => {
    expect(centsDe("1 500,50")).toBe(150050);
    expect(centsDe("1.500,5")).toBe(150050);
    expect(centsDe("1.500")).toBe(150000);
    expect(centsDe("1500")).toBe(150000);
    expect(centsDe("80")).toBe(8000);
    expect(centsDe("")).toBe(0);
    expect(centsDe("abc")).toBe(0);
    expect(centsDe("-5")).toBe(0);
  });

  it("센트 → '1 234,56 Euro'", () => {
    expect(euroCentDe(123456)).toBe("1 234,56 Euro");
    expect(euroCentDe(1234500)).toBe("12 345,00 Euro");
    expect(euroCentDe(5)).toBe("0,05 Euro");
    expect(euroCentDe(0)).toBe("0,00 Euro");
    expect(euroCentDe(-1050)).toBe("-10,50 Euro");
  });

  it("달 이름·기간", () => {
    expect(monthLabelDe(2026, 11, 1)).toBe("November 2026");
    expect(monthLabelDe(2026, 11, 3)).toBe("Januar 2027");
    expect(monthLabelDe(2026, 12, 13)).toBe("Dezember 2027");
    expect(spellMonthsDe(27)).toBe("2 Jahre und 3 Monate");
    expect(spellMonthsDe(12)).toBe("1 Jahr");
    expect(spellMonthsDe(1)).toBe("1 Monat");
    expect(spellMonthsDe(5)).toBe("5 Monate");
    expect(spellMonthsDe(0)).toBe("0 Monate");
  });
});

describe("독일어판 예시 — 센트 단위로 payoffPlan", () => {
  const sample: Debt[] = [
    { name: "Kreditkarte", balance: 240_000, ratePct: 18.9, minPayment: 8_000 },
    { name: "Dispokredit", balance: 150_000, ratePct: 12.5, minPayment: 5_000 },
    { name: "Ratenkredit", balance: 900_000, ratePct: 6.9, minPayment: 18_000 },
  ];
  const av = payoffPlan({ debts: sample, strategy: "avalanche", extra: 15_000, extraGrowthPct: 0 });
  const sb = payoffPlan({ debts: sample, strategy: "snowball", extra: 15_000, extraGrowthPct: 0 });

  it("첫 달 이자는 센트 미만 버림 손계산", () => {
    if (!av.ok) throw new Error("not ok");
    // 2 400 € × 18,9 % ÷ 12 = 37,80 € · 1 500 € × 12,5 % ÷ 12 = 15,625 → 15,62 € · 9 000 € × 6,9 % ÷ 12 = 51,75 €
    expect(av.rows[0].interest).toBe(3780 + 1562 + 5175);
    // 첫 달 예산 = 80 + 50 + 180 + 150 = 460 €
    expect(av.startBudget).toBe(46_000);
    expect(av.rows[0].payment).toBe(46_000);
  });

  it("낸 돈 = 원금 + 이자, 눈사태 이자 ≤ 눈덩이", () => {
    if (!av.ok || !sb.ok) throw new Error("not ok");
    expect(av.totalPaid).toBe(av.totalDebt + av.totalInterest);
    expect(av.rows.reduce((s, r) => s + r.payment, 0)).toBe(av.totalPaid);
    expect(av.totalInterest).toBeLessThanOrEqual(sb.totalInterest);
    // 눈사태: 18,9 % → 12,5 % → 6,9 % · 눈덩이: 1 500 → 2 400 → 9 000
    expect([...av.debts].sort((a, b) => a.order - b.order).map((d) => d.name)).toEqual(["Kreditkarte", "Dispokredit", "Ratenkredit"]);
    expect([...sb.debts].sort((a, b) => a.order - b.order).map((d) => d.name)).toEqual(["Dispokredit", "Kreditkarte", "Ratenkredit"]);
  });
});
