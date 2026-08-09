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
