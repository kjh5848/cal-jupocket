import { describe, it, expect } from "vitest";
import { parseClosesFr, numFr, pctFr, signedPctFr, signedEuroFr, monthsFr } from "../fr/loss-recovery";
import { recovery, needFromLoss, recoveryMonths, series } from "../loss-recovery";
import { eur } from "../fr/tva";

const nb = (s: string) => s.replace(/[\u00a0\u202f]/g, " ");

describe("fr loss-recovery 표기", () => {
  it("10 000 € → 7 000 €: 3000 ÷ 7000 = 42,857…% (손계산)", () => {
    const r = recovery(1_000_000, 700_000);
    expect(r.ok && r.needPct).toBeCloseTo(42.857142857, 6);
    expect(nb(pctFr(r.ok ? r.needPct : 0))).toBe("42,86 %");
    expect(nb(signedPctFr(r.ok ? r.changePct : 0))).toBe("−30 %");
    expect(nb(eur(r.ok ? r.shortfall : 0))).toBe("3 000,00 €");
  });
  it("−50 % → +100 %, −10 % → +11,11 %", () => {
    expect(needFromLoss(50)).toBeCloseTo(100, 9);
    expect(numFr(needFromLoss(10))).toBe("11,11");
  });
  it("회복 기간: ln(1,42857)÷ln(1,08)=4,634 ans → 56 mois = 4 ans et 8 mois", () => {
    expect(monthsFr(recoveryMonths(300 / 7, 8))).toBe("4 ans et 8 mois");
  });
  it("monthsFr 단복수·특수값", () => {
    expect(monthsFr(12)).toBe("1 an");
    expect(monthsFr(13)).toBe("1 an et 1 mois");
    expect(monthsFr(5)).toBe("5 mois");
    expect(monthsFr(Infinity)).toBe("Plus de 100 ans");
    expect(monthsFr(null)).toBe("Jamais atteint");
    expect(monthsFr(0)).toBe("Déjà au niveau du capital");
  });
  it("signedEuroFr", () => {
    expect(nb(signedEuroFr(-300000, eur))).toBe("−3 000,00 €");
    expect(nb(signedEuroFr(250, eur))).toBe("+2,50 €");
  });
});

describe("parseClosesFr", () => {
  it("쉼표 소수·날짜 꼴을 읽는다", () => {
    const c = parseClosesFr("Date; Cours\n01/09/2026; 20,5\n2026-09-02, 18,6\n03.09 1 234,5\n17,25\n\nabc");
    expect(c).toEqual([
      { date: "01/09/2026", price: 20.5 },
      { date: "2026-09-02", price: 18.6 },
      { date: "03.09", price: 1234.5 },
      { date: null, price: 17.25 },
    ]);
  });
  it("최대 낙폭: 20 → 18 → 16 → 17 → 12 → 15, 고점 20 대비 12 = −40 %", () => {
    const c = parseClosesFr("20\n18\n16\n17\n12\n15");
    const s = series(100_000, c, 0);
    expect(s.ok && s.mddPct).toBeCloseTo(-40, 9);
    expect(s.ok && s.rec.needPct).toBeCloseTo(33.3333333, 5);
  });
});
