import { toDay, fromDay, label, dday, spanText, holidayName, holidayCovered, holidayRange } from "../lib/date-calc";
import { anniversary, dayMark, yearMark, nthDay, dayCount, DAY_MARKS, YEAR_MARKS } from "../lib/anniversary";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("anniversary");

const $ = (id: string) => document.getElementById(id)!;
const kindIn = $("kind") as HTMLSelectElement;
const startIn = $("start") as HTMLInputElement;
const firstIn = $("first-one") as HTMLInputElement;
const baseIn = $("base") as HTMLInputElement;
const lookupN = $("lookup-n") as HTMLInputElement;
const lookupD = $("lookup-d") as HTMLInputElement;

const KIND = {
  couple: { start: "사귄 날짜", since: "사귄 지", title: "커플 기념일" },
  wedding: { start: "결혼한 날짜", since: "결혼한 지", title: "결혼기념일" },
  baby: { start: "태어난 날짜", since: "태어난 지", title: "아기 기념일" },
} as const;
type KindKey = keyof typeof KIND;

const fmt = (n: number) => n.toLocaleString("ko-KR");

/** 이 기기 기준 오늘(지역 날짜) — toISOString 은 한국 0~9시에 하루 밀린다 */
function today(): number {
  const t = new Date();
  return toDay(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`)!;
}

/** '2026-12-25 (금) · 성탄절' — 공휴일 목록 안이면 이름을 붙인다 */
function withHoliday(n: number): string {
  const h = holidayName(n);
  return h ? `${label(n)} · ${h}` : label(n);
}

let lastLines: [string, string][] = [];
let lastTitle = "커플 기념일";

function set(id: string, text: string) {
  $(id).textContent = text;
}

function lookups(start: number, first: boolean, base: number) {
  const n = Number(lookupN.value);
  if (lookupN.value === "") set("lookup-n-out", "알고 싶은 일수를 넣으세요.");
  else if (!Number.isInteger(n) || n < 1 || n > 36500) set("lookup-n-out", "1 ~ 36,500 사이 정수로 넣어 주세요.");
  else {
    const day = nthDay(start, n, first);
    set("lookup-n-out", `${fmt(n)}일은 ${withHoliday(day)} · ${dday(day, base)}`);
  }
  const d = toDay(lookupD.value);
  if (d === null) set("lookup-d-out", "생일·여행 날짜를 골라 보세요.");
  else {
    const c = dayCount(start, d, first);
    set("lookup-d-out", c === null ? `시작일보다 ${fmt(start - d)}일 앞입니다.` : `${label(d)}은 ${fmt(c)}일${first ? "째" : ""}입니다.`);
  }
}

function compute() {
  const k = KIND[(kindIn.value as KindKey) in KIND ? (kindIn.value as KindKey) : "couple"];
  set("start-label", k.start);
  const start = toDay(startIn.value);
  const base = toDay(baseIn.value);
  if (start === null || base === null) {
    set("hero-label", "날짜를 넣어 주세요");
    set("hero-value", "—");
    set("hero-sub", "");
    return;
  }
  const first = firstIn.checked;
  const a = anniversary(start, base, first);
  const unit = first ? "일째" : "일";

  set("hero-label", k.since);
  if (a.count === null) {
    set("hero-value", "—");
    set("hero-sub", `시작일이 기준일보다 ${fmt(a.untilStart)}일 뒤입니다. 기념일 날짜만 먼저 보여 드립니다.`);
  } else {
    set("hero-value", `${fmt(a.count)}${unit}`);
    set("hero-sub", `함께한 기간 ${spanText(a)} · ${fmt(a.weeks)}주`);
  }
  if (a.next) {
    set("l-next", `가까운 기념일 · ${a.next.name}`);
    set("v-next", `${label(a.next.day)} ${dday(a.next.day, base)}`);
  }
  set("v-100", label(a.d100));
  set("v-1000", label(a.d1000));
  set("v-y1", label(a.y1));

  const notes: string[] = [];
  if (!first) notes.push("시작일을 0일로 세는 중입니다 — 일수 기념일이 1일째 셈보다 하루 늦습니다.");
  if (base !== today()) notes.push(`기준일 ${label(base)} 기준으로 셌습니다.`);
  set("note", notes.join(" "));

  // 표 — 일수 기념일 다음 주년
  const rows = [...DAY_MARKS.map((n) => dayMark(start, n, first)), ...YEAR_MARKS.map((n) => yearMark(start, n))];
  const tb = $("rows");
  tb.replaceChildren(
    ...rows.map((m) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = m.name;
      const td1 = document.createElement("td");
      td1.textContent = withHoliday(m.day);
      const td2 = document.createElement("td");
      td2.textContent = dday(m.day, base);
      tr.append(th, td1, td2);
      if (m.day === base) tr.setAttribute("aria-current", "date");
      return tr;
    }),
  );
  const outside = rows.some((m) => !holidayCovered(m.day));
  set("rows-note", outside ? `공휴일 표시는 관공서 공휴일 목록(${holidayRange.from.slice(0, 4)}~${holidayRange.to.slice(0, 4)}년) 안에서만 합니다.` : "");

  lookups(start, first, base);

  lastTitle = `${k.title} — ${label(start)} 시작`;
  lastLines = [
    [k.since, a.count === null ? "시작 전" : `${fmt(a.count)}${unit}`],
    ...(a.next ? ([[`다음 · ${a.next.name}`, `${label(a.next.day)} ${dday(a.next.day, base)}`]] as [string, string][]) : []),
    ["100일", label(a.d100)],
    ["1000일", label(a.d1000)],
    ["1주년", label(a.y1)],
  ];
}

for (const el of [kindIn, firstIn]) {
  el.addEventListener("change", () => {
    reportUse(1);
    compute();
  });
}
for (const el of [startIn, baseIn, lookupN, lookupD]) {
  el.addEventListener("input", () => {
    reportUse(1);
    compute();
  });
}

// 시작일 예시 — 기준일에서 센다
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-preset]")) {
  b.addEventListener("click", () => {
    const base = toDay(baseIn.value) ?? today();
    const y = Number(fromDay(base).slice(0, 4));
    const md = fromDay(base).slice(4);
    const start = {
      today: base,
      minus99: base - 99,
      lastyear: toDay(`${y - 1}${md}`) ?? toDay(`${y - 1}-02-28`)!,
    }[b.dataset.preset as "today" | "minus99" | "lastyear"];
    startIn.value = fromDay(start);
    reportUse(1);
    compute();
  });
}

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "anniversary" });
  downloadCard(buildCard(), "anniversary-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "anniversary" });
  await shareCard(buildCard(), "기념일 계산 결과 - jupocket.com");
});

// 처음 열면 기준일은 오늘 — 시작일은 예시 그대로
baseIn.value = fromDay(today());
compute();
