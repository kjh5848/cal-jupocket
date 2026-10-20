import { describe, it, expect } from "vitest";
import { isLeapByChokurei, kigenYear } from "../jp/leap-year";
import { isLeap, dayInfo } from "../date-day";
import { toDay } from "../date-calc";

describe("閏年ニ関スル件(明治31年勅令第90号)", () => {
  it("紀元年数 = 서기 + 660", () => {
    expect(kigenYear(2026)).toBe(2686);
  });

  it("원문 예: 1900·2100 평년, 2000·2028 윤년, 2026 평년", () => {
    expect(isLeapByChokurei(1900)).toBe(false);
    expect(isLeapByChokurei(2100)).toBe(false);
    expect(isLeapByChokurei(2000)).toBe(true);
    expect(isLeapByChokurei(2028)).toBe(true);
    expect(isLeapByChokurei(2026)).toBe(false);
  });

  it("계산기의 그레고리력 규칙(isLeap)과 1600~2400년 전부 같다", () => {
    for (let y = 1600; y <= 2400; y++) expect(isLeapByChokurei(y)).toBe(isLeap(y));
  });
});

describe("曜日計算 일본어판 본문 예시", () => {
  const d = (s: string) => dayInfo(toDay(s)!);
  it("2026年10月20日 — 火曜日·第3火曜日·293日目·残り72日·ISO 第43週", () => {
    const x = d("2026-10-20");
    expect(x.weekday).toBe(2);
    expect(x.nth).toBe(3);
    expect(x.dayOfYear).toBe(293);
    expect(x.daysLeft).toBe(72);
    expect(x.iso).toEqual({ year: 2026, week: 43 });
  });
  it("2027年1月1日 金曜日 · 2028年2月29日 火曜日 · 2000年1月1日 土曜日", () => {
    expect(d("2027-01-01").weekday).toBe(5);
    expect(d("2028-02-29").weekday).toBe(2);
    expect(d("2000-01-01").weekday).toBe(6);
  });
  it("ISO 경계: 2021年1月3日 = 2020年 第53週, 2024年12月30日 = 2025年 第1週", () => {
    expect(d("2021-01-03").iso).toEqual({ year: 2020, week: 53 });
    expect(d("2024-12-30").iso).toEqual({ year: 2025, week: 1 });
  });
});
