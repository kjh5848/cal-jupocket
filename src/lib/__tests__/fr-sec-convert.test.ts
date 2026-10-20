import { describe, it, expect } from "vitest";
import { toNanos, convertAll, minSec, partsToNanos } from "../sec-convert";
import { readInputFr, digitsFr, withUnitFr, readableFr, clockFr, partsSubFr } from "../fr/sec-convert";

const N = " ";

describe("프랑스어판 초·분·시간 변환 표기", () => {
  it("입력: 쉼표 소수·공백 천 단위를 읽고, 쉼표와 점이 섞이면 못 읽는다", () => {
    expect(readInputFr("1,5")).toBe("1.5");
    expect(readInputFr("1 440,25")).toBe("1440.25");
    expect(readInputFr(`86${N}400`)).toBe("86400");
    expect(readInputFr("1.5")).toBe("1.5");
    expect(toNanos(readInputFr("1,5"), "h")).toBe(toNanos("1.5", "h"));
    expect(toNanos(readInputFr("1.234,5"), "s")).toBeNull();
  });

  it("숫자: 천 단위 좁은 공백, 소수 쉼표", () => {
    expect(digitsFr("1,440.25")).toBe(`1${N}440,25`);
    expect(digitsFr("0.083333")).toBe("0,083333");
    expect(digitsFr("90")).toBe("90");
  });

  it("단위: 2 미만은 단수, 2 이상은 복수", () => {
    expect(withUnitFr("0", "s")).toBe("0 seconde");
    expect(withUnitFr("1", "h")).toBe("1 heure");
    expect(withUnitFr("1.5", "h")).toBe("1,5 heure");
    expect(withUnitFr("2", "min")).toBe("2 minutes");
    expect(withUnitFr("5,400", "s")).toBe(`5${N}400 secondes`);
  });

  it("5 400 secondes = 90 minutes = 1,5 heure = 1 heure 30 minutes 0 seconde", () => {
    const n = toNanos("5400", "s")!;
    const all = convertAll(n);
    expect(withUnitFr(all.min, "min")).toBe("90 minutes");
    expect(withUnitFr(all.h, "h")).toBe("1,5 heure");
    expect(readableFr(n)).toBe("1 heure 30 minutes 0 seconde");
    expect(clockFr(n)).toBe("1:30:00");
  });

  it("100 000 secondes = 1 jour 3 heures 46 minutes 40 secondes, horloge 27:46:40", () => {
    const n = toNanos("100000", "s")!;
    expect(readableFr(n)).toBe("1 jour 3 heures 46 minutes 40 secondes");
    expect(clockFr(n)).toBe("27:46:40");
  });

  it("90,5 secondes → horloge à virgule, 0 → '0 seconde'", () => {
    expect(clockFr(toNanos(readInputFr("90,5"), "s")!)).toBe("0:01:30,5");
    expect(readableFr(0n)).toBe("0 seconde");
  });

  it("2 h 15 min → 135 minutes · 2,25 heures", () => {
    const n = partsToNanos("", "2", "15", "")!;
    const all = convertAll(n);
    expect(withUnitFr(all.s, "s")).toBe(`8${N}100 secondes`);
    expect(partsSubFr(all.min, minSec(n), all.h, readableFr(n))).toBe(
      "135 minutes · 2,25 heures · 2 heures 15 minutes 0 seconde",
    );
    const m = toNanos("277.2", "min")!;
    const a = convertAll(m);
    expect(partsSubFr(a.min, minSec(m), a.h, readableFr(m))).toBe(
      "277,2 minutes (277 min 12 s) · 4,62 heures · 4 heures 37 minutes 12 secondes",
    );
  });
});
