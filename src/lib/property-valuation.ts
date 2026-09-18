/**
 * 부동산을 증여·상속할 때 "얼마로 쳐서" 세금을 매기나.
 *
 * 27번 글(gift-tax)은 공제와 세율을 답한다. 그 둘이 정해져도 과세표준이
 * 나오지 않는 이유는 재산가액이 남아 있기 때문이다. 현금은 금액이 곧
 * 가액이지만 부동산은 아니다. 이 파일은 그 가액을 정하는 규칙을 다룬다.
 *
 * 핵심은 순서다 — 기준시가가 원칙이 아니라 시가가 원칙이고(법 제60조
 * 제1항), 기준시가는 시가를 산정하기 어려울 때의 보충적 방법이다(제3항).
 *
 * 날짜는 손으로 적지 않는다. 평가기간과 신고기한은 giftValuationWindow()
 * 가 낸다 — 증여는 평가기준일 전 6개월부터 후 3개월까지이고(시행령
 * 제49조 제1항) 상속의 전후 6개월과 다르기 때문에, 손으로 적으면
 * 어느 한쪽을 반드시 틀린다.
 *
 * 숫자와 조문은 전부 rates/property-valuation-2026.json 에서 온다.
 * 그 파일은 국가법령정보센터 조문 원문에서 확인한 것이다.
 *
 * 다루지 않는 것(rates 의 notVerified 참조): 배율방법의 배율, 임대료
 * 환산율, 비상장주식 평가, 부담부증여의 양도소득세.
 */
import rates from "../rates/property-valuation-2026.json";
import gift from "../rates/gift-2026.json";

/** YYYY-MM-DD 로 맞춘다 — 표시와 계산이 어긋나지 않게 한곳에서 만든다. */
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** UTC 기준으로 만든다. 로컬 시간대가 하루를 밀지 않게. */
const utc = (y: number, m: number, day: number) => new Date(Date.UTC(y, m, day));

/** 그 달의 마지막 날. m 은 0-based. */
const endOfMonth = (y: number, m: number) => utc(y, m + 1, 0);

/**
 * 달을 더한다. 말일 보정을 한다 — 1월 31일에 1개월을 더하면 2월 31일이
 * 아니라 2월 말일이다.
 */
function addMonths(d: Date, months: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const lastDay = endOfMonth(y, m + months).getUTCDate();
  return utc(y, m + months, Math.min(day, lastDay));
}

const addDays = (d: Date, days: number) =>
  new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

export interface GiftValuationWindow {
  /** 평가기준일 = 증여일. */
  valuationDate: string;
  /** 평가기간 시작 — 평가기준일 전 6개월. */
  periodFrom: string;
  /** 평가기간 종료 — 평가기준일 후 3개월. */
  periodTo: string;
  /** 증여세 과세표준 신고기한 — 증여일이 속하는 달의 말일부터 3개월. */
  filingDeadline: string;
  /** 평가심의위원회 신청기한 — 신고기한 만료 70일 전. */
  committeeRequestBy: string;
  /** 평가기간 밖이라도 심의 대상이 될 수 있는 소급 기산일 — 평가기준일 전 2년. */
  lookBackFrom: string;
}

/**
 * 증여일 하나로 평가기간·신고기한·평가심의위원회 신청기한을 한 번에 낸다.
 *
 * 증여의 평가기간은 평가기준일 전 6개월부터 후 3개월까지다(시행령
 * 제49조 제1항). 상속은 전후 6개월이라 창의 길이도 모양도 다르다.
 *
 * 신고기한은 증여받은 날이 속하는 달의 "말일"부터 3개월이다(법 제68조
 * 제1항). 증여일부터가 아니다 — 이 한 칸 때문에 실제 기한이 최대
 * 한 달 가까이 늘어난다.
 */
export function giftValuationWindow(giftDate: string | Date): GiftValuationWindow {
  const d = typeof giftDate === "string" ? new Date(`${giftDate}T00:00:00Z`) : giftDate;
  if (Number.isNaN(d.getTime())) throw new Error(`증여일을 읽을 수 없습니다: ${giftDate}`);

  const p = rates.valuationPeriod;

  /*
   * 신고기한은 "증여받은 날이 속하는 달의 말일부터 3개월"이다(법 제68조
   * 제1항). 말일에 3개월을 캘린더로 더하면 안 된다 — 민법 제157조가
   * 초일을 넣지 않으므로 기산일은 말일의 다음날(그 다음 달 1일)이고,
   * 제160조 제2항이 "최후의 월에서 기산일에 해당하는 날의 전일"로
   * 만료시킨다. 결과적으로 증여월에서 3개월 뒤인 달의 말일이 된다.
   *
   * 9월 18일 증여 → 기산일 10월 1일 → 1월 1일의 전일 → 12월 31일.
   * 말일(9/30)에 3개월을 그냥 더하면 12월 30일이 나와 하루가 어긋난다.
   */
  const filingDeadline = endOfMonth(
    d.getUTCFullYear(),
    d.getUTCMonth() + gift.deadline.months,
  );

  return {
    valuationDate: iso(d),
    periodFrom: iso(addMonths(d, -p.giftBeforeMonths)),
    periodTo: iso(addMonths(d, p.giftAfterMonths)),
    filingDeadline: iso(filingDeadline),
    committeeRequestBy: iso(
      addDays(filingDeadline, -rates.valuationCommittee.giftRequestDaysBeforeDeadline),
    ),
    lookBackFrom: iso(addMonths(d, -12 * p.outsideWindow.priorYears)),
  };
}

/**
 * 부동산 종류를 주면 보충적 평가의 근거 고시가격을 돌려준다(법 제61조
 * 제1항). 종류마다 근거가 다르다는 것이 이 함수의 존재 이유다 — 토지는
 * 개별공시지가지만 아파트는 공동주택가격이고 오피스텔은 국세청장이
 * 토지·건물을 일괄 고시한 가액이다.
 */
export function supplementaryBasis(key: string) {
  return rates.supplementary.items.find((i) => i.key === key);
}

/**
 * 감정평가를 몇 곳에 받아야 하나(법 제60조 제5항, 시행령 제49조 제6항).
 * 기준시가 10억원 이하의 부동산이면 한 곳으로도 된다.
 */
export function requiredAppraisalCount(standardValue: number): number {
  const a = rates.appraisalAgencies;
  return standardValue <= a.reducedThreshold ? a.reducedCount : a.defaultCount;
}

/** 증여 평가기간(개월) — 앞뒤가 다르다. */
export const giftPeriodMonths = {
  before: rates.valuationPeriod.giftBeforeMonths,
  after: rates.valuationPeriod.giftAfterMonths,
} as const;

/** 상속 평가기간(개월) — 비교 기준점으로만 쓴다. */
export const inheritancePeriodMonths = {
  before: rates.valuationPeriod.inheritanceBeforeMonths,
  after: rates.valuationPeriod.inheritanceAfterMonths,
} as const;

export { rates as propertyValuationRates };
