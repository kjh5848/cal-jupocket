import { describe, it, expect } from "vitest";
import { parseLoanQuery, parseAmount, validQuery, missing, toInput, type LoanQuery } from "../loan-parse";
import { CASES } from "./loan-parse.cases";

const KEYS = ["principal", "ratePct", "months", "method", "graceMonths"] as const;
export const same = (a: LoanQuery, b: LoanQuery) => KEYS.every((k) => a[k] === b[k]);

describe("parseAmount", () => {
  it.each([
    ["3억 5천", 350_000_000],
    ["3억5000", 350_000_000],
    ["1.5억", 150_000_000],
    ["5천만원", 50_000_000],
    ["2억 3천5백만원", 235_000_000],
    ["300000000원", 300_000_000],
    ["7천만원", 70_000_000],
    ["500만원", 5_000_000],
  ])("%s → %d", (s, n) => expect(parseAmount(s)).toBe(n));
});

describe("100문항 — 해석기 단독", () => {
  const calc = CASES.filter((c) => c.scope !== "out");
  const misses = calc.filter((c) => !same(parseLoanQuery(c.q), c.want)).map((c) => ({ q: c.q, got: parseLoanQuery(c.q), want: c.want }));

  it("채점표가 100문항이다", () => expect(CASES.length).toBe(100));
  it("계산 질문 80개 중 틀린 것이 없다", () => {
    expect(misses).toEqual([]);
  });
  it("범위 밖 질문에서 세 값이 다 채워지지 않는다(계산으로 답하지 않는다)", () => {
    for (const c of CASES.filter((x) => x.scope === "out")) expect(toInput(parseLoanQuery(c.q)), c.q).toBeNull();
  });
});

describe("validQuery — 모델 출력 검사", () => {
  it("범위 밖·문자열·이상한 방식은 버린다", () => {
    expect(validQuery({ principal: "300000000", ratePct: 4.5, months: 360, method: "level" })).toEqual({ principal: 3e8, ratePct: 4.5, months: 360, method: "level" });
    expect(validQuery({ principal: -1, ratePct: 99, months: 0, method: "x" })).toEqual({});
    expect(validQuery({ principal: 1e8, ratePct: 4, months: 120, graceMonths: 200 })).toEqual({ principal: 1e8, ratePct: 4, months: 120 });
    expect(validQuery(null)).toEqual({});
  });
  it("빠진 값을 알려 준다", () => {
    expect(missing({ principal: 1e8 })).toEqual(["ratePct", "months"]);
  });
});

import { answer } from "../loan-answer";
import { loanSchedule } from "../loan";
import { won } from "../won";

describe("answer — 범위 가르기", () => {
  it("범위 밖 20문항은 모두 out", () => {
    const bad = CASES.filter((c) => c.scope === "out").filter((c) => answer(c.q, parseLoanQuery(c.q)).kind !== "out").map((c) => c.q);
    expect(bad).toEqual([]);
  });
  it("계산 질문 80문항은 하나도 out 이 아니다", () => {
    const bad = CASES.filter((c) => c.scope !== "out").filter((c) => answer(c.q, parseLoanQuery(c.q)).kind === "out").map((c) => c.q);
    expect(bad).toEqual([]);
  });
  it("숫자는 loanSchedule 결과 그대로다", () => {
    const a = answer("3억 4.5% 30년 원리금균등", parseLoanQuery("3억 4.5% 30년 원리금균등"));
    const r = loanSchedule({ principal: 3e8, ratePct: 4.5, months: 360, method: "level" });
    expect(a.kind).toBe("calc");
    if (a.kind === "calc") {
      expect(a.lines.find((l) => l.label === "매달 내는 돈")?.value).toBe(won(r.firstPayment));
      expect(a.lines.find((l) => l.label === "총이자")?.value).toBe(won(r.totalInterest));
    }
  });
  it("빠진 값은 되묻는다", () => {
    const a = answer("3억 30년이면 매달 얼마예요", parseLoanQuery("3억 30년이면 매달 얼마예요"));
    expect(a.kind).toBe("ask");
    if (a.kind === "ask") expect(a.need).toEqual(["ratePct"]);
  });
});
