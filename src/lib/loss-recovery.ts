/**
 * 손실 원금 복구 — 잃은 만큼이 아니라 줄어든 금액에서 다시 올라야 하므로 필요한 상승률이 더 크다(범용, /tools/loss-recovery/).
 *
 *   손실률 L = 1 − 평가액 ÷ 원금
 *   필요 상승률 g = 원금 ÷ 평가액 − 1 = L ÷ (1 − L)
 *   팔 때 비용 f(매도 금액의 %)를 넣으면 손에 쥐는 돈이 원금이 되도록
 *     목표 평가액 = 원금 ÷ (1 − f),  g = 목표 평가액 ÷ 평가액 − 1
 *   회복 기간(연 수익률 r 가정, 월 단위로 처음 닿는 달) = ceil(12 × ln(1 + g) ÷ ln(1 + r))
 *     — 연 r 을 월 (1 + r)^(1/12) 로 나눠 복리로 본다. 1,200개월(100년)을 넘으면 '100년 넘게'.
 *   날짜별 종가: 첫 줄 종가를 산 값으로 보고 평가액 = 원금 × 마지막 종가 ÷ 첫 종가.
 *     최대 낙폭 = 그때까지 최고 종가 대비 가장 크게 떨어진 비율(고점 날짜 → 저점 날짜).
 *
 * 법 숫자가 없는 산술이다. 매도 비용(증권거래세·수수료)은 사람마다 달라 직접 넣게 했다 — 국내 주식 세율은
 * /guide/stock-breakeven/ 이 원문(rates/stock-trade-2026.json)으로 다룬다.
 * roberin #39 는 입력·결과 항목만 대조했다(docs/calc-benchmark.md).
 */

export const MAX_MONTHS = 1200;

export type RecoveryResult =
  | { ok: false; reason: "principal" | "current" | "fee" }
  | {
      ok: true;
      principal: number;
      current: number;
      /** 원금 대비 손익률(%) — 손실이면 음수 */
      changePct: number;
      /** 평가 손익(원) */
      pnl: number;
      /** 비용 넣은 목표 평가액(원) */
      target: number;
      /** 원금까지 필요한 상승률(%, 비용 포함) — 이미 넘었으면 0 */
      needPct: number;
      /** 비용 빼고 본 필요 상승률(%) */
      needPctNoFee: number;
      /** 원금까지 부족한 금액(원, 비용 포함) — 이미 넘었으면 0 */
      shortfall: number;
      /** 지금 팔아도 원금 이상인가(비용 뺀 뒤) */
      above: boolean;
      /** 평가액 0 — 몇 %가 올라도 돌아오지 않는다 */
      wiped: boolean;
    };

export function recovery(principal: number, current: number, feePct = 0): RecoveryResult {
  if (!Number.isFinite(principal) || principal <= 0) return { ok: false, reason: "principal" };
  if (!Number.isFinite(current) || current < 0) return { ok: false, reason: "current" };
  if (!Number.isFinite(feePct) || feePct < 0 || feePct >= 100) return { ok: false, reason: "fee" };
  const f = feePct / 100;
  const target = principal / (1 - f);
  const changePct = (current / principal - 1) * 100;
  const pnl = current - principal;
  if (current === 0) {
    return { ok: true, principal, current, changePct, pnl, target, needPct: Infinity, needPctNoFee: Infinity, shortfall: target, above: false, wiped: true };
  }
  const above = current >= target;
  const needPct = above ? 0 : (target / current - 1) * 100;
  const needPctNoFee = Math.max(0, (principal / current - 1) * 100);
  const shortfall = above ? 0 : target - current;
  return { ok: true, principal, current, changePct, pnl, target, needPct, needPctNoFee, shortfall, above, wiped: false };
}

/** 손실률(%)로 평가액을 만든다 — 0 이상 100 이하 */
export function currentFromLoss(principal: number, lossPct: number): number | null {
  if (!Number.isFinite(principal) || principal <= 0) return null;
  if (!Number.isFinite(lossPct) || lossPct < 0 || lossPct > 100) return null;
  return principal * (1 - lossPct / 100);
}

/** 손실률 L(%) → 필요 상승률(%) = L ÷ (1 − L) */
export function needFromLoss(lossPct: number): number {
  const l = lossPct / 100;
  if (l >= 1) return Infinity;
  return (l / (1 - l)) * 100;
}

/**
 * 연 수익률 annualPct 로 needPct 만큼 오르는 데 걸리는 개월 수(처음 닿는 달).
 * 0 이하 수익률이면 null(닿지 않음), MAX_MONTHS 를 넘으면 Infinity.
 */
export function recoveryMonths(needPct: number, annualPct: number): number | null {
  if (!(needPct > 0)) return 0;
  if (!Number.isFinite(needPct)) return null;
  if (!Number.isFinite(annualPct) || annualPct <= 0) return null;
  const m = Math.ceil((12 * Math.log(1 + needPct / 100)) / Math.log(1 + annualPct / 100) - 1e-9);
  return m > MAX_MONTHS ? Infinity : m;
}

export function formatMonths(m: number | null): string {
  if (m === null) return "닿지 않음";
  if (m === Infinity) return "100년 넘게";
  if (m === 0) return "이미 원금";
  const y = Math.floor(m / 12);
  const r = m % 12;
  if (y === 0) return `${r}개월`;
  return r === 0 ? `${y}년` : `${y}년 ${r}개월`;
}

export type Close = { date: string | null; price: number };

/**
 * 한 줄에 '날짜, 종가' 또는 종가만. 날짜는 2026-09-01 · 2026.9.1 · 2026/09/01 · 9/1 꼴을 그대로 둔다.
 * 숫자가 없는 줄(머리줄 등)은 건너뛴다. 종가는 줄의 마지막 숫자(쉼표 자릿수 허용).
 */
export function parseCloses(text: string): Close[] {
  const out: Close[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const dm = line.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{1,2}[-./]\d{1,2})/);
    const rest = dm ? line.slice(0, dm.index) + " " + line.slice(dm.index! + dm[0].length) : line;
    const nums = rest.match(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g);
    if (!nums) continue;
    const price = Number(nums[nums.length - 1].replace(/,/g, ""));
    if (!(price > 0)) continue;
    out.push({ date: dm ? dm[0] : null, price });
  }
  return out;
}

export type SeriesResult =
  | { ok: false; reason: "principal" | "few" | "fee" }
  | {
      ok: true;
      first: Close;
      last: Close;
      /** 마지막 종가 기준 평가 */
      rec: Extract<RecoveryResult, { ok: true }>;
      /** 전날 대비(%) */
      dayPct: number;
      /** 최대 낙폭(%, 0 이하) */
      mddPct: number;
      /** 최대 낙폭 고점·저점 위치(0부터) */
      peakIdx: number;
      troughIdx: number;
      /** 기간 최고 종가와 그 위치 */
      highest: number;
      highestIdx: number;
      /** 최고 종가까지 필요한 상승률(%) */
      toHighPct: number;
      /** 하루 평균 등락 — 단순 평균·복리(기하) 평균(%), 등락 횟수 */
      avgSimplePct: number;
      avgCompoundPct: number;
      steps: number;
    };

export function series(principal: number, closes: Close[], feePct = 0): SeriesResult {
  if (!Number.isFinite(principal) || principal <= 0) return { ok: false, reason: "principal" };
  if (closes.length < 2) return { ok: false, reason: "few" };
  const first = closes[0];
  const last = closes[closes.length - 1];
  const rec = recovery(principal, (principal * last.price) / first.price, feePct);
  if (!rec.ok) return { ok: false, reason: rec.reason === "fee" ? "fee" : "principal" };
  let peak = first.price;
  let peakAt = 0;
  let mdd = 0;
  let peakIdx = 0;
  let troughIdx = 0;
  let highest = first.price;
  let highestIdx = 0;
  let sum = 0;
  for (let i = 1; i < closes.length; i++) {
    const p = closes[i].price;
    sum += p / closes[i - 1].price - 1;
    if (p > peak) {
      peak = p;
      peakAt = i;
    }
    const dd = p / peak - 1;
    if (dd < mdd) {
      mdd = dd;
      peakIdx = peakAt;
      troughIdx = i;
    }
    if (p > highest) {
      highest = p;
      highestIdx = i;
    }
  }
  const steps = closes.length - 1;
  return {
    ok: true,
    first,
    last,
    rec,
    dayPct: (last.price / closes[closes.length - 2].price - 1) * 100,
    mddPct: mdd * 100,
    peakIdx,
    troughIdx,
    highest,
    highestIdx,
    toHighPct: (highest / last.price - 1) * 100,
    avgSimplePct: (sum / steps) * 100,
    avgCompoundPct: (Math.pow(last.price / first.price, 1 / steps) - 1) * 100,
    steps,
  };
}
