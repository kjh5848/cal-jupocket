import { describe, expect, it } from "vitest";
import { centsFr, euroCentFr, inputEuroFr, monthLabelFr, spellMonthsFr } from "../fr/debt-payoff";
import { payoffPlan } from "../debt-payoff";

/** Intl fr-FR 의 줄바꿈 없는 공백(U+00A0·U+202F)을 보통 공백으로 */
const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("프랑스어판 부채 상환 표기", () => {
  it("입력칸 유로 → 센트", () => {
    expect(centsFr("1 500,50")).toBe(150050);
    expect(centsFr("1500")).toBe(150000);
    expect(centsFr("1500.5")).toBe(150050);
    expect(centsFr("15 000")).toBe(1500000);
    expect(centsFr("50 €")).toBe(5000);
    expect(centsFr("0")).toBe(0);
    expect(centsFr("-20")).toBe(0);
    expect(centsFr("abc")).toBe(0);
    expect(centsFr("")).toBe(0);
  });

  it("센트 → '1 234,56 €'", () => {
    expect(plain(euroCentFr(123456))).toBe("1 234,56 €");
    expect(plain(euroCentFr(5))).toBe("0,05 €");
    expect(plain(euroCentFr(240000))).toBe("2 400,00 €");
  });

  it("미리 넣는 값은 centsFr 가 다시 읽는다", () => {
    for (const c of [240000, 1500000, 900000, 8000]) expect(centsFr(inputEuroFr(c))).toBe(c);
    expect(plain(inputEuroFr(1500000))).toBe("15 000");
  });

  it("달 이름 — 해 넘김", () => {
    expect(monthLabelFr(2026, 11, 1)).toBe("novembre 2026");
    expect(monthLabelFr(2026, 11, 3)).toBe("janvier 2027");
    expect(monthLabelFr(2026, 12, 13)).toBe("décembre 2027");
  });

  it("개월 읽기", () => {
    expect(spellMonthsFr(0)).toBe("0 mois");
    expect(spellMonthsFr(1)).toBe("1 mois");
    expect(spellMonthsFr(12)).toBe("1 an");
    expect(spellMonthsFr(13)).toBe("1 an et 1 mois");
    expect(spellMonthsFr(27)).toBe("2 ans et 3 mois");
  });

  it("센트로 넣으면 이자는 센트 미만 버림 — 1 000 € × 12 % ÷ 12 = 10,00 €", () => {
    const r = payoffPlan({
      debts: [{ name: "Carte", balance: 100_000, ratePct: 12, minPayment: 50_000, priority: 1 }],
      strategy: "avalanche",
      extra: 0,
      extraGrowthPct: 0,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0].interest).toBe(1000);
    // 2달째: 1 000 + 10 − 500 = 510 € → 이자 5,10 € · 남은 15,10 € → 3달째(이자 0,15 €)에 끝
    expect(r.rows[1].interest).toBe(510);
    expect(r.months).toBe(3);
  });
});
