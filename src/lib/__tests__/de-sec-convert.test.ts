import { describe, it, expect } from "vitest";
import { toNanos, convertAll, minSec, partsToNanos } from "../sec-convert";
import { readInputDe, digitsDe, withUnitDe, readableDe, clockDe, partsSubDe, UNIT_NAME_DE } from "../de/sec-convert";
import { intDe } from "../de/date-format";

const N = " ";

describe("독일어판 초·분·시간 변환 표기", () => {
  it("입력: 쉼표 소수, 공백·세 자리 점 묶음은 천 단위, 못 읽으면 null", () => {
    expect(readInputDe("1,5")).toBe("1.5");
    expect(readInputDe("86 400")).toBe("86400");
    expect(readInputDe(`86${N}400`)).toBe("86400");
    expect(readInputDe("1.500")).toBe("1500");
    expect(readInputDe("1.234,5")).toBe("1234.5");
    expect(readInputDe("1.5")).toBe("1.5");
    expect(readInputDe("7,75")).toBe("7.75");
    expect(toNanos(readInputDe("1,2,3"), "s")).toBeNull();
    expect(toNanos(readInputDe("12.34,5"), "s")).toBeNull();
    expect(toNanos(readInputDe("1,5"), "h")).toBe(toNanos("1.5", "h"));
    expect(toNanos(readInputDe("123456789012345,123456"), "ms")).toBe(toNanos("123456789012345.123456", "ms"));
  });

  it("숫자: 천 단위는 intDe 와 같은 줄바꿈 없는 공백, 소수 쉼표", () => {
    expect(digitsDe("1,440.25")).toBe(`1${N}440,25`);
    expect(digitsDe("86,400")).toBe(intDe(86400));
    expect(digitsDe("0.083333")).toBe("0,083333");
    expect(digitsDe("90")).toBe("90");
  });

  it("단위: 정확히 1만 단수", () => {
    expect(withUnitDe("0", "s")).toBe("0 Sekunden");
    expect(withUnitDe("1", "h")).toBe("1 Stunde");
    expect(withUnitDe("1.5", "h")).toBe("1,5 Stunden");
    expect(withUnitDe("2", "min")).toBe("2 Minuten");
    expect(withUnitDe("1", "d")).toBe("1 Tag");
    expect(withUnitDe("5,400", "s")).toBe(`5${N}400 Sekunden`);
    expect(UNIT_NAME_DE.d).toBe("Tage");
  });

  it("풀어 쓰기·h:mm:ss — 본문 예시를 손계산으로 고정", () => {
    // 5 400 s = 1 h 30 min
    expect(readableDe(toNanos("5400", "s")!)).toBe("1 Stunde 30 Minuten 0 Sekunden");
    // 100 000 s = 1 d (86 400) + 13 600 → 3 h (10 800) + 2 800 → 46 min (2 760) + 40 s
    const n = toNanos("100000", "s")!;
    expect(readableDe(n)).toBe("1 Tag 3 Stunden 46 Minuten 40 Sekunden");
    expect(clockDe(n)).toBe("27:46:40");
    expect(clockDe(toNanos("90.5", "s")!)).toBe("0:01:30,5");
    expect(readableDe(0n)).toBe("0 Sekunden");
    // 7,75 h = 7 h 45 min
    expect(readableDe(toNanos(readInputDe("7,75"), "h")!)).toBe("7 Stunden 45 Minuten 0 Sekunden");
    // 8:30–17:00 minus 1 h Pause = 450 min = 7,5 h
    expect(digitsDe(convertAll(toNanos("450", "min")!).h)).toBe("7,5");
    // 1 Industrieminute = 1/100 h = 0,6 min = 36 s
    expect(digitsDe(convertAll(toNanos("0.01", "h")!).min)).toBe("0,6");
    expect(convertAll(toNanos("0.01", "h")!).s).toBe("36");
  });

  it("둘째 계산기 아랫줄", () => {
    const p = partsToNanos("", "2", "15", "")!;
    const a = convertAll(p);
    expect(partsSubDe(a.min, minSec(p), a.h, readableDe(p))).toBe(
      "135 Minuten · 2,25 Stunden · 2 Stunden 15 Minuten 0 Sekunden",
    );
    const q = partsToNanos("", "", "1", "30.5")!;
    const b = convertAll(q);
    expect(partsSubDe(b.min, minSec(q), b.h, readableDe(q))).toContain("(1 min 30,5 s)");
  });
});
