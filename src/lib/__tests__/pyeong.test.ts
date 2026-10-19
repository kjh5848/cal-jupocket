import { describe, it, expect } from "vitest";
import { toM2, fromM2, pyeong, rectM2, fmtArea } from "../pyeong";
import { round2 } from "../percent";
import rates from "../../rates/pyeong-2026.json";

const r = (x: number) => round2(x);

describe("단위 정의 — rates 원문 값", () => {
  it("1평 = 400/121 ㎡, 1 ft² = 0.09290304 ㎡", () => {
    expect(rates.units.m2PerPyeong).toBe("400/121");
    expect(toM2(121, "pyeong")).toBeCloseTo(400, 10);
    expect(toM2(1, "ft2")).toBe(0.09290304);
    // foot = 1/3 yard, yard = 0.9144 m → 0.3048² (영국 WMA 1985 Sch.1)
    expect(toM2(1, "ft2")).toBeCloseTo((0.9144 / 3) ** 2, 12);
  });
  it("평 ↔ ㎡ 왕복", () => {
    expect(fromM2(toM2(33, "pyeong"), "pyeong")).toBeCloseTo(33, 10);
    expect(fromM2(84, "pyeong")).toBe(25.41); // 84 × 121 / 400 — 손셈으로 딱 떨어짐
  });
});

describe("손셈 예시 (roberin #62 대조 입력과 같은 4개)", () => {
  it("공급 30평, 전용률 75% → 99.17 ㎡ · 1,067.50 ft² · 전용 22.50평 · 74.38 ㎡", () => {
    const x = pyeong(30, "pyeong", "supply", 75)!;
    expect(r(x.given.m2)).toBe(99.17); // 12000/121 = 99.1735…
    expect(r(x.given.ft2)).toBe(1067.5);
    expect(r(x.other!.pyeong)).toBe(22.5);
    expect(r(x.other!.m2)).toBe(74.38);
  });
  it("전용 84 ㎡, 75% → 25.41평 · 904.17 ft² · 공급 112 ㎡ · 33.88평", () => {
    const x = pyeong(84, "m2", "exclusive", 75)!;
    expect(r(x.given.pyeong)).toBe(25.41);
    expect(r(x.given.ft2)).toBe(904.17);
    expect(r(x.other!.m2)).toBe(112);
    expect(r(x.other!.pyeong)).toBe(33.88);
  });
  it("공급 1,000 ft², 80% → 92.90 ㎡ · 28.10평 · 전용 74.32 ㎡ · 22.48평", () => {
    const x = pyeong(1000, "ft2", "supply", 80)!;
    expect(r(x.given.m2)).toBe(92.9);
    expect(r(x.given.pyeong)).toBe(28.1);
    expect(r(x.other!.m2)).toBe(74.32);
    expect(r(x.other!.pyeong)).toBe(22.48);
  });
  it("전용 59 ㎡, 60% → 17.85평 · 공급 98.33 ㎡ · 29.75평", () => {
    const x = pyeong(59, "m2", "exclusive", 60)!;
    expect(r(x.given.pyeong)).toBe(17.85);
    expect(r(x.other!.m2)).toBe(98.33);
    expect(r(x.other!.pyeong)).toBe(29.75);
  });
});

describe("경계값", () => {
  it("전용률 100% 면 같은 면적", () => {
    expect(pyeong(10, "pyeong", "supply", 100)!.other!.pyeong).toBeCloseTo(10, 10);
  });
  it("전용률이 0·음수·100 초과·빈칸이면 반대쪽은 비운다", () => {
    for (const p of [0, -5, 101, NaN]) expect(pyeong(10, "pyeong", "supply", p)!.other).toBeNull();
  });
  it("면적 0·음수·숫자 아님은 계산 안 함", () => {
    for (const v of [0, -1, NaN, Infinity]) expect(pyeong(v, "m2", "exclusive", 75)).toBeNull();
  });
  it("가로 × 세로", () => {
    expect(rectM2(3.3, 4)).toBeCloseTo(13.2, 10);
    expect(rectM2(0, 4)).toBeNull();
    expect(rectM2(3, NaN)).toBeNull();
  });
  it("표기는 둘째 자리까지, 천 단위 쉼표", () => {
    expect(fmtArea(1067.5)).toBe("1,067.50");
    expect(fmtArea(12000 / 121)).toBe("99.17");
  });
});
