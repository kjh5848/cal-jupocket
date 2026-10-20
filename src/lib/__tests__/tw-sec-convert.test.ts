import { describe, it, expect } from "vitest";
import { toNanos, convertAll, clock } from "../sec-convert";
import { readableZhHant, withUnitZhHant, UNIT_NAME_ZH_HANT } from "../tw/sec-convert";

describe("tw sec-convert 번체 표기", () => {
  it("1小時 = 3,600秒, 1天 = 86,400秒 (SI 표 8)", () => {
    expect(convertAll(toNanos("1", "h")!).s).toBe("3,600");
    expect(convertAll(toNanos("1", "d")!).s).toBe("86,400");
  });
  it("풀어 쓰기 — 앞쪽 0 단위는 빼고 붙여 쓴다(손계산)", () => {
    expect(readableZhHant(toNanos("0", "s")!)).toBe("0秒");
    expect(readableZhHant(toNanos("3725", "s")!)).toBe("1小時2分鐘5秒");
    // 100000 = 86400 + 3×3600 + 46×60 + 40
    expect(readableZhHant(toNanos("100000", "s")!)).toBe("1天3小時46分鐘40秒");
    expect(readableZhHant(toNanos("1.5", "h")!)).toBe("1小時30分鐘0秒");
    expect(readableZhHant(toNanos("90500", "ms")!)).toBe("1分鐘30.5秒");
    expect(readableZhHant(toNanos("1", "ms")!)).toBe("0.001秒");
    expect(readableZhHant(toNanos("1000000", "d")!)).toBe("1,000,000天0小時0分鐘0秒");
  });
  it("7384秒 = 2:03:04", () => {
    const n = toNanos("7384", "s")!;
    expect(readableZhHant(n)).toBe("2小時3分鐘4秒");
    expect(clock(n)).toBe("2:03:04");
  });
  it("값 + 단위는 붙여 쓰고 복수형이 없다", () => {
    expect(withUnitZhHant("1", "s")).toBe("1秒");
    expect(withUnitZhHant("5,400", "s")).toBe("5,400秒");
    expect(withUnitZhHant("1.5", "h")).toBe("1.5小時");
    expect(UNIT_NAME_ZH_HANT.min).toBe("分鐘");
    expect(UNIT_NAME_ZH_HANT.ms).toBe("毫秒");
  });
});
