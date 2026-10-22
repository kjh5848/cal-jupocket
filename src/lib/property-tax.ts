/**
 * 재산세 — 고지서 한 장이 어떻게 만들어지는가.
 *
 * 이 계산의 어려움은 세율이 아니라 **고지서에 여러 세목이 함께 온다**는
 * 데 있다. 사람들이 "계산기로는 30만원인데 고지서는 40만원"이라고 하는
 * 이유가 이것이다.
 *
 *   재산세 본세      과세표준 × 세율 (누진)
 * + 도시지역분       과세표준 × 0.14%        제112조 — 해당 지역만
 * + 지방교육세       본세 × 20%              제151조 — 도시지역분은 뺀다
 * (+ 지역자원시설세  아직 읽지 않았다)
 *
 * 그리고 과세표준이 시가표준액이 아니다. **시가표준액 × 공정시장가액비율**
 * 이고, 2026년에는 1세대 1주택에 43~45% 구간이 따로 있다. 1주택 특례세율
 * (제111조의2)은 시가표준액 9억원 이하만이다 — 2026-10-22 원문으로 고침.
 *
 * 숫자는 전부 `src/rates/local-tax-2026.json` 에서 온다. 그 값은
 * 국가법령정보센터 조문 원문에서 확인했고, 세율표는 이미지의 대체
 * 텍스트에 들어 있던 것을 조문 위치까지 대조해 옮겼다.
 */
import rates from "../rates/local-tax-2026.json";

const P = rates.propertyTax;

export type Kind = "house" | "landAggregate" | "landSeparate" | "building";

interface Bracket {
  upTo: number | null;
  rate: number;
  base: number;
}

/**
 * 과세표준 = 시가표준액 × 공정시장가액비율.
 *
 * 1세대 1주택은 2026년분에 한해 시가표준액 구간별로 43·44·45% 다.
 * 그 밖의 주택은 60%, 토지·건축물은 70%.
 */
export function taxBase(opts: {
  standardValue: number;
  kind: Kind;
  oneHome?: boolean;
}): number {
  const { standardValue, kind, oneHome = false } = opts;
  if (standardValue <= 0) return 0;

  if (kind !== "house") {
    return Math.floor(standardValue * P.taxBase.ratios.landAndBuilding);
  }
  if (!oneHome) return Math.floor(standardValue * P.taxBase.ratios.house);

  const row = P.taxBase.houseOneHouseholdOneHome2026.find(
    (r) => r.upTo === null || standardValue <= r.upTo,
  )!;
  return Math.floor(standardValue * row.ratio);
}

/** 초과누진 — 구간마다 "누적액 + 초과분 × 세율". */
function progressive(base: number, brackets: Bracket[]): number {
  if (base <= 0) return 0;
  let prevCap = 0;
  for (const b of brackets) {
    if (b.upTo === null || base <= b.upTo) {
      return Math.floor(b.base + (base - prevCap) * b.rate);
    }
    prevCap = b.upTo;
  }
  return 0;
}

/** 1세대 1주택 세율 특례(제111조의2)를 받는가 — 시가표준액 9억원 이하만. 비율 43~45%는 9억 초과도 받는다. */
export function oneHomeRateApplies(standardValue: number, oneHome: boolean): boolean {
  return oneHome && standardValue <= P.rates.houseOneHome.maxStandardValue;
}

function bracketsFor(kind: Kind, oneHome: boolean, standardValue: number): Bracket[] {
  if (kind === "house")
    return (oneHomeRateApplies(standardValue, oneHome) ? P.rates.houseOneHome : P.rates.house).brackets as Bracket[];
  if (kind === "landAggregate") return P.rates.landAggregate.brackets as Bracket[];
  if (kind === "landSeparate") return P.rates.landSeparate.brackets as Bracket[];
  return [{ upTo: null, rate: P.rates.buildingOther.rate, base: 0 }];
}

/** 재산세 본세만. 고지서 총액이 아니다. */
export function baseTax(opts: {
  standardValue: number;
  kind: Kind;
  oneHome?: boolean;
}): number {
  const { kind, oneHome = false } = opts;
  return progressive(taxBase(opts), bracketsFor(kind, oneHome, opts.standardValue));
}

export interface Bill {
  /** 시가표준액 × 공정시장가액비율 */
  base: number;
  /** 적용된 공정시장가액비율 */
  ratio: number;
  /** 재산세 본세 */
  propertyTax: number;
  /** 도시지역분 — 해당 지역이 아니면 0 */
  urbanArea: number;
  /** 지방교육세 — 본세의 20%. 도시지역분은 뺀다 */
  educationTax: number;
  /** 합계 */
  total: number;
  /** 2천원 미만이면 징수하지 않는다 */
  collected: boolean;
}

/**
 * 고지서 한 장.
 *
 * 주택은 한 해 세액을 절반씩 7월과 9월에 나눠 받으므로, 여기서 내는
 * 값은 **한 해 전체**다. 한 번에 오는 금액이 궁금하면 절반이다
 * (20만원 이하면 조례에 따라 7월에 한 번에 올 수 있다).
 */
export function bill(opts: {
  standardValue: number;
  kind: Kind;
  oneHome?: boolean;
  /** 도시지역분 적용 지역인가. 조례로 정해서 지역마다 다르다. */
  urban?: boolean;
}): Bill {
  const { standardValue, kind, oneHome = false, urban = false } = opts;
  const base = taxBase(opts);
  const ratio = standardValue > 0 ? base / standardValue : 0;
  const propertyTax = progressive(base, bracketsFor(kind, oneHome, standardValue));
  const urbanArea = urban ? Math.floor(base * P.urbanArea.rate) : 0;
  const educationTax = Math.floor(propertyTax * P.localEducationTax.rate);
  const total = propertyTax + urbanArea + educationTax;
  return {
    base,
    ratio,
    propertyTax,
    urbanArea,
    educationTax,
    total,
    collected: propertyTax >= P.minCollect.amount,
  };
}

export interface HousePage extends Bill {
  /** 같은 집을 1세대 1주택이 아닌 '그 밖의 주택'으로 볼 때의 합계 */
  generalTotal: number;
  /** 1세대 1주택 특례(비율 43~45% + 9억원 이하면 제111조의2 세율)로 줄어드는 돈 */
  oneHomeSaving: number;
  /** 합계 ÷ 시가표준액 */
  effective: number;
  /** 7월분(= 9월분) — 한 해 합계의 절반 */
  half: number;
  /** 재산세 본세가 20만원 이하라 조례로 7월에 한 번에 올 수 있다(제115조 ① 3호 단서) */
  lumpSum: boolean;
}

/**
 * 주택 재산세 계산기 한 화면.
 *
 * 1세대 1주택 특례로 줄어드는 돈은 체크 여부와 상관없이 '특례 없는 계산 −
 * 특례 계산' 이다 — 체크를 끈 사람에게도 "1주택이면 이만큼 준다"를 보여준다.
 */
export function housePage(opts: { standardValue: number; urban?: boolean; oneHome?: boolean }): HousePage {
  const { standardValue, urban = false, oneHome = false } = opts;
  const b = bill({ standardValue, kind: "house", oneHome, urban });
  const general = oneHome ? bill({ standardValue, kind: "house", oneHome: false, urban }).total : b.total;
  const special = oneHome ? b.total : bill({ standardValue, kind: "house", oneHome: true, urban }).total;
  return {
    ...b,
    generalTotal: general,
    oneHomeSaving: general - special,
    effective: standardValue > 0 ? b.total / standardValue : 0,
    half: halfInstallment(b.total),
    lumpSum: b.collected && b.propertyTax <= LUMP_SUM_UNDER,
  };
}

/** 주택은 절반씩 두 번. 7월분(= 9월분)이 얼마인가. */
export function halfInstallment(yearly: number): number {
  return Math.floor(yearly / 2);
}

/** 주택분 세액이 이 금액 이하면 조례에 따라 7월에 한 번에 올 수 있다. */
export const LUMP_SUM_UNDER = P.smallAmountLumpSum;

/** 세부담 상한 — 주택에는 적용하지 않는다(제122조 단서). */
export function burdenCapApplies(kind: Kind): boolean {
  return kind !== "house";
}

export const BURDEN_CAP = P.burdenCap;
export const BASE_CAP_RATE = P.baseCapRate;
export const ASSESSMENT_DATE = P.assessmentDate;
