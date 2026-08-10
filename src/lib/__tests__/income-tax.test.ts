import { describe, it, expect } from "vitest";
import { estimateRefund } from "../income-tax";

describe("종소세 환급 예상", () => {
  it("총수입 3천만, 단순경비율 0.6, 본인1명", () => {
    // 소득금액 = 30,000,000*(1-0.6)=12,000,000
    // 과표 = 12,000,000 - 1,500,000(인적) = 10,500,000
    // 산출세액 = 10,500,000*0.06 - 0 = 630,000
    // 결정세액 = 630,000 - 70,000(표준) = 560,000
    // 기납부 = 30,000,000*0.033 = 990,000
    // 환급 = 990,000 - 560,000 = 430,000
    const r = estimateRefund({ grossIncome: 30000000, expenseRate: 0.6, dependents: 1 });
    expect(r.taxableBase).toBe(10500000);
    expect(r.computedTax).toBe(560000);
    expect(r.prepaid).toBe(990000);
    expect(r.refund).toBe(430000);
  });

  it("총수입 1억, 단순경비율 0.2, 본인1명 - 추가납부 케이스", () => {
    // 소득금액 = 100,000,000*(1-0.2)=80,000,000
    // 과표 = 80,000,000 - 1,500,000(인적) = 78,500,000 → 5천만~8,800만 구간(24%, 공제 576만)
    // 산출세액 = 78,500,000*0.24 - 5,760,000 = 13,080,000
    // 결정세액 = 13,080,000 - 70,000(표준) = 13,010,000
    // 기납부 = 100,000,000*0.033 = 3,300,000
    // 환급 = 3,300,000 - 13,010,000 = -9,710,000 (음수 = 추가납부)
    const r = estimateRefund({ grossIncome: 100000000, expenseRate: 0.2, dependents: 1 });
    expect(r.taxableBase).toBe(78500000);
    expect(r.computedTax).toBe(13010000);
    expect(r.prepaid).toBe(3300000);
    expect(r.refund).toBe(-9710000);
  });
});
