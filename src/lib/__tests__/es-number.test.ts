import { describe, it, expect } from "vitest";
import { parseNumberEs, formatNumberEs } from "../es/number";

describe("parseNumberEs — 스페인 표기 읽기", () => {
  it.each([
    ["12,5", 12.5],
    ["1.500", 1500],
    ["1.500.000", 1500000],
    ["1.500,25", 1500.25],
    ["12.5", 12.5],
    ["0.25", 0.25],
    ["0,25", 0.25],
    ["0.250", 0.25],
    ["1 500,5", 1500.5],
    ["1 500", 1500],
    ["18 %", 18],
    ["-40,5", -40.5],
    ["２０％", 20],
    ["200", 200],
  ])("%s → %s", (raw, want) => {
    expect(parseNumberEs(raw)).toBe(want);
  });

  it.each(["", "-", ",", "1,2,3", "abc", "1.50,5", "1.2.3"])("%s → NaN", (raw) => {
    expect(parseNumberEs(raw)).toBeNaN();
  });
});

describe("formatNumberEs — 쉼표 소수점·공백 천 단위(RD 2032/2009 Anexo III 2.8·2.9)", () => {
  it.each([
    [25, "25"],
    [12.5, "12,5"],
    [0.25, "0,25"],
    [1500, "1500"],
    [12345.678, "12 345,68"],
    [1500000, "1 500 000"],
    [-20, "-20"],
    [9.09090909, "9,09"],
    [0, "0"],
  ])("%s → %s", (x, want) => {
    expect(formatNumberEs(x)).toBe(want);
  });

  it("표기한 것을 다시 읽으면 같은 값", () => {
    for (const x of [0.5, 12.5, 1500, 12345.67, 1500000.25, -9.09]) {
      expect(parseNumberEs(formatNumberEs(x))).toBe(x);
    }
  });
});
