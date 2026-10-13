/**
 * 신고·납부 기한 — 국세기본법 제5조 제1항.
 * 기한이 토요일·일요일이면 다음 날로 미룬다. 공휴일·대체공휴일·노동절도
 * 미뤄지지만 공휴일 달력은 여기서 들고 있지 않다 — 호출하는 쪽이 넘긴다.
 */
export function shiftToBusinessDay(d: Date, holidays: string[] = []): Date {
  const x = new Date(d.getTime());
  for (;;) {
    const iso = x.toISOString().slice(0, 10);
    const dow = x.getUTCDay();
    if (dow !== 0 && dow !== 6 && !holidays.includes(iso)) return x;
    x.setUTCDate(x.getUTCDate() + 1);
  }
}

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
export const iso = (d: Date) => d.toISOString().slice(0, 10);

/** "2027년 1월 25일(월)" */
export function koDate(d: Date): string {
  const w = "일월화수목금토"[d.getUTCDay()];
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${w})`;
}

/**
 * 부가세 확정신고 기한 — 부가가치세법 제49조·제67조.
 * 과세기간이 끝난 달의 다음 달 25일(폐업이면 폐업일이 속한 달의 다음 달 25일).
 */
export function vatFinalDeadline(periodEndYear: number, periodEndMonth: number, holidays: string[] = []): Date {
  const y = periodEndMonth === 12 ? periodEndYear + 1 : periodEndYear;
  const m = periodEndMonth === 12 ? 1 : periodEndMonth + 1;
  return shiftToBusinessDay(utc(y, m, 25), holidays);
}
