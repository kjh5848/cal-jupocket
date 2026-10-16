/**
 * 가산세 — 신고를 안 했거나 늦게 냈을 때 얼마가 붙나.
 *
 * 국세청 페이지는 가산세 "종류" 표는 주지만 "내 경우 얼마"를 답하지 않는다.
 * 그 자리가 이 계산의 존재 이유다.
 *
 * 숫자는 전부 rates/penalty-2026.json 에서 온다. 그 파일은 국세기본법
 * 제47조의2~4·제48조와 시행령 제27조의4 원문에서 확인한 것이다.
 *
 * 날짜로 계산한다. "1개월 이내"는 30일이 아니라 달력으로 센다(국세기본법
 * 제4조 → 민법 제157조·제160조) — 기한이 6월 1일이면 1개월은 7월 1일,
 * 3개월은 9월 1일(92일째), 6개월은 12월 1일(183일째)까지다.
 *
 * 다루지 않는 것(rates 의 notVerified 참조): 복식부기의무자·법인의 수입금액
 * 기준 가산세, 영세율 가산세, 원천징수 납부지연가산세, 가산세 한도.
 * 개인(단순·기준경비율) 기준만 계산한다.
 */
import rates from "../rates/penalty-2026.json";

/** 원 단위로 맞춘다 — 표시와 계산이 어긋나지 않게 한곳에서 버린다. */
const won = (n: number) => Math.floor(Math.max(0, n));

const DAY = 86_400_000;

/** "2026-06-01" → UTC 자정 시각. 형식이 틀리면 NaN. */
function toTime(date: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
}

function toDate(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

/** 날짜에 일수를 더한다. */
export function addDays(date: string, days: number): string {
  return toDate(toTime(date) + days * DAY);
}

/** b − a 일수. */
export function daysBetween(a: string, b: string): number {
  return Math.round((toTime(b) - toTime(a)) / DAY);
}

/**
 * 기한이 지난 뒤 n개월이 끝나는 날(그날까지가 "n개월 이내").
 *
 * 민법 제157조: 첫날(기한 다음 날)을 기산일로 한다 — 기한 다음 날 0시부터
 * 시작하므로 초일 불산입 예외(같은 조 단서)가 아니라 기한일 자체를 뺀 것과 같다.
 * 제160조 제2항: 최후의 월에서 기산일에 해당한 날의 전일로 만료.
 * 제160조 제3항: 최종의 월에 해당일이 없으면 그 월의 말일로 만료.
 */
export function periodEnd(deadline: string, months: number): string {
  const start = new Date(toTime(deadline) + DAY);
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth() + months;
  const d = start.getUTCDate();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  if (d > lastDay) return toDate(Date.UTC(y, m, lastDay));
  return toDate(Date.UTC(y, m, d) - DAY);
}

/** 신고일의 감면율과 그 감면율이 끝나는 날. 기한 내거나 6개월을 넘기면 감면 0. */
export function lateFilingRelief(
  deadline: string,
  filedOn: string,
): { relief: number; until: string | null } {
  if (daysBetween(deadline, filedOn) <= 0) return { relief: 0, until: null };
  for (const step of rates.lateFilingRelief) {
    const end = periodEnd(deadline, step.withinMonths);
    if (filedOn <= end) return { relief: step.relief, until: end };
  }
  return { relief: 0, until: null };
}

export interface LateFilingInput {
  /** 신고했어야 할 세액(원). */
  tax: number;
  /** 법정신고·납부기한 "YYYY-MM-DD" (토·일·공휴일이면 다음 날 — 국세기본법 제5조). */
  deadline: string;
  /** 기한 후 신고·납부하는 날 "YYYY-MM-DD". 신고와 납부를 같은 날 한다고 본다. */
  filedOn: string;
  /** 부정행위인 경우. 기본은 아니다. */
  fraud?: boolean;
}

export interface PenaltyResult {
  /** 기한이 지난 일수(신고일 − 기한). */
  daysLate: number;
  /** 납부지연가산세를 세는 일수 — 기한 다음 날부터 납부일 전날까지. */
  lateDays: number;
  /** 무신고가산세 — 감면 전. */
  noReportBase: number;
  /** 적용된 감면율(0~1). 없으면 0. */
  reliefRate: number;
  /** 지금 감면율이 끝나는 날. 감면이 없으면 null. */
  reliefUntil: string | null;
  /** 감면액. */
  reliefAmount: number;
  /** 무신고가산세 — 감면 후. */
  noReport: number;
  /** 납부지연가산세. */
  latePayment: number;
  /** 가산세 합계. */
  total: number;
  /** 세금 + 가산세. */
  grandTotal: number;
  /** 감면 구간을 넘겼는지 — 화면에서 "지금 신고하면 아직 줄어든다"를 말하려면 필요하다. */
  reliefExpired: boolean;
}

/**
 * 기한 후 신고할 때의 가산세.
 *
 * 무신고가산세는 감면되지만 납부지연가산세는 감면 대상이 아니다(제48조
 * 제2항 제2호가 제47조의2 만 든다). 이 둘을 합쳐서 "가산세"라고 부르면
 * 계산이 틀린다.
 *
 * 납부지연 일수는 "법정납부기한의 다음 날부터 … 그 납부일의 전날까지"
 * (제47조의4 제1항 제1호, 2026. 7. 1. 시행 조문) — 기한 다음 날 내면 0일이다.
 */
export function computeLateFiling(input: LateFilingInput): PenaltyResult {
  const tax = won(input.tax);
  const days = daysBetween(input.deadline, input.filedOn);

  // 기한 내 신고면 가산세가 아예 없다. 감면율 0 과 헷갈리면 안 된다 —
  // 감면 0 은 "20% 를 다 문다" 이고 여기는 "안 문다" 다.
  if (!(days > 0)) {
    return {
      daysLate: 0, lateDays: 0, noReportBase: 0, reliefRate: 0, reliefUntil: null,
      reliefAmount: 0, noReport: 0, latePayment: 0, total: 0, grandTotal: tax,
      reliefExpired: false,
    };
  }

  const rate = input.fraud ? rates.noReport.fraud : rates.noReport.general;
  const noReportBase = won(tax * rate);

  // 부정행위에는 감면이 없다 — 제48조 제2항 제2호는 "경정할 것을 미리 알고"
  // 낸 경우를 빼는데, 부정행위 감면을 따로 정하지 않는다. 안전하게 0으로 둔다.
  const relief = input.fraud ? { relief: 0, until: null } : lateFilingRelief(input.deadline, input.filedOn);
  const reliefAmount = won(noReportBase * relief.relief);
  const noReport = noReportBase - reliefAmount;

  const lateDays = days - 1;
  const latePayment = won(tax * rates.latePayment.dailyRate * lateDays);

  const total = noReport + latePayment;
  return {
    daysLate: days,
    lateDays,
    noReportBase,
    reliefRate: relief.relief,
    reliefUntil: relief.until,
    reliefAmount,
    noReport,
    latePayment,
    total,
    grandTotal: tax + total,
    reliefExpired: !input.fraud && relief.relief === 0,
  };
}

export const penaltyRates = rates;
