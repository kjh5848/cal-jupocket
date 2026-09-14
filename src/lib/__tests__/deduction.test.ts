import { describe, it, expect } from "vitest";
import {
  checkPerson,
  filerAddition,
  computeDeduction,
  taxOn,
  taxSaved,
  type Person,
  type Filer,
} from "../deduction";
import rates from "../../rates/deduction-2026.json";

const self: Person = { relation: "self", age: 40, income: 50_000_000 };
const filer: Filer = { isFemale: false, hasSpouse: false, totalIncome: 50_000_000 };

describe("기본공제 대상 판정 (제50조)", () => {
  it("본인은 소득이 얼마든 대상이다", () => {
    // 제50조 제1항 제1호에는 소득 요건이 없다.
    expect(checkPerson({ relation: "self", age: 40, income: 900_000_000 }).ok).toBe(true);
  });

  it("배우자는 소득금액 100만원까지", () => {
    const at = { relation: "spouse", age: 38, income: 1_000_000 } as const;
    expect(checkPerson(at).ok).toBe(true);
    expect(checkPerson({ ...at, income: 1_000_001 }).ok).toBe(false);
  });

  it("근로소득만 있으면 총급여 500만원까지", () => {
    const p = { relation: "spouse", age: 38, income: 5_000_000, salaryOnly: true } as const;
    expect(checkPerson(p).ok).toBe(true);
    expect(checkPerson({ ...p, income: 5_000_001 }).ok).toBe(false);
    // 같은 금액이어도 근로소득만이 아니면 떨어진다.
    expect(checkPerson({ ...p, salaryOnly: false }).ok).toBe(false);
  });

  it("부모는 60세 이상, 자녀는 20세 이하", () => {
    const parent = { relation: "ascendant", age: 60, income: 0, livesTogether: true } as const;
    expect(checkPerson(parent).ok).toBe(true);
    expect(checkPerson({ ...parent, age: 59 }).ok).toBe(false);

    const child = { relation: "descendant", age: 20, income: 0 } as const;
    expect(checkPerson(child).ok).toBe(true);
    expect(checkPerson({ ...child, age: 21 }).ok).toBe(false);
  });

  it("형제자매는 20세 이하 또는 60세 이상 — 가운데가 비어 있다", () => {
    const s = { relation: "sibling", age: 20, income: 0, livesTogether: true } as const;
    expect(checkPerson(s).ok).toBe(true);
    expect(checkPerson({ ...s, age: 35 }).ok).toBe(false);
    expect(checkPerson({ ...s, age: 60 }).ok).toBe(true);
  });

  it("장애인은 나이 제한을 받지 않는다", () => {
    const p = { relation: "ascendant", age: 45, income: 0, livesTogether: true } as const;
    expect(checkPerson(p).ok).toBe(false);
    expect(checkPerson({ ...p, disabled: true }).ok).toBe(true);
  });
});

describe("생계 요건 (제53조)", () => {
  it("자녀는 따로 살아도 된다", () => {
    expect(checkPerson({ relation: "descendant", age: 19, income: 0 }).ok).toBe(true);
  });

  it("부모는 주거 형편에 따른 별거면 인정된다", () => {
    const p = { relation: "ascendant", age: 70, income: 0 } as const;
    expect(checkPerson(p).ok).toBe(false);
    expect(checkPerson({ ...p, separatedForHousing: true }).ok).toBe(true);
  });

  it("형제자매에게는 별거 특례가 없다", () => {
    // 제53조 제3항은 직계존속만 말한다.
    const s = { relation: "sibling", age: 18, income: 0, separatedForHousing: true } as const;
    expect(checkPerson(s).ok).toBe(false);
  });
});

describe("추가공제 (제51조)", () => {
  it("70세 이상이면 경로우대 100만원이 붙는다", () => {
    const p = { relation: "ascendant", age: 70, income: 0, livesTogether: true } as const;
    const c = checkPerson(p);
    expect(c.additions).toEqual([{ label: "경로우대", amount: 1_000_000 }]);
    expect(checkPerson({ ...p, age: 69 }).additions).toEqual([]);
  });

  it("기본공제에서 떨어지면 추가공제도 없다", () => {
    // 소득이 넘으면 그 사람은 기본공제대상자가 아니다. 제51조는
    // "기본공제대상이 되는 사람" 에만 붙는다.
    const p = { relation: "ascendant", age: 80, income: 20_000_000, livesTogether: true } as const;
    const c = checkPerson(p);
    expect(c.ok).toBe(false);
    expect(c.additions).toEqual([]);
  });

  it("부녀자와 한부모가 겹치면 한부모만 적용한다", () => {
    // 제51조 제1항 단서. 50만 + 100만 = 150만 이 아니다.
    const people: Person[] = [self, { relation: "descendant", age: 10, income: 0 }];
    const both: Filer = { isFemale: true, hasSpouse: false, totalIncome: 20_000_000 };
    expect(filerAddition(both, people)).toEqual({ label: "한부모", amount: 1_000_000 });
  });

  it("부녀자는 종합소득금액 3천만원을 넘으면 안 된다", () => {
    const people: Person[] = [self];
    const married: Filer = { isFemale: true, hasSpouse: true, totalIncome: 30_000_000 };
    expect(filerAddition(married, people)).toEqual({ label: "부녀자", amount: 500_000 });
    expect(filerAddition({ ...married, totalIncome: 30_000_001 }, people)).toBeNull();
  });

  it("한부모는 공제대상 자녀가 있어야 한다", () => {
    const single: Filer = { isFemale: false, hasSpouse: false, totalIncome: 50_000_000 };
    // 스물한 살 자녀는 기본공제대상이 아니다 → 한부모도 아니다.
    const grown: Person[] = [self, { relation: "descendant", age: 21, income: 0 }];
    expect(filerAddition(single, grown)).toBeNull();
  });
});

describe("합계와 절사 (제51조 제4항)", () => {
  it("본인 + 부모 두 분(70세 이상) 이면 450만 + 200만", () => {
    const people: Person[] = [
      self,
      { relation: "ascendant", age: 72, income: 0, separatedForHousing: true },
      { relation: "ascendant", age: 70, income: 0, separatedForHousing: true },
    ];
    const r = computeDeduction(filer, people);
    expect(r.count).toBe(3);
    expect(r.basic).toBe(4_500_000);
    expect(r.additional).toBe(2_000_000);
    expect(r.applied).toBe(6_500_000);
    expect(r.discarded).toBe(0);
  });

  it("소득금액을 넘는 공제는 버려진다", () => {
    const poor: Filer = { isFemale: false, hasSpouse: false, totalIncome: 3_000_000 };
    const people: Person[] = [
      { relation: "self", age: 40, income: 3_000_000 },
      { relation: "ascendant", age: 75, income: 0, separatedForHousing: true },
    ];
    const r = computeDeduction(poor, people);
    expect(r.raw).toBe(4_000_000); // 150만 × 2 + 경로우대 100만
    expect(r.applied).toBe(3_000_000);
    expect(r.discarded).toBe(1_000_000);
  });
});

describe("공제가 세금으로 얼마인가", () => {
  it("세율이 높을수록 같은 공제가 더 크게 돌아온다", () => {
    const low = taxSaved(14_000_000, rates.basic.perPerson);
    const high = taxSaved(88_000_000, rates.basic.perPerson);
    expect(high.total).toBeGreaterThan(low.total);
  });

  it("24% 구간에서 150만원 공제는 지방소득세까지 39만 6천원", () => {
    // 1,500,000 × 24% = 360,000 국세, 지방소득세 10% = 36,000
    const r = taxSaved(80_000_000, 1_500_000);
    expect(r.national).toBe(360_000);
    expect(r.local).toBe(36_000);
    expect(r.total).toBe(396_000);
  });

  it("과세표준이 0이면 공제해도 돌아오는 게 없다", () => {
    expect(taxSaved(0, 1_500_000).total).toBe(0);
  });

  it("구간을 걸치면 낮은 쪽 세율이 섞인다", () => {
    // 과세표준 14,500,000 에서 150만원을 빼면 13,000,000.
    // 14,000,000 경계를 넘나들므로 24%도 15%도 아니다.
    const r = taxSaved(14_500_000, 1_500_000);
    expect(r.national).toBe(taxOn(14_500_000) - taxOn(13_000_000));
    expect(r.national).toBeLessThan(1_500_000 * 0.15);
  });
});
