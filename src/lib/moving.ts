/**
 * 이사 — 손없는날(음력 9·10·19·20·29·30일)과 주택 임대차 신고 대상.
 *
 * 음력 날짜는 계산으로 만들지 않는다. 한국천문연구원 음양력 변환에서 받은 음력 각 달의
 * 시작일·일수(rates/lunar-2026.json)로만 양력을 음력으로 옮긴다. 표 밖의 날짜는 throw —
 * 확인하지 않은 음력을 화면에 내지 않기 위해서다.
 *
 * 임대차 신고 기준: 부동산 거래신고 등에 관한 법률 제6조의2 ①, 시행령 제4조의3 ①
 * (rates/moving-2026.json leaseReport).
 */
import lunar from "../rates/lunar-2026.json";
import m from "../rates/moving-2026.json";
import holidays from "../rates/kr-holidays-2026.json";

const DAY = 86_400_000;
const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** 음력 끝자리가 9·0 인 날 — 민간 풍습에서 '손(귀신)이 없다'고 보는 날. 30일은 큰달에만 있다. */
export const SON_DAYS = [9, 10, 19, 20, 29, 30] as const;

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  leap: boolean;
}

/** 양력 YYYY-MM-DD → 음력. 표(lunar-2026.json) 범위 밖이면 throw. */
export function toLunar(date: string): LunarDate {
  const t = ms(date);
  for (const mo of lunar.months) {
    const start = ms(mo.solarStart);
    const d = Math.round((t - start) / DAY);
    if (d >= 0 && d < mo.days) return { year: mo.lunarYear, month: mo.lunarMonth, day: d + 1, leap: mo.leap };
  }
  throw new Error(`음력 표 범위 밖: ${date} (${lunar.range.from} ~ ${lunar.range.to})`);
}

export const isSonDay = (date: string) => (SON_DAYS as readonly number[]).includes(toLunar(date).day);

const holidayName = new Map(holidays.holidays.map((h) => [h.date, h.name]));
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

export interface SonDay {
  date: string;
  /** 양력 일 */
  day: number;
  weekday: string;
  lunar: LunarDate;
  /** 토·일·공휴일 */
  offDay: boolean;
  holiday?: string;
}

/** 표가 양력 한 달을 통째로 덮는지 */
export function covers(year: number, month: number): boolean {
  const first = Date.UTC(year, month - 1, 1);
  const last = Date.UTC(year, month, 0);
  return first >= ms(lunar.range.from) && last <= ms(lunar.range.to);
}

/** 양력 year년 month월의 손없는날. 그 달이 표 밖이면 throw. */
export function sonDays(year: number, month: number): SonDay[] {
  if (!covers(year, month)) throw new Error(`음력 표가 ${year}년 ${month}월을 다 덮지 않는다`);
  const out: SonDay[] = [];
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let d = 1; d <= last; d++) {
    const t = Date.UTC(year, month - 1, d);
    const date = iso(t);
    const l = toLunar(date);
    if (!(SON_DAYS as readonly number[]).includes(l.day)) continue;
    const w = new Date(t).getUTCDay();
    const holiday = holidayName.get(date);
    out.push({ date, day: d, weekday: WEEK[w], lunar: l, offDay: w === 0 || w === 6 || !!holiday, holiday });
  }
  return out;
}

/** 표가 통째로 덮는 양력 달 목록(오래된 것부터) — 페이지의 월별 표가 쓴다. */
export function coveredMonths(): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = [];
  const from = new Date(ms(lunar.range.from));
  let y = from.getUTCFullYear();
  let mo = from.getUTCMonth() + 1;
  for (let i = 0; i < 40; i++) {
    if (covers(y, mo)) out.push({ year: y, month: mo });
    mo++;
    if (mo > 12) {
      mo = 1;
      y++;
    }
  }
  return out;
}

/**
 * 주택 임대차 계약 신고 대상 금액인가 — 보증금 6천만원 초과 또는 월 차임 30만원 초과(시행령 제4조의3 ①).
 * 지역(같은 조 ②)과 '금액 변동 없는 기간 연장 갱신 제외'는 화면이 안내한다.
 */
export function leaseReportRequired(deposit: number, monthlyRent: number): boolean {
  return deposit > m.leaseReport.depositOver || monthlyRent > m.leaseReport.monthlyRentOver;
}
