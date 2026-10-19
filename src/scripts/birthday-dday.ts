import { toDay, fromDay, label, dday, countdown, durationText, weekday, WEEKDAYS, holidayName, holidayCovered, holidayRange } from "../lib/date-calc";
import { birthdayDday, upcomingBirthdays, validMonthDay, type LeapRule } from "../lib/birthday-dday";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("birthday-dday");

const $ = (id: string) => document.getElementById(id)!;
const monthIn = $("month") as HTMLSelectElement;
const dayIn = $("day") as HTMLSelectElement;
const yearIn = $("year") as HTMLInputElement;
const leapIn = $("leap") as HTMLSelectElement;
const baseIn = $("base") as HTMLInputElement;

const fmt = (n: number) => n.toLocaleString("ko-KR");

/** 이 기기 기준 오늘(지역 날짜)과 0시부터 흐른 초 — toISOString 은 한국 0~9시에 하루 밀린다 */
function now(): { day: number; sec: number } {
  const t = new Date();
  const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return { day: toDay(iso)!, sec: t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds() };
}

/** 기준일을 손대지 않았으면 오늘을 따라간다 — 켜 둔 채 자정을 넘기면 다음 날로 */
let baseFollowsToday = true;

function withHoliday(n: number): string {
  const h = holidayName(n);
  return h ? `${label(n)} · ${h}` : label(n);
}

function set(id: string, text: string) {
  $(id).textContent = text;
}

let lastLines: [string, string][] = [];
let lastTitle = "생일 디데이";

function clear(msg: string) {
  set("hero-label", msg);
  set("hero-value", "—");
  set("hero-sub", "");
  for (const id of ["v-time", "v-weekday", "v-age", "v-lived"]) set(id, "—");
  set("bar-text", "");
  ($("bar-fill") as HTMLElement).style.width = "0%";
  set("note", "");
  $("rows").replaceChildren();
}

function compute() {
  const m = Number(monthIn.value);
  const d = Number(dayIn.value);
  const isLeapDay = m === 2 && d === 29;
  ($("leap-wrap") as HTMLElement).hidden = !isLeapDay;
  const rule = (isLeapDay ? leapIn.value : "mar1") as LeapRule;
  const base = toDay(baseIn.value);
  if (base === null) return clear("기준일을 넣어 주세요");
  if (!validMonthDay(m, d)) return clear(`${m}월 ${d}일은 없는 날짜입니다`);

  const yText = yearIn.value.trim();
  const year = yText === "" ? null : Number(yText);
  if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2100)) return clear("태어난 해는 1900 ~ 2100 사이로 넣어 주세요");
  const r = birthdayDday(m, d, year, base, rule);
  if (!r) {
    if (year !== null && isLeapDay) return clear(`${year}년에는 2월 29일이 없습니다`);
    return clear("태어난 날이 기준일보다 뒤입니다");
  }

  const n = now();
  const isToday = base === n.day;
  // 생일 당일은 그날이 끝날 때까지, 아니면 생일 0시까지. 기준일이 오늘이 아니면 '지금'을 그날 0시로 본다
  const c = countdown(r.next, r.daysLeft === 0 ? null : 0, base, isToday ? n.sec : 0);

  set("hero-label", r.daysLeft === 0 ? "오늘이 생일입니다" : `다음 생일 ${label(r.next)}까지`);
  set("hero-value", dday(r.next, base));
  const sub = [r.daysLeft === 0 ? "생일 축하합니다" : `${fmt(r.daysLeft)}일 남음`];
  if (r.turningAge !== null) sub.push(`${r.daysLeft === 0 ? "오늘" : "이번 생일에"} 만 ${r.turningAge}세`);
  set("hero-sub", sub.join(" · "));
  set("v-time", r.daysLeft === 0 ? `오늘 끝까지 ${durationText(c.seconds)}` : durationText(c.seconds));
  set("v-weekday", `${WEEKDAYS[weekday(r.next)]}요일${holidayName(r.next) ? ` · ${holidayName(r.next)}` : ""}`);
  set("v-age", r.turningAge === null ? "태어난 해를 넣으면 나옵니다" : `만 ${r.turningAge}세`);
  set("v-lived", r.livedDays === null ? "태어난 해를 넣으면 나옵니다" : `${fmt(r.livedDays)}일`);

  const pct = Math.min(100, Math.max(0, r.progress));
  ($("bar-fill") as HTMLElement).style.width = `${pct.toFixed(1)}%`;
  $("bar").setAttribute("aria-valuenow", String(Math.round(pct)));
  set("bar-text", `${label(r.prev)} → ${label(r.next)} · ${pct.toFixed(1)}% 지남`);

  const notes: string[] = [];
  if (r.currentAge !== null && r.birth !== null) notes.push(`지금 만 ${r.currentAge}세 · 태어난 날은 ${WEEKDAYS[weekday(r.birth)]}요일`);
  if (isLeapDay && rule === "feb28") notes.push("2월 28일에 축하해도 만 나이는 법대로 3월 1일에 오릅니다.");
  if (isLeapDay && rule === "feb29") notes.push("윤년에만 생일이 옵니다 — 진행 막대는 지난 윤년 생일부터 셉니다.");
  if (!isToday) notes.push(`기준일 ${label(base)} 기준으로 셌습니다. 남은 시간은 그날 0시부터입니다.`);
  set("note", notes.join(" "));

  const list = upcomingBirthdays(m, d, base, rule, 10);
  $("rows").replaceChildren(
    ...list.map((b) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = withHoliday(b);
      const td1 = document.createElement("td");
      td1.textContent = year === null ? "—" : `만 ${Number(fromDay(b).slice(0, 4)) - year}세`;
      const td2 = document.createElement("td");
      td2.textContent = dday(b, base);
      tr.append(th, td1, td2);
      if (b === base) tr.setAttribute("aria-current", "date");
      return tr;
    }),
  );
  const outside = list.some((b) => !holidayCovered(b));
  set("rows-note", outside ? `공휴일 표시는 관공서 공휴일 목록(${holidayRange.from.slice(0, 4)}~${holidayRange.to.slice(0, 4)}년) 안에서만 합니다.` : "");

  lastTitle = `생일 디데이 — ${m}월 ${d}일`;
  lastLines = [
    ["다음 생일", label(r.next)],
    ["D-day", dday(r.next, base)],
    ...(r.turningAge !== null ? ([["이번 생일 나이", `만 ${r.turningAge}세`]] as [string, string][]) : []),
    ...(r.livedDays !== null ? ([["살아온 날", `${fmt(r.livedDays)}일`]] as [string, string][]) : []),
  ];
}

for (const el of [monthIn, dayIn, leapIn]) {
  el.addEventListener("change", () => {
    reportUse(1);
    compute();
  });
}
yearIn.addEventListener("input", () => {
  reportUse(1);
  compute();
});
baseIn.addEventListener("input", () => {
  baseFollowsToday = baseIn.value === fromDay(now().day);
  reportUse(1);
  compute();
});

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "birthday-dday" });
  downloadCard(buildCard(), "birthday-dday-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "birthday-dday" });
  await shareCard(buildCard(), "생일 디데이 - jupocket.com");
});

// 처음 열면 기준일은 오늘 — 생일은 예시 그대로
baseIn.value = fromDay(now().day);
compute();
// 남은 시간은 초 단위로 흐른다. 기준일이 오늘을 따라가면 자정에 날짜도 넘긴다
setInterval(() => {
  const t = now().day;
  if (baseFollowsToday && toDay(baseIn.value) !== t) baseIn.value = fromDay(t);
  if (toDay(baseIn.value) === t) compute();
}, 1000);
