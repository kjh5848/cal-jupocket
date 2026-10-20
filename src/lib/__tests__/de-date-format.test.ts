import { describe, it, expect } from "vitest";
import { toDay, span, shift } from "../date-calc";
import { labelDe, shortDe, spanTextDe, weeksTextDe, relDe, countDe, intDe } from "../de/date-format";

const d = (iso: string) => toDay(iso)!;

describe("독일어 날짜 표기", () => {
  it("긴 꼴·숫자 꼴", () => {
    expect(labelDe(d("2026-10-20"))).toBe("Dienstag, 20. Oktober 2026");
    expect(labelDe(d("2002-01-02"))).toBe("Mittwoch, 2. Januar 2002");
    expect(labelDe(d("2026-03-01"))).toBe("Sonntag, 1. März 2026");
    expect(shortDe(d("1896-08-18"))).toBe("18.08.1896");
  });

  it("단수·복수와 천 단위", () => {
    expect(countDe(1, "day")).toBe("1 Tag");
    expect(countDe(2, "month")).toBe("2 Monate");
    expect(countDe(1, "year")).toBe("1 Jahr");
    expect(intDe(12348)).toBe("12 348");
    expect(intDe(999)).toBe("999");
  });

  it("기간 풀어쓰기", () => {
    expect(spanTextDe({ years: 1, months: 2, restDays: 3 })).toBe("1 Jahr, 2 Monate und 3 Tage");
    expect(spanTextDe({ years: 0, months: 2, restDays: 11 })).toBe("2 Monate und 11 Tage");
    expect(spanTextDe({ years: 0, months: 0, restDays: 0 })).toBe("0 Tage");
    expect(weeksTextDe(10, 2)).toBe("10 Wochen und 2 Tage");
    expect(weeksTextDe(4, 0)).toBe("4 Wochen");
    expect(weeksTextDe(0, 1)).toBe("1 Tag");
  });

  it("오늘 기준", () => {
    const t = d("2026-10-21");
    expect(relDe(t, t)).toBe("heute");
    expect(relDe(t + 1, t)).toBe("in 1 Tag");
    expect(relDe(t + 30, t)).toBe("in 30 Tagen");
    expect(relDe(t - 3, t)).toBe("vor 3 Tagen");
  });

  it("§ 188 Abs. 3 BGB 처럼 없는 날은 그 달 말일 — 계산은 date-calc 그대로", () => {
    expect(labelDe(shift(d("2027-01-31"), 1, "month"))).toBe("Sonntag, 28. Februar 2027");
    const s = span(d("2026-10-20"), d("2026-12-31"), false);
    expect(s.days).toBe(72);
    expect(spanTextDe(s)).toBe("2 Monate und 11 Tage");
  });
});
