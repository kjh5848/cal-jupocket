/**
 * 한 달 실수령액을 하루·시간으로 나눠 본다 — 법 숫자 없는 달력 나눗셈.
 *
 *   계산 기준일   기준 월의 날짜 수(주 7일) · 토·일 뺀 날(주 5일) · 일요일 뺀 날(주 6일) · 직접 입력
 *   실근무시간    하루 근무시간 − 휴게시간
 *   하루 금액     월 금액 ÷ 계산 기준일
 *   근무시간당    월 금액 ÷ (계산 기준일 × 실근무시간)
 *
 * 공휴일·대체공휴일은 세지 않는다(관공서 공휴일 규정을 넣지 않았다). 원 미만은 버린다.
 * 실제 시급·일급(근로계약·주휴수당)과는 다르다 — 그건 시급 계산기·통상임금 계산기가 한다.
 */
export type WorkPattern = "all" | "weekdays" | "noSunday" | "custom";

/** 기준 월(1~12)의 날짜 수 */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 기준 월에서 근무 패턴에 맞는 날 수 — custom 은 customDays 를 그대로(1~31로 자름) */
export function workDaysInMonth(year: number, month: number, pattern: WorkPattern, customDays = 0): number {
  const n = daysInMonth(year, month);
  if (pattern === "all") return n;
  if (pattern === "custom") return Math.min(31, Math.max(0, Math.floor(customDays || 0)));
  let count = 0;
  for (let d = 1; d <= n; d++) {
    const wd = new Date(Date.UTC(year, month - 1, d)).getUTCDay(); // 0 일요일 · 6 토요일
    if (wd === 0) continue;
    if (pattern === "weekdays" && wd === 6) continue;
    count++;
  }
  return count;
}

export interface PerDayInput {
  /** 한 달 금액(실수령액) */
  monthly: number;
  year: number;
  month: number;
  pattern: WorkPattern;
  customDays?: number;
  /** 하루 근무시간(기본 8) */
  hours?: number;
  /** 휴게시간(기본 0) */
  breakHours?: number;
}

const fl = (v: number) => Math.floor(v + 1e-6);

export function payPerDay(i: PerDayInput) {
  const monthly = Math.max(0, fl(i.monthly || 0));
  const days = workDaysInMonth(i.year, i.month, i.pattern, i.customDays);
  const hours = Math.max(0, Math.min(24, i.hours ?? 8));
  const breakHours = Math.max(0, Math.min(hours, i.breakHours ?? 0));
  const workHours = hours - breakHours;
  const perDay = days > 0 ? fl(monthly / days) : 0;
  const perWorkHour = days > 0 && workHours > 0 ? fl(monthly / (days * workHours)) : 0;
  return { monthly, days, monthDays: daysInMonth(i.year, i.month), workHours, perDay, perWorkHour };
}

/**
 * 물건 가격 ÷ 근무시간당 실수령 — 그 돈을 벌려면 몇 시간 일해야 하나.
 *   필요한 분 = 가격 × 계산 기준일 × 실근무시간 × 60 ÷ 월 금액 (분 미만 버림)
 * 근무시간당 금액을 원 미만에서 버리기 전 값으로 나눈다. 근무일은 소수 첫째 자리까지.
 */
export function workTimeFor(price: number, monthly: number, days: number, workHours: number) {
  const p = Math.max(0, fl(price || 0));
  if (!(monthly > 0) || !(days > 0) || !(workHours > 0) || p === 0) return { minutes: 0, hours: 0, mins: 0, workDays: 0 };
  const minutes = fl((p * days * workHours * 60) / monthly);
  return { minutes, hours: Math.floor(minutes / 60), mins: minutes % 60, workDays: Math.floor((minutes / (workHours * 60)) * 10 + 1e-6) / 10 };
}

/**
 * 일한 시간만큼 쌓인 실수령액 — 근무 중 누적 표시용.
 *   누적 = 월 금액 × 경과 초 ÷ (계산 기준일 × 실근무시간 × 3600) (원 미만 버림)
 * 근무시간당 금액을 버리기 전 비율로 곱해 오래 켜 둬도 끝수가 쌓이지 않는다. 분당은 원 미만 버림, 초당은 소수 첫째 자리 버림.
 */
export function earnedFor(monthly: number, days: number, workHours: number, seconds: number) {
  const m = Math.max(0, fl(monthly || 0));
  const s = Math.max(0, Math.floor(seconds || 0));
  if (!(m > 0) || !(days > 0) || !(workHours > 0)) return { earned: 0, perMinute: 0, perSecond: 0 };
  const total = days * workHours * 3600;
  return {
    earned: fl((m * s) / total),
    perMinute: fl((m * 60) / total),
    perSecond: Math.floor((m * 10) / total + 1e-6) / 10,
  };
}
