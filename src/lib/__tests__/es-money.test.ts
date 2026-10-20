import { describe, it, expect } from "vitest";
import { euroEs, decimalEs } from "../es/money";

describe("euroEs — 정수 유로, 쉼표 소수점·공백 천 단위(RD 2032/2009)", () => {
  it("네 자리까지는 공백 없음", () => {
    expect(euroEs(5000)).toBe("5000 euros");
    expect(euroEs(200)).toBe("200 euros");
  });
  it("다섯 자리부터 세 자리마다 공백", () => {
    expect(euroEs(10_000).replace(/\s/g, " ")).toBe("10 000 euros");
    expect(euroEs(1_234_567.4).replace(/\s/g, " ")).toBe("1 234 567 euros");
  });
  it("반올림·단수", () => {
    expect(euroEs(0.6)).toBe("1 euro");
    expect(euroEs(-1)).toBe("-1 euro");
    expect(euroEs(0)).toBe("0 euros");
    expect(euroEs(-12_345.5).replace(/\s/g, " ")).toBe("-12 345 euros");
  });
  it("천 단위는 줄바꿈 없는 공백(formatNumberEs 와 같음), 'euros' 앞은 보통 공백", () => {
    expect(euroEs(10_000)).toBe("10 000 euros");
  });
});

describe("decimalEs", () => {
  it("점 → 쉼표", () => {
    expect(decimalEs("0.4167")).toBe("0,4167");
    expect(decimalEs("5")).toBe("5");
  });
});
