/**
 * 실수령액 ÷ 하루·시간 — 달력 날짜 수는 직접 센 값으로 고정한다(2026-02-01 일요일, 2024-02-01 목요일, 2026-03-01 일요일).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { daysInMonth, workDaysInMonth, payPerDay } from "../pay-per-day";

describe("계산 기준일", () => {
  it("월 날짜 수 — 윤년 2월 포함", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2026, 3)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
  });
  it("2026년 2월 — 28 · 주 5일 20 · 주 6일 24", () => {
    expect(workDaysInMonth(2026, 2, "all")).toBe(28);
    expect(workDaysInMonth(2026, 2, "weekdays")).toBe(20);
    expect(workDaysInMonth(2026, 2, "noSunday")).toBe(24);
  });
  it("2024년 2월 — 29 · 주 5일 21 · 주 6일 25", () => {
    expect(workDaysInMonth(2024, 2, "weekdays")).toBe(21);
    expect(workDaysInMonth(2024, 2, "noSunday")).toBe(25);
  });
  it("2026년 3월 — 31 · 주 5일 22 · 주 6일 26", () => {
    expect(workDaysInMonth(2026, 3, "weekdays")).toBe(22);
    expect(workDaysInMonth(2026, 3, "noSunday")).toBe(26);
  });
  it("직접 입력은 0~31", () => {
    expect(workDaysInMonth(2026, 3, "custom", 22)).toBe(22);
    expect(workDaysInMonth(2026, 3, "custom", 40)).toBe(31);
    expect(workDaysInMonth(2026, 3, "custom", -1)).toBe(0);
  });
});

describe("하루·근무시간당 금액(원 미만 버림)", () => {
  it("300만원 · 2026년 2월 · 주 5일 → 하루 150,000 · 8시간 18,750", () => {
    const r = payPerDay({ monthly: 3_000_000, year: 2026, month: 2, pattern: "weekdays" });
    expect(r.days).toBe(20);
    expect(r.perDay).toBe(150_000);
    expect(r.perWorkHour).toBe(18_750);
  });
  it("300만원 · 2026년 2월 · 날짜 전체 → 107,142(107,142.85…)", () => {
    expect(payPerDay({ monthly: 3_000_000, year: 2026, month: 2, pattern: "all" }).perDay).toBe(107_142);
  });
  it("450만원 · 2024년 2월 · 주 6일 → 180,000", () => {
    expect(payPerDay({ monthly: 4_500_000, year: 2024, month: 2, pattern: "noSunday" }).perDay).toBe(180_000);
  });
  it("600만원 · 직접 22일 · 8시간 휴게 1시간 → 272,727 · 실근무 7시간 38,961", () => {
    const r = payPerDay({ monthly: 6_000_000, year: 2026, month: 3, pattern: "custom", customDays: 22, hours: 8, breakHours: 1 });
    expect(r.workHours).toBe(7);
    expect(r.perDay).toBe(272_727);
    expect(r.perWorkHour).toBe(38_961);
  });
  it("0일·0시간·휴게가 근무보다 길면 0(나눗셈 오류 없음)", () => {
    expect(payPerDay({ monthly: 3_000_000, year: 2026, month: 2, pattern: "custom", customDays: 0 }).perDay).toBe(0);
    const r = payPerDay({ monthly: 3_000_000, year: 2026, month: 2, pattern: "weekdays", hours: 4, breakHours: 9 });
    expect(r.workHours).toBe(0);
    expect(r.perWorkHour).toBe(0);
  });
});

describe("실수령액 계산기 화면", () => {
  it("하루·시간 나누기 칸이 빌드에 들어 있다", () => {
    const html = readFileSync("dist/guide/take-home-calculator/index.html", "utf-8");
    for (const id of ["pd-month", "pd-pattern", "pd-days", "pd-hours", "pd-break", "pd-day", "pd-hour"]) expect(html, id).toContain(`id="${id}"`);
    expect(html).toContain("공휴일");
  });
});
