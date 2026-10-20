/**
 * 12時間表記 ↔ 24時間表記(일본어판 /ja/tools/time-12-24/) — 같은 시각을 '午後3時40分' ↔ '15:40' 로 바꿔 쓴다.
 *
 * 한국어판(lib/time-12-24.ts)과 셈(하루 24시, 분 정수 0 ~ 1439)은 같지만 12시 쪽 표기 규칙이 달라 따로 둔다
 * (한국어판은 12:00 = 오후 12:00, 0:00 = 오전 12:00).
 *
 * 근거(e-Gov 법령 API, 2026-10-21 확인):
 * - 明治五年太政官布告第三百三十七号(改暦ノ布告, 105DF0000000337) — 본문 '子刻ヨリ午刻迄ヲ十二時ニ分チ午前幾時ト称シ
 *   午刻ヨリ子刻迄ヲ十二時ニ分チ午後幾時ト称候事', 時刻表 '午前 零時 即午後十二時 子刻 … 十二時 午刻 / 午後 一時 … 十二時 子刻'.
 *   → 0:00 = 午前0時(= 午後12時), 12:00 = 午前12時(午刻), 午後는 午刻부터 子刻까지.
 * - 현행 법령의 '午後零時' — 人事院規則九―一五 '午前八時三十分から午後零時三十分まで', 人事院規則二〇―〇
 *   '午後零時から午後一時までを除く'(e-Gov 키워드 검색 2026-10-21). → 12:00 ~ 12:59 를 午後0時台로 쓰는 0時 기준 표기.
 *
 * 정한 규칙(테스트로 고정):
 * - 화면의 12時間表記는 0時 기준: 0:00 ~ 11:59 = 午前0時 ~ 午前11時59分, 12:00 ~ 23:59 = 午後0時 ~ 午後11時59分.
 *   0:00·12:00 두 시각만 布告 시각표의 다른 이름(午後12時·午前12時)을 함께 보인다(alt12).
 * - 입력 午前12時·午後12時 는 0분일 때만 받는다(午前12時 = 12:00 正午, 午後12時 = 그날이 끝나는 子刻 = 다음 날 0:00).
 *   午前12時30分·午後12時30分 은 布告 시각표에 없는 표기라 받지 않는다 — 午後0時30分·午前0時30分 으로 넣는다.
 * - AM·PM 은 영어 디지털 시계 표기로 읽는다(12:30 AM = 0:30, 12:30 PM = 12:30). 법 근거가 아니라 이 계산기의 읽는 방법.
 * - 24時間表記는 0 ~ 23時. 24:00·25時 같은 표기는 받지 않는다. 초는 받지 않는다. 全角 숫자·コロン은 半角으로 읽는다.
 * - 深夜·朝·夜 같은 말은 받지 않는다(몇 시인지 정한 원문 없음).
 */

export const MIN_PER_DAY = 1440;
export const NOON = 720;

export interface ParsedJa {
  /** 0時부터 센 분, 0 ~ 1439 */
  min: number;
  /** 넣은 표기가 어느 쪽이었나 */
  from: "12" | "24";
  /** '午後12時' 로 넣었다 — 그날이 끝나는 시각이라 다음 날 0:00 */
  dayEnd?: boolean;
}

const p2 = (n: number) => String(n).padStart(2, "0");

/** 시·분 꼬리 — '3:40' · '3時40分' · '3時' · '3時半' · '0340'(4자리) */
function hm(s: string): [number, number] | null {
  let m = /^(\d{1,2})(?::(\d{2}))?$/.exec(s);
  if (m) return [Number(m[1]), m[2] === undefined ? 0 : Number(m[2])];
  m = /^(\d{1,2})時(?:(\d{1,2})分|半)?$/.exec(s);
  if (m) return [Number(m[1]), s.endsWith("半") ? 30 : m[2] === undefined ? 0 : Number(m[2])];
  m = /^(\d{2})(\d{2})$/.exec(s);
  if (m) return [Number(m[1]), Number(m[2])];
  return null;
}

/**
 * 시각 한 칸 → 분. 못 읽으면 null.
 * '午後3時40分' · '午後3:40' · '15:40' · '15時40分' · '1540' · '正午' · '3:40 PM' · '１５：４０'
 */
export function parseTimeJa(raw: string): ParsedJa | null {
  let s = raw.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, "").replace(/\./g, "");
  if (s === "") return null;
  if (s === "正午") return { min: NOON, from: "12" };

  let kind: "am" | "pm" | "午前" | "午後" | null = null;
  const pre = /^(午前|午後|am|pm)/.exec(s);
  const post = /(am|pm)$/.exec(s);
  if (pre) {
    kind = pre[1] as typeof kind;
    s = s.slice(pre[1].length);
  } else if (post) {
    kind = post[1] as typeof kind;
    s = s.slice(0, -2);
  }

  const t = hm(s);
  if (!t) return null;
  const [h, mi] = t;
  if (mi > 59) return null;

  if (kind === null) {
    if (h > 23) return null;
    return { min: h * 60 + mi, from: "24" };
  }
  if (kind === "午前" || kind === "午後") {
    if (h <= 11) return { min: (h + (kind === "午後" ? 12 : 0)) * 60 + mi, from: "12" };
    if (h === 12 && mi === 0) return kind === "午前" ? { min: NOON, from: "12" } : { min: 0, from: "12", dayEnd: true };
    return null;
  }
  if (h < 1 || h > 12) return null;
  return { min: ((h % 12) + (kind === "pm" ? 12 : 0)) * 60 + mi, from: "12" };
}

/** '15:40' — 두 자리 시 */
export function text24(min: number): string {
  return `${p2(Math.floor(min / 60))}:${p2(min % 60)}`;
}

/** '午後3時40分' · '午前0時'(0분이면 분을 뺌) — 0時 기준 */
export function textJa(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h < 12 ? "午前" : "午後"}${h % 12}時${m ? `${m}分` : ""}`;
}

/** '午後3:40' — 0時 기준, 콜론 표기 */
export function colonJa(min: number): string {
  const h = Math.floor(min / 60);
  return `${h < 12 ? "午前" : "午後"}${h % 12}:${p2(min % 60)}`;
}

/** '3:40 PM' — 영어 디지털 시계 표기 */
export function textEn(min: number): string {
  const h = Math.floor(min / 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${p2(min % 60)} ${h < 12 ? "AM" : "PM"}`;
}

/** 布告 시각표의 다른 이름 — 0:00 은 午後12時(전날이 끝나는 시각), 12:00 은 午前12時(午刻), 나머지는 빈 문자열 */
export function alt12(min: number): string {
  return min === 0 ? "午後12時" : min === NOON ? "午前12時" : "";
}

/** 0時 ~ 23時 표 — [24時間表記, 12時間表記(0時 기준)] 24행 */
export function hourTableJa(): [string, string][] {
  return Array.from({ length: 24 }, (_, h) => [text24(h * 60), textJa(h * 60)]);
}
