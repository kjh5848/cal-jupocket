import { toDay, span, spanText, label, shift, shiftBusiness, dday, holidayRange, type Unit } from "../lib/date-calc";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("date-diff");

const $ = (id: string) => document.getElementById(id)!;
const modeSel = $("mode") as HTMLSelectElement;
const startIn = $("start") as HTMLInputElement;
const endIn = $("end") as HTMLInputElement;
const inclIn = $("inclusive") as HTMLInputElement;
const baseIn = $("base") as HTMLInputElement;
const amountIn = $("amount") as HTMLInputElement;
const unitSel = $("unit") as HTMLSelectElement;
const dirSel = $("dir") as HTMLSelectElement;
const bizIn = $("biz") as HTMLInputElement;

/** 이 기기 기준 오늘(지역 날짜) */
function todayDay(): number {
  const t = new Date();
  const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return toDay(iso)!;
}
const yearRange = `${holidayRange.from.slice(0, 4)}~${holidayRange.to.slice(0, 4)}년`;

let lastTitle = "";
let lastLines: [string, string][] = [];

function show(heroLabel: string, value: string, sub: string, chips: [string, string][], note = "") {
  $("hero-label").textContent = heroLabel;
  $("hero-value").textContent = value;
  $("hero-sub").textContent = sub;
  (["1", "2", "3"] as const).forEach((k, i) => {
    $(`l${k}`).textContent = chips[i]?.[0] ?? "";
    $(`v${k}`).textContent = chips[i]?.[1] ?? "";
    ($(`l${k}`).parentElement as HTMLElement).hidden = !chips[i];
  });
  $("note").textContent = note;
  lastLines = [[heroLabel, value], ...chips];
}

function computeSpan() {
  lastTitle = "날짜 계산 결과 — 두 날짜 사이";
  const a = toDay(startIn.value);
  const b = toDay(endIn.value);
  if (a === null || b === null) return show("날짜를 넣어 주세요", "—", "", []);
  const s = span(a, b, inclIn.checked);
  const notes: string[] = [];
  if (s.swapped) notes.push("종료일이 시작일보다 앞이라 두 날짜를 바꿔 셌습니다.");
  if (s.businessDays === null) notes.push(`공휴일 목록은 ${yearRange}만 있어 업무일은 계산하지 않았습니다.`);
  else if (s.holidaysOnWeekdays.length) {
    notes.push(`평일에 걸린 공휴일 ${s.holidaysOnWeekdays.length}일: ${s.holidaysOnWeekdays.map((h) => `${h.date.slice(5).replace("-", "/")} ${h.name}`).join(", ")}`);
  }
  show(
    inclIn.checked ? "두 날짜 사이 (종료일 포함)" : "두 날짜 사이",
    `${s.days.toLocaleString("ko-KR")}일`,
    `${spanText(s)} · ${s.weeks}주 ${s.weekRest}일 · ${s.hours.toLocaleString("ko-KR")}시간`,
    [
      ["평일 (토·일 뺌)", `${s.weekdays.toLocaleString("ko-KR")}일`],
      ["업무일 (공휴일도 뺌)", s.businessDays === null ? "—" : `${s.businessDays.toLocaleString("ko-KR")}일`],
      ["기간", `${label(s.from)} → ${label(s.to)}`],
    ],
    notes.join(" "),
  );
}

function computeShift() {
  lastTitle = "날짜 계산 결과 — 며칠 뒤·앞";
  const base = toDay(baseIn.value);
  const raw = amountIn.value.trim();
  const n = Number(raw);
  if (base === null) return show("기준일을 넣어 주세요", "—", "", []);
  if (raw === "" || !Number.isInteger(n) || n < 0) return show("0 이상 정수를 넣어 주세요", "—", "", []);
  const unit = unitSel.value as Unit;
  const sign = dirSel.value === "before" ? -1 : 1;
  const biz = bizIn.checked && unit === "day";
  const target = biz ? shiftBusiness(base, sign * n) : shift(base, sign * n, unit);
  const unitName = { day: biz ? "업무일" : "일", week: "주", month: "개월", year: "년" }[unit];
  const what = `${n.toLocaleString("ko-KR")}${unitName} ${sign > 0 ? "뒤" : "앞"}`;
  if (target === null) return show(what, "—", "", [], `공휴일 목록은 ${yearRange}만 있어 이 범위를 넘는 업무일은 셀 수 없습니다.`);
  const today = todayDay();
  const s = span(base, target, false);
  show(what, label(target), `오늘 기준 ${dday(target, today)}`, [
    ["기준일", label(base)],
    ["두 날짜 사이", `${s.days.toLocaleString("ko-KR")}일 (${spanText(s)})`],
  ], unit === "month" || unit === "year" ? "그 달에 없는 날(31일·윤일)이면 그 달 말일로 맞췄습니다." : "");
}

function compute() {
  if (modeSel.value === "shift") computeShift();
  else computeSpan();
}

function setMode() {
  const shiftMode = modeSel.value === "shift";
  $("span-fields").hidden = shiftMode;
  $("shift-fields").hidden = !shiftMode;
  compute();
}

function syncBiz() {
  ($("biz-wrap") as HTMLElement).hidden = unitSel.value !== "day";
}

modeSel.addEventListener("change", setMode);
unitSel.addEventListener("change", () => {
  syncBiz();
  compute();
});
for (const el of [startIn, endIn, inclIn, baseIn, amountIn, dirSel, bizIn]) {
  el.addEventListener(el instanceof HTMLInputElement && el.type !== "checkbox" ? "input" : "change", () => {
    reportUse(1);
    compute();
  });
}

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "date-diff" });
  downloadCard(buildCard(), "date-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "date-diff" });
  await shareCard(buildCard(), "날짜 계산 결과 - jupocket.com");
});

// 처음 열면 시작일·기준일을 오늘로(종료일은 그해 12월 31일)
{
  const t = todayDay();
  const iso = new Date(t * 86_400_000).toISOString().slice(0, 10);
  startIn.value = iso;
  baseIn.value = iso;
  endIn.value = `${iso.slice(0, 4)}-12-31`;
}
syncBiz();
setMode();
