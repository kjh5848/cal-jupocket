import { describe, it, expect } from "vitest";
import { won, formatWon } from "../money";

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
