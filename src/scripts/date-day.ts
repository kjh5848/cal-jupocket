import { toDay, fromDay, WEEKDAYS } from "../lib/date-calc";
import { dayInfo, WEEKDAY_EN, type DayInfo, type WeekStart } from "../lib/date-day";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";
import { pickLang } from "../i18n/ui";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("date-day");

const $ = (id: string) => document.getElementById(id)!;
const dateIn = $("date") as HTMLInputElement;
const startIn = $("start") as HTMLSelectElement;
const fmt = (n: number) => n.toLocaleString("ko-KR");

/** 이 기기 기준 오늘(지역 날짜) */
function today(): number {
  const t = new Date();
  return toDay(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`)!;
}

/**
 * 화면 문구 — 한국어판(/tools/date-day/)과 영어판(/en-us/tools/date-day/ — 영어 다섯 판 공용)이 같은 계산(dayInfo)을 쓴다.
 * lib 의 공휴일 판정은 한국 관공서 공휴일 목록이라 영어판은 holiday 를 쓰지 않고 토·일만 본다.
 */
const KO = {
  title: "날짜 요일",
  needDate: "날짜를 넣어 주세요",
  outOfRange: "1900년부터 2100년 사이 날짜를 넣어 주세요.",
  head: (d: DayInfo) => `${d.year}년 ${d.month}월 ${d.date}일`,
  today: (head: string) => `${head} · 오늘`,
  dayName: (d: DayInfo) => `${WEEKDAYS[d.weekday]}요일`,
  kind: (d: DayInfo) => (d.holiday ? `공휴일(${d.holiday})` : d.weekend ? "주말" : "평일"),
  sub: (d: DayInfo, kind: string) => `${kind} · ${d.month}월 ${d.nthText} · ${WEEKDAY_EN[d.weekday]}`,
  doy: (d: DayInfo) => `${d.dayOfYear}일째 / ${d.daysInYear}일`,
  left: (d: DayInfo) => `${fmt(d.daysLeft)}일`,
  iso: (d: DayInfo) => `${d.iso.year}년 ${d.iso.week}주차`,
  cal: (d: DayInfo) => `${d.calWeek}주차`,
  month: (d: DayInfo) => d.monthWeekText,
  leap: (d: DayInfo) => (d.leap ? "윤년 (366일)" : "평년 (365일)"),
  notes: (d: DayInfo) => {
    const notes = [`${d.quarter}분기 · ISO 표기 ${d.isoText} · Unix(UTC 0시) ${d.unix}`];
    if (d.iso.year !== d.year) notes.push(`ISO 주차로는 ${d.iso.year}년에 속하는 주입니다.`);
    if (d.holiday === null) notes.push("공휴일 목록(2026~2027년) 밖이라 토·일만 판정했습니다. 공휴일은 따로 확인하세요.");
    return notes;
  },
  lines: (d: DayInfo, dayName: string, kind: string): [string, string][] => [
    ["요일", `${dayName} · ${kind}`],
    ["그해 몇째 날", `${d.dayOfYear}일째 · ${fmt(d.daysLeft)}일 남음`],
    ["주차", `ISO ${d.iso.year}-W${String(d.iso.week).padStart(2, "0")} · ${d.monthWeekText}`],
    ["윤년", d.leap ? "윤년" : "평년"],
  ],
  shareText: "날짜 요일 계산 결과 - jupocket.com",
};

/**
 * 영어판. 날짜·달 이름은 페이지 lang 의 Intl 표기(timeZone "UTC" — 하루 번호가 UTC 자정이라).
 * 공휴일은 표시하지 않는다(나라 공휴일 원문 미확인) — Weekday·Weekend 는 토·일만으로 가르고 그렇게 적는다.
 */
const enLang = document.documentElement.lang || "en-US";
const en = (v: number) => v.toLocaleString(enLang);
const monthEn = (d: DayInfo) => new Date(Date.UTC(d.year, d.month - 1, 1)).toLocaleDateString(enLang, { timeZone: "UTC", month: "long" });
const ordEn = (v: number) => `${v}${v === 1 ? "st" : v === 2 ? "nd" : v === 3 ? "rd" : "th"}`;

const EN: typeof KO = {
  title: "Day of the week",
  needDate: "Enter a date",
  outOfRange: "Enter a date between 1900 and 2100.",
  head: (d: DayInfo) =>
    new Date(Date.UTC(d.year, d.month - 1, d.date)).toLocaleDateString(enLang, { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" }),
  today: (head: string) => `${head} · Today`,
  dayName: (d: DayInfo) => WEEKDAY_EN[d.weekday],
  kind: (d: DayInfo) => (d.weekend ? "Weekend" : "Weekday"),
  sub: (d: DayInfo, kind: string) => `${kind} · ${ordEn(d.nth)} ${WEEKDAY_EN[d.weekday]} of ${monthEn(d)}`,
  doy: (d: DayInfo) => `Day ${d.dayOfYear} of ${d.daysInYear}`,
  left: (d: DayInfo) => `${en(d.daysLeft)} day${d.daysLeft === 1 ? "" : "s"}`,
  iso: (d: DayInfo) => `Week ${d.iso.week}, ${d.iso.year}`,
  cal: (d: DayInfo) => `Week ${d.calWeek}`,
  month: (d: DayInfo) => `Week ${d.monthWeek} of ${monthEn(d)}`,
  leap: (d: DayInfo) => (d.leap ? "Leap year (366 days)" : "Common year (365 days)"),
  notes: (d: DayInfo) => {
    const notes = [`Q${d.quarter} · ISO ${d.isoText} · Unix time (00:00 UTC) ${d.unix}`];
    if (d.iso.year !== d.year) notes.push(`In ISO week numbering, this week belongs to ${d.iso.year}.`);
    notes.push("Holidays aren't marked — weekday or weekend is based on Saturday and Sunday only.");
    return notes;
  },
  lines: (d: DayInfo, dayName: string, kind: string): [string, string][] => [
    ["Day", `${dayName} · ${kind}`],
    ["Day of the year", `Day ${d.dayOfYear} · ${en(d.daysLeft)} left`],
    ["Week", `ISO ${d.iso.year}-W${String(d.iso.week).padStart(2, "0")} · week ${d.monthWeek} of ${monthEn(d)}`],
    ["Leap year", d.leap ? "Leap year" : "Common year"],
  ],
  shareText: "Day of the week result - jupocket.com",
};

const S = pickLang({ ko: KO, en: EN });

let lastLines: [string, string][] = [];
let lastTitle = S.title;

function set(id: string, text: string) {
  $(id).textContent = text;
}

/** 계산할 수 없을 때 — 지난 결과가 남지 않게 칸을 비운다 */
function clear(note: string) {
  set("hero-label", S.needDate);
  set("hero-value", "—");
  set("hero-sub", "");
  for (const id of ["v-doy", "v-left", "v-iso", "v-cal", "v-month", "v-leap"]) set(id, "—");
  set("note", note);
  lastLines = [];
}

function compute() {
  const n = toDay(dateIn.value);
  if (n === null) return clear("");
  const y = Number(dateIn.value.slice(0, 4));
  if (y < 1900 || y > 2100) return clear(S.outOfRange);
  const d = dayInfo(n, Number(startIn.value) as WeekStart);

  const kind = S.kind(d);
  const dayName = S.dayName(d);
  const head = S.head(d);

  set("hero-label", n === today() ? S.today(head) : head);
  set("hero-value", dayName);
  set("hero-sub", S.sub(d, kind));
  set("v-doy", S.doy(d));
  set("v-left", S.left(d));
  set("v-iso", S.iso(d));
  set("v-cal", S.cal(d));
  set("v-month", S.month(d));
  set("v-leap", S.leap(d));
  set("note", S.notes(d).join(" "));

  lastTitle = `${head} — ${dayName}`;
  lastLines = S.lines(d, dayName, kind);
}

dateIn.addEventListener("input", () => {
  reportUse(1);
  compute();
});
startIn.addEventListener("change", () => {
  reportUse(1);
  compute();
});

for (const b of document.querySelectorAll<HTMLButtonElement>("[data-preset]")) {
  b.addEventListener("click", () => {
    const t = today();
    const y = Number(fromDay(t).slice(0, 4));
    const p = b.dataset.preset;
    dateIn.value =
      p === "tomorrow" ? fromDay(t + 1) : p === "newyear" ? `${y + 1}-01-01` : p === "christmas" ? `${y}-12-25` : fromDay(t);
    reportUse(1);
    compute();
  });
}

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "date-day" });
  downloadCard(buildCard(), "date-day-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "date-day" });
  await shareCard(buildCard(), S.shareText);
});

// 처음 열면 오늘
dateIn.value = fromDay(today());
compute();
