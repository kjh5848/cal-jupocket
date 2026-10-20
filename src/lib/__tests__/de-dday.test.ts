import { describe, it, expect } from "vitest";
import { toDay, countdown } from "../date-calc";
import { ddayDe, durationTextDe, labelDe } from "../de/date-format";

const d = (iso: string) => toDay(iso)!;

describe("디데이 독일어판", () => {
  it("noch · Heute · vor", () => {
    const base = d("2026-10-21");
    expect(ddayDe(countdown(d("2026-12-24"), null, base, 0))).toBe("noch 64 Tage");
    expect(ddayDe(countdown(base + 1, null, base, 0))).toBe("noch 1 Tag");
    expect(ddayDe(countdown(base, null, base, 0))).toBe("Heute");
    expect(ddayDe(countdown(base - 1, null, base, 0))).toBe("vor 1 Tag");
    expect(ddayDe(countdown(d("2026-09-01"), null, base, 0))).toBe("vor 50 Tagen");
  });

  it("Tag 1 zählen — 남은 날 + 1", () => {
    const c = countdown(d("2026-12-31"), null, d("2026-10-21"), 0);
    expect(c.days).toBe(71);
    expect(c.countDays).toBe(72);
    expect(labelDe(d("2026-12-31"))).toBe("Donnerstag, 31. Dezember 2026");
  });

  it("남은 시간 풀어쓰기", () => {
    expect(durationTextDe(65 * 86_400 + 3 * 3600 + 12 * 60)).toBe("65 Tage, 3 Stunden und 12 Minuten");
    expect(durationTextDe(86_400 + 3600 + 60)).toBe("1 Tag, 1 Stunde und 1 Minute");
    expect(durationTextDe(3 * 3600 + 12 * 60 + 5)).toBe("3 Stunden, 12 Minuten und 5 Sekunden");
    expect(durationTextDe(-59)).toBe("0 Stunden, 0 Minuten und 59 Sekunden");
  });

  it("시각을 넣으면 그 시각까지 — 15 Uhr 에 열고 24.12. 9 Uhr", () => {
    const c = countdown(d("2026-12-24"), 9 * 3600, d("2026-10-21"), 15 * 3600);
    expect(durationTextDe(c.seconds)).toBe("63 Tage, 18 Stunden und 0 Minuten");
  });
});
