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
}

export interface Deductions {
  /** 기초공제 2억 + 인적공제 합계 */
  itemized: number;
  /** 일괄공제 5억 */
  lumpSum: number;
  /** 둘 중 실제로 쓰는 쪽 */
  chosen: number;
  chosenLabel: "일괄공제" | "기초공제 + 인적공제";
  spouse: number;
  total: number;
}

/**
 * 공제를 고른다.
 *
 * 국세청 표현 그대로 — "기초공제 2억원과 그 밖의 인적공제액의 합계액과
 * 5억원 중 **큰 금액**을 공제받을 수 있습니다."
 */
export function deductionsFor(h: Household): Deductions {
  const p = rates.otherPersonal;
  const personal =
    (h.children ?? 0) * p.child + (h.elderly ?? 0) * p.elderly;
  const itemized = rates.basicDeduction.amount + personal;
  const lumpSum = rates.lumpSum.amount;

  const useLump = lumpSum >= itemized;
  const chosen = useLump ? lumpSum : itemized;

  let spouse = 0;
  if (h.hasSpouse) {
    const actual = h.spouseShare ?? 0;
    spouse =
      actual < rates.spouse.minimum
        ? rates.spouse.minimum
        : Math.min(actual, rates.spouse.cap);
  }

  return {
    itemized,
    lumpSum,
    chosen,
    chosenLabel: useLump ? "일괄공제" : "기초공제 + 인적공제",
    spouse,
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
  deductions: Deductions;
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
  const base = Math.max(0, h.estate - deductions.total);
  const computed = taxOn(base);
  const filingCredit = won(computed * rates.filingCredit.rate);
  const payable = computed - filingCredit;
  return {
    estate: h.estate,
    deductions,
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
