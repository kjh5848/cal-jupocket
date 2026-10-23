/**
 * TVA française — F24271 (TTC 50 € → 41,67 / 45,45 / 46,08 / 47,39 / 48,97 €, 41,669 → 41,67) et fiches N13445 (taux).
 * Calculs à la main : 50 ÷ 1,2 = 41,666… ; 50 ÷ 1,085 = 46,082… ; 1,00 € × 5,5 % = 0,055 → 0,06 (3e chiffre 5 → supérieur).
 */
import { describe, it, expect } from "vitest";
import { fromHT, fromTTC, parseFixed, eur, eurosInput, pct, METROPOLE, DOM } from "../fr/tva";

describe("taux (rates/fr/tva-2026.json)", () => {
  it("métropole 20 / 10 / 5,5 / 2,1 %", () => {
    expect(METROPOLE).toEqual({ normal: 2000, intermediaire: 1000, reduit: 550, particulier: 210 });
  });
  it("Guadeloupe, Martinique, La Réunion 8,5 / 2,1 / 1,05 %", () => {
    expect(DOM).toEqual({ normal: 850, reduit: 210, particulier: 105 });
  });
});

describe("TTC → HT (F24271)", () => {
  it("tableau TTC 50 € : 41,67 · 45,45 · 46,08 · 47,39 · 48,97 €", () => {
    expect(fromTTC(5000, 2000).ht).toBe(4167);
    expect(fromTTC(5000, 1000).ht).toBe(4545);
    expect(fromTTC(5000, 850).ht).toBe(4608);
    expect(fromTTC(5000, 550).ht).toBe(4739);
    expect(fromTTC(5000, 210).ht).toBe(4897);
  });
  it("TVA = TTC − HT", () => {
    expect(fromTTC(5000, 2000)).toEqual({ ht: 4167, tva: 833, ttc: 5000 });
    expect(fromTTC(12000, 2000)).toEqual({ ht: 10000, tva: 2000, ttc: 12000 });
  });
});

describe("HT → TTC (convention : même arrondi au centime)", () => {
  it("100 € HT → 120 € · 110 € · 105,50 € · 102,10 €", () => {
    expect(fromHT(10000, 2000)).toEqual({ ht: 10000, tva: 2000, ttc: 12000 });
    expect(fromHT(10000, 1000).ttc).toBe(11000);
    expect(fromHT(10000, 550).ttc).toBe(10550);
    expect(fromHT(10000, 210).ttc).toBe(10210);
  });
  it("demi-centime : 1,00 € × 5,5 % = 0,055 → 0,06 € (pas 0,05 comme Math.round(1.055*100))", () => {
    expect(fromHT(100, 550)).toEqual({ ht: 100, tva: 6, ttc: 106 });
  });
  it("0,10 € × 1,05 % = 0,00105 → 0,00 €", () => {
    expect(fromHT(10, 105).tva).toBe(0);
  });
  it("0 → 0", () => {
    expect(fromHT(0, 2000)).toEqual({ ht: 0, tva: 0, ttc: 0 });
    expect(fromTTC(0, 850)).toEqual({ ht: 0, tva: 0, ttc: 0 });
  });
  it("aller-retour HT → TTC → HT à 1 centime près", () => {
    for (let ht = 0; ht <= 5000; ht += 7) {
      for (const r of [2000, 1000, 850, 550, 210, 105]) {
        expect(Math.abs(fromTTC(fromHT(ht, r).ttc, r).ht - ht)).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("saisie et affichage", () => {
  it("virgule ou point, espaces, €", () => {
    expect(parseFixed("41,67")).toBe(4167);
    expect(parseFixed("1 234,5 €")).toBe(123450);
    expect(parseFixed("1 234.56")).toBe(123456);
    expect(parseFixed("41,669")).toBe(4167);
    expect(parseFixed("50")).toBe(5000);
  });
  it("taux saisi : « 5,5 % » → 550, « 1,05 » → 105", () => {
    expect(parseFixed("5,5 %", 10000)).toBe(550);
    expect(parseFixed("1,05", 10000)).toBe(105);
    expect(parseFixed("101", 10000)).toBeNaN();
  });
  it("illisible → NaN", () => {
    expect(parseFixed("")).toBeNaN();
    expect(parseFixed("-5")).toBeNaN();
    expect(parseFixed("1.234,5")).toBeNaN();
    expect(parseFixed("abc")).toBeNaN();
  });
  it("format fr-FR, € après le montant", () => {
    const n = (s: string) => s.replace(/[  ]/g, " ");
    expect(n(eur(4167))).toBe("41,67 €");
    expect(n(eur(123456))).toBe("1 234,56 €");
    expect(n(eurosInput(5000))).toBe("50,00");
    expect(n(pct(550))).toBe("5,5 %");
    expect(n(pct(2000))).toBe("20 %");
  });
});
