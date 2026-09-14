import { describe, it, expect } from "vitest";
import {
  won,
  formatWon,
  parseAmount,
  formatAmountInput,
  currentValueOrDefault,
  formatMan,
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

describe("formatMan — 문장 안에서 읽는 금액", () => {
  it("만 단위로 떨어지면 만원으로", () => {
    expect(formatMan(1_500_000)).toBe("150만원");
    expect(formatMan(500_000)).toBe("50만원");
    expect(formatMan(30_000_000)).toBe("3,000만원");
  });

  it("억을 넘기면 억으로", () => {
    expect(formatMan(100_000_000)).toBe("1억원");
    expect(formatMan(120_000_000)).toBe("1억 2,000만원");
  });

  it("만 단위로 안 떨어지면 물러선다", () => {
    // 반올림해서 틀린 금액을 보여주느니 자릿수가 긴 편이 낫다.
    expect(formatMan(1_234_567)).toBe(formatWon(1_234_567));
  });

  it("0은 0원", () => {
    expect(formatMan(0)).toBe("0원");
  });
});
