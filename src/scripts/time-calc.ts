import { parseAt, toMinutes, shiftAt, atText, ampmText, dayShiftText, splitText, between, hoursText, atParts } from "../lib/time-calc";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("time-calc");

const $ = (id: string) => document.getElementById(id)!;
const val = (id: string) => ($(id) as HTMLInputElement).value;
const set = (id: string, text: string) => ($(id).textContent = text);

let lastLines: [string, string][] = [];

/** ① 시작 일시 ± 일·시간·분 */
function calcA() {
  const sign = val("a-op") === "-1" ? -1 : 1;
  const start = parseAt(val("a-date"), val("a-time"));
  const mins = toMinutes(val("a-d"), val("a-h"), val("a-m"));
  const fail = (msg: string) => {
    set("a-label", msg);
    set("a-hero", "—");
    set("a-sub", "");
    for (const id of ["a-from", "a-span", "a-hours", "a-mins"]) set(id, "—");
    set("a-note", "");
    lastLines = [];
  };
  if (start === null) return fail("시작 날짜·시각을 확인해 주세요");
  if (mins === null) return fail("일·시간·분은 0 이상의 정수로 넣어 주세요");
  const end = shiftAt(start, mins, sign);
  if (end === null) return fail("1900년 1월 1일 ~ 9999년 12월 30일 사이만 셉니다");
  const span = splitText(mins);
  set("a-label", `${span} ${sign > 0 ? "뒤" : "전"}`);
  set("a-hero", atText(end));
  set("a-sub", `${ampmText(end)} · ${dayShiftText(start, end)}`);
  set("a-from", atText(start));
  set("a-span", span);
  set("a-hours", `${hoursText(mins)}시간`);
  set("a-mins", `${mins.toLocaleString("ko-KR")}분`);
  set("a-note", mins === 0 ? "기간이 0이라 시작 시각 그대로입니다." : "");
  lastLines = [
    ["시작", atText(start)],
    [sign > 0 ? "더한 기간" : "뺀 기간", span],
    ["결과", atText(end)],
  ];
}

/** ② 두 일시 사이 */
function calcB() {
  const s = parseAt(val("b-sdate"), val("b-stime"));
  const e = parseAt(val("b-edate"), val("b-etime"));
  if (s === null || e === null) {
    set("b-label", "날짜·시각을 확인해 주세요");
    set("b-hero", "—");
    for (const id of ["b-hours", "b-mins", "b-hm"]) set(id, "—");
    set("b-note", "");
    return;
  }
  const b = between(s, e);
  set("b-label", b.sign < 0 ? "사이 (끝이 시작보다 이릅니다)" : "사이");
  set("b-hero", splitText(b.total));
  set("b-sub", `${atText(s)} → ${atText(e)}`);
  set("b-hours", `${hoursText(b.total)}시간`);
  set("b-mins", `${b.total.toLocaleString("ko-KR")}분`);
  set("b-hm", `${Math.floor(b.total / 60).toLocaleString("ko-KR")}:${String(b.total % 60).padStart(2, "0")}`);
  set("b-note", b.sign < 0 ? "끝 날짜·시각이 시작보다 앞이라 거꾸로 센 크기입니다. 밤을 넘겼다면 끝 날짜를 다음 날로 바꾸세요." : "");
}

for (const id of ["a-op", "a-date", "a-time", "a-d", "a-h", "a-m"]) {
  $(id).addEventListener("input", () => { reportUse(1); calcA(); });
  $(id).addEventListener("change", calcA);
}
for (const id of ["b-sdate", "b-stime", "b-edate", "b-etime"]) {
  $(id).addEventListener("input", () => { reportUse(1); calcB(); });
  $(id).addEventListener("change", calcB);
}

// '지금 시각으로' — 이 기기의 지금 날짜·시각(분까지)을 시작 칸에 넣는다
$("a-now").addEventListener("click", () => {
  reportUse(1);
  const n = new Date();
  const local = Math.floor((n.getTime() - n.getTimezoneOffset() * 60_000) / 60_000);
  const p = atParts(local);
  ($("a-date") as HTMLInputElement).value = p.date;
  ($("a-time") as HTMLInputElement).value = p.time;
  calcA();
});

const buildCard = () => renderCard({ title: "시간 계산", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "time-calc" });
  downloadCard(buildCard(), "time-calc-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "time-calc" });
  await shareCard(buildCard(), "시간 계산 - jupocket.com");
});

calcA();
calcB();
