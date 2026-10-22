/**
 * 부채 상환 계획 스페인판(/es/tools/debt-payoff/) 표기·읽기 — 계산은 lib/debt-payoff.ts payoffPlan() 그대로.
 *
 * 한국어판은 원 단위 정수로 계산한다(이자 원 미만 버림). 유로는 센트가 있어 스페인판은 **센트 정수**로 넘긴다 —
 * 잔액·최소 상환액·추가 상환액을 센트로 바꿔 payoffPlan 에 넣고, 나온 금액은 센트를 유로로 적는다.
 * 그래서 월 이자는 센트 미만 버림(공유 lib 의 '단위 미만 버림'이 센트에 걸린다). lib/es/money.ts euroEs 는 정수 유로라 안 쓴다.
 *
 *   1234,56 euros · 12 345,67 euros · noviembre de 2027 · 2 años y 3 meses · 1 mes
 *
 * 숫자 꼴은 lib/es/number.ts 와 같은 규칙(RD 2032/2009 Anexo III 2.8·2.9 — 쉼표 소수점, 다섯 자리 이상만 세 자리마다 공백,
 * https://www.boe.es/buscar/act.php?id=BOE-A-2010-927). € 기호 위치는 허용 출처로 확인하지 않아 'euros' 라는 말을 붙인다.
 * 달 이름은 lib/es/date-format.ts MONTHS_ES.
 */
import { MONTHS_ES, pluralEs } from "./date-format";
import { parseNumberEs } from "./number";

/** 입력칸 유로 → 센트 정수. '1.500,50' · '1500' · '15 000' → 150050 · 150000 · 1500000. 못 읽으면 0, 0 이하도 0 */
export function centsEs(raw: string): number {
  const x = parseNumberEs(raw);
  if (!Number.isFinite(x) || x <= 0) return 0;
  return Math.round(x * 100);
}

/** 정수 유로 부분 — 다섯 자리 이상이면 세 자리마다 줄바꿈 없는 공백(formatNumberEs 와 같은 규칙) */
function intEs(n: number): string {
  const s = String(n);
  return s.length > 4 ? s.replace(/\B(?=(\d{3})+$)/g, " ") : s;
}

/** 센트 정수 → '1234,56 euros' (센트가 0이어도 ',00' 을 붙인다 — 같은 표 안에서 자릿수를 맞춘다) */
export function euroCentEs(cents: number): string {
  const c = Math.round(cents);
  const abs = Math.abs(c);
  const s = `${intEs(Math.floor(abs / 100))},${String(abs % 100).padStart(2, "0")} euros`;
  return c < 0 ? `-${s}` : s;
}

/** 입력칸에 미리 넣을 정수 유로 — 센트 → '2400' · '15 000' (centsEs 가 다시 읽는 꼴) */
export function inputEuroEs(cents: number): string {
  return intEs(Math.round(cents / 100));
}

/** 몇 번째 달 → 'noviembre de 2027'. 1번째 달이 시작 연월 */
export function monthLabelEs(startYear: number, startMonth: number, month: number): string {
  const t = startYear * 12 + (startMonth - 1) + (month - 1);
  return `${MONTHS_ES[t % 12]} de ${Math.floor(t / 12)}`;
}

/** 개월 → '2 años y 3 meses' · '1 año' · '5 meses' · '0 meses' */
export function spellMonthsEs(months: number): string {
  const y = Math.floor(months / 12);
  const r = months % 12;
  const parts = [y ? pluralEs(y, "año", "años") : "", r ? pluralEs(r, "mes", "meses") : ""].filter(Boolean);
  return parts.join(" y ") || "0 meses";
}
