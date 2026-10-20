import { describe, it, expect } from "vitest";
import { toDay, span, shift, countdown } from "../date-calc";
import { labelEs, spanTextEs, weekTextEs, ddayEs, daysEs, pluralEs, durationTextEs } from "../es/date-format";

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

  it("durationTextEs — 단수·복수, 하루 미만은 초까지", () => {
    expect(durationTextEs(0)).toBe("0 horas, 0 minutos y 0 segundos");
    expect(durationTextEs(3600 + 60 + 1)).toBe("1 hora, 1 minuto y 1 segundo");
    expect(durationTextEs(86_400 + 2 * 3600 + 5 * 60)).toBe("1 día, 2 horas y 5 minutos");
    expect(durationTextEs(-90)).toBe("0 horas, 1 minuto y 30 segundos");
  });

  it("손계산 디데이 — 21/10/2026 → Navidad 25/12/2026 은 65일, 25일 끝(26일 0시)까지 66일", () => {
    const base = d("2026-10-21");
    const xmas = d("2026-12-25");
    expect(ddayEs(xmas, base)).toBe("dentro de 65 días");
    const c = countdown(xmas, null, base, 0);
    expect(c.countDays).toBe(66);
    expect(durationTextEs(c.seconds)).toBe("66 días, 0 horas y 0 minutos");
    // 기준일 15:00 에 열고 25일 09:00 까지 → 64일 18시간
    expect(durationTextEs(countdown(xmas, 9 * 3600, base, 15 * 3600).seconds)).toBe("64 días, 18 horas y 0 minutos");
  });
});
