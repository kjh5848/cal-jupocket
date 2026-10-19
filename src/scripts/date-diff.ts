import { toDay, span, spanText, label, shift, shiftBusiness, dday, holidayRange, type Unit, type Span } from "../lib/date-calc";
import { labelJa, spanTextJa, ddayJa } from "../lib/date-format-ja";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";
import { pageLocale } from "../i18n/ui";

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
/** 업무일 토글 — 일본어판에는 없다(일본 祝日 목록을 원문으로 확인하지 않았다) */
const bizIn = document.getElementById("biz") as HTMLInputElement | null;

const yearRange = `${holidayRange.from.slice(0, 4)}~${holidayRange.to.slice(0, 4)}년`;
const n = (v: number, loc: string) => v.toLocaleString(loc);

/**
 * 화면 문구 — 한국어판(/tools/date-diff/)과 일본어판(/ja/tools/date-diff/)이 같은 계산을 쓴다.
 * 일본어판은 업무일(공휴일 빼기)을 하지 않는다 — 한국 관공서 공휴일 목록이라서. 토·일만 뺀 平日까지.
 */
const KO = {
  spanTitle: "날짜 계산 결과 — 두 날짜 사이",
  shiftTitle: "날짜 계산 결과 — 며칠 뒤·앞",
  needDates: "날짜를 넣어 주세요",
  needBase: "기준일을 넣어 주세요",
  needInt: "0 이상 정수를 넣어 주세요",
  swapped: "종료일이 시작일보다 앞이라 두 날짜를 바꿔 셌습니다.",
  spanLabel: (incl: boolean) => (incl ? "두 날짜 사이 (종료일 포함)" : "두 날짜 사이"),
  days: (v: number) => `${n(v, "ko-KR")}일`,
  spanSub: (s: Span) => `${spanText(s)} · ${s.weeks}주 ${s.weekRest}일 · ${n(s.hours, "ko-KR")}시간`,
  spanChips: (s: Span): [string, string][] => [
    ["평일 (토·일 뺌)", `${n(s.weekdays, "ko-KR")}일`],
    ["업무일 (공휴일도 뺌)", s.businessDays === null ? "—" : `${n(s.businessDays, "ko-KR")}일`],
    ["기간", `${label(s.from)} → ${label(s.to)}`],
  ],
  spanNotes: (s: Span) => {
    if (s.businessDays === null) return [`공휴일 목록은 ${yearRange}만 있어 업무일은 계산하지 않았습니다.`];
    if (!s.holidaysOnWeekdays.length) return [];
    return [`평일에 걸린 공휴일 ${s.holidaysOnWeekdays.length}일: ${s.holidaysOnWeekdays.map((h) => `${h.date.slice(5).replace("-", "/")} ${h.name}`).join(", ")}`];
  },
  unitName: (u: Unit, biz: boolean) => ({ day: biz ? "업무일" : "일", week: "주", month: "개월", year: "년" })[u],
  shiftWhat: (amount: number, unitName: string, after: boolean) => `${n(amount, "ko-KR")}${unitName} ${after ? "뒤" : "앞"}`,
  bizOut: `공휴일 목록은 ${yearRange}만 있어 이 범위를 넘는 업무일은 셀 수 없습니다.`,
  label,
  todaySub: (target: number, today: number) => `오늘 기준 ${dday(target, today)}`,
  baseChip: "기준일",
  betweenChip: "두 날짜 사이",
  between: (s: Span) => `${n(s.days, "ko-KR")}일 (${spanText(s)})`,
  monthEnd: "그 달에 없는 날(31일·윤일)이면 그 달 말일로 맞췄습니다.",
  shareText: "날짜 계산 결과 - jupocket.com",
};

const JA: typeof KO = {
  spanTitle: "日数計算の結果 — 2つの日付の間",
  shiftTitle: "日付計算の結果 — 何日後・何日前",
  needDates: "日付を入れてください",
  needBase: "基準日を入れてください",
  needInt: "0 以上の整数を入れてください",
  swapped: "終了日が開始日より前なので、2つの日付を入れ替えて数えました。",
  spanLabel: (incl: boolean) => (incl ? "2つの日付の間（初日も数える）" : "2つの日付の間"),
  days: (v: number) => `${n(v, "ja-JP")}日`,
  spanSub: (s: Span) => `${spanTextJa(s)} · ${s.weeks}週${s.weekRest}日 · ${n(s.hours, "ja-JP")}時間`,
  spanChips: (s: Span): [string, string][] => [
    ["平日（土日を除く）", `${n(s.weekdays, "ja-JP")}日`],
    ["期間", `${labelJa(s.from)} → ${labelJa(s.to)}`],
  ],
  spanNotes: () => [],
  unitName: (u: Unit) => ({ day: "日", week: "週間", month: "か月", year: "年" })[u],
  shiftWhat: (amount: number, unitName: string, after: boolean) => `${n(amount, "ja-JP")}${unitName}${after ? "後" : "前"}`,
  bizOut: "",
  label: labelJa,
  todaySub: (target: number, today: number) => `今日から ${ddayJa(target, today)}`,
  baseChip: "基準日",
  betweenChip: "2つの日付の間",
  between: (s: Span) => `${n(s.days, "ja-JP")}日（${spanTextJa(s)}）`,
  monthEnd: "その月にない日付（31日・2月29日など）は、その月の末日にしました。",
  shareText: "日付計算の結果 - jupocket.com",
};

const S = pageLocale() === "ja" ? JA : KO;

/** 이 기기 기준 오늘(지역 날짜) */
function todayDay(): number {
  const t = new Date();
  const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return toDay(iso)!;
}

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
  lastTitle = S.spanTitle;
  const a = toDay(startIn.value);
  const b = toDay(endIn.value);
  if (a === null || b === null) return show(S.needDates, "—", "", []);
  const s = span(a, b, inclIn.checked);
  const notes: string[] = [];
  if (s.swapped) notes.push(S.swapped);
  notes.push(...S.spanNotes(s));
  show(S.spanLabel(inclIn.checked), S.days(s.days), S.spanSub(s), S.spanChips(s), notes.join(" "));
}

function computeShift() {
  lastTitle = S.shiftTitle;
  const base = toDay(baseIn.value);
  const raw = amountIn.value.trim();
  const amount = Number(raw);
  if (base === null) return show(S.needBase, "—", "", []);
  if (raw === "" || !Number.isInteger(amount) || amount < 0) return show(S.needInt, "—", "", []);
  const unit = unitSel.value as Unit;
  const sign = dirSel.value === "before" ? -1 : 1;
  const biz = !!bizIn?.checked && unit === "day";
  const target = biz ? shiftBusiness(base, sign * amount) : shift(base, sign * amount, unit);
  const what = S.shiftWhat(amount, S.unitName(unit, biz), sign > 0);
  if (target === null) return show(what, "—", "", [], S.bizOut);
  const s = span(base, target, false);
  show(what, S.label(target), S.todaySub(target, todayDay()), [
    [S.baseChip, S.label(base)],
    [S.betweenChip, S.between(s)],
  ], unit === "month" || unit === "year" ? S.monthEnd : "");
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
  const wrap = document.getElementById("biz-wrap");
  if (wrap) wrap.hidden = unitSel.value !== "day";
}

modeSel.addEventListener("change", setMode);
unitSel.addEventListener("change", () => {
  syncBiz();
  compute();
});
for (const el of [startIn, endIn, inclIn, baseIn, amountIn, dirSel, bizIn]) {
  if (!el) continue;
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
  await shareCard(buildCard(), S.shareText);
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
