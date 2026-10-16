import { describe, it, expect } from "vitest";
import { estimateRefund } from "../income-tax";

describe("종소세 환급 예상", () => {
  it("총수입 3천만, 단순경비율 0.6, 본인1명", () => {
    // 소득금액 = 30,000,000*(1-0.6)=12,000,000
    // 과표 = 12,000,000 - 1,500,000(인적) = 10,500,000
    // 산출세액 = 10,500,000*0.06 - 0 = 630,000
    // 결정세액 = 630,000 - 70,000(표준) = 560,000 · 지방소득세 56,000
    // 기납부 = 소득세 30,000,000*0.03 = 900,000 · 지방 90,000 (소득세법 제76조 제3항 제4호)
    // 환급 = (900,000 - 560,000) + (90,000 - 56,000) = 340,000 + 34,000 = 374,000
    const r = estimateRefund({ grossIncome: 30000000, expenseRate: 0.6, dependents: 1 });
    expect(r.taxableBase).toBe(10500000);
    expect(r.computedTax).toBe(560000);
    expect(r.localTax).toBe(56000);
    expect(r.prepaidNational).toBe(900000);
    expect(r.prepaidLocal).toBe(90000);
    expect(r.prepaid).toBe(990000);
    expect(r.refundNational).toBe(340000);
    expect(r.refundLocal).toBe(34000);
    expect(r.refund).toBe(374000);
  });

  it("총수입 1억, 단순경비율 0.2, 본인1명 - 추가납부 케이스", () => {
    // 과표 = 80,000,000 - 1,500,000 = 78,500,000 → 24% 구간(누진공제 576만)
    // 결정세액 = 13,080,000 - 70,000 = 13,010,000 · 지방 1,301,000
    // 기납부 = 3,000,000 + 300,000
    // 환급 = -10,010,000 + -1,001,000 = -11,011,000 (음수 = 추가납부)
    const r = estimateRefund({ grossIncome: 100000000, expenseRate: 0.2, dependents: 1 });
    expect(r.taxableBase).toBe(78500000);
    expect(r.computedTax).toBe(13010000);
    expect(r.prepaid).toBe(3300000);
    expect(r.refund).toBe(-11011000);
  });

  it("roberin 대조(2026-10-17): 3천만 · 경비율 64.1% · 본인1명 → 소득세 413,800 + 지방 41,380 = 455,180 환급", () => {
    const r = estimateRefund({ grossIncome: 30000000, expenseRate: 0.641, dependents: 1 });
    expect(r.taxableBase).toBe(9270000);
    expect(r.computedTax).toBe(486200);
    expect(r.refundNational).toBe(413800);
    expect(r.refundLocal).toBe(41380);
    expect(r.refund).toBe(455180);
  });

  it.each([
    // 경비율 64.1% · roberin 같은 입력 결과(2026-10-17)
    [10_000_000, 1, 269_060],
    [30_000_000, 3, 653_180],
    [39_000_000, 1, 538_934],
  ])("roberin 대조: 총수입 %i · %i명 → %i 환급", (g, n, want) => {
    expect(estimateRefund({ grossIncome: g, expenseRate: 0.641, dependents: n }).refund).toBe(want);
  });

  it("세금이 0이면 미리 낸 3.3% 전부가 환급", () => {
    const r = estimateRefund({ grossIncome: 3000000, expenseRate: 0.6, dependents: 1 });
    expect(r.totalTax).toBe(0);
    expect(r.refund).toBe(r.prepaid);
  });
});
