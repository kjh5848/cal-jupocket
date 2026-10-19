import { toDay, fromDay, label } from "../lib/date-calc";
import { age } from "../lib/age";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("age");

const $ = (id: string) => document.getElementById(id)!;
const birthIn = $("birth") as HTMLInputElement;
const baseIn = $("base") as HTMLInputElement;
const fmt = (n: number) => n.toLocaleString("ko-KR");

/** 이 기기 기준 오늘(지역 날짜) */
function today(): number {
  const t = new Date();
  return toDay(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`)!;
}

let lastLines: [string, string][] = [];
let lastTitle = "만 나이";

function set(id: string, text: string) {
  $(id).textContent = text;
}

/** 계산할 수 없을 때 — 지난 결과가 남지 않게 칸을 비운다 */
function clear(heroLabel: string, note: string) {
  set("hero-label", heroLabel);
  set("hero-value", "—");
  set("hero-sub", "");
  for (const id of ["v-year", "v-korean", "v-months", "v-lived", "v-next"]) set(id, "—");
  set("l-next", "다음 생일");
  set("note", note);
  lastLines = [];
}

function compute() {
  const birth = toDay(birthIn.value);
  const base = toDay(baseIn.value);
  if (birth === null || base === null) return clear("날짜를 넣어 주세요", "");
  const a = age(birth, base);
  if (!a) return clear(`${label(base)} 기준`, "생년월일이 기준일보다 뒤입니다. 날짜를 확인해 주세요.");

  // 1세 미만은 개월로(민법 제158조 단서)
  const hero = a.years === 0 ? `${a.totalMonths}개월` : `만 ${a.years}세`;
  const detail = a.years === 0 ? `${a.totalMonths}개월 ${a.days}일 · 만 0세` : `${a.years}세 ${a.months}개월 ${a.days}일`;
  const until = a.turnsToday ? "오늘 한 살 더 먹는 날" : `다음 생일까지 ${fmt(a.daysToNext)}일`;

  set("hero-label", `${label(base)} 기준`);
  set("hero-value", hero);
  set("hero-sub", `${detail} · ${until}`);
  set("v-year", `${a.yearAge}세`);
  set("v-korean", `${a.koreanAge}살`);
  set("v-months", `${fmt(a.totalMonths)}개월`);
  set("v-lived", `${fmt(a.livedDays)}일`);
  set("l-next", `만 ${a.nextAge}세 되는 날`);
  set("v-next", label(a.next));

  const notes: string[] = [];
  if (birthIn.value.slice(5) === "02-29") notes.push("2월 29일생은 평년엔 3월 1일부터 한 살 더 먹습니다(민법 제160조 ③).");
  if (a.livedDays > 0) notes.push(`태어난 날을 1일째로 세면 ${fmt(a.dayCount)}일째입니다.`);
  if (base !== today()) notes.push("기준일이 오늘이 아닙니다.");
  set("note", notes.join(" "));

  lastTitle = `만 나이 — ${label(base)} 기준`;
  lastLines = [
    ["만 나이", hero],
    ["연 나이 · 세는 나이", `${a.yearAge}세 · ${a.koreanAge}살`],
    ["살아온 날", `${fmt(a.livedDays)}일`],
    [`만 ${a.nextAge}세 되는 날`, label(a.next)],
  ];
}

for (const el of [birthIn, baseIn]) {
  el.addEventListener("input", () => {
    reportUse(1);
    compute();
  });
}

for (const b of document.querySelectorAll<HTMLButtonElement>("[data-preset]")) {
  b.addEventListener("click", () => {
    const t = today();
    const y = Number(fromDay(t).slice(0, 4));
    baseIn.value = b.dataset.preset === "newyear" ? `${y + 1}-01-01` : fromDay(t);
    reportUse(1);
    compute();
  });
}

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "age" });
  downloadCard(buildCard(), "age-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "age" });
  await shareCard(buildCard(), "만 나이 계산 결과 - jupocket.com");
});

// 처음 열면 기준일은 오늘
baseIn.value = fromDay(today());
compute();
