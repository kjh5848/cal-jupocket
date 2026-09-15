import { describe, it, expect } from "vitest";
import {
  computeInheritance,
  deductionsFor,
  taxOn,
  taxFreeCeiling,
  type Household,
} from "../inheritance";
import rates from "../../rates/inheritance-2026.json";

const 억 = 100_000_000;

describe("세율표 (국세청 5단계 초과누진)", () => {
  it("구간마다 누진공제를 뺀다", () => {
    expect(taxOn(1 * 억)).toBe(10_000_000); // 1억 × 10%
    expect(taxOn(5 * 억)).toBe(90_000_000); // 5억 × 20% − 1천만
    expect(taxOn(10 * 억)).toBe(240_000_000); // 10억 × 30% − 6천만
    expect(taxOn(30 * 억)).toBe(1_040_000_000); // 30억 × 40% − 1억 6천만
  });

  it("30억을 넘으면 50%", () => {
    // 50억 × 50% − 4억 6천만
    expect(taxOn(50 * 억)).toBe(2_040_000_000);
  });

  it("과세표준이 0이면 세금도 0", () => {
    expect(taxOn(0)).toBe(0);
    expect(taxOn(-1 * 억)).toBe(0);
  });
});

describe("공제는 더하는 게 아니라 고르는 것이다", () => {
  it("자녀가 적으면 일괄공제 5억이 이긴다", () => {
    // 기초 2억 + 자녀 1명 5천만 = 2억 5천만 < 5억
    const d = deductionsFor({ estate: 0, hasSpouse: false, children: 1 });
    expect(d.itemized).toBe(250_000_000);
    expect(d.chosen).toBe(500_000_000);
    expect(d.chosenLabel).toBe("일괄공제");
  });

  it("인적공제가 5억을 넘으면 그쪽을 쓴다", () => {
    // 기초 2억 + 자녀 7명 × 5천만 = 5억 5천만 > 5억
    const d = deductionsFor({ estate: 0, hasSpouse: false, children: 7 });
    expect(d.itemized).toBe(550_000_000);
    expect(d.chosen).toBe(550_000_000);
    expect(d.chosenLabel).toBe("기초공제 + 인적공제");
  });

  it("둘을 더하지 않는다 — 2억 + 5억 = 7억이 아니다", () => {
    const d = deductionsFor({ estate: 0, hasSpouse: false });
    expect(d.chosen).toBe(500_000_000);
    expect(d.chosen).not.toBe(700_000_000);
  });
});

describe("배우자공제", () => {
  it("한 푼도 안 받아도 5억이 나온다", () => {
    const d = deductionsFor({ estate: 0, hasSpouse: true, spouseShare: 0 });
    expect(d.spouse).toBe(500_000_000);
  });

  it("5억 미만을 받아도 5억", () => {
    const d = deductionsFor({ estate: 0, hasSpouse: true, spouseShare: 200_000_000 });
    expect(d.spouse).toBe(500_000_000);
  });

  it("5억을 넘으면 실제 받은 금액", () => {
    const d = deductionsFor({ estate: 0, hasSpouse: true, spouseShare: 12 * 억 });
    expect(d.spouse).toBe(12 * 억);
  });

  it("30억을 넘지 못한다", () => {
    const d = deductionsFor({ estate: 0, hasSpouse: true, spouseShare: 50 * 억 });
    expect(d.spouse).toBe(rates.spouse.cap);
  });

  it("배우자가 없으면 0", () => {
    expect(deductionsFor({ estate: 0, hasSpouse: false }).spouse).toBe(0);
  });
});

describe("얼마부터 내나 — 가족 구성이 경계를 정한다", () => {
  it("배우자와 자녀가 있으면 10억까지 세금이 없다", () => {
    // 일괄공제 5억 + 배우자 최소 5억 = 10억
    const h: Omit<Household, "estate"> = { hasSpouse: true, children: 2 };
    expect(taxFreeCeiling(h)).toBe(10 * 억);
    expect(computeInheritance({ ...h, estate: 10 * 억 }).payable).toBe(0);
  });

  it("배우자가 없으면 5억이 경계다", () => {
    const h: Omit<Household, "estate"> = { hasSpouse: false, children: 2 };
    expect(taxFreeCeiling(h)).toBe(5 * 억);
    expect(computeInheritance({ ...h, estate: 5 * 억 }).payable).toBe(0);
  });

  it("경계를 1원이라도 넘으면 과세표준이 생긴다", () => {
    const r = computeInheritance({ estate: 10 * 억 + 1, hasSpouse: true, children: 2 });
    expect(r.base).toBe(1);
  });
});

describe("실제 사례 — 10억을 물려받으면", () => {
  it("배우자 있음: 세금 0", () => {
    const r = computeInheritance({ estate: 10 * 억, hasSpouse: true, children: 2 });
    expect(r.deductions.total).toBe(10 * 억);
    expect(r.payable).toBe(0);
  });

  it("배우자 없음: 과세표준 5억 · 신고공제 뒤 8,730만원", () => {
    const r = computeInheritance({ estate: 10 * 억, hasSpouse: false, children: 2 });
    expect(r.base).toBe(5 * 억);
    expect(r.computed).toBe(90_000_000); // 5억 × 20% − 1천만
    expect(r.filingCredit).toBe(2_700_000); // 3%
    expect(r.payable).toBe(87_300_000);
  });

  it("같은 재산인데 배우자 유무로 8,730만원이 갈린다", () => {
    const withSpouse = computeInheritance({ estate: 10 * 억, hasSpouse: true, children: 2 });
    const without = computeInheritance({ estate: 10 * 억, hasSpouse: false, children: 2 });
    expect(without.payable - withSpouse.payable).toBe(87_300_000);
  });
});

describe("신고세액공제 3%", () => {
  it("산출세액의 3%를 깎는다", () => {
    const r = computeInheritance({ estate: 20 * 억, hasSpouse: false, children: 1 });
    expect(r.filingCredit).toBe(Math.round(r.computed * 0.03));
    expect(r.payable).toBe(r.computed - r.filingCredit);
  });

  it("세금이 0이면 공제도 0", () => {
    const r = computeInheritance({ estate: 3 * 억, hasSpouse: false, children: 1 });
    expect(r.computed).toBe(0);
    expect(r.filingCredit).toBe(0);
    expect(r.payable).toBe(0);
  });
});
