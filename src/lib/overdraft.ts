/**
 * 마이너스통장 이자 — 사용 금액을 시작일부터 N일 쓴다고 보고, 결제일마다 나눠 청구되는 일할 이자.
 *
 *   하루 이자   사용 금액 × 연 이자율 ÷ 그날이 속한 해의 날수(평년 365 · 윤년 366)
 *   날수        시작일 포함·끝날 제외 — 시작일부터 N일
 *   회차        결제일(매월 1~28일 또는 말일) 하루 전날까지의 이자가 그 결제일에 청구된다.
 *               시작일 다음에 오는 첫 결제일이 1회차, 마지막 회차는 사용이 끝나는 날
 *
 * 근거: 은행 여신거래약정서 '이자 계산방법' — 1년을 365일(윤년은 366일)로 보고 1일 단위로 계산(rates: overdraft-2026.json).
 * 단수: 법령에 대출 이자 원 단위 처리 규정이 없다. 회차 이자를 원 미만 버림하고 총 이자는 회차 합 —
 * 해를 넘는 회차는 해마다 날수를 나눠 더한 뒤 한 번만 버린다.
 * 일자별 잔액 변동·미납 이자 원금 산입·연체는 넣지 않는다.
 */

export type PayDay = number | "last";

export interface OverdraftInput {
  /** 사용 금액(원) — 기간 내내 이만큼 쓴다고 본다 */
  amount: number;
  /** 연 이자율(%) — 6.5 는 연 6.5% */
  ratePct: number;
  /** 사용일수(일) */
  days: number;
  /** 사용 시작일 YYYY-MM-DD */
  start: string;
  /** 이자 결제일 — 1~28 또는 "last"(말일) */
  payDay: PayDay;
}

export interface OverdraftRow {
  no: number;
  /** 청구일(마지막 회차는 사용이 끝나는 날) YYYY-MM-DD */
  billDate: string;
  /** 이 회차의 첫날 YYYY-MM-DD */
  from: string;
  /** 이 회차 날수 */
  days: number;
  /** 그중 윤년(366일) 해의 날수 */
  leapDays: number;
  interest: number;
  cumulative: number;
}

export interface OverdraftResult {
  rows: OverdraftRow[];
  totalInterest: number;
  /** 평년 기준 하루 이자(원 미만 버림) */
  dailyInterest: number;
  /** 하루 평균 이자 = 총 이자 ÷ 사용일수(원 미만 버림) */
  dailyAverage: number;
  /** 마지막으로 이자가 붙는 날 YYYY-MM-DD */
  lastDay: string;
  /** 사용이 끝나는 날(마지막 회차 청구일) YYYY-MM-DD */
  endDate: string;
}

const fl = (v: number) => Math.floor(v + 1e-6);
const DAY = 86_400_000;

export const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export const yearDays = (y: number) => (isLeap(y) ? 366 : 365);

/** YYYY-MM-DD → UTC 자정 시각(ms). 잘못된 값이면 NaN */
export function parseDate(s: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return NaN;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return new Date(t).getUTCDate() === +m[3] ? t : NaN;
}

export function fmtDate(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

/** 그 달의 결제일(UTC ms) */
function billIn(y: number, mo: number, payDay: PayDay): number {
  const last = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
  return Date.UTC(y, mo, payDay === "last" ? last : Math.min(payDay, last));
}

/** t 보다 뒤에 오는 첫 결제일 */
export function nextBill(t: number, payDay: PayDay): number {
  const d = new Date(t);
  const here = billIn(d.getUTCFullYear(), d.getUTCMonth(), payDay);
  return here > t ? here : billIn(d.getUTCFullYear(), d.getUTCMonth() + 1, payDay);
}

/** [from, to) 날수를 평년·윤년으로 나눈다 */
export function splitDays(from: number, to: number): { common: number; leap: number } {
  let common = 0;
  let leap = 0;
  let t = from;
  while (t < to) {
    const y = new Date(t).getUTCFullYear();
    const yEnd = Date.UTC(y + 1, 0, 1);
    const n = Math.round((Math.min(to, yEnd) - t) / DAY);
    if (isLeap(y)) leap += n;
    else common += n;
    t = Math.min(to, yEnd);
  }
  return { common, leap };
}

/** [from, to) 동안의 이자(원 미만 버림 전) */
export function rawInterest(amount: number, ratePct: number, from: number, to: number): number {
  const { common, leap } = splitDays(from, to);
  return ((amount * ratePct) / 100) * (common / 365 + leap / 366);
}

export function overdraftInterest(inp: OverdraftInput): OverdraftResult {
  const amount = Math.max(0, fl(inp.amount));
  const rate = Math.max(0, inp.ratePct);
  const days = Math.max(1, Math.floor(inp.days));
  const start = parseDate(inp.start);
  if (Number.isNaN(start)) throw new Error(`시작일 형식이 잘못됐다: ${inp.start}`);
  const end = start + days * DAY;

  const rows: OverdraftRow[] = [];
  let cum = 0;
  let from = start;
  for (let no = 1; from < end; no++) {
    const to = Math.min(nextBill(from, inp.payDay), end);
    const { leap } = splitDays(from, to);
    const interest = fl(rawInterest(amount, rate, from, to));
    cum += interest;
    rows.push({ no, billDate: fmtDate(to), from: fmtDate(from), days: Math.round((to - from) / DAY), leapDays: leap, interest, cumulative: cum });
    from = to;
  }

  return {
    rows,
    totalInterest: cum,
    dailyInterest: fl((amount * rate) / 100 / 365),
    dailyAverage: fl(cum / days),
    lastDay: fmtDate(end - DAY),
    endDate: fmtDate(end),
  };
}
