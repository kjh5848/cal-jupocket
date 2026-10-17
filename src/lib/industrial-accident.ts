/**
 * 산재 보험급여 — 휴업급여(산재보험법 제52조·제54조·제55조, 별표 1)와 장해급여(제57조, 별표 2).
 *
 *   평균임금 상·하한  최고 268,299원 · 최저 82,560원(2026, 고용노동부고시 제2025-84호, 제36조 ⑦)
 *                     휴업급여에는 최저 보상기준을 쓰지 않고 상한만 쓴다
 *   휴업급여          평균임금 × 70%. 70%가 최저 보상기준 × 80% 이하면 저소득 특례(제54조)
 *   장해급여          평균임금(상·하한 적용) × 별표 2 일수. 1~3급 연금만(시행령 제53조 ⑤), 4~7급 선택, 8~14급 일시금
 *
 * 저소득 특례 중 '90%가 최저 보상기준 × 80%를 넘는' 구간(2026년 평균임금 73,387~94,354원)은
 * 제54조 제2항이 미치는지 원문으로 확정하지 못해 금액을 내지 않는다(kind: "band").
 */
import r from "../rates/industrial-accident-2026.json";

const B = r.compensationBase;
const L = r.leavePay;
const D = r.disability;
const fl = (v: number) => Math.floor(v + 1e-6);

/** 저소득 특례 판단선 — 최저 보상기준 × 80% (2026년 66,048원) */
export const LOW_CAP = fl(B.min * L.lowIncome.capRatio);

export type LeaveKind = "none" | "standard" | "floor" | "band";

export interface LeavePay {
  kind: LeaveKind;
  /** 상한을 적용한 평균임금 */
  avg: number;
  /** 1일 휴업급여(원 미만 버림 표시). band 이면 null */
  daily: number | null;
  /** 61세 이상 감액 비율(별표 1). 감액 없으면 1 */
  ratio: number;
  /** 평균임금 × 70%(저소득 특례면 90%), 원 미만 버림. band 이면 0 */
  byRate: number;
  /** 90% 금액이 최저임금액보다 적어 최저임금액까지 보탠 돈(제54조 ②) */
  raise: number;
  /** 61세 이후 별표 1 비율로 줄어든 돈 */
  ageCut: number;
  /** 감액 금액이 별표 1 제3호(최저 보상기준 × 80% × 나이별 비율)보다 적어 보탠 돈 */
  floorAdd: number;
}

const ageKey = (age: number) => String(Math.min(65, Math.floor(age)));

/**
 * 1일 휴업급여. avg = 1일 평균임금, age = 휴업급여를 받는 날의 나이(61세 미만이면 감액 없음),
 * grace = 61세 이후 일하다 다쳐 요양 시작 2년 안이면 true(시행령 제51조).
 */
export function leavePayDaily(avg: number, age = 0, grace = false): LeavePay {
  const a = Math.min(Math.max(0, avg), B.max);
  const zero = { byRate: 0, raise: 0, ageCut: 0, floorAdd: 0 };
  if (a <= 0) return { kind: "none", avg: 0, daily: 0, ratio: 1, ...zero };
  const elderly = age >= 61 && !grace;
  const std = a * L.rate;
  if (std > LOW_CAP) {
    // 제52조. 61세 이상이면 별표 1 제1호, 그 금액이 제3호보다 적으면 제3호
    const byRate = fl(std);
    if (!elderly) return { kind: "standard", avg: a, daily: byRate, ratio: 1, ...zero, byRate };
    const k = ageKey(age) as keyof typeof L.elderly.standard;
    const ratio = L.elderly.standard[k];
    const item3 = LOW_CAP * L.elderly.lowIncome[k];
    const cut = fl(std * ratio);
    const daily = fl(Math.max(std * ratio, item3));
    return { kind: "standard", avg: a, daily, ratio, byRate, raise: 0, ageCut: byRate - cut, floorAdd: daily - cut };
  }
  if (a * L.lowIncome.raisedRate <= LOW_CAP) {
    // 제54조 ① 본문 금액(90%)이 최저임금액보다 적으면 최저임금액(②). 61세 이상이면 별표 1 제2호
    const byRate = fl(a * L.lowIncome.raisedRate);
    const base = Math.max(byRate, B.minWageDaily);
    const raise = base - byRate;
    if (!elderly) return { kind: "floor", avg: a, daily: base, ratio: 1, byRate, raise, ageCut: 0, floorAdd: 0 };
    const ratio = L.elderly.lowIncome[ageKey(age) as keyof typeof L.elderly.lowIncome];
    const daily = fl(base * ratio);
    return { kind: "floor", avg: a, daily, ratio, byRate, raise, ageCut: base - daily, floorAdd: 0 };
  }
  return { kind: "band", avg: a, daily: null, ratio: 1, ...zero };
}

/** 저소득 특례에서 금액을 내지 않는 평균임금 구간 [하한, 상한] */
export function bandRange(): [number, number] {
  return [fl(LOW_CAP / L.lowIncome.raisedRate) + 1, fl(LOW_CAP / L.rate)];
}

export type DisabilityPay = "annuity" | "choice" | "lump";

/** 장해급여 — 등급 1~14. 평균임금은 최고·최저 보상기준으로 맞춘다 */
export function disabilityPay(avg: number, grade: number) {
  const g = Math.min(14, Math.max(1, Math.round(grade)));
  const a = Math.min(Math.max(Math.max(0, avg), B.min), B.max);
  const key = String(g) as keyof typeof D.lumpDays;
  const lumpDays = D.lumpDays[key];
  const annuityDays = g <= 7 ? D.annuityDays[String(g) as keyof typeof D.annuityDays] : 0;
  const way: DisabilityPay = g <= D.annuityOnlyUpToGrade ? "annuity" : g <= 7 ? "choice" : "lump";
  return {
    grade: g,
    avg: a,
    lumpDays,
    annuityDays,
    way,
    lump: way === "annuity" ? 0 : fl(a * lumpDays),
    annuityYear: annuityDays ? fl(a * annuityDays) : 0,
  };
}
