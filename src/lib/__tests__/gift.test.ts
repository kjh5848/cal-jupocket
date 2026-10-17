/**
 * 증여세 계산이 rates 와 어긋나지 않는지 본다.
 *
 * 이 주제에서 사람들이 가장 많이 틀리는 곳이 둘이다 — 공제를 매번 새로
 * 생기는 금액으로 읽는 것, 그리고 혼인·출산공제를 관계별 공제 대신
 * 쓰는 것으로 읽는 것. 그 둘을 여기서 고정한다.
 */
import { describe, it, expect } from "vitest";
import {
  computeGift,
  deductionsFor,
  relationCap,
  taxFreeCeiling,
  taxOn,
} from "../gift";
import rates from "../../rates/gift-2026.json";
import inheritance from "../../rates/inheritance-2026.json";

const 억 = 100_000_000;

describe("관계별 공제 한도", () => {
  it("rates 의 값을 그대로 쓴다", () => {
    expect(relationCap("spouse")).toBe(6 * 억);
    expect(relationCap("ascendant")).toBe(50_000_000);
    expect(relationCap("descendant")).toBe(50_000_000);
    expect(relationCap("relative")).toBe(10_000_000);
    expect(relationCap("other")).toBe(0);
  });

  it("미성년자가 직계존속에게 받으면 2천만원으로 줄어든다", () => {
    expect(relationCap("ascendant", true)).toBe(20_000_000);
    // 직계비속·기타친족에는 미성년자 특례가 없다.
    expect(relationCap("descendant", true)).toBe(relationCap("descendant"));
  });
});

describe("10년 한도", () => {
  it("이미 쓴 만큼 줄어든다 — 매번 새로 생기지 않는다", () => {
    const d = deductionsFor({
      amount: 50_000_000,
      relation: "ascendant",
      usedWithin10y: 50_000_000,
    });
    expect(d.relation).toBe(0);
  });

  it("한도를 다 쓴 뒤 받으면 받은 금액이 그대로 과세표준이 된다", () => {
    const r = computeGift({
      amount: 50_000_000,
      relation: "ascendant",
      usedWithin10y: 50_000_000,
    });
    expect(r.base).toBe(50_000_000);
    expect(r.computed).toBe(taxOn(50_000_000));
  });

  it("공제 한도까지는 세금이 0원이다", () => {
    const r = computeGift({ amount: 50_000_000, relation: "ascendant" });
    expect(r.base).toBe(0);
    expect(r.payable).toBe(0);
  });
});

describe("혼인·출산공제", () => {
  it("관계별 공제와 별개로 붙는다", () => {
    const d = deductionsFor({
      amount: 2 * 억,
      relation: "ascendant",
      marriageBirth: 억,
    });
    expect(d.relation).toBe(50_000_000);
    expect(d.marriageBirth).toBe(억);
    expect(d.total).toBe(150_000_000);
  });

  it("혼인분과 출산분을 합해 1억이 한도다", () => {
    const d = deductionsFor({
      amount: 3 * 억,
      relation: "ascendant",
      marriageBirth: 억,
      marriageBirthUsed: 억,
    });
    expect(d.marriageBirth).toBe(0);
  });

  it("직계존속이 아니면 적용되지 않는다", () => {
    const d = deductionsFor({
      amount: 2 * 억,
      relation: "relative",
      marriageBirth: 억,
    });
    expect(d.marriageBirth).toBe(0);
  });

  it("세금 0원 경계가 1억 5천만원이 된다", () => {
    expect(taxFreeCeiling("ascendant", { marriageBirth: true })).toBe(
      150_000_000,
    );
  });
});

describe("세율", () => {
  it("상속세 세율표와 같다 — 제56조가 제26조를 준용한다", () => {
    expect(rates.brackets).toEqual(inheritance.brackets);
  });

  it("구간별 산출세액", () => {
    expect(taxOn(억)).toBe(10_000_000);
    expect(taxOn(5 * 억)).toBe(90_000_000);
    expect(taxOn(10 * 억)).toBe(240_000_000);
  });
});

describe("신고세액공제", () => {
  it("산출세액의 3%를 뺀 금액을 낸다", () => {
    const r = computeGift({ amount: 3 * 억, relation: "ascendant" });
    expect(r.filingCredit).toBe(Math.round(r.computed * rates.filingCredit.rate));
    expect(r.payable).toBe(r.computed - r.filingCredit);
  });
});

describe("과세최저한", () => {
  it("과세표준 50만원 미만이면 부과하지 않는다", () => {
    const r = computeGift({
      amount: 50_000_000 + 400_000,
      relation: "ascendant",
    });
    expect(r.base).toBe(0);
    expect(r.payable).toBe(0);
  });
});

describe("검증 기록", () => {
  it("sources 와 verifiedOn 이 있다", () => {
    expect(rates.sources.length).toBeGreaterThan(0);
    expect(rates.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

/*
 * 10년 합산(제47조 ②)·납부세액공제(제58조)·세대생략 할증(제57조 · 시행령 제46조의3).
 * 기대값은 원문 식으로 손계산한 것이다. roberin 같은 입력(2026-10-18)과도 같지만 그것은 근거가 아니다.
 */
describe("10년 안에 같은 사람에게 받은 금액 합산", () => {
  it("직계존속 이번 2억 + 10년 안 2억 → 3,880만원 (합산 과세표준 3.5억, 이전분 산출세액 2천만 공제)", () => {
    const r = computeGift({ amount: 2 * 억, relation: "ascendant", priorGifts: 2 * 억 });
    expect(r.aggregated).toBe(true);
    expect(r.taxable).toBe(4 * 억);
    expect(r.priorDeduction).toBe(50_000_000);
    expect(r.deductions.relation).toBe(0);
    expect(r.base).toBe(350_000_000);
    expect(r.computed).toBe(60_000_000);
    expect(r.priorComputed).toBe(20_000_000);
    // 한도 = 6천만 × 1.5억/3.5억 ≈ 2,571만 — 2천만 전액 공제
    expect(r.priorCreditLimit).toBe(25_714_286);
    expect(r.priorCredit).toBe(20_000_000);
    expect(r.filingCredit).toBe(1_200_000);
    expect(r.payable).toBe(38_800_000);
  });

  it("이전 증여가 공제 안이면 '이미 쓴 공제'로 넣은 것과 같다 (1억 + 5천 → 970만)", () => {
    const a = computeGift({ amount: 억, relation: "ascendant", priorGifts: 50_000_000 });
    const b = computeGift({ amount: 억, relation: "ascendant", usedWithin10y: 50_000_000 });
    expect(a.payable).toBe(9_700_000);
    expect(a.payable).toBe(b.payable);
  });

  it("친족 외 이번 2억 + 10년 안 3억 → 3,880만원", () => {
    const r = computeGift({ amount: 2 * 억, relation: "other", priorGifts: 3 * 억 });
    expect(r.computed).toBe(90_000_000);
    expect(r.priorComputed).toBe(50_000_000);
    expect(r.priorCredit).toBe(50_000_000);
    expect(r.payable).toBe(38_800_000);
  });

  it("이전분 과세표준이 50만원 미만이면 이전분 세액은 0 (기타친족 1,040만 + 1천만 → 1,008,800원)", () => {
    const r = computeGift({ amount: 10_000_000, relation: "relative", priorGifts: 10_400_000 });
    expect(r.priorBase).toBe(0);
    expect(r.priorCredit).toBe(0);
    expect(r.base).toBe(10_400_000);
    expect(r.payable).toBe(1_008_800);
  });

  it("이번에 혼인공제를 쓰면 한도가 공제를 막는다 (1억 + 이전 1억, 혼인 1억 → 0원)", () => {
    const r = computeGift({ amount: 억, relation: "ascendant", priorGifts: 억, marriageBirth: 억 });
    expect(r.base).toBe(50_000_000);
    expect(r.computed).toBe(5_000_000);
    expect(r.priorComputed).toBe(5_000_000);
    expect(r.priorCreditLimit).toBe(5_000_000);
    expect(r.payable).toBe(0);
  });

  it("친족 외에서 이전 합계가 1천만원 미만이면 합산 여부를 원문으로 닫지 못해 unclear", () => {
    const r = computeGift({ amount: 95_000_000, relation: "other", priorGifts: 9_000_000 });
    expect(r.unclear).toBe(true);
  });

  it("공제가 있는 관계에서 이전 합계가 1천만원 미만이면 합산과 무관하게 같은 값", () => {
    const r = computeGift({ amount: 30_000_000, relation: "relative", priorGifts: 5_000_000 });
    expect(r.unclear).toBe(false);
    // 공제 1천만 중 500만은 이전 증여가 먼저 썼다(시행령 제46조 ①1호) → 3천만 − 500만
    expect(r.base).toBe(25_000_000);
  });

  it("이전 금액이 없으면 지금까지와 결과가 같다", () => {
    for (const amount of [0, 30_000_000, 억, 7 * 억, 40 * 억]) {
      for (const relation of ["spouse", "ascendant", "descendant", "relative", "other"] as const) {
        const a = computeGift({ amount, relation });
        expect(a.priorCredit).toBe(0);
        expect(a.surcharge).toBe(0);
        expect(a.taxable).toBe(amount);
      }
    }
  });
});

describe("세대생략 할증 (제57조 · 시행령 제46조의3)", () => {
  it("조부모 → 성년 손자녀 1억 → 산출 500만 + 할증 150만, 신고공제 195,000 → 6,305,000원", () => {
    const r = computeGift({ amount: 억, relation: "ascendant", generationSkip: true });
    expect(r.surchargeRate).toBe(0.3);
    expect(r.surcharge).toBe(1_500_000);
    expect(r.filingCredit).toBe(195_000);
    expect(r.payable).toBe(6_305_000);
  });

  it("미성년자이면서 20억 넘으면 40% (25억 → 1,129,856,000원)", () => {
    const r = computeGift({ amount: 25 * 억, relation: "ascendant", minor: true, generationSkip: true });
    expect(r.base).toBe(2_480_000_000);
    expect(r.computed).toBe(832_000_000);
    expect(r.surchargeRate).toBe(0.4);
    expect(r.surcharge).toBe(332_800_000);
    expect(r.payable).toBe(1_129_856_000);
  });

  it("미성년자라도 20억 이하면 30%", () => {
    const r = computeGift({ amount: 20 * 억, relation: "ascendant", minor: true, generationSkip: true });
    expect(r.surchargeRate).toBe(0.3);
  });

  it("직계존속이 아니면 할증하지 않는다", () => {
    const r = computeGift({ amount: 억, relation: "relative", generationSkip: true });
    expect(r.surcharge).toBe(0);
  });

  it("10년 합산과 함께면 '종전에 납부한 할증과세액'을 원문만으로 못 정해 unclear", () => {
    const r = computeGift({ amount: 억, relation: "ascendant", generationSkip: true, priorGifts: 억 });
    expect(r.unclear).toBe(true);
  });
});
