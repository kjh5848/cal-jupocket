/**
 * 부채 상환 계획 프랑스어판(/fr/tools/debt-payoff/) 표기·읽기 — 계산은 lib/debt-payoff.ts payoffPlan() 그대로.
 *
 * 한국어판은 원 단위 정수로 계산한다(이자 원 미만 버림). 유로는 센트가 있어 프랑스어판은 **센트 정수**로 넘긴다 —
 * 잔액·최소 상환액·추가 상환액을 센트로 바꿔 payoffPlan 에 넣고, 나온 금액은 센트를 유로로 적는다.
 * 그래서 월 이자는 센트 미만 버림(공유 lib 의 '단위 미만 버림'이 센트에 걸린다).
 *
 *   1 234,56 € · novembre 2027 · 2 ans et 3 mois · 1 an · 0 mois
 *
 * 금액 읽기·쓰기는 lib/fr/tva.ts 의 parseFixed·eur 를 그대로 쓴다 — '1 234,56 €'(Intl fr-FR, € 뒤) 표기 근거는
 * service-public 공식 시뮬레이터 설정(decimalPoint ',' · groupingSeparator ' ' · symbolPosition 'after', docs/countries/fr.md 2026-10-23 TVA 행).
 */
import { eur, parseFixed } from "./tva";

/** 입력칸 유로 → 센트 정수. '1 500,50' · '1500' · '1500.5' · '50 €' → 150050 · 150000 · 150050 · 5000. 못 읽으면 0 */
export function centsFr(raw: string): number {
  const c = parseFixed(raw);
  return Number.isFinite(c) && c > 0 ? c : 0;
}

/** 센트 정수 → '1 234,56 €' (센트가 0이어도 ',00' — 같은 표 안에서 자릿수를 맞춘다) */
export const euroCentFr = (cents: number): string => eur(Math.round(cents));

/** 입력칸에 미리 넣을 정수 유로 — 센트 → '2 400' (centsFr 가 다시 읽는 꼴) */
export function inputEuroFr(cents: number): string {
  return Math.round(cents / 100).toLocaleString("fr-FR");
}

/** 몇 번째 달 → 'novembre 2027'. 1번째 달이 시작 연월 */
export function monthLabelFr(startYear: number, startMonth: number, month: number): string {
  const t = startYear * 12 + (startMonth - 1) + (month - 1);
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(Math.floor(t / 12), t % 12, 1)),
  );
}

/** 개월 → '2 ans et 3 mois' · '1 an' · '5 mois' · '0 mois' (an 은 0·1 단수, mois 는 단복수 같음) */
export function spellMonthsFr(months: number): string {
  const y = Math.floor(months / 12);
  const r = months % 12;
  const parts = [y ? `${y} ${y < 2 ? "an" : "ans"}` : "", r ? `${r} mois` : ""].filter(Boolean);
  return parts.join(" et ") || "0 mois";
}
