import { describe, it, expect } from "vitest";
import { toDay, span, shift } from "../date-calc";
import { labelEs, spanTextEs, weekTextEs, ddayEs, daysEs, pluralEs } from "../es/date-format";

const d = (iso: string) => toDay(iso)!;

describe("스페인판 날짜 표기", () => {
  it("labelEs — 요일, 일 de 월 de 연", () => {
    expect(labelEs(d("2026-10-20"))).toBe("martes, 20 de octubre de 2026");
    expect(labelEs(d("2027-01-01"))).toBe("viernes, 1 de enero de 2027");
    expect(labelEs(d("2028-02-29"))).toBe("martes, 29 de febrero de 2028");
  });

  it("단수·복수 — mes/meses, día/días, 다섯 자리부터 공백", () => {
    expect(pluralEs(1, "mes", "meses")).toBe("1 mes");
    expect(pluralEs(2, "mes", "meses")).toBe("2 meses");
    expect(daysEs(0)).toBe("0 días");
    expect(daysEs(1)).toBe("1 día");
    expect(daysEs(1234)).toBe("1234 días");
    expect(daysEs(36500)).toBe("36 500 días");
  });

  it("spanTextEs — 0 칸 빼고 마지막은 y 로 잇는다", () => {
    expect(spanTextEs({ years: 1, months: 2, restDays: 3 })).toBe("1 año, 2 meses y 3 días");
    expect(spanTextEs({ years: 0, months: 1, restDays: 0 })).toBe("1 mes");
    expect(spanTextEs({ years: 2, months: 0, restDays: 1 })).toBe("2 años y 1 día");
    expect(spanTextEs({ years: 0, months: 0, restDays: 0 })).toBe("0 días");
  });

  it("손계산 — 20/10/2026 ~ 31/12/2026 은 72일, 2개월 11일, 10주 2일", () => {
    const s = span(d("2026-10-20"), d("2026-12-31"), false);
    expect(s.days).toBe(72);
    expect(spanTextEs(s)).toBe("2 meses y 11 días");
    expect(weekTextEs(s)).toBe("10 semanas y 2 días");
  });

  it("31 de enero + 1 mes → 28 de febrero (말일로 맞춤)", () => {
    expect(labelEs(shift(d("2027-01-31"), 1, "month"))).toBe("domingo, 28 de febrero de 2027");
  });

  it("ddayEs", () => {
    expect(ddayEs(10, 10)).toBe("hoy");
    expect(ddayEs(22, 10)).toBe("dentro de 12 días");
    expect(ddayEs(9, 10)).toBe("hace 1 día");
  });
});
