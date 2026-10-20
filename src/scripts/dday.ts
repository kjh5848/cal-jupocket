import { toDay, fromDay, countdown, durationText, timeToSec, label, shift, type Countdown } from "../lib/date-calc";
import { labelJa, ddayJa, durationTextJa } from "../lib/date-format-ja";
import { labelDe, ddayDe, durationTextDe, intDe } from "../lib/de/date-format";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";
import { pickLang } from "../i18n/ui";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("dday");

const $ = (id: string) => document.getElementById(id)!;
const targetIn = $("target") as HTMLInputElement;
const useTimeIn = $("use-time") as HTMLInputElement;
const timeIn = $("time") as HTMLInputElement;
const baseIn = $("base") as HTMLInputElement;

/** 이 기기 기준 오늘(지역 날짜)과 0시부터 흐른 초 */
function now(): { day: number; sec: number } {
  const t = new Date();
  const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return { day: toDay(iso)!, sec: t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds() };
}

const n = (v: number, loc: string) => v.toLocaleString(loc);

/**
 * 화면 문구 — 한국어판(/tools/dday/)과 일본어판(/ja/tools/dday/)이 같은 계산(countdown)을 쓴다.
 * 일본어판은 'D-12' 대신 'あと12日'(ddayJa), 'N일째'는 '今日を1日目' 으로 쓴다.
 */
const KO = {
  title: "디데이",
  needDate: "날짜를 넣어 주세요",
  until: (when: string) => `${when}까지`,
  hero: (c: Countdown, _target: number, _base: number) => c.dday,
  sub: (c: Countdown) => {
    const dayWord = c.side > 0 ? "남음" : c.side < 0 ? "지남" : "오늘";
    return c.side === 0 ? `목표일이 기준일과 같은 날입니다` : `${n(c.days, "ko-KR")}일 ${dayWord} · 기준일을 1일로 세면 ${n(c.countDays, "ko-KR")}일째`;
  },
  left: "남은 시간",
  passed: "지난 시간",
  countLabel: "기준일 포함",
  count: (c: Countdown) => `${n(c.countDays, "ko-KR")}일째`,
  baseLabel: "기준일",
  ddayLabel: "디데이",
  label,
  duration: durationText,
  noteNoTime: "시각을 안 넣으면 목표일이 끝나는 순간(다음 날 0시)까지 셉니다.",
  noteNotToday: "기준일이 오늘이 아니라 남은 시간은 기준일 0시부터 셌습니다.",
  notePastTime: "D-Day 지만 목표 시각은 이미 지났습니다.",
  shareText: "디데이 계산 결과 - jupocket.com",
};

const JA: typeof KO = {
  title: "あと何日",
  needDate: "日付を入れてください",
  until: (when: string) => `${when}まで`,
  hero: (_c: Countdown, target: number, base: number) => ddayJa(target, base),
  sub: (c: Countdown) =>
    c.side === 0
      ? "目標日は基準日と同じ日です"
      : c.side > 0
        ? `残り${n(c.days, "ja-JP")}日 · 基準日を1日目と数えると目標日は${n(c.countDays, "ja-JP")}日目`
        : `${n(c.days, "ja-JP")}日経過 · 目標日を1日目と数えると基準日は${n(c.countDays, "ja-JP")}日目`,
  left: "残り時間",
  passed: "経過時間",
  countLabel: "1日目から数えると",
  count: (c: Countdown) => `${n(c.countDays, "ja-JP")}日目`,
  baseLabel: "基準日",
  ddayLabel: "あと何日",
  label: labelJa,
  duration: durationTextJa,
  noteNoTime: "時刻を入れないときは、目標日が終わる瞬間（翌日の午前0時）までを数えます。",
  noteNotToday: "基準日が今日ではないため、残り時間は基準日の午前0時から数えました。",
  notePastTime: "目標日は今日ですが、目標の時刻はもう過ぎています。",
  shareText: "あと何日の計算結果 - jupocket.com",
};

/**
 * 영어판(/en-us/tools/dday/ — 영어 다섯 판 공용). 'D-12' 는 영어권에서 안 써서 '100 days to go' · 'Today' · '5 days ago' 로 낸다.
 * 날짜는 페이지 lang 의 Intl 표기(timeZone "UTC" — 하루 번호가 UTC 자정이라). 하루는 24시간으로 세서
 * 서머타임 전환일을 끼면 남은 시간이 맞지 않을 수 있다 — 고치지 않고 noteNoTime 에 그렇게 적는다(전환 규칙 원문 미확인).
 */
const enLang = document.documentElement.lang || "en-US";
const labelEn = (d: number) =>
  new Date(d * 86_400_000).toLocaleDateString(enLang, { timeZone: "UTC", weekday: "short", year: "numeric", month: "long", day: "numeric" });
const plural = (v: number, one: string) => `${n(v, enLang)} ${one}${v === 1 ? "" : "s"}`;
const durationTextEn = (sec: number) => {
  const s = Math.abs(Math.trunc(sec));
  const day = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (day > 0) return `${plural(day, "day")}, ${plural(h, "hour")}, ${plural(m, "minute")}`;
  return `${plural(h, "hour")}, ${plural(m, "minute")}, ${plural(s % 60, "second")}`;
};
const ddayEn = (c: Countdown) => (c.side === 0 ? "Today" : c.side > 0 ? `${plural(c.days, "day")} to go` : `${plural(c.days, "day")} ago`);

const EN: typeof KO = {
  title: "Days until",
  needDate: "Enter a date",
  until: (when: string) => `Until ${when}`,
  hero: (c: Countdown) => ddayEn(c),
  sub: (c: Countdown) =>
    c.side === 0
      ? "The target date is the same day as the start date"
      : c.side > 0
        ? `Counting the start date as day 1, the target date is day ${n(c.countDays, enLang)}`
        : `Counting the target date as day 1, the start date is day ${n(c.countDays, enLang)}`,
  left: "Time left",
  passed: "Time since",
  countLabel: "Counting day 1",
  count: (c: Countdown) => `Day ${n(c.countDays, enLang)}`,
  baseLabel: "Start date",
  ddayLabel: "Countdown",
  label: labelEn,
  duration: durationTextEn,
  noteNoTime:
    "With no time set, it counts to the moment the target date ends (midnight). Every day is counted as 24 hours, so if the clocks change for daylight saving time before then, the hours can be off by one.",
  noteNotToday: "The start date isn't today, so the time left is counted from midnight on the start date.",
  notePastTime: "The target date is today, but the target time has already passed.",
  shareText: "Days until countdown - jupocket.com",
};

/**
 * 독일어판(/de/tools/dday/). 표기는 lib/de/date-format.ts — 'noch 64 Tage' · 'Heute' · 'vor 3 Tagen',
 * 날짜 'Donnerstag, 24. Dezember 2026'(BGB 원문 꼴), 천 단위 줄바꿈 없는 공백. Intl 안 씀.
 */
const DE: typeof KO = {
  title: "Countdown",
  needDate: "Bitte ein Datum eingeben",
  until: (when: string) => `Bis ${when}`,
  hero: (c: Countdown) => ddayDe(c),
  sub: (c: Countdown) =>
    c.side === 0
      ? "Der Zieltag ist derselbe Tag wie der Ausgangstag"
      : c.side > 0
        ? `Zählt man den Ausgangstag als Tag 1, ist der Zieltag Tag ${intDe(c.countDays)}`
        : `Zählt man den Zieltag als Tag 1, ist der Ausgangstag Tag ${intDe(c.countDays)}`,
  left: "Verbleibende Zeit",
  passed: "Vergangene Zeit",
  countLabel: "Ab Tag 1 gezählt",
  count: (c: Countdown) => `Tag ${intDe(c.countDays)}`,
  baseLabel: "Ausgangstag",
  ddayLabel: "Countdown",
  label: labelDe,
  duration: durationTextDe,
  noteNoTime:
    "Ohne Uhrzeit wird bis zum Ende des Zieltags (Mitternacht) gezählt. Jeder Tag zählt 24 Stunden – liegt die Zeitumstellung dazwischen, kann die Stundenzahl um eine Stunde abweichen.",
  noteNotToday: "Der Ausgangstag ist nicht heute, deshalb zählt die verbleibende Zeit ab Mitternacht des Ausgangstags.",
  notePastTime: "Der Zieltag ist heute, die Uhrzeit ist aber schon vorbei.",
  shareText: "Countdown-Ergebnis - jupocket.com",
};

const S = pickLang({ ko: KO, ja: JA, en: EN, de: DE });

let lastLines: [string, string][] = [];
let lastTitle = S.title;

function set(id: string, text: string) {
  $(id).textContent = text;
}

function compute() {
  const target = toDay(targetIn.value);
  const base = toDay(baseIn.value);
  const tSec = useTimeIn.checked ? timeToSec(timeIn.value) : null;
  if (target === null || base === null || (useTimeIn.checked && tSec === null)) {
    set("hero-label", S.needDate);
    set("hero-value", "—");
    set("hero-sub", "");
    return;
  }
  const now_ = now();
  const isToday = base === now_.day;
  // 기준일이 오늘이 아니면 '지금'은 그날 0시로 본다 — 남은 시간은 그 날짜 기준
  const c = countdown(target, tSec, base, isToday ? now_.sec : 0);
  const when = useTimeIn.checked ? `${S.label(target)} ${timeIn.value}` : S.label(target);
  const left = c.seconds > 0;

  set("hero-label", S.until(when));
  set("hero-value", S.hero(c, target, base));
  set("hero-sub", S.sub(c));
  set("l1", left ? S.left : S.passed);
  set("v1", S.duration(c.seconds));
  set("l2", S.countLabel);
  set("v2", S.count(c));
  set("v3", S.label(base));

  const notes: string[] = [];
  if (!useTimeIn.checked) notes.push(S.noteNoTime);
  if (!isToday) notes.push(S.noteNotToday);
  if (c.side === 0 && !left) notes.push(S.notePastTime);
  set("note", notes.join(" "));

  lastTitle = `${S.title} — ${when}`;
  lastLines = [
    [S.ddayLabel, S.hero(c, target, base)],
    [left ? S.left : S.passed, S.duration(c.seconds)],
    [S.countLabel, S.count(c)],
    [S.baseLabel, S.label(base)],
  ];
}

useTimeIn.addEventListener("change", () => {
  ($("time-wrap") as HTMLElement).hidden = !useTimeIn.checked;
  reportUse(1);
  compute();
});
for (const el of [targetIn, timeIn, baseIn]) {
  el.addEventListener("input", () => {
    reportUse(1);
    compute();
  });
}

// 자주 찾는 날짜 — 기준일에서 센다
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-preset]")) {
  b.addEventListener("click", () => {
    const base = toDay(baseIn.value) ?? now().day;
    const y = Number(fromDay(base).slice(0, 4));
    const xmas = toDay(`${y}-12-25`)!;
    const target = {
      plus100: shift(base, 100, "day"),
      xmas: xmas >= base ? xmas : toDay(`${y + 1}-12-25`)!,
      newyear: toDay(`${y + 1}-01-01`)!,
      // 일본어판만 — 'あと何日で今年終わる'
      yearend: toDay(`${y}-12-31`)!,
    }[b.dataset.preset as "plus100" | "xmas" | "newyear" | "yearend"];
    targetIn.value = fromDay(target);
    reportUse(1);
    compute();
  });
}

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "dday" });
  downloadCard(buildCard(), "dday-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "dday" });
  await shareCard(buildCard(), S.shareText);
});

// 처음 열면 기준일은 오늘, 목표일은 100일 뒤
{
  const t = now().day;
  baseIn.value = fromDay(t);
  targetIn.value = fromDay(t + 100);
}
compute();
// 남은 시간은 초 단위로 흐른다 — 기준일이 오늘일 때만 다시 센다
setInterval(() => {
  if (toDay(baseIn.value) === now().day) compute();
}, 1000);
