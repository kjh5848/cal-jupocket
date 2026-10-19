import {
  KST, INT32_MAX, parseTimestamp, toParts, koText, jaText, isoText, secondsText, fromParts, relativeText, relativeTextJa,
  dateValue, timeValue, offsetText,
  type Unit,
} from "../lib/unix-time";
import { pageLocale } from "../i18n/ui";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("unix-time");

const $ = (id: string) => document.getElementById(id)!;
const zoneIn = $("zone") as HTMLSelectElement;
const tsIn = $("ts") as HTMLInputElement;
const unitIn = $("unit") as HTMLSelectElement;
const dateIn = $("date") as HTMLInputElement;
const timeIn = $("time") as HTMLInputElement;
const msecIn = $("msec") as HTMLInputElement;

const set = (id: string, text: string) => ($(id).textContent = text);

/**
 * 화면 문구 — 한국어판(/tools/unix-time/)과 일본어판(/ja/tools/unix-time/)이 같은 계산(lib/unix-time.ts)을 쓴다.
 * 시간대 값 "kst" 는 UTC+9(540분) — 일본 표준시(東経135度)도 같은 값이라 일본어판은 이름만 JST 로 부른다.
 */
const KO = {
  text: koText,
  rel: relativeText,
  utc: "UTC",
  device: (o: string) => `이 기기 시간대 (${o})`,
  home: "한국 시간 (KST)",
  homeSub: (t: string) => `한국 시간 ${t}`,
  utcSub: (t: string) => `UTC ${t}`,
  msWrote: "밀리초로 적었습니다.",
  sWrote: "초로 적었습니다.",
  int32: "32비트 정수 초(최대 2,147,483,647 = 2038-01-19 03:14:07 UTC)를 넘는 시각입니다 — 오래된 시스템은 담지 못할 수 있습니다.",
  negative: "1970년 이전이라 음수입니다 — 하루 86,400초를 거꾸로 센 값입니다.",
  lineSec: "타임스탬프(초)",
  lineMs: "밀리초",
  err: {
    empty: "타임스탬프를 넣어 주세요",
    format: "숫자만 넣어 주세요 (지수 표기 1e9 는 안 됩니다)",
    "ms-fraction": "밀리초는 정수만 됩니다 — 소수가 있으면 단위를 '초'로",
    "too-precise": "초는 소수 셋째 자리(밀리초)까지만 됩니다",
    range: "1900년 1월 1일 ~ 9999년 12월 30일(UTC) 사이 값만 바꿉니다",
  } as Record<string, string>,
  unitName: (u: "s" | "ms") => (u === "s" ? "초" : "밀리초"),
  readAuto: (n: number, u: string) => `${n}자리 — ${u}로 읽었습니다. 아니면 단위를 고르세요.`,
  read: (u: string) => `${u}로 읽었습니다.`,
  badDate: "날짜·시각을 확인해 주세요 (밀리초는 0~999)",
  cardTitle: "유닉스 타임스탬프",
  shareText: "유닉스 타임스탬프 변환 - jupocket.com",
  now: (s: number, ms: number) => `지금: ${s} 초 · ${ms} 밀리초`,
};

const JA: typeof KO = {
  text: jaText,
  rel: relativeTextJa,
  utc: "UTC",
  device: (o: string) => `この端末のタイムゾーン（${o}）`,
  home: "日本時間（JST）",
  homeSub: (t: string) => `日本時間 ${t}`,
  utcSub: (t: string) => `UTC ${t}`,
  msWrote: "ミリ秒で書きました。",
  sWrote: "秒で書きました。",
  int32: "32ビット整数の秒（最大 2,147,483,647 = 2038-01-19 03:14:07 UTC）を超える時刻です。古いシステムでは扱えないことがあります。",
  negative: "1970年より前なので負の数です。1日 86,400秒を逆向きに数えた値です。",
  lineSec: "UNIX時間（秒）",
  lineMs: "ミリ秒",
  err: {
    empty: "タイムスタンプを入れてください",
    format: "数字だけを入れてください（1e9 のような指数表記は使えません）",
    "ms-fraction": "ミリ秒は整数だけです。小数があるときは単位を「秒」にしてください",
    "too-precise": "秒は小数第3位（ミリ秒）までです",
    range: "1900年1月1日〜9999年12月30日（UTC）の間の値だけ変換します",
  },
  unitName: (u: "s" | "ms") => (u === "s" ? "秒" : "ミリ秒"),
  readAuto: (n: number, u: string) => `${n}桁なので${u}として読みました。違うときは単位を選んでください。`,
  read: (u: string) => `${u}として読みました。`,
  badDate: "日付・時刻を確かめてください（ミリ秒は0〜999）",
  cardTitle: "UNIX時間 変換",
  shareText: "UNIX時間 変換 - jupocket.com",
  now: (s: number, ms: number) => `現在：${s} 秒 · ${ms} ミリ秒`,
};

const S = pageLocale() === "ja" ? JA : KO;

/** 그 순간의 시간대 오프셋(분). 이 기기 시간대는 서머타임이 있으면 순간마다 다르다 */
function offsetAt(ms: number): number {
  if (zoneIn.value === "utc") return 0;
  if (zoneIn.value === "device") return -new Date(ms).getTimezoneOffset();
  return KST;
}

function zoneLabel(off: number): string {
  if (zoneIn.value === "utc") return S.utc;
  if (zoneIn.value === "device") return S.device(offsetText(off));
  return S.home;
}

/** 이 기기 시간대 날짜 칸을 밀리초로 — 오프셋이 바뀌는 날(서머타임)도 맞게 두 번 맞춘다 */
function partsToMs(date: string, time: string, msPart: number): number | null {
  if (zoneIn.value !== "device") return fromParts(date, time, msPart, offsetAt(0));
  const guess = fromParts(date, time, msPart, 0);
  if (guess === null) return null;
  const first = fromParts(date, time, msPart, offsetAt(guess));
  return first === null ? null : fromParts(date, time, msPart, offsetAt(first));
}

let current: number | null = null;
let lastLines: [string, string][] = [];

const ERR = S.err;

function clear(msg: string) {
  current = null;
  set("hero-label", msg);
  set("hero-value", "—");
  set("hero-sub", "");
  for (const id of ["v-sec", "v-ms", "v-iso", "v-iso-local", "v-rel"]) set(id, "—");
  set("note", "");
}

/** 결과 칸을 ms 하나로 다시 그린다. fill 이면 반대쪽 입력 칸도 맞춘다 */
function render(ms: number, fill: "dates" | "ts" | "both" | "none") {
  current = ms;
  const off = offsetAt(ms);
  const p = toParts(ms, off);
  if (fill === "dates" || fill === "both") {
    dateIn.value = dateValue(p);
    timeIn.value = timeValue(p);
    msecIn.value = String(p.ms);
  }
  if (fill === "ts" || fill === "both") {
    tsIn.value = unitIn.value === "ms" ? String(ms) : secondsText(ms);
    set("ts-hint", unitIn.value === "ms" ? S.msWrote : S.sWrote);
  }
  set("hero-label", zoneLabel(off));
  set("hero-value", S.text(p));
  set("hero-sub", zoneIn.value === "utc" ? S.homeSub(S.text(toParts(ms, KST))) : S.utcSub(isoText(ms, 0)));
  set("v-sec", secondsText(ms));
  set("v-ms", String(ms));
  set("v-iso", isoText(ms, 0));
  set("v-iso-local", isoText(ms, off));
  set("v-rel", S.rel(ms - Date.now()));

  const notes: string[] = [];
  if (ms > INT32_MAX * 1000) notes.push(S.int32);
  if (ms < 0) notes.push(S.negative);
  set("note", notes.join(" "));

  lastLines = [
    [S.lineSec, secondsText(ms)],
    [S.lineMs, String(ms)],
    [zoneLabel(off), S.text(p)],
    ["UTC", isoText(ms, 0)],
  ];
}

function fromTs() {
  const r = parseTimestamp(tsIn.value, unitIn.value as Unit);
  if (!r.ok) {
    set("ts-hint", ERR[r.error]);
    return clear(ERR[r.error]);
  }
  const digits = tsIn.value.replace(/[\s,_+-]/g, "").split(".")[0].replace(/^0+(?=\d)/, "").length;
  set("ts-hint", unitIn.value === "auto" ? S.readAuto(digits, S.unitName(r.unit)) : S.read(S.unitName(r.unit)));
  render(r.ms, "dates");
}

function fromDates() {
  const msPart = msecIn.value.trim() === "" ? 0 : Number(msecIn.value);
  const ms = partsToMs(dateIn.value, timeIn.value || "00:00:00", msPart);
  if (ms === null) return clear(S.badDate);
  render(ms, "ts");
}

tsIn.addEventListener("input", () => {
  reportUse(1);
  fromTs();
});
unitIn.addEventListener("change", () => {
  reportUse(1);
  fromTs();
});
for (const el of [dateIn, timeIn, msecIn]) {
  el.addEventListener("input", () => {
    reportUse(1);
    fromDates();
  });
}
// 시간대를 바꾸면 숫자는 그대로 두고 날짜 칸을 그 시간대로 다시 적는다
zoneIn.addEventListener("change", () => {
  reportUse(1);
  if (current !== null) render(current, "dates");
  else fromDates();
});
$("btn-now").addEventListener("click", () => {
  reportUse(1);
  const ms = Date.now();
  render(unitIn.value === "ms" ? ms : Math.floor(ms / 1000) * 1000, "both");
});

const buildCard = () => renderCard({ title: S.cardTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "unix-time" });
  downloadCard(buildCard(), "unix-time-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "unix-time" });
  await shareCard(buildCard(), S.shareText);
});

fromTs();
// '지금' 줄과 지금과의 차이는 초마다 흐른다
function tick() {
  const n = Date.now();
  set("now-line", S.now(Math.floor(n / 1000), n));
  if (current !== null) set("v-rel", S.rel(current - n));
}
tick();
setInterval(tick, 1000);
