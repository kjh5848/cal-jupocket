/**
 * TVA française — prix HT ↔ TTC. Page /fr/tva/ (basis "law").
 *
 * Source (rates/fr/tva-2026.json, vérifié 2026-10-23) :
 * - F24271 (service-public, Vérifié le 04 mai 2026) — Prix HT = Prix TTC ÷ (1 + taux), prix HT arrondi au centime :
 *   3e chiffre ≥ 5 → centime supérieur, < 5 → centime inférieur (41,669 € → 41,67 €). Tableau TTC 50 € → 41,67 / 45,45 / 46,08 / 47,39 / 48,97 €.
 * - Fiches « Taux applicables » (N13445) — métropole 20 / 10 / 5,5 / 2,1 %, Guadeloupe·Martinique·La Réunion 8,5 / 2,1 / 1,05 %.
 * Convention de l'outil (dite sur la page) : depuis un HT, la TVA est arrondie au centime de la même façon et TTC = HT + TVA.
 *
 * Tout en centimes entiers et en centièmes de pour cent (20 % = 2000, 5,5 % = 550, 1,05 % = 105) —
 * jamais 1.055 × 100 en virgule flottante (105,4999…).
 */
import rates from "../../rates/fr/tva-2026.json";

/** taux en centièmes de pour cent */
const h = (x: number) => Math.round(x * 10000);

export const METROPOLE = {
  normal: h(rates.rates.metropole.normal),
  intermediaire: h(rates.rates.metropole.intermediaire),
  reduit: h(rates.rates.metropole.reduit),
  particulier: h(rates.rates.metropole.particulier),
};
export const DOM = {
  normal: h(rates.rates.guadeloupeMartiniqueReunion.normal),
  reduit: h(rates.rates.guadeloupeMartiniqueReunion.reduit),
  particulier: h(rates.rates.guadeloupeMartiniqueReunion.particulier),
};

/** plus grand montant accepté : 1 milliard d'euros (centimes × 10 000 reste un entier sûr) */
export const MAX_CENTS = 100_000_000_000;

/** num/den (entiers ≥ 0) arrondi au centime : reste ≥ 1/2 → supérieur (règle F24271) */
function roundHalfUp(num: number, den: number): number {
  const q = Math.floor(num / den);
  const r = num - q * den;
  return 2 * r >= den ? q + 1 : q;
}

export interface TvaSplit {
  /** hors taxes (centimes) */
  ht: number;
  /** TVA (centimes) */
  tva: number;
  /** toutes taxes comprises (centimes) */
  ttc: number;
}

/** HT (centimes) → TVA arrondie au centime, TTC = HT + TVA */
export function fromHT(ht: number, rate: number): TvaSplit {
  const tva = roundHalfUp(ht * rate, 10000);
  return { ht, tva, ttc: ht + tva };
}

/** TTC (centimes) → HT = TTC ÷ (1 + taux) arrondi au centime (F24271), TVA = TTC − HT */
export function fromTTC(ttc: number, rate: number): TvaSplit {
  const ht = roundHalfUp(ttc * 10000, 10000 + rate);
  return { ht, tva: ttc - ht, ttc };
}

/**
 * Lit « 1 234,56 », « 1234.5 », « 50 € » → nombre entier d'unités à `digits` décimales
 * (2 pour des centimes, 2 aussi pour un taux en centièmes de pour cent). Décimale suivante ≥ 5 → arrondi supérieur.
 * Virgule ou point comme séparateur décimal, espaces ignorées. Illisible, négatif ou trop grand → NaN.
 */
export function parseFixed(raw: string, max = MAX_CENTS): number {
  const s = raw.normalize("NFKC").replace(/[\s€%]/g, "").replace(/,/g, ".");
  const m = /^(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m || (m[1] === "" && (m[2] ?? "") === "")) return NaN;
  const whole = m[1] === "" ? 0 : parseInt(m[1], 10);
  const frac = (m[2] ?? "").padEnd(3, "0");
  let n = whole * 100 + parseInt(frac.slice(0, 2), 10);
  if (parseInt(frac[2], 10) >= 5) n += 1;
  return Number.isSafeInteger(n) && n <= max ? n : NaN;
}

/** centimes → « 1 234,56 € » (format fr-FR, symbole après le montant) */
export function eur(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** centimes → « 1 234,56 » (champ de saisie) */
export function eurosInput(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** taux en centièmes de pour cent → « 5,5 % » */
export function pct(rate: number): string {
  return `${(rate / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}
