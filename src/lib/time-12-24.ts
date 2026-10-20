/**
 * 12·24시간제 변환(/tools/time-12-24/) — 같은 시각을 '오후 3:40' ↔ '15:40' 로 바꿔 쓴다.
 *
 * 시각은 '그날 0시부터 센 분' 정수 하나(0 ~ 1439)로 다룬다. 24→12 표기는 시간 계산기의 ampmText 를 그대로 써서
 * 두 도구가 같은 표기를 낸다(0시 = 오전 12:00, 12시 = 오후 12:00).
 *
 * 기준(rates/time-12-24-2026.json): 표준국어대사전 — 오전 = 밤 열두 시부터 낮 열두 시까지, 오후 = 낮 열두 시부터
 * 밤 열두 시까지, 정오 = 낮 열두 시, 자정 = 밤 열두 시. 낮 12시가 두 범위의 끝점이라 사전만으로는 12:00 이 어느 쪽인지
 * 갈리지 않는다 — 12:00 을 오후로 쓰는 것은 관례이고, 그래서 결과에 '정오'·'자정' 을 함께 보인다.
 *
 * 정한 규칙(테스트로 고정):
 * - 한 칸에 아무 표기나 넣는다. 오전·오후·AM·PM·정오·자정이 있으면 12시간제로, 없으면 24시간제로 읽는다.
 * - 12시간제 시는 1~12, 그리고 '오전 0시'·'오후 0시'(0시를 그대로 쓰는 표기)를 받는다. '오후 13:00' 은 오류.
 * - 24시간제 시는 0~23. 24:00 은 받지 않는다 — 다음 날 00:00(자정)으로 넣는다.
 * - 밤·낮·새벽·저녁 같은 말은 받지 않는다 — '밤 1시' 가 01시인지 13시인지 정한 원문이 없다(자정 = 밤 열두 시만 사전에 있음).
 * - 초는 받지 않는다(분까지).
 */
import { ampmText } from "./time-calc";

export const MIN_PER_DAY = 1440;
export const NOON = 720;

export type Clock = "12" | "24";

export interface Parsed {
  /** 0시부터 센 분, 0 ~ 1439 */
  min: number;
  /** 넣은 표기가 어느 쪽이었나 */
  from: Clock;
}

const p2 = (n: number) => String(n).padStart(2, "0");

/** 시·분 꼬리 — '3:40' · '3:5' 는 안 받음 · '3시 40분' · '3시' · '0340'(4자리) */
function hm(s: string): [number, number] | null {
  let m = /^(\d{1,2})(?::(\d{2}))?$/.exec(s);
  if (m) return [Number(m[1]), m[2] === undefined ? 0 : Number(m[2])];
  m = /^(\d{1,2})시(?:(\d{1,2})분)?$/.exec(s);
  if (m) return [Number(m[1]), m[2] === undefined ? 0 : Number(m[2])];
  m = /^(\d{2})(\d{2})$/.exec(s);
  if (m) return [Number(m[1]), Number(m[2])];
  return null;
}

/**
 * 시각 한 칸 → 분. 못 읽으면 null.
 * '오후 3:40' · '오후 3시 40분' · '3:40 PM' · '3pm' · 'p.m. 3:40' · '정오' · '자정' · '15:40' · '15시 40분' · '1540'
 */
export function parseTime(raw: string): Parsed | null {
  let s = raw.trim().toLowerCase().replace(/\s+/g, "").replace(/\./g, "");
  if (s === "") return null;
  if (s === "정오" || s === "낮12시") return { min: NOON, from: "12" };
  if (s === "자정" || s === "밤12시") return { min: 0, from: "12" };

  let pm: boolean | null = null;
  const pre = /^(오전|오후|am|pm)/.exec(s);
  const post = /(am|pm)$/.exec(s);
  if (pre) {
    pm = pre[1] === "오후" || pre[1] === "pm";
    s = s.slice(pre[1].length);
  } else if (post) {
    pm = post[1] === "pm";
    s = s.slice(0, -2);
  }

  const t = hm(s);
  if (!t) return null;
  const [h, mi] = t;
  if (mi > 59) return null;

  if (pm === null) {
    if (h > 23) return null;
    return { min: h * 60 + mi, from: "24" };
  }
  if (h > 12) return null;
  const h24 = (h % 12) + (pm ? 12 : 0);
  return { min: h24 * 60 + mi, from: "12" };
}

/** '15:40' — 두 자리 시 */
export function text24(min: number): string {
  return `${p2(Math.floor(min / 60))}:${p2(min % 60)}`;
}

/** '오후 3:40' — 시간 계산기와 같은 표기 */
export function text12(min: number): string {
  return ampmText(min);
}

/** '오후 3시 40분' · '오전 12시'(0분이면 분을 뺌) — 말로 읽는 표기 */
export function spoken(min: number): string {
  const h = Math.floor(min / 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const m = min % 60;
  return `${h < 12 ? "오전" : "오후"} ${h12}시${m ? ` ${m}분` : ""}`;
}

/** '3:40 PM' — 영어 표기 */
export function textEn(min: number): string {
  const h = Math.floor(min / 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${p2(min % 60)} ${h < 12 ? "AM" : "PM"}`;
}

/** 경계 이름 — 0:00 은 자정, 12:00 은 정오, 나머지는 빈 문자열 */
export function boundary(min: number): "자정" | "정오" | "" {
  return min === 0 ? "자정" : min === NOON ? "정오" : "";
}

/** 0시 ~ 23시 표 — [24시간제, 12시간제] 24행 */
export function hourTable(): [string, string][] {
  return Array.from({ length: 24 }, (_, h) => [text24(h * 60), text12(h * 60)]);
}
