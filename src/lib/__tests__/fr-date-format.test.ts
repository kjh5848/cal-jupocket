import { describe, it, expect } from "vitest";
import { toDay, span, shift } from "../date-calc";
import { labelFr, pluralFr, joursFr, spanTextFr, ddayFr, durationTextFr } from "../fr/date-format";

const d = (iso: string) => toDay(iso)!;

describe("fr date-format", () => {
  it("labelFr — jour de la semaine, jour, mois en lettres, année (UTC)", () => {
    expect(labelFr(d("2026-10-20"))).toBe("mar. 20 octobre 2026");
    expect(labelFr(d("2027-01-01"))).toBe("ven. 1 janvier 2027");
  });

  it("pluriel — 0 et 1 au singulier", () => {
    expect(joursFr(0)).toBe("0 jour");
    expect(joursFr(1)).toBe("1 jour");
    expect(joursFr(2)).toBe("2 jours");
    expect(pluralFr(3, "mois", "mois")).toBe("3 mois");
    expect(joursFr(1234)).toMatch(/^1\s234 jours$/);
  });

  it("spanTextFr", () => {
    expect(spanTextFr({ years: 0, months: 0, restDays: 0 })).toBe("0 jour");
    expect(spanTextFr({ years: 1, months: 2, restDays: 3 })).toBe("1 an, 2 mois et 3 jours");
    expect(spanTextFr({ years: 2, months: 0, restDays: 0 })).toBe("2 ans");
    expect(spanTextFr({ years: 0, months: 1, restDays: 11 })).toBe("1 mois et 11 jours");
  });

  it("ddayFr", () => {
    expect(ddayFr(d("2026-10-20"), d("2026-10-20"))).toBe("aujourd’hui");
    expect(ddayFr(d("2026-11-01"), d("2026-10-20"))).toBe("dans 12 jours");
    expect(ddayFr(d("2026-10-19"), d("2026-10-20"))).toBe("il y a 1 jour");
  });

  it("exemples de la page /fr/tools/date-diff/", () => {
    const s = span(d("2026-10-20"), d("2026-12-31"), false);
    expect(s.days).toBe(72);
    expect(spanTextFr(s)).toBe("2 mois et 11 jours");
    expect(span(d("2026-11-02"), d("2026-11-06"), true).days).toBe(5);
    expect(labelFr(shift(d("2027-01-31"), 1, "month"))).toBe("dim. 28 février 2027");
  });

  it("durationTextFr — compte à rebours", () => {
    expect(durationTextFr(0)).toBe("0 heure, 0 minute et 0 seconde");
    expect(durationTextFr(61)).toBe("0 heure, 1 minute et 1 seconde");
    expect(durationTextFr(2 * 86_400 + 3 * 3600 + 4 * 60 + 5)).toBe("2 jours, 3 heures et 4 minutes");
    expect(durationTextFr(-(86_400 + 3600))).toBe("1 jour, 1 heure et 0 minute");
    expect(durationTextFr(100 * 86_400)).toBe("100 jours, 0 heure et 0 minute");
  });
});
