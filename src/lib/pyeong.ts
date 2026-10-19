/**
 * 평수 계산기(/tools/pyeong/) — 평 · ㎡ · ft² 바꾸기와 전용·공급면적 추정.
 *
 * 1평 = 400/121 ㎡(자 10/33 m × 6자 정사각형), 1 ft² = 0.3048² = 0.09290304 ㎡ — rates/pyeong-2026.json.
 * 400/121 을 3.3058 같은 소수로 미리 줄이지 않고 분수 그대로 곱하고 나눈 뒤, 화면에 낼 때만
 * 소수 둘째 자리로 맞춘다(round2). 전용률 환산은 법 공식이 아니라 추정 — 공급 = 전용 ÷ 전용률.
 */
import { round2 } from "./percent";

export type AreaUnit = "pyeong" | "m2" | "ft2";
export type AreaBasis = "exclusive" | "supply";

/** 1단위가 몇 ㎡ 인가 */
const M2_PER: Record<AreaUnit, number> = {
  pyeong: 400 / 121,
  m2: 1,
  ft2: 0.09290304,
};

export function toM2(value: number, unit: AreaUnit): number {
  return value * M2_PER[unit];
}

export function fromM2(m2: number, unit: AreaUnit): number {
  // 평은 121/400 을 곱해 ㎡ → 평의 부동소수 오차를 줄인다(84 ㎡ → 25.41 평이 정확히 떨어짐)
  return unit === "pyeong" ? (m2 * 121) / 400 : m2 / M2_PER[unit];
}

export interface Areas {
  m2: number;
  pyeong: number;
  ft2: number;
}

/** 한 면적을 세 단위로 — 반올림 전 값 */
export function allUnits(m2: number): Areas {
  return { m2, pyeong: fromM2(m2, "pyeong"), ft2: fromM2(m2, "ft2") };
}

export interface PyeongResult {
  /** 넣은 면적(넣은 기준 — 전용이거나 공급) */
  given: Areas;
  /** 전용률로 추정한 반대쪽 면적. 전용률이 없거나 범위 밖이면 null */
  other: Areas | null;
}

/**
 * 면적 하나 → 세 단위 + 반대쪽(전용 ↔ 공급) 추정.
 * 전용률은 % (0 초과 100 이하). 음수·0·숫자 아님 면적은 null.
 */
export function pyeong(value: number, unit: AreaUnit, basis: AreaBasis, ratioPct: number): PyeongResult | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const m2 = toM2(value, unit);
  const okRatio = Number.isFinite(ratioPct) && ratioPct > 0 && ratioPct <= 100;
  const otherM2 = !okRatio ? null : basis === "supply" ? (m2 * ratioPct) / 100 : (m2 * 100) / ratioPct;
  return { given: allUnits(m2), other: otherM2 === null ? null : allUnits(otherM2) };
}

export interface AreaRatioResult {
  supply: Areas;
  exclusive: Areas;
  /** 공용면적 = 공급 − 전용 */
  common: Areas;
  /** 전용률 % = 전용 ÷ 공급 × 100 (반올림 전) */
  ratioPct: number;
  /** 분양가를 넣었을 때만 — 원, 반올림 전. 공급·전용 어느 쪽으로 나눴는지 둘 다 */
  price: { perPyeongSupply: number; perM2Supply: number; perPyeongExclusive: number; perM2Exclusive: number } | null;
}

/**
 * 분양 공고의 두 면적(㎡) → 전용률·공용면적, 분양가(원)를 넣으면 평당·㎡당 값(roberin #57 방향).
 * 전용이 공급보다 크거나 0 이하·숫자 아님이면 null. 분양가가 0 이하·숫자 아님이면 price 만 null.
 */
export function areaRatio(supplyM2: number, exclusiveM2: number, priceWon = NaN): AreaRatioResult | null {
  if (!(supplyM2 > 0) || !(exclusiveM2 > 0) || exclusiveM2 > supplyM2) return null;
  const supply = allUnits(supplyM2);
  const exclusive = allUnits(exclusiveM2);
  const price =
    priceWon > 0
      ? {
          perPyeongSupply: priceWon / supply.pyeong,
          perM2Supply: priceWon / supplyM2,
          perPyeongExclusive: priceWon / exclusive.pyeong,
          perM2Exclusive: priceWon / exclusiveM2,
        }
      : null;
  return {
    supply,
    exclusive,
    common: allUnits(supplyM2 - exclusiveM2),
    ratioPct: (exclusiveM2 / supplyM2) * 100,
    price,
  };
}

/** 가로 × 세로(m) → ㎡. 둘 중 하나라도 0 이하면 null */
export function rectM2(widthM: number, depthM: number): number | null {
  if (!(widthM > 0) || !(depthM > 0)) return null;
  return widthM * depthM;
}

/** 화면 표기 — 소수 둘째 자리 반올림, 끝 0 은 남긴다(면적은 99.10 처럼 자리를 맞춰 읽음) */
export function fmtArea(x: number): string {
  return round2(x).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
