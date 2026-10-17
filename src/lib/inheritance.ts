/**
 * 상속세 — 과세표준과 산출세액.
 *
 * 숫자는 전부 rates/inheritance-2026.json 에서 온다. 여기서 하는 일은
 * **국세청이 설명한 순서를 코드로 옮기는 것**뿐이다.
 *
 * 이 파일이 조심하는 세 가지:
 *
 * 1. **일괄공제는 더하는 게 아니라 고르는 것이다.** 기초공제 2억 + 인적공제
 *    합계와 일괄공제 5억 중 **큰 쪽 하나만** 쓴다. 둘을 더해 7억으로 잡은
 *    글이 흔한데 틀렸다.
 * 2. **배우자공제는 최소 5억이다.** 실제로 한 푼도 못 받아도 5억이 나온다.
 *    "배우자가 안 받으면 공제도 없다" 가 가장 흔한 오해다.
 * 3. **신고세액공제 3%는 산출세액이 아니라 "공제세액을 뺀 금액"의 3%다.**
 *    여기서는 다른 세액공제를 다루지 않으므로 산출세액에 바로 곱하지만,
 *    실제 신고에서는 순서가 하나 더 있다.
 *
 * 다루지 않는 것은 rates 의 notVerified 에 적혀 있다. 가업상속·금융재산·
 * 동거주택 공제는 대상이 좁아 계산에 넣지 않았다 — 해당하면 이 계산은
 * 실제보다 많이 나온다.
 */
import rates from "../rates/inheritance-2026.json";
import { won } from "./money";

export interface Household {
  /** 상속재산 총액(과세가액). 채무·장례비를 이미 뺀 금액으로 본다. */
  estate: number;
  /** 배우자가 생존해 있는가. 없으면 배우자공제가 0이다. */
  hasSpouse: boolean;
  /**
   * 배우자가 실제로 상속받는 금액. 0이면 최소 5억이 적용된다.
   * 한도(법정상속지분 · 30억)는 입력이 너무 많아 다루지 않는다 —
   * 30억 상한만 건다.
   */
  spouseShare?: number;
  /** 자녀 수. 그 밖의 인적공제에 쓴다. */
  children?: number;
  /** 65세 이상 상속인·동거가족 수(배우자 제외). */
  elderly?: number;
  /**
   * 미성년자 상속인·동거가족이 19세가 될 때까지 남은 연수의 합(제20조 제1항 제2호).
   * 1년 미만은 1년으로 센다(제3항) — 호출하는 쪽이 올림해서 넘긴다.
   */
  minorYears?: number;
  /**
   * 자녀가 없을 때 배우자와 함께 상속하는 부모 수(민법 제1000조·제1003조).
   * 0 이면 배우자 혼자 상속 — 일괄공제를 못 쓰고(제21조 ②) 법정상속분이 1이다.
   * 넘기지 않으면 예전처럼 배우자 단독상속을 따지지 않는다.
   */
  parents?: 0 | 1 | 2;
  /** 공과금·채무(제14조 ①). estate 에서 빼 과세가액을 만들고, 배우자 한도의 A 에서도 뺀다. */
  debts?: number;
  /**
   * 장례비(시행령 제9조 ②). 넘기면 estate 를 장례비 빼기 전 금액으로 보고 최저 500만원을 적용해 뺀다.
   * 넘기지 않으면 예전처럼 estate 를 장례비를 이미 뺀 금액으로 본다.
   */
  funeral?: { direct: number; memorial?: number };
}

export interface Deductions {
  /** 기초공제 2억 + 인적공제 합계 */
  itemized: number;
  /** 일괄공제 5억 */
  lumpSum: number;
  /** 둘 중 실제로 쓰는 쪽 */
  chosen: number;
  chosenLabel: "일괄공제" | "기초공제 + 인적공제";
  /** 배우자 혼자 상속해 일괄공제를 못 쓰는가(제21조 ②) */
  spouseSole: boolean;
  spouse: number;
  /** 배우자 법정상속분(민법 제1009조 ②) — 계산할 수 없으면 null */
  legalShare: number | null;
  /** 배우자공제 한도 — 법정상속분 한도(제19조 ①1호, 원 미만 버림)와 30억 중 작은 쪽. 법정상속분을 모르면 30억 */
  spouseLimit: number;
  /**
   * 실제 받은 금액이 5억 이상인데 한도가 5억 미만 — 5억 바닥이 적용되는지 원문으로 닫히지 않는다(rates spouse.floorNote).
   * 이때 spouse 는 국세청 안내 문구대로 한도 금액이지만 화면은 금액을 내지 않는다.
   */
  spouseUnclear: boolean;
  total: number;
}

/** 배우자 법정상속분 — 같은 순위 상속인 n명과 함께면 1.5/(n + 1.5), 혼자면 1 (민법 제1009조 ②) */
export function spouseLegalShare(coHeirs: number): number {
  const w = rates.spouse.legalShare.spouseWeight;
  return coHeirs <= 0 ? 1 : w / (coHeirs + w);
}

/** 장례비 반영액 — 직접 장례비 500만~1천만원 + 봉안·자연장 500만원 한도(시행령 제9조 ②) */
export function funeralAllowed(f: { direct: number; memorial?: number }): number {
  const r = rates.funeral;
  const direct = Math.min(Math.max(f.direct, r.directMin), r.directMax);
  const memorial = Math.min(Math.max(f.memorial ?? 0, 0), r.memorialMax);
  return direct + memorial;
}

/**
 * 공제를 고른다.
 *
 * 국세청 표현 그대로 — "기초공제 2억원과 그 밖의 인적공제액의 합계액과
 * 5억원 중 **큰 금액**을 공제받을 수 있습니다." 배우자 혼자 상속하면 5억은 고를 수 없다(제21조 ②).
 */
export function deductionsFor(h: Household): Deductions {
  const p = rates.otherPersonal;
  const personal =
    (h.children ?? 0) * p.child + (h.elderly ?? 0) * p.elderly + (h.minorYears ?? 0) * p.minorPerYear;
  const itemized = rates.basicDeduction.amount + personal;
  const lumpSum = rates.lumpSum.amount;

  const children = h.children ?? 0;
  const spouseSole = h.hasSpouse && children === 0 && h.parents === 0;
  const useLump = !spouseSole && lumpSum >= itemized;
  const chosen = useLump ? lumpSum : itemized;

  // 법정상속분 — 자녀가 있으면 자녀 수, 없으면 넘겨받은 부모 수. 자녀 0명에 부모를 모르면 계산하지 않는다
  const coHeirs = children > 0 ? children : h.parents;
  const legalShare = h.hasSpouse && coHeirs !== undefined ? spouseLegalShare(coHeirs) : null;
  const a = Math.max(0, h.estate - (h.debts ?? 0));
  const spouseLimit =
    legalShare === null ? rates.spouse.cap : Math.min(Math.floor(a * legalShare), rates.spouse.cap);

  let spouse = 0;
  let spouseUnclear = false;
  if (h.hasSpouse) {
    const actual = h.spouseShare ?? 0;
    if (actual < rates.spouse.minimum) {
      spouse = rates.spouse.minimum; // 제19조 ④
    } else {
      spouse = Math.min(actual, spouseLimit);
      spouseUnclear = spouse < rates.spouse.minimum;
    }
  }

  return {
    itemized,
    lumpSum,
    chosen,
    chosenLabel: useLump ? "일괄공제" : "기초공제 + 인적공제",
    spouseSole,
    spouse,
    legalShare,
    spouseLimit,
    spouseUnclear,
    total: chosen + spouse,
  };
}

/** 과세표준에 붙는 산출세액. */
export function taxOn(base: number): number {
  const b = Math.max(0, base);
  const bracket = rates.brackets.find((x) => x.upTo === null || b <= x.upTo)!;
  return Math.max(0, won(b * bracket.rate - bracket.deduction));
}

/** 그 과세표준이 속한 구간의 세율(%) — 표에 "몇 % 구간"을 적기 위해. */
export function bracketPercent(base: number): number {
  const b = Math.max(0, base);
  const bracket = rates.brackets.find((x) => x.upTo === null || b <= x.upTo)!;
  return Math.round(bracket.rate * 100);
}

export interface InheritanceResult {
  estate: number;
  /** 공과금·채무 */
  debts: number;
  /** 장례비 반영액(시행령 제9조 ②) — funeral 을 넘기지 않으면 0 */
  funeral: number;
  /** 상속세 과세가액 = 상속재산 − 공과금·채무 − 장례비, 음수면 0 */
  taxable: number;
  deductions: Deductions;
  /** 공제 합계 중 실제로 뺀 금액 — 과세가액을 넘지 못한다(제24조) */
  appliedDeduction: number;
  /** 과세표준 — 음수가 되면 0 */
  base: number;
  ratePercent: number;
  /** 산출세액 */
  computed: number;
  /** 신고세액공제 3% */
  filingCredit: number;
  /** 실제로 내는 금액 */
  payable: number;
  /** 상속재산 대비 실효세율 */
  effectiveRate: number;
}

export function computeInheritance(h: Household): InheritanceResult {
  const deductions = deductionsFor(h);
  const debts = Math.max(0, h.debts ?? 0);
  const funeral = h.funeral ? funeralAllowed(h.funeral) : 0;
  const taxable = Math.max(0, h.estate - debts - funeral);
  const appliedDeduction = Math.min(deductions.total, taxable);
  const base = taxable - appliedDeduction;
  // 과세표준 50만원 미만이면 상속세를 부과하지 않는다(제25조 제2항) — 과세표준은 그대로, 세액만 0
  const computed = base < rates.minimumBase.amount ? 0 : taxOn(base);
  const filingCredit = won(computed * rates.filingCredit.rate);
  const payable = computed - filingCredit;
  return {
    estate: h.estate,
    debts,
    funeral,
    taxable,
    deductions,
    appliedDeduction,
    base,
    ratePercent: bracketPercent(base),
    computed,
    filingCredit,
    payable,
    effectiveRate: h.estate > 0 ? payable / h.estate : 0,
  };
}

/**
 * 세금이 0이 되는 상속재산의 크기.
 *
 * "얼마부터 상속세를 내나"가 이 주제에서 가장 많이 묻는 질문인데, 답이
 * 가족 구성에 따라 달라서 고정된 숫자가 없다. 공제 합계가 곧 그 경계다.
 */
export function taxFreeCeiling(h: Omit<Household, "estate">): number {
  return deductionsFor({ ...h, estate: 0 }).total;
}

/**
 * 상속공제 적용 한도 — 제24조.
 * 공제 합계는 과세가액에서 ① 상속인 아닌 사람에게 간 유증 등 ② 선순위 포기로 후순위가 받은 재산
 * ③ (과세가액 5억 초과 시) 가산한 사전증여재산의 과세표준을 뺀 금액을 넘지 못한다.
 */
export function deductionLimit(o: { taxable: number; bequestToNonHeirs?: number; renounced?: number; priorGiftBase?: number }): number {
  const gift = o.taxable > rates.deductionLimit.giftAddThreshold ? (o.priorGiftBase ?? 0) : 0;
  return Math.max(0, o.taxable - (o.bequestToNonHeirs ?? 0) - (o.renounced ?? 0) - gift);
}

/** 그 밖의 인적공제(제20조)만의 합 — 기초공제 2억과 더해 일괄공제 5억과 비교한다 */
export function personalTotal(o: { children?: number; elderly?: number; minorYears?: number }): number {
  const p = rates.otherPersonal;
  return (o.children ?? 0) * p.child + (o.elderly ?? 0) * p.elderly + (o.minorYears ?? 0) * p.minorPerYear;
}
