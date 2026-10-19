import {
  parseAt, toMinutes, shiftAt, atText, ampmText, dayShiftText, splitText, between, hoursText, atParts,
  atTextJa, dayShiftTextJa, splitTextJa,
} from "../lib/time-calc";
import { pageLocale } from "../i18n/ui";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("time-calc");

const $ = (id: string) => document.getElementById(id)!;
const val = (id: string) => ($(id) as HTMLInputElement).value;
const set = (id: string, text: string) => ($(id).textContent = text);

let lastLines: [string, string][] = [];

/**
 * 화면 문구 — 한국어판(/tools/time-calc/)과 일본어판(/ja/tools/time-calc/)이 같은 계산(lib/time-calc.ts)을 쓴다.
 * 일본어판은 午前·午後 줄 없이 날짜 이동(翌日 등)만 보여 준다.
 */
const KO = {
  at: atText,
  span: splitText,
  sub: (start: number, end: number) => `${ampmText(end)} · ${dayShiftText(start, end)}`,
  label: (span: string, sign: number) => `${span} ${sign > 0 ? "뒤" : "전"}`,
  hours: (t: string) => `${t}시간`,
  mins: (n: number) => `${n.toLocaleString("ko-KR")}분`,
  badStart: "시작 날짜·시각을 확인해 주세요",
  badSpan: "일·시간·분은 0 이상의 정수로 넣어 주세요",
  range: "1900년 1월 1일 ~ 9999년 12월 30일 사이만 셉니다",
  zero: "기간이 0이라 시작 시각 그대로입니다.",
  lineFrom: "시작",
  lineAdd: "더한 기간",
  lineSub: "뺀 기간",
  lineEnd: "결과",
  badB: "날짜·시각을 확인해 주세요",
  between: "사이",
  betweenRev: "사이 (끝이 시작보다 이릅니다)",
  reversed: "끝 날짜·시각이 시작보다 앞이라 거꾸로 센 크기입니다. 밤을 넘겼다면 끝 날짜를 다음 날로 바꾸세요.",
  cardTitle: "시간 계산",
  shareText: "시간 계산 - jupocket.com",
};

const JA: typeof KO = {
  at: atTextJa,
  span: splitTextJa,
  sub: (start: number, end: number) => dayShiftTextJa(start, end),
  label: (span: string, sign: number) => `${span}${sign > 0 ? "後" : "前"}`,
  hours: (t: string) => `${t}時間`,
  mins: (n: number) => `${n.toLocaleString("ja-JP")}分`,
  badStart: "開始の日付・時刻を確認してください",
  badSpan: "日・時間・分は0以上の整数で入れてください",
  range: "1900年1月1日〜9999年12月30日の間だけ計算します",
  zero: "足す時間が0なので、開始時刻のままです。",
  lineFrom: "開始",
  lineAdd: "足した時間",
  lineSub: "引いた時間",
  lineEnd: "結果",
  badB: "日付・時刻を確認してください",
  between: "経過時間",
  betweenRev: "経過時間（終了が開始より前です）",
  reversed: "終了の日時が開始より前なので、逆向きに数えた長さです。日付をまたいだときは終了日を翌日にしてください。",
  cardTitle: "時間計算",
  shareText: "時間計算 - jupocket.com",
};

const S = pageLocale() === "ja" ? JA : KO;

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
  if (start === null) return fail(S.badStart);
  if (mins === null) return fail(S.badSpan);
  const end = shiftAt(start, mins, sign);
  if (end === null) return fail(S.range);
  const span = S.span(mins);
  set("a-label", S.label(span, sign));
  set("a-hero", S.at(end));
  set("a-sub", S.sub(start, end));
  set("a-from", S.at(start));
  set("a-span", span);
  set("a-hours", S.hours(hoursText(mins)));
  set("a-mins", S.mins(mins));
  set("a-note", mins === 0 ? S.zero : "");
  lastLines = [
    [S.lineFrom, S.at(start)],
    [sign > 0 ? S.lineAdd : S.lineSub, span],
    [S.lineEnd, S.at(end)],
  ];
}

/** ② 두 일시 사이 */
function calcB() {
  const s = parseAt(val("b-sdate"), val("b-stime"));
  const e = parseAt(val("b-edate"), val("b-etime"));
  if (s === null || e === null) {
    set("b-label", S.badB);
    set("b-hero", "—");
    for (const id of ["b-hours", "b-mins", "b-hm"]) set(id, "—");
    set("b-note", "");
    return;
  }
  const b = between(s, e);
  set("b-label", b.sign < 0 ? S.betweenRev : S.between);
  set("b-hero", S.span(b.total));
  set("b-sub", `${S.at(s)} → ${S.at(e)}`);
  set("b-hours", S.hours(hoursText(b.total)));
  set("b-mins", S.mins(b.total));
  set("b-hm", `${Math.floor(b.total / 60).toLocaleString("ko-KR")}:${String(b.total % 60).padStart(2, "0")}`);
  set("b-note", b.sign < 0 ? S.reversed : "");
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

const buildCard = () => renderCard({ title: S.cardTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "time-calc" });
  downloadCard(buildCard(), "time-calc-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "time-calc" });
  await shareCard(buildCard(), S.shareText);
});

calcA();
calcB();
