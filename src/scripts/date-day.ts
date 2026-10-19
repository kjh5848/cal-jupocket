import { toDay, fromDay, WEEKDAYS } from "../lib/date-calc";
import { dayInfo, WEEKDAY_EN, type WeekStart } from "../lib/date-day";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

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

let lastLines: [string, string][] = [];
let lastTitle = "날짜 요일";

function set(id: string, text: string) {
  $(id).textContent = text;
}

/** 계산할 수 없을 때 — 지난 결과가 남지 않게 칸을 비운다 */
function clear(note: string) {
  set("hero-label", "날짜를 넣어 주세요");
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
  if (y < 1900 || y > 2100) return clear("1900년부터 2100년 사이 날짜를 넣어 주세요.");
  const d = dayInfo(n, Number(startIn.value) as WeekStart);

  const kind = d.holiday ? `공휴일(${d.holiday})` : d.weekend ? "주말" : "평일";
  const dayName = `${WEEKDAYS[d.weekday]}요일`;
  const head = `${d.year}년 ${d.month}월 ${d.date}일`;

  set("hero-label", n === today() ? `${head} · 오늘` : head);
  set("hero-value", dayName);
  set("hero-sub", `${kind} · ${d.month}월 ${d.nthText} · ${WEEKDAY_EN[d.weekday]}`);
  set("v-doy", `${d.dayOfYear}일째 / ${d.daysInYear}일`);
  set("v-left", `${fmt(d.daysLeft)}일`);
  set("v-iso", `${d.iso.year}년 ${d.iso.week}주차`);
  set("v-cal", `${d.calWeek}주차`);
  set("v-month", `${d.month}월 ${d.monthWeek}째 주`);
  set("v-leap", d.leap ? "윤년 (366일)" : "평년 (365일)");

  const notes = [`${d.quarter}분기 · ISO 표기 ${d.isoText} · Unix(UTC 0시) ${d.unix}`];
  if (d.iso.year !== d.year) notes.push(`ISO 주차로는 ${d.iso.year}년에 속하는 주입니다.`);
  if (d.holiday === null) notes.push("공휴일 목록(2026~2027년) 밖이라 토·일만 판정했습니다. 공휴일은 따로 확인하세요.");
  set("note", notes.join(" "));

  lastTitle = `${head} — ${dayName}`;
  lastLines = [
    ["요일", `${dayName} · ${kind}`],
    ["그해 몇째 날", `${d.dayOfYear}일째 · ${fmt(d.daysLeft)}일 남음`],
    ["주차", `ISO ${d.iso.year}-W${String(d.iso.week).padStart(2, "0")} · ${d.month}월 ${d.monthWeek}째 주`],
    ["윤년", d.leap ? "윤년" : "평년"],
  ];
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
  await shareCard(buildCard(), "날짜 요일 계산 결과 - jupocket.com");
});

// 처음 열면 오늘
dateIn.value = fromDay(today());
compute();
