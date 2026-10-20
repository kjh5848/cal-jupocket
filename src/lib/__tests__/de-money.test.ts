import { describe, it, expect } from "vitest";
import { euroDe, decimalDe } from "../de/money";
import { compound } from "../compound";

describe("독일어 금액 표기", () => {
  it("법령 원문 꼴", () => {
    expect(euroDe(12348)).toBe("12 348 Euro");
    expect(euroDe(1000)).toBe("1 000 Euro");
    expect(euroDe(999.6)).toBe("1 000 Euro");
    expect(euroDe(0)).toBe("0 Euro");
    expect(decimalDe((5 / 12).toFixed(4))).toBe("0,4167");
    expect(decimalDe("26.375")).toBe("26,375");
  });

  it("독일어판 예시(1 000 Euro + 250 Euro/Monat, 5 %, 10 Jahre) 손계산", () => {
    const x = compound({ principal: 1000, monthly: 250, ratePct: 5, months: 120, timing: "start", taxPct: 0, inflationPct: 0 });
    // FV = 1000·(1+r)^120 + 250·[(1+r)^120 − 1]/r·(1+r), r = 0,05/12
    const r = 0.05 / 12;
    const g = Math.pow(1 + r, 120);
    expect(x.balance).toBeCloseTo(1000 * g + (250 * (g - 1) / r) * (1 + r), 0);
    expect(x.paid).toBe(31000);
    // Kapitalertragsteuer 25 % + Solidaritätszuschlag 5,5 % darauf
    expect(25 * 1.055).toBeCloseTo(26.375, 10);
  });
});
