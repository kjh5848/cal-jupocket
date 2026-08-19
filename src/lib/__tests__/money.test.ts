import { describe, it, expect } from "vitest";
import {
  won,
  formatWon,
  parseAmount,
  formatAmountInput,
  currentValueOrDefault,
} from "../money";

describe("won 반올림", () => {
  it("원 단위 반올림", () => {
    expect(won(1234.4)).toBe(1234);
    expect(won(1234.5)).toBe(1235);
  });
});
describe("formatWon", () => {
  it("천단위 콤마+원", () => {
    expect(formatWon(1234567)).toBe("1,234,567원");
  });
});
describe("parseAmount", () => {
  it("콤마 섞인 문자열에서 숫자만 파싱", () => {
    expect(parseAmount("1,000,000")).toBe(1000000);
  });
  it("빈 문자열은 0", () => {
    expect(parseAmount("")).toBe(0);
  });
});
describe("formatAmountInput", () => {
  it("천단위 콤마 포맷 (원 단위 없음)", () => {
    expect(formatAmountInput(1000000)).toBe("1,000,000");
  });
});
describe("currentValueOrDefault", () => {
  it("숫자가 있으면 콤마 포맷으로 반환", () => {
    expect(currentValueOrDefault("500", 999)).toBe("500");
  });
  it("숫자가 없으면 기본값을 콤마 포맷으로 반환", () => {
    expect(currentValueOrDefault("", 999)).toBe("999");
  });
});
