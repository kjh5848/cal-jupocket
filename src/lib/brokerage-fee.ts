/**
 * 부동산 중개보수(복비) 상한 — 공인중개사법 시행규칙 제20조, [별표 1]·[별표 2] (rates: brokerage-fee-2026.json).
 * 주택은 거래금액 구간별 상한요율 × 거래금액, 앞 두 구간은 한도액까지. 요건 갖춘 오피스텔은 매매 0.5%·임대차 0.4%,
 * 그 밖(상가·토지 등)은 0.9% 이내. 월세는 보증금 + 월세 × 100(합이 5천만원 미만이면 × 70)을 거래금액으로 본다.
 */
import r from "../rates/brokerage-fee-2026.json";

export type BrokerProperty = "housing" | "officetel" | "other";
export type BrokerDeal = "sale" | "jeonse" | "monthly";

export interface BrokerageInput {
  property: BrokerProperty;
  deal: BrokerDeal;
  /** 매매·교환 거래금액 또는 전세 보증금 */
  amount?: number;
  /** 월세일 때 보증금 */
  deposit?: number;
  /** 월세일 때 월 차임 */
  monthlyRent?: number;
  /** 협의 요율(%) — 상한보다 높으면 상한으로 */
  agreedPct?: number;
}

export interface BrokerageResult {
  /** 요율을 곱하는 거래금액 */
  base: number;
  /** 월세 환산에 쓴 배수(100·70), 월세가 아니면 0 */
  multiplier: number;
  /** 상한요율(천분율) */
  capPermille: number;
  /** 구간 한도액, 없으면 null */
  capAmount: number | null;
  /** 법정 상한 중개보수(일방) */
  maxFee: number;
  /** 실제 쓴 요율(%) — 협의 요율이 있으면 그 값(상한 이하) */
  appliedPct: number;
  /** 협의 요율이 상한을 넘어 잘렸는지 */
  agreedClamped: boolean;
  /** 적용 요율로 낸 중개보수(일방) */
  fee: number;
  /** 일반과세자면 더해지는 부가세 10% */
  vat: number;
  /** fee + vat */
  feeWithVat: number;
  /** 매수인·매도인(임차인·임대인) 둘 다 낸 합계(부가세 제외) */
  bothSides: number;
  /** 거래금액이 한도액에 걸려 요율보다 적게 나왔는지 */
  hitCap: boolean;
}

type Band = { below: number | null; permille: number; cap: number | null };

/** 월세 거래금액 — 제20조 ⑤ 1호. ×100 합이 5천만원 미만일 때만 ×70 */
export function monthlyRentBase(deposit: number, rent: number): { base: number; multiplier: number } {
  const m = r.monthlyRent;
  const big = deposit + rent * m.multiplier;
  if (big < m.smallBelow) return { base: deposit + rent * m.smallMultiplier, multiplier: m.smallMultiplier };
  return { base: big, multiplier: m.multiplier };
}

/** 주택 별표 1 구간 — 'A 이상 B 미만' */
export function housingBand(base: number, lease: boolean): Band {
  const bands = (lease ? r.housing.lease : r.housing.sale) as Band[];
  return bands.find((b) => b.below === null || base < b.below)!;
}

export function brokerageFee(input: BrokerageInput): BrokerageResult {
  const lease = input.deal !== "sale";
  const clean = (n?: number) => Math.max(0, Math.floor(n ?? 0));
  let base = clean(input.amount);
  let multiplier = 0;
  if (input.deal === "monthly") ({ base, multiplier } = monthlyRentBase(clean(input.deposit), clean(input.monthlyRent)));

  let capPermille: number;
  let capAmount: number | null = null;
  if (input.property === "housing") {
    const b = housingBand(base, lease);
    capPermille = b.permille;
    capAmount = b.cap;
  } else if (input.property === "officetel") {
    capPermille = lease ? r.officetel.leasePermille : r.officetel.salePermille;
  } else {
    capPermille = r.other.permille;
  }

  const byRate = (permille: number) => Math.floor((base * permille) / 1000);
  const limit = (n: number) => (capAmount === null ? n : Math.min(n, capAmount));
  const maxFee = limit(byRate(capPermille));

  const capPct = capPermille / 10;
  const agreed = input.agreedPct;
  const hasAgreed = agreed !== undefined && Number.isFinite(agreed) && agreed > 0;
  const agreedClamped = hasAgreed && agreed! > capPct;
  const appliedPct = hasAgreed && !agreedClamped ? agreed! : capPct;
  // 협의 요율은 소수 퍼센트라 천분율 정수로 바꾸지 않고 바로 곱한다(원 미만 버림)
  const fee = hasAgreed && !agreedClamped ? limit(Math.floor((base * Math.round(agreed! * 1000)) / 100_000)) : maxFee;
  const vat = Math.floor(fee * r.vatRate);

  return {
    base,
    multiplier,
    capPermille,
    capAmount,
    maxFee,
    appliedPct,
    agreedClamped,
    fee,
    vat,
    feeWithVat: fee + vat,
    bothSides: fee * 2,
    hitCap: capAmount !== null && byRate(capPermille) > capAmount,
  };
}
