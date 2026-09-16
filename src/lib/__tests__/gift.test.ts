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
