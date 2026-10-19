import { toDay, fromDay, label, dday, durationText } from "../lib/date-calc";
import { yearLeft, monthFirsts, pctText } from "../lib/year-left";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("year-left");

const $ = (id: string) => document.getElementById(id)!;
const baseIn = $("base") as HTMLInputElement;

const fmt = (n: number) => n.toLocaleString("ko-KR");

/** 이 기기 기준 오늘(지역 날짜)과 0시부터 흐른 초 — toISOString 은 한국 0~9시에 하루 밀린다 */
function now(): { day: number; sec: number } {
  const t = new Date();
  const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return { day: toDay(iso)!, sec: t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds() };
}

/** 기준일을 손대지 않았으면 오늘을 따라간다 — 켜 둔 채 자정·새해를 넘기면 다음 날로 */
let baseFollowsToday = true;

function set(id: string, text: string) {
  $(id).textContent = text;
}

function row(cells: string[]): HTMLTableRowElement {
  const tr = document.createElement("tr");
  cells.forEach((c, i) => {
    const el = document.createElement(i === 0 ? "th" : "td");
    if (i === 0) (el as HTMLTableCellElement).scope = "row";
    el.textContent = c;
    tr.append(el);
  });
  return tr;
}

let lastLines: [string, string][] = [];
let lastTitle = "올해 남은 날";
let lastYear = 0;

function clear(msg: string) {
  set("hero-label", msg);
  set("hero-value", "—");
  set("hero-sub", "");
  for (const id of ["v-newyear", "v-weeks", "v-month", "v-quarter", "v-weekend", "v-weekdays", "v-business"]) set(id, "—");
  set("bar-text", "");
  ($("bar-fill") as HTMLElement).style.width = "0%";
  $("ms-rows").replaceChildren();
  $("hol-list").replaceChildren();
  $("mf-rows").replaceChildren();
}

function compute() {
  const base = toDay(baseIn.value);
  if (base === null) return clear("기준일을 넣어 주세요");
  const n = now();
  const isToday = base === n.day;
  const r = yearLeft(base, isToday ? n.sec : 0);

  set("hero-label", `${r.year}년 남은 날 (${isToday ? "오늘" : "그날"} 제외)`);
  set("hero-value", `${fmt(r.daysLeft)}일`);
  set("hero-sub", `${isToday ? "오늘" : "그날"} 포함 ${fmt(r.daysLeftIncl)}일 · ${r.dayOfYear}번째 날 / ${r.daysInYear}일${r.leap ? " (윤년)" : ""}`);

  ($("bar-fill") as HTMLElement).style.width = `${r.progress.toFixed(2)}%`;
  $("bar").setAttribute("aria-valuenow", String(Math.floor(r.progress)));
  set("bar-text", `1월 1일 0시부터 ${pctText(r.progress)} 지남${isToday ? "" : ` (${label(base)} 0시 기준)`}`);

  set("v-newyear", durationText(r.secondsToNewYear));
  set("v-weeks", `${r.weeks}주 ${r.weekRest}일`);
  set("v-month", `${r.monthLeft}일`);
  set("v-quarter", `${r.quarterLeft}일 (${r.quarter}분기)`);
  set("v-weekend", `토 ${r.saturdays} · 일 ${r.sundays}`);
  set("v-weekdays", `${r.weekdays}일`);
  set("v-business", r.businessDays === null ? "공휴일 목록 밖" : `${r.businessDays}일`);
  set(
    "note",
    `남은 토·일·평일·업무일은 ${isToday ? "내일" : "기준일 다음 날"}부터 12월 31일까지 셉니다.` +
      (r.businessDays === null ? ` 업무일은 공휴일 목록이 있는 2026~2027년만 셉니다.` : ""),
  );

  $("ms-rows").replaceChildren(
    ...r.milestones.map((m) => row([`${m.left}일 남은 날`, label(m.day), dday(m.day, base)])),
    row(["마지막 날", label(r.lastDay), dday(r.lastDay, base)]),
  );

  if (r.holidays === null) {
    $("hol-list").replaceChildren();
    set("hol-note", "이 해는 공휴일 목록(2026~2027년) 밖이라 보여 드리지 않습니다.");
  } else {
    $("hol-list").replaceChildren(
      ...r.holidays.map((h) => {
        const li = document.createElement("li");
        li.textContent = `${label(h.day)} ${h.name} · ${dday(h.day, base)}`;
        return li;
      }),
    );
    set("hol-note", r.holidays.length === 0 ? "남은 공휴일이 없습니다." : "관공서 공휴일 목록(2026~2027년) 기준입니다.");
  }

  if (r.year !== lastYear) {
    $("mf-rows").replaceChildren(...monthFirsts(r.year).map((f) => row([label(f.day), `${f.dayOfYear}번째`, `${fmt(f.daysLeft)}일`])));
    lastYear = r.year;
  }

  lastTitle = `${r.year}년 남은 날`;
  lastLines = [
    ["기준일", label(base)],
    ["남은 날", `${fmt(r.daysLeft)}일 (포함 ${fmt(r.daysLeftIncl)}일)`],
    ["몇 번째 날", `${r.dayOfYear} / ${r.daysInYear}`],
    ["진행률", pctText(r.progress)],
  ];
}

baseIn.addEventListener("input", () => {
  baseFollowsToday = baseIn.value === fromDay(now().day);
  reportUse(1);
  compute();
});

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "year-left" });
  downloadCard(buildCard(), "year-left-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "year-left" });
  await shareCard(buildCard(), "올해 남은 날 - jupocket.com");
});

// 처음 열면 기준일은 오늘
baseIn.value = fromDay(now().day);
compute();
// 새해까지 남은 시간은 초 단위로 흐른다. 기준일이 오늘을 따라가면 자정·새해에 날짜도 넘긴다
setInterval(() => {
  const t = now().day;
  if (baseFollowsToday && toDay(baseIn.value) !== t) baseIn.value = fromDay(t);
  if (toDay(baseIn.value) === t) compute();
}, 1000);
