/**
 * 가산세 — 신고를 안 했거나 늦게 냈을 때 얼마가 붙나.
 *
 * 국세청 페이지는 가산세 "종류" 표는 주지만 "내 경우 얼마"를 답하지 않는다.
 * 그 자리가 이 계산의 존재 이유다.
 *
 * 숫자는 전부 rates/penalty-2026.json 에서 온다. 그 파일은 국세기본법
 * 제47조의2~4·제48조와 시행령 제27조의4 원문에서 확인한 것이다.
 *
 * 다루지 않는 것(rates 의 notVerified 참조): 복식부기의무자·법인의 수입금액
 * 기준 가산세, 영세율 가산세, 원천징수 납부지연가산세, 가산세 한도.
 * 개인(단순·기준경비율) 기준만 계산한다.
 */
import rates from "../rates/penalty-2026.json";

/** 원 단위로 맞춘다 — 표시와 계산이 어긋나지 않게 한곳에서 버린다. */
const won = (n: number) => Math.floor(Math.max(0, n));

export interface LateFilingInput {
  /** 신고했어야 할 세액(원). */
  tax: number;
  /** 법정신고기한이 지난 뒤 며칠 만에 신고하나. */
  daysLate: number;
  /** 부정행위인 경우. 기본은 아니다. */
  fraud?: boolean;
}

export interface PenaltyResult {
  /** 무신고가산세 — 감면 전. */
  noReportBase: number;
  /** 적용된 감면율(0~1). 없으면 0. */
  reliefRate: number;
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

/** 개월 수로 감면율을 고른다. 구간을 넘기면 0. */
export function lateFilingRelief(daysLate: number): number {
  if (daysLate <= 0) return 0;
  const months = daysLate / 30;
  for (const step of rates.lateFilingRelief) {
    if (months <= step.withinMonths) return step.relief;
  }
  return 0;
}

/**
 * 기한 후 신고할 때의 가산세.
 *
 * 무신고가산세는 감면되지만 납부지연가산세는 감면 대상이 아니다(제48조
 * 제2항 제2호가 제47조의2 만 든다). 이 둘을 합쳐서 "가산세"라고 부르면
 * 계산이 틀린다.
 */
export function computeLateFiling(input: LateFilingInput): PenaltyResult {
  const tax = won(input.tax);
  const days = Math.max(0, Math.floor(input.daysLate));

  // 기한 내 신고면 가산세가 아예 없다. 감면율 0 과 헷갈리면 안 된다 —
  // 감면 0 은 "20% 를 다 문다" 이고 여기는 "안 문다" 다.
  if (days === 0) {
    return {
      noReportBase: 0, reliefRate: 0, reliefAmount: 0, noReport: 0,
      latePayment: 0, total: 0, grandTotal: tax, reliefExpired: false,
    };
  }

  const rate = input.fraud ? rates.noReport.fraud : rates.noReport.general;
  const noReportBase = won(tax * rate);

  // 부정행위에는 감면이 없다 — 제48조 제2항 제2호는 "경정할 것을 미리 알고"
  // 낸 경우를 빼는데, 부정행위 감면을 따로 정하지 않는다. 안전하게 0으로 둔다.
  const reliefRate = input.fraud ? 0 : lateFilingRelief(days);
  const reliefAmount = won(noReportBase * reliefRate);
  const noReport = noReportBase - reliefAmount;

  const latePayment = won(tax * rates.latePayment.dailyRate * days);

  const total = noReport + latePayment;
  return {
    noReportBase,
    reliefRate,
    reliefAmount,
    noReport,
    latePayment,
    total,
    grandTotal: tax + total,
    reliefExpired: !input.fraud && days > 0 && reliefRate === 0,
  };
}

/** 감면이 한 단계 줄어들기까지 남은 일수. 이미 끝났으면 null. */
export function daysUntilReliefDrops(daysLate: number): number | null {
  const months = daysLate / 30;
  for (const step of rates.lateFilingRelief) {
    if (months <= step.withinMonths) {
      return Math.ceil(step.withinMonths * 30 - daysLate);
    }
  }
  return null;
}

export const penaltyRates = rates;
