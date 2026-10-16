import { describe, it, expect } from "vitest";
import { fromGross, fromNet, otherIncome } from "../withholding";

describe("사업소득 3.3%", () => {
  it("계약금액→원천징수·실수령", () => {
    const r = fromGross(1000000);
    expect(r.withholding).toBe(33000);
    expect(r.net).toBe(967000);
  });
  it("실수령→계약금액 역산", () => {
    expect(fromNet(967000).gross).toBe(1000000);
  });
});
describe("기타소득 8.8%", () => {
  it("총액→원천징수·실수령", () => {
    const r = otherIncome(1000000);
    expect(r.withholding).toBe(88000);
    expect(r.net).toBe(912000);
  });
});
describe("3.3% = 소득세 3% + 지방소득세 0.3%(소득세의 10%) 나눠 보기", () => {
  // roberin 대조(2026-10-17)와 같은 입력·같은 값 — 합계는 원천징수액과 늘 같다
  it.each([
    [1000000, 30000, 3000],
    [1234567, 37037, 3704],
    [999, 30, 3],
  ])("계약금액 %i → 소득세 %i · 지방소득세 %i", (gross, inc, loc) => {
    const r = fromGross(gross);
    expect(r.incomeTax).toBe(inc);
    expect(r.localTax).toBe(loc);
    expect(r.incomeTax + r.localTax).toBe(r.withholding);
  });
  it.each([
    [1000000, 1034126, 31024, 3102],
    [1234567, 1276698, 38301, 3830],
  ])("실수령 %i → 계약금액 %i · 소득세 %i · 지방소득세 %i", (net, gross, inc, loc) => {
    const r = fromNet(net);
    expect(r.gross).toBe(gross);
    expect(r.net).toBe(net);
    expect(r.incomeTax).toBe(inc);
    expect(r.localTax).toBe(loc);
  });
});
