import { describe, it, expect } from "vitest";
import { vatFinalDeadline, shiftToBusinessDay, iso, koDate } from "../tax-deadline";

describe("부가세 확정신고 기한", () => {
  it("2026년 제2기(7~12월) → 2027년 1월 25일(월)", () => {
    expect(iso(vatFinalDeadline(2026, 12))).toBe("2027-01-25");
    expect(koDate(vatFinalDeadline(2026, 12))).toBe("2027년 1월 25일(월)");
  });
  it("2026년 제1기 → 7월 25일이 토요일이라 7월 27일(월)", () => {
    expect(iso(vatFinalDeadline(2026, 6))).toBe("2026-07-27");
  });
  it("2027년 제1기 → 7월 25일이 일요일이라 7월 26일(월)", () => {
    expect(iso(vatFinalDeadline(2027, 6))).toBe("2027-07-26");
  });
  it("폐업이 3월이면 4월 25일", () => {
    expect(iso(vatFinalDeadline(2027, 3))).toBe("2027-04-26"); // 2027-04-25 는 일요일
  });
  it("공휴일을 넘기면 그것도 건너뛴다", () => {
    expect(iso(shiftToBusinessDay(new Date(Date.UTC(2027, 0, 25)), ["2027-01-25"]))).toBe("2027-01-26");
  });
});
