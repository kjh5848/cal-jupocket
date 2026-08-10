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
});
