/**
 * 퇴직금(지급액) — 근로자퇴직급여 보장법 제8조 제1항(1년에 30일분 이상의 평균임금), 제4조 제1항 단서(1년 미만·주 15시간 미만 제외),
 * 근로기준법 제2조 제1항 제6호·제2항(평균임금, 통상임금 하한). 일수 비례·상여 3/12·퇴직일은 고용노동부 퇴직금 계산 안내.
 * rates: severance-2026.json pay·pay.byDays
 *
 * 1일 평균임금은 끊지 않고(고용노동부도 전 단위까지 보여 준다) 최종 퇴직금만 원 미만 버린다 — 원문에 단수 규정이 없다.
 * 평균임금 계산에서 빼는 기간(근로기준법 시행령 제2조: 수습·휴업·육아휴직 등)은 넣지 않았다.
 */
import r from "../rates/severance-2026.json";
import { daysInLastThreeMonths } from "./unemployment";

const B = r.pay.byDays;
const DAY = 86_400_000;
/** 원 미만 버림 — 부동소수점 오차 보정 */
const fl = (v: number) => Math.floor(v + 1e-6);

/** "2026-10-18" → 그 날 0시(로컬). 잘못된 값이면 null */
export function parseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const diffDays = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY);

/** 퇴직일 = 마지막 근무일 다음 날(고용노동부) */
export const retireDateOf = (lastWorkDay: Date) => addDays(lastWorkDay, 1);

/** 재직일수 — 입사일부터 마지막 근무일까지, 양 끝 포함 */
export const serviceDays = (start: Date, lastWorkDay: Date) => Math.max(0, diffDays(start, lastWorkDay) + 1);

/** 계속근로 1년 이상 — 퇴직일이 입사일의 1년 뒤 같은 날 이후. 2/29 입사는 다음 해 3/1 */
export function oneYearServed(start: Date, lastWorkDay: Date): boolean {
  return retireDateOf(lastWorkDay).getTime() >= new Date(start.getFullYear() + 1, start.getMonth(), start.getDate()).getTime();
}

/** 평균임금 산정 기간 — 퇴직일 3개월 전 날부터 퇴직일 전날(=마지막 근무일)까지. 입사가 더 늦으면 입사일부터 */
export function wagePeriod(start: Date, lastWorkDay: Date) {
  const retire = retireDateOf(lastWorkDay);
  const days = Math.min(daysInLastThreeMonths(retire), serviceDays(start, lastWorkDay));
  return { from: addDays(retire, -days), to: lastWorkDay, days };
}

export interface SeverancePayInput {
  start: Date;
  lastWorkDay: Date;
  /** 퇴직 전 3개월 세전 임금 총액(기본급·수당) */
  wages3m: number;
  /** 최근 1년 상여금 총액 */
  annualBonus: number;
  /** 퇴직 전에 이미 생긴(전년도분) 못 쓴 연차의 수당 총액 */
  leavePay: number;
  /** 1일 통상임금(모르면 0) */
  dailyOrdinary: number;
  /** 4주 평균 주 소정근로시간 15시간 이상 */
  over15h: boolean;
}

export function severancePayByDays(o: SeverancePayInput) {
  const days = serviceDays(o.start, o.lastWorkDay);
  const period = wagePeriod(o.start, o.lastWorkDay);
  const bonusAdd = Math.max(0, o.annualBonus) * B.bonusShare;
  const leaveAdd = Math.max(0, o.leavePay) * B.bonusShare;
  const total3m = Math.max(0, o.wages3m) + bonusAdd + leaveAdd;
  const average = period.days > 0 ? total3m / period.days : 0;
  const ordinary = Math.max(0, o.dailyOrdinary);
  const applied = Math.max(average, ordinary);
  const amount = fl((applied * r.pay.daysPerYear * days) / B.daysInYear);
  const year = oneYearServed(o.start, o.lastWorkDay);
  return {
    serviceDays: days,
    retireDate: retireDateOf(o.lastWorkDay),
    period,
    bonusAdd,
    leaveAdd,
    total3m,
    average,
    applied,
    usedOrdinary: ordinary > average,
    amount,
    oneYear: year,
    /** 법정 퇴직금 대상(제4조 제1항 단서) */
    eligible: year && o.over15h,
  };
}
