import { describe, it, expect } from "vitest";
import { toNanos, convertAll } from "../sec-convert";
import { readableZhHant, withUnitZhHant, UNIT_NAME_ZH_HANT } from "../hk/sec-convert";

describe("hk sec-convert 표기", () => {
  it("값 + 단위는 붙여 쓴다", () => {
    expect(withUnitZhHant("5,400", "s")).toBe("5,400秒");
    expect(withUnitZhHant("1.5", "h")).toBe("1.5小時");
    expect(UNIT_NAME_ZH_HANT.min).toBe("分鐘");
  });

  it("풀어 쓰기 — 100,000秒 = 1天3小時46分鐘40秒 (손계산: 100000 − 86400 = 13600, 13600 = 3×3600 + 2800, 2800 = 46×60 + 40)", () => {
    expect(readableZhHant(toNanos("100000", "s")!)).toBe("1天3小時46分鐘40秒");
  });

  it("앞쪽 0 단위는 빼고 중간 0 은 남긴다", () => {
    expect(readableZhHant(toNanos("150", "s")!)).toBe("2分鐘30秒");
    expect(readableZhHant(toNanos("86405", "s")!)).toBe("1天0小時0分鐘5秒");
    expect(readableZhHant(0n)).toBe("0秒");
  });

  it("소수 초와 분 → 소수 시간", () => {
    expect(readableZhHant(toNanos("90500", "ms")!)).toBe("1分鐘30.5秒");
    expect(convertAll(toNanos("45", "min")!).h).toBe("0.75");
    expect(convertAll(toNanos("15", "min")!).h).toBe("0.25");
  });
});
