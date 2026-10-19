/**
 * 일본 학년 — 学校教育法 第17条 · 施行規則 第59条 · 年齢計算ニ関スル法律(民法 第143条 준용).
 * 4월 1일생은 3월 31일에 満6歳に達する → 그해 4월 1일 입학, 4월 2일생은 이듬해.
 */
import { describe, it, expect } from "vitest";
import { toDay } from "../date-calc";
import { elementaryEntryYear, schoolYearOf, schoolGrade } from "../jp/school-grade";

const d = (s: string) => toDay(s)!;

describe("小学校 입학 연도", () => {
  it("4月1日생과 4月2日생이 갈린다", () => {
    expect(elementaryEntryYear(d("2019-04-01"))).toBe(2025);
    expect(elementaryEntryYear(d("2019-04-02"))).toBe(2026);
  });
  it("1月1日생은 같은 해 4월 입학, 12月31日생은 이듬해", () => {
    expect(elementaryEntryYear(d("2020-01-01"))).toBe(2026);
    expect(elementaryEntryYear(d("2019-12-31"))).toBe(2026);
  });
  it("2月29日생도 4월 1일 전이라 그해 입학", () => {
    expect(elementaryEntryYear(d("2020-02-29"))).toBe(2026);
  });
});

describe("학년도", () => {
  it("3월 31일까지는 전 학년도", () => {
    expect(schoolYearOf(d("2027-03-31"))).toBe(2026);
    expect(schoolYearOf(d("2027-04-01"))).toBe(2027);
  });
});

describe("기준일 학년", () => {
  it("입학 전·小1·小6·中1·中3·졸업 뒤", () => {
    const b = d("2019-04-02"); // 2026년 입학
    expect(schoolGrade(b, d("2026-03-31")).stage).toBe("preschool");
    expect(schoolGrade(b, d("2026-04-01"))).toEqual({ stage: "elementary", grade: 1, elementaryEntry: 2026, juniorEntry: 2032 });
    expect(schoolGrade(b, d("2032-03-31"))).toMatchObject({ stage: "elementary", grade: 6 });
    expect(schoolGrade(b, d("2032-04-01"))).toMatchObject({ stage: "junior", grade: 1 });
    expect(schoolGrade(b, d("2035-03-31"))).toMatchObject({ stage: "junior", grade: 3 });
    expect(schoolGrade(b, d("2035-04-01"))).toMatchObject({ stage: "after", grade: 0 });
  });
});
