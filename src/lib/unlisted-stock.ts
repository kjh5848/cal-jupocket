/**
 * 비상장주식을 상속·증여할 때 "얼마로 쳐서" 세금을 매기나.
 *
 * 29번 글(property-valuation)이 부동산의 가액을 답했고, 그 글은 마지막에
 * "비상장주식은 제63조의 별도 평가규정이 적용된다"고만 적고 넘어갔다.
 * 이 파일이 그 칸이다.
 *
 * 부동산과 갈리는 자리는 하나다. 부동산의 보충적 평가는 국가가 이미
 * 고시해 둔 값(공시가격)을 가져다 쓰는 일이지만, 비상장주식은 고시된
 * 값이 없어서 **재무제표에서 두 개의 가치를 직접 계산해 섞는다.**
 * 그래서 이 파일에는 부동산 쪽에 없던 산식이 들어온다.
 *
 * 세 개의 식이 전부 조문에 이미지로 실려 있어 본문 텍스트로는 읽히지
 * 않는다. img 의 alt 에 LaTeX 로 들어 있는 것을 읽어 옮겼다:
 *
 *   순손익가치 = 1주당 최근 3년 순손익액 가중평균액 ÷ 환원율
 *   순자산가치 = 순자산가액 ÷ 발행주식총수
 *   가중평균액 = {(1년전 × 3) + (2년전 × 2) + (3년전 × 1)} ÷ 6
 *
 * 숫자와 조문은 전부 rates/unlisted-stock-2026.json 에서 온다.
 *
 * 다루지 않는 것(rates 의 notVerified 참조): 순손익액의 세무조정 가감
 * 항목, 유상증자·감자 환산율, 영업권 평가액, 양도소득세·증권거래세.
 */
import rates from "../rates/unlisted-stock-2026.json";

/** 원 단위. 1주당 가액은 원 미만을 버린다. */
const won = (n: number) => Math.floor(Math.max(0, n));

/* ── 조문이 정한 상수 ─────────────────────────────────────── */

/** 순손익가치 : 순자산가치 = 3 : 2 (시행령 제54조 제1항). */
export const profitWeight: number = rates.weightedAverage.profitWeight;
export const assetWeight: number = rates.weightedAverage.assetWeight;

/** 부동산과다보유법인은 2 : 3 으로 뒤집힌다. */
export const realEstateHeavyProfitWeight: number =
  rates.weightedAverage.realEstateHeavyProfitWeight;
export const realEstateHeavyAssetWeight: number =
  rates.weightedAverage.realEstateHeavyAssetWeight;

/** 가중평균액의 하한 — 순자산가치의 80%. */
export const floorPercent: number =
  rates.weightedAverage.floorPercentOfAssetValue;

/** 순손익가치환원율 — 연 10% (시행규칙 제17조). */
export const capitalizationRatePercent: number =
  rates.profitValue.capitalizationRatePercent;

/** 최근 3년의 가중치 3 : 2 : 1, 나누는 수는 6 (시행령 제56조 제1항). */
export const yearWeights: number[] = rates.profitValue.yearWeights;
export const yearWeightDivisor: number = rates.profitValue.yearWeightDivisor;

/** 최대주주등 할증 20% (법 제63조 제3항). */
export const premiumPercent: number =
  rates.majorShareholderPremium.premiumPercent;

/** 순자산가치로만 평가하는 경우 (시행령 제54조 제4항). */
export const assetOnlyCases = rates.assetValueOnly.cases;

/** 최대주주 할증에서 빠지는 것 (시행령 제53조 제8항). */
export const premiumExclusions = rates.majorShareholderPremium.excluded;

/** 평가심의위원회를 쓸 수 있는 범위 — 보충적 평가액의 70~130%. */
export const committeeBand = {
  lower: rates.committee.lowerBoundPercent,
  upper: rates.committee.upperBoundPercent,
};

/* ── 계산 ─────────────────────────────────────────────────── */

/**
 * 1주당 최근 3년간의 순손익액의 가중평균액 (시행령 제56조 제1항).
 *
 * 가까운 해일수록 무겁다. 인자는 [1년 전, 2년 전, 3년 전] 순서다.
 * 음수이면 영으로 한다 — 조문 후단이 그렇게 정한다. 적자라고 평가액이
 * 마이너스로 내려가지는 않는다.
 */
export function weightedProfit(perShareByYear: [number, number, number]): number {
  const sum = perShareByYear.reduce((acc, v, i) => acc + v * yearWeights[i], 0);
  return Math.max(rates.profitValue.negativeFloor, sum / yearWeightDivisor);
}

/**
 * 1주당 순손익가치 = 가중평균액 ÷ 환원율.
 *
 * 환원율이 10% 라는 것은 **가중평균 순이익의 10배**라는 뜻이다.
 * 나눗셈으로 적혀 있어 눈에 안 들어오는데, 이 배수가 이 평가에서
 * 순손익이 얼마나 세게 작용하는지를 결정한다.
 */
export function profitValue(perShareByYear: [number, number, number]): number {
  return won(weightedProfit(perShareByYear) / (capitalizationRatePercent / 100));
}

/** 환원율을 배수로 바꿔 말한 것 — 10% → 10배. */
export const profitMultiple = 100 / rates.profitValue.capitalizationRatePercent;

/**
 * 1주당 순자산가치 = 순자산가액 ÷ 발행주식총수 (시행령 제54조 제2항).
 *
 * 순자산가액이 0원 이하이면 0원으로 한다(시행령 제55조 제1항).
 */
export function assetValue(netAssets: number, shares: number): number {
  if (shares <= 0) return 0;
  return won(Math.max(rates.assetValue.netAssetFloor, netAssets) / shares);
}

export interface ValuationInput {
  /** [평가기준일 이전 1년, 2년, 3년] 사업연도의 1주당 순손익액. */
  perShareProfitByYear: [number, number, number];
  /** 평가기준일 현재의 순자산가액. */
  netAssets: number;
  /** 평가기준일 현재의 발행주식총수. */
  shares: number;
  /** 부동산과다보유법인이면 가중치가 2 : 3 으로 뒤집힌다. */
  realEstateHeavy?: boolean;
  /** 순자산가치로만 평가하는 경우(시행령 제54조 제4항). */
  assetOnly?: boolean;
  /** 최대주주등의 주식이고 할증 제외에 걸리지 않으면 20% 가산. */
  majorShareholder?: boolean;
}

export interface Valuation {
  /** 1주당 순손익가치. */
  profit: number;
  /** 1주당 순자산가치. */
  asset: number;
  /** 가중평균한 가액 (하한 적용 전). */
  weighted: number;
  /** 순자산가치의 80% — 하한. */
  floor: number;
  /** 하한·순자산가치전용을 적용한 뒤의 1주당 가액. */
  base: number;
  /** 하한이 실제로 가액을 끌어올렸나. */
  floorApplied: boolean;
  /** 최대주주 할증액. */
  premium: number;
  /** 최종 1주당 가액. */
  perShare: number;
  /** 쓰인 가중치 — 표시용. */
  weights: { profit: number; asset: number };
}

/**
 * 1주당 평가액을 낸다.
 *
 * 순서가 중요하다. 가중평균 → 하한(순자산가치의 80%) → 할증(20%) 이다.
 * 할증은 "제1항에 따라 평가한 가액"에 붙으므로(법 제63조 제3항) 하한이
 * 먼저 적용된 뒤의 가액에 붙는다.
 */
export function valuate(input: ValuationInput): Valuation {
  const profit = profitValue(input.perShareProfitByYear);
  const asset = assetValue(input.netAssets, input.shares);

  const wp = input.realEstateHeavy ? realEstateHeavyProfitWeight : profitWeight;
  const wa = input.realEstateHeavy ? realEstateHeavyAssetWeight : assetWeight;
  const weighted = won((profit * wp + asset * wa) / (wp + wa));

  const floor = won((asset * floorPercent) / 100);

  // 순자산가치로만 평가하는 경우에는 가중평균도 하한도 거치지 않는다.
  let base: number;
  let floorApplied = false;
  if (input.assetOnly) {
    base = asset;
  } else if (weighted < floor) {
    base = floor;
    floorApplied = true;
  } else {
    base = weighted;
  }

  const premium = input.majorShareholder ? won((base * premiumPercent) / 100) : 0;

  return {
    profit,
    asset,
    weighted,
    floor,
    base,
    floorApplied,
    premium,
    perShare: base + premium,
    weights: { profit: wp, asset: wa },
  };
}

/** 총 평가액 = 1주당 가액 × 주식 수. */
export function totalValue(v: Valuation, shareCount: number): number {
  return won(v.perShare * shareCount);
}
