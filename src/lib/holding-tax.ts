/**
 * 보유세 — 6월 1일에 집을 가진 사람이 그해 내는 재산세(지방세)와 종부세(국세)를 합친 말.
 *
 * 법에 '보유세'라는 세목은 없다. 같은 집에 두 세금이 겹치므로 종부세에서
 * 그 집에 이미 붙은 재산세 일부를 뺀다(종합부동산세법 제9조 제3항). 이 계산이
 * 이 파일의 핵심이다.
 *
 *   공제할 재산세액 = 주택분 재산세 부과세액 합계
 *                   × (종부세 과세표준 × 재산세 공정시장가액비율 × 재산세 표준세율)
 *                   ÷ (주택을 합산해 재산세 표준세율로 계산한 재산세 상당액)
 *                                                       — 시행령 제4조의3 제1항
 *
 * 분자의 '표준세율'은 누진공제를 빼지 않고 곱한다 — 공제 초과분은 언제나 맨 위
 * 구간(0.4%)에 있기 때문이다. 분모는 공시가격 합계에 비율을 곱해 누진공제를 뺀
 * 값이다. 둘 다 국세청 「종합부동산세 집행기준」 9-4의3-4·9-4의3-6 이 이렇게 정한다
 * (2026-10-22 확인). '부과세액'은 재산세 본세만이다 — 도시지역분·지방교육세는 넣지 않는다.
 *
 * 순서: 종부세 산출세액 − 재산세액 공제 → 1세대 1주택 나이·보유 공제(제9조 ⑤) →
 * 10원 미만 버림(국고금 관리법 제47조 ①) → 농특세 20%(다시 10원 미만 버림).
 *
 * 넣지 않은 것: 세부담 상한(종부세법 제10조 — 직전 연도 세액이 필요),
 * 재산세 과세표준 상한 105%(지방세법 제110조 ③ — 직전 연도 과세표준이 필요),
 * 지역자원시설세. 과세표준 상한이 걸리면 재산세가 줄면서 공제도 줄어 종부세 줄은
 * 커질 수 있으므로, '이보다 크지 않다'는 합계에만 붙인다.
 */
import local from "../rates/local-tax-2026.json";
import { bill } from "./property-tax";
import { taxBase as jongbuBase, taxOn, oneHomeCreditRate, type HomeCount } from "./comprehensive-property-tax";
import J from "../rates/comprehensive-property-2026.json";
import lottery from "../rates/lottery-2026.json";

const P = local.propertyTax;
const STD = P.rates.house.brackets;
/** 재산세 주택 표준세율 맨 위 구간 0.4% — 분자는 이 값을 누진공제 없이 곱한다 */
export const TOP_RATE = STD[STD.length - 1].rate;
const TEN = lottery.rounding.unit;
const RURAL = J.ruralTax.rate;
const DEDUCTION = J.taxBase.deduction;

/** 10원 미만 버림(국고금 관리법 제47조 ①, 지방세기본법 제59조 준용) */
export function trunc10(n: number): number {
  return Math.floor(n / TEN) * TEN;
}

/** 이 사람에게 적용되는 재산세 주택 공정시장가액비율 — 1세대 1주택이면 43~45%(시행령 제109조 ① 2호 단서) */
export function propertyRatio(standardValue: number, oneHome: boolean): number {
  if (!oneHome) return P.taxBase.ratios.house;
  return P.taxBase.houseOneHouseholdOneHome2026.find((r) => r.upTo === null || standardValue <= r.upTo)!.ratio;
}

/** 표준세율 누진 계산(누진공제 적용) — 분모 */
function standardProgressive(base: number): number {
  if (base <= 0) return 0;
  let prev = 0;
  for (const b of STD) {
    if (b.upTo === null || base <= b.upTo) return Math.floor(b.base + (base - prev) * b.rate);
    prev = b.upTo;
  }
  return 0;
}

export interface CreditParts {
  /** 분자: 종부세 과세표준 × 재산세 비율 × 0.4% */
  numerator: number;
  /** 분모: 공시가격 합계 × 재산세 비율에 표준세율(누진공제 적용) */
  denominator: number;
  /** 공제할 재산세액(종부세 산출세액을 넘지 않는다) */
  credit: number;
}

/** 공제할 재산세액(시행령 제4조의3 ①, 집행기준 9-4의3) */
export function propertyTaxCredit(opts: {
  /** 주택분 재산세 본세 부과세액 합계 */
  levied: number;
  totalPrice: number;
  jongbuTaxBase: number;
  jongbuTax: number;
  oneHome: boolean;
}): CreditParts {
  const { levied, totalPrice, jongbuTaxBase, jongbuTax, oneHome } = opts;
  if (jongbuTaxBase <= 0 || levied <= 0) return { numerator: 0, denominator: 0, credit: 0 };
  const ratio = propertyRatio(totalPrice, oneHome);
  const numerator = Math.floor(jongbuTaxBase * ratio * TOP_RATE);
  const denominator = standardProgressive(Math.floor(totalPrice * ratio));
  const credit = Math.min(jongbuTax, Math.floor((levied * numerator) / denominator));
  return { numerator, denominator, credit };
}

export interface House {
  price: number;
  /** 도시지역분 대상 지역인가(조례) */
  urban?: boolean;
}

export interface HoldingResult {
  homes: number;
  oneHome: boolean;
  totalPrice: number;
  /** 재산세 본세 합계 */
  propertyTax: number;
  urbanArea: number;
  educationTax: number;
  /** 재산세 고지서 합계(본세 + 도시지역분 + 지방교육세) */
  propertyBill: number;
  jongbuDeduction: number;
  jongbuTaxBase: number;
  /** 종부세 산출세액(세율 적용, 공제 전) */
  jongbuGross: number;
  credit: CreditParts;
  /** 나이·보유 공제율 합계 */
  oneHomeRate: number;
  oneHomeCredit: number;
  /** 낼 종부세 */
  jongbu: number;
  rural: number;
  /** 보유세 합계 — 세부담 상한·과세표준 상한 전이라 이보다 크지 않다 */
  total: number;
  /** 합계 ÷ 공시가격 합계 */
  effective: number;
}

/**
 * 주택별 공시가격으로 한 해 보유세. 재산세는 주택마다 따로 누진으로 붙고,
 * 종부세는 사람 단위로 합산한다. 1세대 1주택은 집이 하나일 때만 받는다.
 */
export function holdingTax(opts: { houses: House[]; oneHome?: boolean; age?: number; years?: number }): HoldingResult {
  const houses = opts.houses.filter((h) => h.price > 0);
  const oneHome = !!opts.oneHome && houses.length === 1;
  const totalPrice = houses.reduce((s, h) => s + h.price, 0);

  let propertyTax = 0;
  let urbanArea = 0;
  let educationTax = 0;
  for (const h of houses) {
    const b = bill({ standardValue: h.price, kind: "house", oneHome, urban: !!h.urban });
    propertyTax += b.propertyTax;
    urbanArea += b.urbanArea;
    educationTax += b.educationTax;
  }

  const homes: HomeCount = houses.length >= 3 ? "from3Homes" : "upTo2Homes";
  const jongbuTaxBase = jongbuBase(totalPrice, oneHome);
  const jongbuGross = taxOn(jongbuTaxBase, homes);
  const credit = propertyTaxCredit({ levied: propertyTax, totalPrice, jongbuTaxBase, jongbuTax: jongbuGross, oneHome });
  const afterProperty = jongbuGross - credit.credit;
  const oneHomeRate = oneHome ? oneHomeCreditRate(opts.age ?? 0, opts.years ?? 0).total : 0;
  const oneHomeCredit = Math.floor(afterProperty * oneHomeRate);
  const jongbu = trunc10(afterProperty - oneHomeCredit);
  const rural = trunc10(jongbu * RURAL);

  const propertyBill = propertyTax + urbanArea + educationTax;
  const total = propertyBill + jongbu + rural;
  return {
    homes: houses.length,
    oneHome,
    totalPrice,
    propertyTax,
    urbanArea,
    educationTax,
    propertyBill,
    jongbuDeduction: oneHome ? DEDUCTION.oneHouseholdOneHome : DEDUCTION.other,
    jongbuTaxBase,
    jongbuGross,
    credit,
    oneHomeRate,
    oneHomeCredit,
    jongbu,
    rural,
    total,
    effective: totalPrice > 0 ? total / totalPrice : 0,
  };
}

