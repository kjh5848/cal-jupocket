/**
 * 주식 수익률 — 수수료·증권거래세·농어촌특별세를 뺀 실제 손익(roberin #17, 페이지는 다음 회차).
 *
 * 매도 때만 세금이 붙는다. 세율은 시장마다 다르고(증권거래세법 시행령 제5조), 코스피만 농특세가 더 붙는다
 * (농어촌특별세법 제5조 ① 5호). rates: stock-trade-2026.json.
 *
 * 정한 규칙(테스트로 고정):
 * - 매수 원가 = 매수 금액 + 매수 수수료, 매도 정산액 = 매도 금액 − 매도 수수료 − 거래세 − 농특세.
 * - 순손익 = 정산액 − 원가, 순수익률 = 순손익 ÷ 원가.
 * - 수수료·세금은 각각 원 미만 버림(해석 — rates rounding). 정수·BigInt 로 계산해 0.05% 같은 소수 오차를 피한다.
 * - 본전·목표 매도가 = 그 가격 이상이면 순손익이 늘 목표 이상인 가장 낮은 원 단위 가격.
 *   끝수 때문에 1원 오를 때 순손익이 잠깐 줄 수 있어(수량 1주 등) 어림값 근처를 훑어 정한다.
 */
import rates from "../rates/stock-trade-2026.json";

export type Market = keyof typeof rates.markets;
export const MARKETS = Object.keys(rates.markets) as Market[];

export interface StockInput {
  /** 매수 단가(원, 평균 단가) */
  buyPrice: number;
  /** 수량(주) */
  qty: number;
  /** 매도 단가(원) */
  sellPrice: number;
  /** 증권사 수수료율(%, 매수·매도 같게), 예: 0.015 */
  feePct: number;
  market: Market;
}

export interface StockResult {
  buyAmount: number;
  buyFee: number;
  /** 매수 원가 = 매수 금액 + 매수 수수료 */
  cost: number;
  sellAmount: number;
  sellFee: number;
  /** 증권거래세 */
  tax: number;
  /** 농어촌특별세(코스피만) */
  rural: number;
  /** 매도 정산액 */
  proceeds: number;
  profit: number;
  /** 순수익률(소수, 0.0974 = 9.74%) */
  returnRate: number;
  /** 비용 전 주가 변동(소수) */
  priceChange: number;
  /** 수수료 둘 + 세금 */
  costs: number;
}

/** 수수료율(%)을 1/10000 % 정수로 — 0.015 → 150 */
const micro = (pct: number) => Math.round(pct * 10_000);
const big = (n: number) => BigInt(Math.floor(n));

/** 금액 × 수수료율, 원 미만 버림 */
export function feeOf(amount: number, feePct: number): number {
  if (amount <= 0 || feePct <= 0) return 0;
  return Number((big(amount) * BigInt(micro(feePct))) / 1_000_000n);
}

/** 금액 × 1만분의 n, 원 미만 버림 */
const perTenThousand = (amount: number, n: number) => (amount <= 0 || n <= 0 ? 0 : Number((big(amount) * BigInt(n)) / 10_000n));

export function sellTaxes(sellAmount: number, market: Market): { tax: number; rural: number } {
  const m = rates.markets[market];
  return { tax: perTenThousand(sellAmount, m.tax), rural: perTenThousand(sellAmount, m.rural) };
}

export function stockReturn(input: StockInput): StockResult {
  const qty = Math.max(0, Math.floor(input.qty));
  const buyAmount = Math.max(0, Math.floor(input.buyPrice)) * qty;
  const sellAmount = Math.max(0, Math.floor(input.sellPrice)) * qty;
  const buyFee = feeOf(buyAmount, input.feePct);
  const sellFee = feeOf(sellAmount, input.feePct);
  const { tax, rural } = sellTaxes(sellAmount, input.market);
  const cost = buyAmount + buyFee;
  const proceeds = sellAmount - sellFee - tax - rural;
  const profit = proceeds - cost;
  return {
    buyAmount,
    buyFee,
    cost,
    sellAmount,
    sellFee,
    tax,
    rural,
    proceeds,
    profit,
    returnRate: cost > 0 ? profit / cost : 0,
    priceChange: input.buyPrice > 0 ? (input.sellPrice - input.buyPrice) / input.buyPrice : 0,
    costs: buyFee + sellFee + tax + rural,
  };
}

/**
 * 순수익률이 targetPct(%) 이상이 되는 가장 낮은 매도 단가 — 그 위 어느 가격에서도 목표 아래로 내려가지 않는다.
 * targetPct 0 이면 본전 매도가, 음수면 비용까지 넣은 손절 가격.
 */
export function priceForReturn(input: Omit<StockInput, "sellPrice">, targetPct = 0): number | null {
  const qty = Math.floor(input.qty);
  if (qty <= 0 || input.buyPrice <= 0) return null;
  const cost = stockReturn({ ...input, sellPrice: input.buyPrice }).cost;
  const m = rates.markets[input.market];
  // 매도 금액 1원당 빠지는 몫(수수료 + 세금), 끝수 없이
  const drag = micro(input.feePct) / 1_000_000 + (m.tax + m.rural) / 10_000;
  if (drag >= 1) return null;
  const t = micro(targetPct);
  // 목표 순이익 = 원가 × 목표율 — 비교는 정수로: 순손익 × 1e6 ≥ 원가 × t
  const ok = (p: number) => BigInt(stockReturn({ ...input, sellPrice: p }).profit) * 1_000_000n >= BigInt(cost) * BigInt(t);
  const exact = (cost * (1 + targetPct / 100)) / (qty * (1 - drag));
  // 끝수 버림으로 비용이 덜 빠지는 몫은 세목 셋(수수료·거래세·농특세) 합쳐 3원 미만
  const hi = Math.max(1, Math.ceil(exact) + 1);
  const lo = Math.max(0, Math.floor(exact - 4 / (qty * (1 - drag))) - 1);
  for (let p = hi; p >= lo; p--) if (!ok(p)) return p + 1;
  return lo;
}
