import { describe, it, expect } from "vitest";
import { cleanHistory, numbersGrounded, readModel, checkAnswer, sourcesFor, levelOf, LEVEL_HINT, SYSTEM, type Msg } from "../hug-chat-core";
import { KB, eok } from "../hug-kb";
import { hugGuarantee } from "../hug-jeonse";
import { won } from "../won";
import r from "../../rates/hug-jeonse-2026.json";

const user = (content: string): Msg => ({ role: "user", content });

describe("eok", () => {
  it("억·천만 단위를 읽기 좋게", () => {
    expect(eok(7e8)).toBe("7억원");
    expect(eok(1.2e8)).toBe("1억 2천만원");
    expect(eok(3.45e8)).toBe("3억 4,500만원");
    expect(eok(5e7)).toBe("5천만원");
  });
});

describe("자료", () => {
  it("id 가 겹치지 않고 출처가 rates 의 URL 이다", () => {
    expect(new Set(KB.map((k) => k.id)).size).toBe(KB.length);
    const urls = new Set(Object.values(r.sources));
    for (const k of KB) expect(urls.has(k.src), k.id).toBe(true);
  });
  it("숫자는 rates 에서 나온다 — 상한·한도가 자료에 그대로 있다", () => {
    expect(SYSTEM).toContain(`수도권 ${eok(r.guarantee.depositCap.capital)}`);
    expect(SYSTEM).toContain(`연 ${r.beotimmok.ratePctMin}~${r.beotimmok.ratePctMax}%`);
  });
});

describe("cleanHistory", () => {
  it("마지막이 사용자 말이어야 하고 모양이 틀린 것은 버린다", () => {
    expect(cleanHistory([{ role: "user", content: "  안녕  " }])).toEqual([{ role: "user", content: "안녕" }]);
    expect(cleanHistory([{ role: "assistant", content: "x" }])).toBeNull();
    expect(cleanHistory([{ role: "system", content: "x" }, { role: "user", content: "q" }])).toEqual([{ role: "user", content: "q" }]);
    expect(cleanHistory("q")).toBeNull();
  });
});

describe("numbersGrounded — 자료·대화에 없는 숫자가 있으면 버린다", () => {
  const h = [user("수도권 빌라 보증금 2억 3천이에요")];
  it("자료의 숫자는 통과", () => {
    expect(numbersGrounded("보증금은 수도권 7억원, 그 외 5억원 이하여야 해요. 주택가격의 90% 기준이에요.", h)).toBe(true);
    expect(numbersGrounded("버팀목 금리는 연 2.5~3.5%예요.", h)).toBe(true);
  });
  it("사용자가 말한 금액은 통과", () => {
    expect(numbersGrounded("보증금 2억 3천만원이면 상한 안이에요.", h)).toBe(true);
  });
  it("지어낸 숫자는 막는다", () => {
    expect(numbersGrounded("수도권 상한은 8억원이에요.", h)).toBe(false);
    expect(numbersGrounded("금리는 연 4.2%예요.", h)).toBe(false);
    expect(numbersGrounded("보증료는 약 37만원이에요.", h)).toBe(false);
  });
});

describe("readModel", () => {
  const h = [user("수도권 아파트, 보증금 3억, 시세 5억, 근저당 1억이에요")];
  const base = { type: "apartment", capital: true, deposit: 3e8, senior: 1e8, basis: "market", price: 5e8 };
  it("사용자가 말한 금액만 계산에 쓴다", () => {
    expect(readModel({ reply: "계산해 봤어요.", cite: ["ltv", "없는id"], check: base }, h)).toEqual({
      reply: "계산해 봤어요.",
      cite: ["ltv"],
      check: { ...base, otherDeposits: 0 },
    });
  });
  it("말하지 않은 금액이 들어오면 계산하지 않는다", () => {
    expect(readModel({ reply: "x", check: { ...base, price: 6e8 } }, h)?.check).toBeNull();
  });
  it("집값을 근저당 칸에 넣으면 버리고 다시 시키게 표시한다", () => {
    const h2 = [user("수도권 빌라, 보증금 2억, 공시가격 1억 8천, 근저당 없어요")];
    const out = readModel({ reply: "x", check: { type: "row", capital: true, deposit: 2e8, senior: 1.8e8, basis: "public", price: 1.8e8 } }, h2);
    expect(out?.check).toBeNull();
    expect(out?.checkRejected).toBe(true);
  });
  it("값이 빠지면 계산하지 않는다", () => {
    expect(readModel({ reply: "x", check: { ...base, type: undefined } }, h)?.check).toBeNull();
  });
  it("reply 가 없으면 null", () => {
    expect(readModel({ cite: [] }, h)).toBeNull();
  });
});

describe("checkAnswer — 숫자는 hugGuarantee 그대로", () => {
  it("조건 충족", () => {
    const x = { type: "apartment" as const, capital: true, deposit: 3e8, senior: 1e8, basis: "market" as const, price: 5e8 };
    const g = hugGuarantee(x);
    const a = checkAnswer(x);
    expect(g.ok).toBe(true);
    expect(a.text).toContain("맞는 것으로 추산");
    expect(a.lines.find((l) => l.label.startsWith("이 집에서"))?.value).toBe(won(g.maxDeposit));
  });
  it("가입 조건에 맞으면 보증료를 붙인다 — 2년 기본, 할인 안내", () => {
    const a = checkAnswer({ type: "row", capital: true, deposit: 2e8, senior: 0, basis: "public", price: 1.8e8 });
    expect(a.lines.find((l) => l.label.startsWith("보증료(2년"))?.value).toBe(won(736_000));
    expect(a.text).toContain("2년으로 계산");
    expect(a.text).toContain("할인 대상이면");
    expect(a.numbers).toContain(736_000);
  });
  it("할인을 말했으면 할인 줄과 합계", () => {
    const a = checkAnswer({ type: "row", capital: true, deposit: 2e8, senior: 0, basis: "public", price: 1.8e8, discount: "newlywed", months: 12 });
    expect(a.lines.some((l) => l.label.startsWith("할인 40%"))).toBe(true);
    expect(a.lines.find((l) => l.label === "내는 보증료(추산)")?.value).toBe(won(368_000 - 147_200));
  });
  it("90% 초과면 이유를 말한다", () => {
    const a = checkAnswer({ type: "row", capital: true, deposit: 2e8, senior: 1e8, basis: "public", price: 2e8 });
    expect(a.text).toContain("90%를 넘어요");
  });
});

describe("readModel — 보증료 선택 값", () => {
  const h = [user("서울 아파트 보증금 3억, 시세 5억, 근저당 1억, 신혼이고 대출 2억이에요")];
  const base = { type: "apartment", capital: true, deposit: 3e8, senior: 1e8, basis: "market", price: 5e8 };
  it("할인 키·기간·말한 대출금만 받는다", () => {
    expect(readModel({ reply: "x", check: { ...base, discount: "newlywed", months: 24, loan: 2e8 } }, h)?.check).toMatchObject({ discount: "newlywed", months: 24, loan: 2e8 });
    const bad = readModel({ reply: "x", check: { ...base, discount: "vip", months: 7, loan: 1.5e8 } }, h)?.check;
    expect(bad?.discount).toBeUndefined();
    expect(bad?.months).toBeUndefined();
    expect(bad?.loan).toBeUndefined();
  });
});

describe("수준(얼마나 아세요)", () => {
  it("알려진 값만 받는다", () => {
    expect(levelOf("new")).toBe("new");
    expect(levelOf("expert")).toBeNull();
    expect(Object.keys(LEVEL_HINT)).toEqual(["new", "some", "ready"]);
  });
  it("쉬운 말 규칙이 SYSTEM 에 있다", () => {
    expect(SYSTEM).toContain("집에 먼저 잡힌 빚");
  });
});

describe("sourcesFor", () => {
  it("같은 페이지는 한 번만", () => {
    expect(sourcesFor(["ltv", "deposit-cap", "beotimmok-who"]).map((s) => s.name)).toEqual(["HUG 전세반환보증 안내", "주택도시기금 버팀목 안내"]);
  });
});
