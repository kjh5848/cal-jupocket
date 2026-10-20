/** 프랑스어판 숫자 읽기·쓰기 — 소수 쉼표 입력, fr-FR 표기. 법 숫자 없음. */
import { describe, it, expect } from "vitest";
import { parseNumberFr, formatNumberFr } from "../fr/number";

describe("parseNumberFr", () => {
  it("쉼표와 점을 둘 다 소수점으로 읽는다", () => {
    expect(parseNumberFr("12,5")).toBe(12.5);
    expect(parseNumberFr("12.5")).toBe(12.5);
    expect(parseNumberFr("-0,75")).toBe(-0.75);
  });
  it("공백(줄바꿈 없는 공백 포함)과 % 를 지운다", () => {
    expect(parseNumberFr("1 500")).toBe(1500);
    expect(parseNumberFr("1 500,25")).toBe(1500.25);
    expect(parseNumberFr("1 500")).toBe(1500);
    expect(parseNumberFr("18 %")).toBe(18);
  });
  it("소수점이 둘이거나 숫자가 아니면 NaN", () => {
    expect(parseNumberFr("1.234,5")).toBeNaN();
    expect(parseNumberFr("abc")).toBeNaN();
    expect(parseNumberFr("")).toBeNaN();
    expect(parseNumberFr(",")).toBeNaN();
  });
});

describe("formatNumberFr", () => {
  const plain = (s: string) => s.replace(/[  ]/g, " ");
  it("소수는 쉼표, 천 단위는 공백, 둘째 자리까지", () => {
    expect(plain(formatNumberFr(1234.5))).toBe("1 234,5");
    expect(formatNumberFr(4110.885)).toMatch(/^4.110,89$/);
    expect(formatNumberFr(25)).toBe("25");
    expect(formatNumberFr(-20)).toMatch(/^-20$|^−20$/);
  });
});
