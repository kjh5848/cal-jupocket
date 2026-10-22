import { describe, expect, it } from "vitest";
import { centsEs, euroCentEs, inputEuroEs, monthLabelEs, spellMonthsEs } from "../es/debt-payoff";
import { payoffPlan } from "../debt-payoff";

describe("스페인판 부채 상환 표기", () => {
  it("입력칸 유로 → 센트", () => {
    expect(centsEs("1.500,50")).toBe(150050);
    expect(centsEs("1500")).toBe(150000);
    expect(centsEs("1500,5")).toBe(150050);
    expect(centsEs("15 000")).toBe(1500000);
    expect(centsEs("15 000")).toBe(1500000);
    expect(centsEs("0")).toBe(0);
    expect(centsEs("-20")).toBe(0);
    expect(centsEs("abc")).toBe(0);
    expect(centsEs("")).toBe(0);
  });

  it("센트 → euros (네 자리까지 공백 없음, 다섯 자리부터 공백)", () => {
    expect(euroCentEs(123456)).toBe("1234,56 euros");
    expect(euroCentEs(1234567)).toBe("12 345,67 euros");
    expect(euroCentEs(5)).toBe("0,05 euros");
    expect(euroCentEs(240000)).toBe("2400,00 euros");
    expect(euroCentEs(-1050)).toBe("-10,50 euros");
  });

  it("미리 넣는 값은 centsEs 가 다시 읽는다", () => {
    for (const c of [240000, 1500000, 900000, 8000]) expect(centsEs(inputEuroEs(c))).toBe(c);
    expect(inputEuroEs(1500000)).toBe("15 000");
  });

  it("달 이름 — 해 넘김", () => {
    expect(monthLabelEs(2026, 11, 1)).toBe("noviembre de 2026");
    expect(monthLabelEs(2026, 11, 3)).toBe("enero de 2027");
    expect(monthLabelEs(2026, 12, 13)).toBe("diciembre de 2027");
  });

  it("개월 읽기", () => {
    expect(spellMonthsEs(0)).toBe("0 meses");
    expect(spellMonthsEs(1)).toBe("1 mes");
    expect(spellMonthsEs(5)).toBe("5 meses");
    expect(spellMonthsEs(12)).toBe("1 año");
    expect(spellMonthsEs(27)).toBe("2 años y 3 meses");
    expect(spellMonthsEs(13)).toBe("1 año y 1 mes");
  });

  it("센트로 넣으면 첫 달 이자는 센트 미만 버림 — 1000 euros × 12 % ÷ 12 = 10,00 euros", () => {
    const r = payoffPlan({
      debts: [{ name: "Tarjeta", balance: 100_000, ratePct: 12, minPayment: 50_000, priority: 1 }],
      strategy: "avalanche",
      extra: 0,
      extraGrowthPct: 0,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0].interest).toBe(1000);
    // 2달째: 잔액 1000 + 10 − 500 = 510 euros → 이자 5,10 · 남은 15,10 euros → 3달째(이자 0,15)에 끝
    expect(r.rows[1].interest).toBe(510);
    expect(r.months).toBe(3);
  });
});
