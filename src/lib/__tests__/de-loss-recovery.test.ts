import { describe, it, expect } from "vitest";
import { numDe, pctDe, signedPctDe, eurDe, readEurDe, formatMonthsDe, parseClosesDe } from "../de/loss-recovery";
import { recovery, needFromLoss, recoveryMonths, series } from "../loss-recovery";

describe("독일어판 손실 원금 복구 표기", () => {
  it("퍼센트·부호", () => {
    expect(numDe(42.857142)).toBe("42,86");
    expect(numDe(30)).toBe("30");
    expect(numDe(1234.5)).toBe("1 234,5");
    expect(pctDe(100)).toBe("100 %");
    expect(signedPctDe(42.857)).toBe("+42,86 %");
    expect(signedPctDe(-30)).toBe("−30 %");
    expect(signedPctDe(0)).toBe("0 %");
  });

  it("유로", () => {
    expect(eurDe(3000)).toBe("3 000,00 Euro");
    expect(eurDe(7000.5)).toBe("7 000,50 Euro");
    expect(eurDe(-3000)).toBe("-3 000,00 Euro");
    expect(readEurDe("10 000")).toBe(10000);
    expect(readEurDe("10.000,50")).toBe(10000.5);
    expect(readEurDe("abc")).toBeNaN();
  });

  it("기간", () => {
    expect(formatMonthsDe(27)).toBe("2 Jahre und 3 Monate");
    expect(formatMonthsDe(12)).toBe("1 Jahr");
    expect(formatMonthsDe(0)).toBe("Bereits erreicht");
    expect(formatMonthsDe(null)).toBe("Wird nicht erreicht");
    expect(formatMonthsDe(Infinity)).toBe("Über 100 Jahre");
  });

  it("종가 줄 읽기 — 독일 표기", () => {
    const c = parseClosesDe("Datum; Kurs\n01.09.2026; 20,50\n2026-09-02\t1.234,5\n03.09. 18\n\n04.09.26 0,5");
    expect(c).toEqual([
      { date: "01.09.2026", price: 20.5 },
      { date: "2026-09-02", price: 1234.5 },
      { date: "03.09.", price: 18 },
      { date: "04.09.26", price: 0.5 },
    ]);
    expect(parseClosesDe("100\n90,5")).toEqual([{ date: null, price: 100 }, { date: null, price: 90.5 }]);
  });

  it("계산 손계산 — 10 000 → 7 000 은 +42,86 %, 최대 낙폭", () => {
    const r = recovery(10000, 7000);
    if (!r.ok) throw new Error();
    expect(r.needPct).toBeCloseTo(300000 / 7000, 10); // 3000 ÷ 7000 = 42,857…
    expect(r.shortfall).toBe(3000);
    expect(needFromLoss(50)).toBeCloseTo(100, 10);
    expect(recoveryMonths(100, 8)).toBe(Math.ceil((12 * Math.log(2)) / Math.log(1.08) - 1e-9)); // 109 Monate
    const s = series(10000, parseClosesDe("20\n18,6\n17,1\n17,9\n16,4\n17,2"));
    if (!s.ok) throw new Error();
    expect(s.mddPct).toBeCloseTo((16.4 / 20 - 1) * 100, 10); // −18 %
    expect(s.toHighPct).toBeCloseTo((20 / 17.2 - 1) * 100, 10);
  });
});
