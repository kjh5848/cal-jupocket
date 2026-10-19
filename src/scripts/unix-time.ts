import {
  KST, INT32_MAX, parseTimestamp, toParts, koText, isoText, secondsText, fromParts, relativeText, dateValue, timeValue, offsetText,
  type Unit,
} from "../lib/unix-time";
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

/** 그 순간의 시간대 오프셋(분). 이 기기 시간대는 서머타임이 있으면 순간마다 다르다 */
function offsetAt(ms: number): number {
  if (zoneIn.value === "utc") return 0;
  if (zoneIn.value === "device") return -new Date(ms).getTimezoneOffset();
  return KST;
}

function zoneLabel(off: number): string {
  if (zoneIn.value === "utc") return "UTC";
  if (zoneIn.value === "device") return `이 기기 시간대 (${offsetText(off)})`;
  return "한국 시간 (KST)";
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

const ERR: Record<string, string> = {
  empty: "타임스탬프를 넣어 주세요",
  format: "숫자만 넣어 주세요 (지수 표기 1e9 는 안 됩니다)",
  "ms-fraction": "밀리초는 정수만 됩니다 — 소수가 있으면 단위를 '초'로",
  "too-precise": "초는 소수 셋째 자리(밀리초)까지만 됩니다",
  range: "1900년 1월 1일 ~ 9999년 12월 30일(UTC) 사이 값만 바꿉니다",
};

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
    set("ts-hint", unitIn.value === "ms" ? "밀리초로 적었습니다." : "초로 적었습니다.");
  }
  set("hero-label", zoneLabel(off));
  set("hero-value", koText(p));
  set("hero-sub", zoneIn.value === "utc" ? `한국 시간 ${koText(toParts(ms, KST))}` : `UTC ${isoText(ms, 0)}`);
  set("v-sec", secondsText(ms));
  set("v-ms", String(ms));
  set("v-iso", isoText(ms, 0));
  set("v-iso-local", isoText(ms, off));
  set("v-rel", relativeText(ms - Date.now()));

  const notes: string[] = [];
  if (ms > INT32_MAX * 1000) notes.push("32비트 정수 초(최대 2,147,483,647 = 2038-01-19 03:14:07 UTC)를 넘는 시각입니다 — 오래된 시스템은 담지 못할 수 있습니다.");
  if (ms < 0) notes.push("1970년 이전이라 음수입니다 — 하루 86,400초를 거꾸로 센 값입니다.");
  set("note", notes.join(" "));

  lastLines = [
    ["타임스탬프(초)", secondsText(ms)],
    ["밀리초", String(ms)],
    [zoneLabel(off), koText(p)],
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
  set(
    "ts-hint",
    unitIn.value === "auto"
      ? `${digits}자리 — ${r.unit === "s" ? "초" : "밀리초"}로 읽었습니다. 아니면 단위를 고르세요.`
      : `${r.unit === "s" ? "초" : "밀리초"}로 읽었습니다.`,
  );
  render(r.ms, "dates");
}

function fromDates() {
  const msPart = msecIn.value.trim() === "" ? 0 : Number(msecIn.value);
  const ms = partsToMs(dateIn.value, timeIn.value || "00:00:00", msPart);
  if (ms === null) return clear("날짜·시각을 확인해 주세요 (밀리초는 0~999)");
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

const buildCard = () => renderCard({ title: "유닉스 타임스탬프", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "unix-time" });
  downloadCard(buildCard(), "unix-time-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "unix-time" });
  await shareCard(buildCard(), "유닉스 타임스탬프 변환 - jupocket.com");
});

fromTs();
// '지금' 줄과 지금과의 차이는 초마다 흐른다
function tick() {
  const n = Date.now();
  set("now-line", `지금: ${Math.floor(n / 1000)} 초 · ${n} 밀리초`);
  if (current !== null) set("v-rel", relativeText(current - n));
}
tick();
setInterval(tick, 1000);
