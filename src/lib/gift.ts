/**
 * 증여세 — 과세표준과 산출세액.
 *
 * 숫자는 전부 rates/gift-2026.json 에서 온다. 여기서 하는 일은 국세청이
 * 설명한 계산 순서를 코드로 옮기는 것뿐이다.
 *
 * 이 파일이 조심하는 세 가지:
 *
 * 1. **공제는 한 번에 쓰는 금액이 아니라 10년 한도다.** 자녀에게 5천만원을
 *    주고 3년 뒤에 또 5천만원을 주면 두 번째는 공제가 0이다. 이걸 매번
 *    새로 생기는 금액으로 읽는 것이 이 주제에서 가장 흔한 오해다.
 * 2. **혼인·출산공제는 제53조와 별개로 붙는다.** 5천만원 + 1억 = 1억
 *    5천만원이 된다. 다만 혼인분과 출산분을 합해 평생 1억이 한도다.
 * 3. **세율표는 상속세와 같다.** 제56조가 제26조를 준용한다. 그래서 두
 *    세금의 차이는 세율이 아니라 공제와 기한에서 나온다.
 *
 * 다루지 않는 것은 rates 의 notVerified 에 적혀 있다. 재산 평가·부담부증여·
 * 특례세율은 대상이 갈려 계산에 넣지 않았다.
 */
import rates from "../rates/gift-2026.json";
import { won } from "./money";

export type Relation =
  | "spouse"
  | "ascendant"
  | "descendant"
  | "relative"
  | "other";

export interface Gift {
  /** 이번에 받는 금액(증여세 과세가액). 채무 인수액을 이미 뺀 금액으로 본다. */
  amount: number;
  /** 준 사람이 받는 사람에게 어떤 관계인가. */
  relation: Relation;
  /** 받는 사람이 미성년자인가 — 직계존속에게 받을 때만 금액이 달라진다. */
  minor?: boolean;
  /**
   * 이번 증여 전 10년 이내에 같은 관계에서 이미 공제받은 금액.
   * 한도에서 먼저 차감된다 — 이것이 "10년마다 다시 생긴다"의 실제 규칙이다.
   */
  usedWithin10y?: number;
  /** 혼인·출산공제로 쓸 금액(직계존속에게 받을 때만). 한도까지만 반영한다. */
  marriageBirth?: number;
  /** 이미 쓴 혼인·출산공제 — 평생 1억 한도에서 차감된다. */
  marriageBirthUsed?: number;
  /**
   * 이번 증여일 전 10년 안에 **같은 사람**에게 받은 금액의 합(제47조 ②).
   * 증여자가 직계존속이면 그 배우자도 같은 사람이다 — 아버지·어머니 몫을 합친다.
   * 1천만원 이상이면 이번 과세가액에 더하고, 그때 낸 세금은 제58조로 뺀다.
   * 관계별 공제는 이 금액이 먼저 쓴 것으로 본다(시행령 제46조 ①1호).
   */
  priorGifts?: number;
  /** 받는 사람이 증여자의 자녀가 아닌 직계비속인가(조부모 → 손자녀, 제57조). */
  generationSkip?: boolean;
}

export interface GiftDeductions {
  /** 관계별 공제의 10년 한도 */
  relationCap: number;
  /** 한도에서 이미 쓴 금액을 뺀, 이번에 실제로 쓸 수 있는 금액 */
  relationAvailable: number;
  /** 이번 증여에 실제로 적용된 관계별 공제 */
  relation: number;
  /** 혼인·출산공제 적용액 */
  marriageBirth: number;
  total: number;
}

function relationItem(relation: Relation) {
  return rates.relationDeduction.items.find((i) => i.key === relation)!;
}

/** 그 관계의 10년 한도. 미성년자가 직계존속에게 받으면 줄어든다. */
export function relationCap(relation: Relation, minor = false): number {
  const item = relationItem(relation);
  if (minor && "minorAmount" in item && item.minorAmount !== undefined) {
    return item.minorAmount;
  }
  return item.amount;
}

export function relationLabel(relation: Relation): string {
  return relationItem(relation).label;
}

/** 10년 안 같은 사람에게 받은 금액이 먼저 쓴 관계별 공제(시행령 제46조 ①1호 — 최초 증여부터 순차로). */
export function priorDeductionFor(g: Gift): number {
  const available = Math.max(0, relationCap(g.relation, g.minor) - (g.usedWithin10y ?? 0));
  return Math.min(Math.max(0, g.priorGifts ?? 0), available);
}

export function deductionsFor(g: Gift): GiftDeductions {
  const cap = relationCap(g.relation, g.minor);
  const available = Math.max(0, cap - (g.usedWithin10y ?? 0) - priorDeductionFor(g));
  const relation = Math.min(g.amount, available);

  let marriageBirth = 0;
  if (g.relation === "ascendant" && (g.marriageBirth ?? 0) > 0) {
    const mbCap = Math.max(
      0,
      rates.marriageBirthDeduction.combinedCap - (g.marriageBirthUsed ?? 0),
    );
    marriageBirth = Math.min(
      g.marriageBirth ?? 0,
      mbCap,
      Math.max(0, g.amount - relation),
    );
  }

  return {
    relationCap: cap,
    relationAvailable: available,
    relation,
    marriageBirth,
    total: relation + marriageBirth,
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

export interface GiftResult {
  amount: number;
  /** 10년 안 같은 사람에게 받은 금액 */
  priorGifts: number;
  /** 그 금액을 이번 과세가액에 더했는가(1천만원 이상, 제47조 ②) */
  aggregated: boolean;
  /** 과세가액 — 합산했으면 이번 + 이전 */
  taxable: number;
  /** 이전 증여가 먼저 쓴 관계별 공제 */
  priorDeduction: number;
  /** 이전 증여만의 과세표준(그때 50만원 미만이면 0) — 지금 세율·공제로 본 추정 */
  priorBase: number;
  /** 이전 증여 당시 산출세액 추정 */
  priorComputed: number;
  /** 납부세액공제 한도(제58조 ②) */
  priorCreditLimit: number;
  /** 납부세액공제 — 이전 산출세액과 한도 중 작은 쪽 */
  priorCredit: number;
  /** 세대생략 할증 비율(0·0.3·0.4) */
  surchargeRate: number;
  /** 세대생략 할증액 */
  surcharge: number;
  /** 원문만으로 금액이 닫히지 않음 — 화면은 '—' */
  unclear: boolean;
  /** 이번 증여에 쓴 공제(이전 증여가 쓴 몫은 priorDeduction) */
  deductions: GiftDeductions;
  /** 과세표준 — 음수가 되면 0 */
  base: number;
  ratePercent: number;
  /** 산출세액 */
  computed: number;
  /** 신고세액공제 3% */
  filingCredit: number;
  /** 실제로 내는 금액 */
  payable: number;
  /** 받은 금액 대비 실효세율 */
  effectiveRate: number;
}

export function computeGift(g: Gift): GiftResult {
  const deductions = deductionsFor(g);
  const prior = Math.max(0, g.priorGifts ?? 0);
  const priorDeduction = priorDeductionFor(g);
  const aggregated = prior >= rates.priorGiftAggregation.threshold;
  const min = rates.minimumBase.amount;

  // 이전 증여만 따로 본 과세표준·산출세액 — 그때 50만원 미만이면 부과하지 않았다(제55조 ②).
  const priorRaw = Math.max(0, prior - priorDeduction);
  const priorBase = priorRaw < min ? 0 : priorRaw;
  const priorComputed = taxOn(priorBase);

  const taxable = g.amount + (aggregated ? prior : 0);
  const rawBase = Math.max(
    0,
    taxable - deductions.total - (aggregated ? priorDeduction : 0),
  );
  // 과세표준 50만원 미만은 부과하지 않는다(제55조 ②).
  const base = rawBase < min ? 0 : rawBase;
  const computed = taxOn(base);

  // 제58조 ② — 산출세액 × 이전분 과세표준 / 합친 과세표준 이 한도.
  const priorCreditLimit =
    aggregated && base > 0 ? won((computed * priorBase) / base) : 0;
  const priorCredit = aggregated ? Math.min(priorComputed, priorCreditLimit) : 0;

  // 제57조 · 시행령 제46조의3 — 이번 증여 하나면 산출세액 × 30%(미성년 · 20억 초과 40%).
  const skip = g.generationSkip === true && g.relation === "ascendant";
  const gs = rates.generationSkip;
  const surchargeRate = !skip
    ? 0
    : g.minor && taxable > gs.minorOverAmount
      ? gs.minorRate
      : gs.rate;
  const surcharge = won(computed * surchargeRate);

  // 제69조 ② — 할증 포함 산출세액에서 납부세액공제를 뺀 금액의 3%.
  const filingCredit = won(
    (computed + surcharge - priorCredit) * rates.filingCredit.rate,
  );
  const payable = computed + surcharge - priorCredit - filingCredit;

  // 닫히지 않는 두 경우:
  // · 공제 없는 관계에서 이전 합계가 1천만원 미만 — 제47조 ② '합친 금액'에 이번 증여가 드는지
  //   (공제가 있는 관계는 어느 쪽으로 읽어도 결과가 같다)
  // · 세대생략 + 합산 — 시행령 제46조의3 의 '종전에 납부한 할증과세액'은 입력으로 받지 않는다
  const unclear =
    (prior > 0 && !aggregated && relationCap(g.relation, g.minor) === 0) ||
    (skip && prior > 0);

  return {
    amount: g.amount,
    priorGifts: prior,
    aggregated,
    taxable,
    priorDeduction,
    priorBase,
    priorComputed,
    priorCreditLimit,
    priorCredit,
    surchargeRate,
    surcharge,
    unclear,
    deductions,
    base,
    ratePercent: bracketPercent(base),
    computed,
    filingCredit,
    payable,
    effectiveRate: g.amount > 0 ? payable / g.amount : 0,
  };
}

/**
 * 세금이 0이 되는 증여 금액 — "얼마까지 세금 없이 줄 수 있나".
 *
 * 이 주제에서 사람들이 "면제한도"라고 부르며 찾는 숫자가 이것이다.
 * 관계별 공제 한도가 곧 그 경계다.
 */
export function taxFreeCeiling(
  relation: Relation,
  opts: { minor?: boolean; marriageBirth?: boolean } = {},
): number {
  const cap = relationCap(relation, opts.minor);
  if (relation === "ascendant" && opts.marriageBirth) {
    return cap + rates.marriageBirthDeduction.combinedCap;
  }
  return cap;
}
