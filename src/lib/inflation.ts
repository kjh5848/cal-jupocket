/**
 * 화폐가치(인플레이션) 환산 — 옛날 돈이 지금 얼마어치인지, 지금 돈이 옛날 얼마어치인지(범용, /tools/inflation/).
 *
 *   CPI 모드   환산 금액 = 금액 × (비교 연도 CPI ÷ 기준 연도 CPI)   — CPI 는 rates/cpi-2026.json(ECOS 901Y009, 2020=100)
 *              누적 상승률 = 늦은 해 CPI ÷ 이른 해 CPI − 1
 *              연평균 상승률 = (늦은 해 CPI ÷ 이른 해 CPI)^(1 ÷ 햇수) − 1
 *   직접 입력  미래 가격 = 금액 × (1 + 연 물가 상승률)^년
 *              오늘 가치 = 금액 ÷ (1 + 연 물가 상승률)^년   — /tools/compound/ '오늘 돈 가치'와 같은 식
 *
 * 상승률은 방향과 상관없이 늘 이른 해 → 늦은 해로 낸다(2025 → 1995 를 넣어도 '물가가 몇 % 올랐나'를 보여 줌).
 * 환산 금액만 넣은 방향을 따른다. 부동소수로 계산하고 화면에서만 원 단위로 반올림한다(법 끝수 규정 없음).
 * roberin #37 은 2020년 이전 CPI 를 소수 둘째 자리로 줄여 쓴다 — 우리는 ECOS 셋째 자리 그대로(테스트로 차이 고정).
 */
import cpi from "../rates/cpi-2026.json";

export const CPI: Record<number, number> = Object.fromEntries(Object.entries(cpi.annual).map(([y, v]) => [Number(y), v]));
const years = Object.keys(CPI).map(Number);
export const FIRST_YEAR = Math.min(...years);
export const LAST_YEAR = Math.max(...years);

export type CpiResult =
  | { ok: false; reason: "amount" | "year" }
  | {
      ok: true;
      /** 환산 금액(원, 부동소수) */
      value: number;
      /** 비교 연도 CPI ÷ 기준 연도 CPI */
      ratio: number;
      /** 이른 해 → 늦은 해 누적 상승률(%) */
      cumulativePct: number;
      /** 이른 해 → 늦은 해 연평균 상승률(%) — 같은 해면 0 */
      annualPct: number;
      /** 두 해 사이 햇수 */
      span: number;
      /** 과거 → 현재 쪽이면 "forward", 현재 → 과거면 "backward", 같은 해면 "same" */
      direction: "forward" | "backward" | "same";
    };

export function cpiAdjust(amount: number, from: number, to: number): CpiResult {
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "amount" };
  if (CPI[from] === undefined || CPI[to] === undefined) return { ok: false, reason: "year" };
  const ratio = CPI[to] / CPI[from];
  const early = Math.min(from, to);
  const late = Math.max(from, to);
  const span = late - early;
  const grow = CPI[late] / CPI[early];
  return {
    ok: true,
    value: amount * ratio,
    ratio,
    cumulativePct: (grow - 1) * 100,
    annualPct: span === 0 ? 0 : (Math.pow(grow, 1 / span) - 1) * 100,
    span,
    direction: from === to ? "same" : from < to ? "forward" : "backward",
  };
}

export type RateMode = "future" | "present";

export type RateResult =
  | { ok: false; reason: "amount" | "rate" | "years" }
  | { ok: true; value: number; factor: number; cumulativePct: number };

/** 직접 넣은 연 물가 상승률로 n 년 뒤 가격(future) 또는 n 년 뒤 돈의 오늘 가치(present) */
export function rateAdjust(amount: number, ratePct: number, yearsN: number, mode: RateMode): RateResult {
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "amount" };
  if (!Number.isFinite(ratePct) || ratePct <= -100) return { ok: false, reason: "rate" };
  if (!Number.isFinite(yearsN) || yearsN < 0 || yearsN > 200) return { ok: false, reason: "years" };
  const factor = Math.pow(1 + ratePct / 100, yearsN);
  return {
    ok: true,
    value: mode === "future" ? amount * factor : amount / factor,
    factor,
    cumulativePct: (factor - 1) * 100,
  };
}

export const won = (x: number) => Math.round(x);
