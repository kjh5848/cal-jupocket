/**
 * 손실 원금 복구 프랑스어판(/fr/tools/loss-recovery/) 표기·읽기 — 계산은 lib/loss-recovery.ts 그대로(통화 단위와 무관한 산술).
 *
 * 금액은 센트 정수로 넘긴다(lib/fr/tva.ts parseFixed·eur). 종가 줄은 쉼표를 소수점으로 읽는다 — 한국어판 parseCloses 는
 * 쉼표를 천 단위로 지우므로 프랑스어 '20,5' 가 205 가 되어 쓸 수 없다.
 *
 *   2026-09-01 · 01/09/2026 · 1/9 · 1.9 날짜 뒤에 '; 20,5' · ', 20,5' · 탭 · 공백 중 아무거나, 종가는 '1 234,5' 도 읽는다.
 */
import type { Close } from "../loss-recovery";

const DATE = /(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/.-]\d{1,2}[/.-]\d{4}|\d{1,2}[/.]\d{1,2})/;

/** 줄마다 '날짜 종가' 또는 종가만 → Close[]. 숫자가 아닌 줄(머리줄)은 건너뛴다. 날짜는 쓴 그대로 둔다 */
export function parseClosesFr(text: string): Close[] {
  const out: Close[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.normalize("NFKC").trim();
    if (!line) continue;
    const dm = line.match(DATE);
    const rest = dm ? line.slice(0, dm.index) + " " + line.slice(dm.index! + dm[0].length) : line;
    const fields = rest.replace(/^[\s;,:\t-]+/, "").split(/[;\t]/);
    const last = fields[fields.length - 1].replace(/\s/g, "").replace(/,/g, ".");
    if (!/^\d+(\.\d+)?$/.test(last)) continue;
    const price = Number(last);
    if (!(price > 0)) continue;
    out.push({ date: dm ? dm[0] : null, price });
  }
  return out;
}

/** 숫자 → '42,86' (둘째 자리까지, 끝 0 지움) */
export const numFr = (x: number): string => x.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

/** 퍼센트 → '42,86 %' (줄바꿈 없는 공백) */
export const pctFr = (x: number): string => `${numFr(x)}\u00a0%`;

/** 부호 붙은 퍼센트 → '+42,86 %' · '−30 %' · '0 %' (마이너스는 U+2212) */
export const signedPctFr = (x: number): string => (x > 0 ? `+${pctFr(x)}` : x < 0 ? `−${pctFr(-x)}` : pctFr(0));

/** 부호 붙은 금액(센트) → '−3 000,00 €' · '+2,50 €' */
export const signedEuroFr = (cents: number, eur: (c: number) => string): string =>
  cents < 0 ? `−${eur(-cents)}` : cents > 0 ? `+${eur(cents)}` : eur(0);

/** 회복 기간(개월) → '4 ans et 8 mois' · '5 mois' · 'Plus de 100 ans' · 'Jamais atteint' · 'Déjà au niveau du capital' */
export function monthsFr(m: number | null): string {
  if (m === null) return "Jamais atteint";
  if (m === Infinity) return "Plus de 100 ans";
  if (m === 0) return "Déjà au niveau du capital";
  const y = Math.floor(m / 12);
  const r = m % 12;
  const parts = [y ? `${y} ${y < 2 ? "an" : "ans"}` : "", r ? `${r} mois` : ""].filter(Boolean);
  return parts.join(" et ");
}
