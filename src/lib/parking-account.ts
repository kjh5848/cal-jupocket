/**
 * 파킹통장(입출금이 자유로운 예금) 이자 — 매일의 최종잔액에 그날 금리를 붙여 더한다.
 *
 *   일별 이자  금액 구간마다 (그날 최종잔액 중 그 구간에 든 금액 × 구간 연 이율) ÷ 365 의 합
 *              (광주은행 매일이자Wa파킹통장 금리안내 산식, 신한 입출금이 자유로운 예금약관 제2조 ②)
 *   기간       첫날부터 이자 받는 날 전날까지(받는 날은 넣지 않음 — 같은 약관 제2조 ②)
 *   변경       잔액·금리는 바뀐 날부터 새 값(그날 최종잔액이 그날 이자의 기준)
 *   끝수       기간의 일별 이자를 끝까지 더한 뒤 원 미만 버림(우리 해석 — rates 의 rounding)
 *   세금       deposit.ts depositTax — 소득세 14%·지방소득세 그 10%, 각각 10원 미만 버림
 *
 * 금리는 1/1000 % 정수, 잔액은 원 정수로 바꿔 BigInt 로 '잔액 × 금리' 를 날마다 더하고 마지막에
 * 365 × 100,000 으로 한 번 나눈다 — 부동소수 오차 없이 원 미만을 버리려는 것이다.
 * 잔액 전체 적용·366일·매일 버림·여러 번 지급 복리는 넣지 않는다(원문 미확인). rates: parking-account-2026.json
 */
import r from "../rates/parking-account-2026.json";
import { depositTax, type DepositTax } from "./deposit";
import { toDay, fromDay } from "./date-calc";

export const DAY_BASIS = r.dayBasis;
/** 계산할 수 있는 최대 날수(10년) */
export const MAX_DAYS = 3660;

export interface DatedBalance {
  date: string;
  /** 그날 마감 잔액(원) — 입금액이 아니라 거래가 끝난 뒤 남은 돈 */
  balance: number;
}

export interface DatedRates {
  date: string;
  /** 구간별 연 이율(%) — 구간 수와 같은 길이 */
  rates: number[];
}

export interface ParkingInput {
  /** 첫날(이자가 붙기 시작하는 날, 'YYYY-MM-DD') */
  start: string;
  /** 이자 받는 날 — 이 전날까지 셈한다 */
  payDay: string;
  /** 첫날 마감 잔액(원) */
  opening: number;
  /** 구간 상한(원, 오름차순). 구간 수 − 1 개 — 마지막 구간은 한도 없음 */
  caps: number[];
  /** 처음 구간별 연 이율(%) */
  rates: number[];
  balances?: DatedBalance[];
  rateChanges?: DatedRates[];
  tax: DepositTax;
}

export interface ParkingMonth {
  /** 'YYYY-MM' */
  month: string;
  days: number;
  /** 그 달 일말 잔액 평균(원, 소수) */
  avgBalance: number;
  /** 그 달 세전 이자(원, 소수 — 표시는 화면에서) */
  interest: number;
}

export interface ParkingTier {
  /** 구간 아래 끝(포함 안 함)·위 끝(포함, null = 한도 없음) */
  from: number;
  to: number | null;
  /** 이 구간에서 붙은 세전 이자(원, 소수) */
  interest: number;
}

export type ParkingError = "date" | "order" | "long" | "tiers";

export interface ParkingResult {
  error?: ParkingError;
  days: number;
  /** 마지막으로 이자를 센 날 = 받는 날 전날 */
  lastDay: string;
  avgBalance: number;
  /** 세전 이자 — 합산 뒤 원 미만 버림 */
  grossInterest: number;
  /** 버리기 전 세전 이자(원, 소수) */
  exactInterest: number;
  incomeTax: number;
  localTax: number;
  tax: number;
  netInterest: number;
  /** 세전 이자를 평균 잔액의 연 이율로 — 이자 ÷ 평균 잔액 × 365 ÷ 날수 */
  effectiveRate: number;
  months: ParkingMonth[];
  tiers: ParkingTier[];
  /** 기간 밖이라 쓰지 않은 변경 건수 */
  ignored: number;
}

/** 연 이율(%)을 1/1000 % 정수로 — 2.5 × 1000 같은 부동소수 오차를 피한다 */
const milli = (pct: number) => BigInt(Math.round(Math.max(0, pct) * 1000));
const DIV = BigInt(DAY_BASIS) * 100_000n;
const asWon = (v: bigint) => Number(v) / Number(DIV);

/** 잔액을 구간별 금액으로 나눈다(상한은 그 구간에 포함 — 100만원 상한이면 정확히 100만원은 첫 구간) */
export function splitTiers(balance: number, caps: number[]): number[] {
  const out: number[] = [];
  let lower = 0;
  for (const cap of caps) {
    out.push(Math.max(0, Math.min(balance, cap) - lower));
    lower = cap;
  }
  out.push(Math.max(0, balance - lower));
  return out;
}

function empty(error: ParkingError | undefined, days = 0): ParkingResult {
  return { error, days, lastDay: "", avgBalance: 0, grossInterest: 0, exactInterest: 0, incomeTax: 0, localTax: 0, tax: 0, netInterest: 0, effectiveRate: 0, months: [], tiers: [], ignored: 0 };
}

export function parkingInterest(input: ParkingInput): ParkingResult {
  const s = toDay(input.start);
  const p = toDay(input.payDay);
  if (s === null || p === null) return empty("date");
  if (p <= s) return empty("order");
  const days = p - s;
  if (days > MAX_DAYS) return empty("long", days);

  const caps = input.caps.map((c) => Math.max(0, Math.floor(c)));
  const tierCount = caps.length + 1;
  if (input.rates.length !== tierCount || caps.some((c, i) => i > 0 && c <= caps[i - 1])) return empty("tiers");

  let ignored = 0;
  // 날짜별 변경을 일련번호로. 같은 날 여러 건이면 나중 것이 이긴다. 첫날 이전 변경은 첫날 값으로 접는다.
  const balAt = new Map<number, number>();
  let opening = Math.max(0, Math.floor(input.opening));
  const balList = (input.balances ?? [])
    .map((b) => ({ d: toDay(b.date), v: Math.max(0, Math.floor(b.balance)) }))
    .filter((b) => {
      if (b.d === null || b.d >= p) return ignored++, false;
      return true;
    }) as { d: number; v: number }[];
  for (const b of balList.sort((a, b2) => a.d - b2.d)) {
    if (b.d <= s) opening = b.v;
    else balAt.set(b.d, b.v);
  }

  const rateAt = new Map<number, bigint[]>();
  let rates = input.rates.map(milli);
  const rateList = (input.rateChanges ?? [])
    .map((c) => ({ d: toDay(c.date), v: c.rates }))
    .filter((c) => {
      if (c.d === null || c.d >= p || c.v.length !== tierCount) return ignored++, false;
      return true;
    }) as { d: number; v: number[] }[];
  for (const c of rateList.sort((a, b2) => a.d - b2.d)) {
    if (c.d <= s) rates = c.v.map(milli);
    else rateAt.set(c.d, c.v.map(milli));
  }

  let balance = opening;
  let total = 0n;
  let balSum = 0;
  const tierUnits = Array.from({ length: tierCount }, () => 0n);
  const months: { month: string; days: number; bal: number; units: bigint }[] = [];

  for (let d = s; d < p; d++) {
    if (balAt.has(d)) balance = balAt.get(d)!;
    if (rateAt.has(d)) rates = rateAt.get(d)!;
    const parts = splitTiers(balance, caps);
    let day = 0n;
    parts.forEach((amt, i) => {
      const u = BigInt(amt) * rates[i];
      tierUnits[i] += u;
      day += u;
    });
    total += day;
    balSum += balance;
    const ym = fromDay(d).slice(0, 7);
    const last = months[months.length - 1];
    if (last && last.month === ym) {
      last.days++;
      last.bal += balance;
      last.units += day;
    } else months.push({ month: ym, days: 1, bal: balance, units: day });
  }

  const grossInterest = Number(total / DIV);
  const { incomeTax, localTax } = depositTax(grossInterest, input.tax);
  const tax = incomeTax + localTax;
  const avgBalance = balSum / days;
  let lower = 0;
  const tiers = tierUnits.map((u, i) => {
    const t = { from: lower, to: i < caps.length ? caps[i] : null, interest: asWon(u) };
    if (i < caps.length) lower = caps[i];
    return t;
  });

  return {
    days,
    lastDay: fromDay(p - 1),
    avgBalance,
    grossInterest,
    exactInterest: asWon(total),
    incomeTax,
    localTax,
    tax,
    netInterest: grossInterest - tax,
    effectiveRate: avgBalance > 0 ? (asWon(total) / avgBalance) * (DAY_BASIS / days) * 100 : 0,
    months: months.map((m) => ({ month: m.month, days: m.days, avgBalance: m.bal / m.days, interest: asWon(m.units) })),
    tiers,
    ignored,
  };
}
