import { toDay, fromDay, countdown, durationText, timeToSec, label, shift } from "../lib/date-calc";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

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

let lastLines: [string, string][] = [];
let lastTitle = "디데이";

function set(id: string, text: string) {
  $(id).textContent = text;
}

function compute() {
  const target = toDay(targetIn.value);
  const base = toDay(baseIn.value);
  const tSec = useTimeIn.checked ? timeToSec(timeIn.value) : null;
  if (target === null || base === null || (useTimeIn.checked && tSec === null)) {
    set("hero-label", "날짜를 넣어 주세요");
    set("hero-value", "—");
    set("hero-sub", "");
    return;
  }
  const n = now();
  const isToday = base === n.day;
  // 기준일이 오늘이 아니면 '지금'은 그날 0시로 본다 — 남은 시간은 그 날짜 기준
  const c = countdown(target, tSec, base, isToday ? n.sec : 0);
  const when = useTimeIn.checked ? `${label(target)} ${timeIn.value}` : label(target);
  const dayWord = c.side > 0 ? "남음" : c.side < 0 ? "지남" : "오늘";
  const left = c.seconds > 0;

  set("hero-label", `${when}까지`);
  set("hero-value", c.dday);
  set("hero-sub", c.side === 0 ? `목표일이 기준일과 같은 날입니다` : `${c.days.toLocaleString("ko-KR")}일 ${dayWord} · 기준일을 1일로 세면 ${c.countDays.toLocaleString("ko-KR")}일째`);
  set("l1", left ? "남은 시간" : "지난 시간");
  set("v1", durationText(c.seconds));
  set("v2", `${c.countDays.toLocaleString("ko-KR")}일째`);
  set("v3", label(base));

  const notes: string[] = [];
  if (!useTimeIn.checked) notes.push("시각을 안 넣으면 목표일이 끝나는 순간(다음 날 0시)까지 셉니다.");
  if (!isToday) notes.push("기준일이 오늘이 아니라 남은 시간은 기준일 0시부터 셌습니다.");
  if (c.side === 0 && !left) notes.push("D-Day 지만 목표 시각은 이미 지났습니다.");
  set("note", notes.join(" "));

  lastTitle = `디데이 — ${when}`;
  lastLines = [
    ["디데이", c.dday],
    [left ? "남은 시간" : "지난 시간", durationText(c.seconds)],
    ["기준일 포함", `${c.countDays.toLocaleString("ko-KR")}일째`],
    ["기준일", label(base)],
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
    }[b.dataset.preset as "plus100" | "xmas" | "newyear"];
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
  await shareCard(buildCard(), "디데이 계산 결과 - jupocket.com");
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
