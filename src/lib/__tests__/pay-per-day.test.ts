/**
 * 실수령액 ÷ 하루·시간 — 달력 날짜 수는 직접 센 값으로 고정한다(2026-02-01 일요일, 2024-02-01 목요일, 2026-03-01 일요일).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { daysInMonth, workDaysInMonth, payPerDay, workTimeFor } from "../pay-per-day";

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

describe("물건 가격 → 필요한 근무시간(분 미만 버림)", () => {
  // 300만원 · 2026년 2월 주 5일(20일) · 8시간 → 160시간, 시간당 18,750원
  it("10만원 → 5시간 20분 · 근무일 0.6일", () => {
    expect(workTimeFor(100_000, 3_000_000, 20, 8)).toEqual({ minutes: 320, hours: 5, mins: 20, workDays: 0.6 });
  });
  it("5천원 → 16분", () => {
    expect(workTimeFor(5_000, 3_000_000, 20, 8)).toMatchObject({ hours: 0, mins: 16 });
  });
  it("100만원 → 53시간 20분 · 6.6일", () => {
    expect(workTimeFor(1_000_000, 3_000_000, 20, 8)).toEqual({ minutes: 3200, hours: 53, mins: 20, workDays: 6.6 });
  });
  it("버리기 전 시급으로 나눈다 — 600만원 22일 7시간(38,961.03…원) · 100만원 → 25시간 40분", () => {
    // 1,000,000 × 22 × 7 × 60 ÷ 6,000,000 = 1540분
    expect(workTimeFor(1_000_000, 6_000_000, 22, 7)).toMatchObject({ minutes: 1540, hours: 25, mins: 40 });
  });
  it("월 금액·날·시간·가격이 0이면 0", () => {
    expect(workTimeFor(100_000, 0, 20, 8).minutes).toBe(0);
    expect(workTimeFor(100_000, 3_000_000, 0, 8).minutes).toBe(0);
    expect(workTimeFor(100_000, 3_000_000, 20, 0).minutes).toBe(0);
    expect(workTimeFor(0, 3_000_000, 20, 8).minutes).toBe(0);
  });
});

describe("실수령액 계산기 화면", () => {
  it("하루·시간 나누기 칸이 빌드에 들어 있다", () => {
    const html = readFileSync("dist/guide/take-home-calculator/index.html", "utf-8");
    for (const id of ["pd-month", "pd-pattern", "pd-days", "pd-hours", "pd-break", "pd-day", "pd-hour", "pd-price", "pd-need"]) expect(html, id).toContain(`id="${id}"`);
    expect(html).toContain("공휴일");
  });
});
