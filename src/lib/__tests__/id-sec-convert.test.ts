import { describe, it, expect } from "vitest";
import { toNanos, convertAll } from "../sec-convert";
import { readableId, withUnitId, UNIT_NAME_ID } from "../id/sec-convert";

describe("id sec-convert 표기", () => {
  it("1 jam = 3,600 detik, 1 hari = 86,400 detik (SI 표 8)", () => {
    expect(convertAll(toNanos("1", "h")!).s).toBe("3,600");
    expect(convertAll(toNanos("1", "d")!).s).toBe("86,400");
  });
  it("풀어 쓰기는 앞쪽 0 단위를 빼고 복수형이 없다", () => {
    expect(readableId(toNanos("5400", "s")!)).toBe("1 jam 30 menit 0 detik");
    expect(readableId(toNanos("100000", "s")!)).toBe("1 hari 3 jam 46 menit 40 detik");
    expect(readableId(toNanos("0", "s")!)).toBe("0 detik");
    expect(readableId(toNanos("90000", "ms")!)).toBe("1 menit 30 detik");
    expect(readableId(toNanos("1", "ms")!)).toBe("0.001 detik");
  });
  it("값 + 단위", () => {
    expect(withUnitId("1", "s")).toBe("1 detik");
    expect(withUnitId("1.5", "h")).toBe("1.5 jam");
    expect(UNIT_NAME_ID.ms).toBe("Milidetik");
  });
});
