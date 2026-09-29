/**
 * 취득세 — 집이나 땅을 살 때 한 번 내는 세금.
 *
 * 재산세·자동차세와 성격이 다르다. 해마다 오는 것이 아니라 **취득할 때
 * 한 번** 내고, 고지서가 오지 않는다 — **내가 신고해서 낸다.** 기한을
 * 놓치면 가산세가 붙는다.
 *
 * 계산에서 가장 헷갈리는 자리가 주택 유상거래의 6억~9억 구간이다.
 * 여기는 세율표가 아니라 **계산식**이라 금액마다 세율이 다르다.
 *
 *   6억 이하        1%
 *   6억 ~ 9억       (취득가액 × 2 ÷ 3억 − 3) ÷ 100     제11조 ①8 나목
 *   9억 초과        3%
 *
 * 두 끝이 맞물린다 — 6억을 넣으면 1%, 9억을 넣으면 3% 가 나온다. 그래서
 * "6억 1원이면 세율이 갑자기 뛴다" 는 일이 없다. 2020년 이전에는 구간이
 * 계단이라 실제로 그런 일이 있었는데 지금은 아니다.
 *
 * 숫자는 `src/rates/local-tax-2026.json` 에서만 온다.
 */
import rates from "../rates/local-tax-2026.json";

const A = rates.acquisitionTax;

export type Cause =
  | "housePaid" // 유상거래로 주택을 산다
  | "paidOther" // 그 밖의 유상취득 (상가·토지 등)
  | "paidFarm" // 농지 유상취득
  | "gift" // 증여 등 무상취득
  | "inheritanceOther" // 상속 (농지 외)
  | "inheritanceFarm" // 상속 (농지)
  | "original"; // 원시취득 (신축)

/**
 * 주택 유상거래의 세율. 6억~9억은 계산식이다.
 *
 * 조문이 "소수점 이하 다섯째자리에서 반올림하여 소수점 넷째자리까지"
 * 라고 못박았다. 그 반올림을 빼면 금액이 몇 천원씩 어긋난다.
 */
export function housePaidRate(price: number): number {
  if (price <= A.housePaid.under.upTo) return A.housePaid.under.rate;
  if (price > A.housePaid.over.from) return A.housePaid.over.rate;
  const raw = (price * 2) / 300_000_000 - 3;
  const rate = raw / 100;
  const f = 10 ** A.housePaid.middleRound;
  return Math.round(rate * f) / f;
}

/** 원인별 표준세율. 주택 유상거래만 금액에 따라 달라진다. */
export function rateFor(cause: Cause, price: number): number {
  if (cause === "housePaid") return housePaidRate(price);
  const s = A.standard;
  const map: Record<Exclude<Cause, "housePaid">, number> = {
    paidOther: s.paidOther,
    paidFarm: s.paidFarm,
    gift: s.gift,
    inheritanceOther: s.inheritanceOther,
    inheritanceFarm: s.inheritanceFarm,
    original: s.original,
  };
  return map[cause];
}

export interface AcquisitionBill {
  rate: number;
  /** 취득세 본세 */
  acquisitionTax: number;
  /** 지방교육세 */
  educationTax: number;
  total: number;
  /** 신고·납부 기한 설명 */
  deadline: string;
}

/**
 * 지방교육세 — 취득세액의 20% 가 아니다.
 *
 * 표준세율에서 **2%를 뺀 세율**로 다시 산출한 금액의 20% 다. 주택
 * 유상거래는 거기에 세율을 절반으로 한 번 더 줄인다. 그래서 4% 짜리
 * 상가는 (4−2)% × 20% = 0.4%, 1% 짜리 주택은 1% × 50% × 20% = 0.1% 가
 * 붙는다.
 */
export function educationTaxOn(price: number, cause: Cause): number {
  const e = A.localEducationTax;
  if (cause === "housePaid") {
    return Math.floor(price * housePaidRate(price) * e.houseFactor * e.rate);
  }
  const effective = Math.max(0, rateFor(cause, price) - e.deductRate);
  return Math.floor(price * effective * e.rate);
}

function deadlineText(cause: Cause): string {
  const d = A.deadline;
  if (cause === "inheritanceOther" || cause === "inheritanceFarm")
    return `${d.inheritanceFrom}부터 ${d.inheritanceMonths}개월 (국외 상속인이 있으면 ${d.inheritanceMonthsAbroad}개월)`;
  if (cause === "gift") return `${d.giftFrom}부터 ${d.giftMonths}개월`;
  return `취득한 날부터 ${d.generalDays}일`;
}

export function bill(opts: { price: number; cause: Cause }): AcquisitionBill {
  const { price, cause } = opts;
  if (price <= 0)
    return { rate: 0, acquisitionTax: 0, educationTax: 0, total: 0, deadline: deadlineText(cause) };
  const rate = rateFor(cause, price);
  const acquisitionTax = Math.floor(price * rate);
  const educationTax = educationTaxOn(price, cause);
  return {
    rate,
    acquisitionTax,
    educationTax,
    total: acquisitionTax + educationTax,
    deadline: deadlineText(cause),
  };
}

export const DEADLINE = A.deadline;
export const STANDARD = A.standard;
export const HOUSE_PAID = A.housePaid;
