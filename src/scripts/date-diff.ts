import { toDay, span, spanText, label, shift, shiftBusiness, dday, holidayRange, type Unit, type Span } from "../lib/date-calc";
import { labelJa, spanTextJa, ddayJa } from "../lib/date-format-ja";
import { labelFr, pluralFr, joursFr, semainesFr, spanTextFr, ddayFr } from "../lib/fr/date-format";
import { labelDe, shortDe, countDe, spanTextDe, weeksTextDe, relDe, type UnitDe } from "../lib/de/date-format";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";
import { pickLang } from "../i18n/ui";

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

/**
 * 영어판(/en-us/tools/date-diff/ — 영어 다섯 판 공용). 날짜는 페이지 lang(en-US·en-GB…)의 Intl 표기라 월·일 순서가 판마다 맞는다.
 * 하루 번호는 UTC 자정이라 timeZone "UTC" 필수(없으면 미국 방문자에게 하루 앞 날짜가 보인다).
 * 업무일(공휴일 빼기)·시간 환산은 넣지 않는다 — 그 나라 공휴일·서머타임 원문을 확인하지 않았다.
 */
const enLang = document.documentElement.lang || "en-US";
const labelEn = (d: number) =>
  new Date(d * 86_400_000).toLocaleDateString(enLang, { timeZone: "UTC", weekday: "short", year: "numeric", month: "long", day: "numeric" });
const plural = (v: number, one: string) => `${n(v, enLang)} ${one}${v === 1 ? "" : "s"}`;
const spanTextEn = (s: Span) => {
  const parts: string[] = [];
  if (s.years) parts.push(plural(s.years, "year"));
  if (s.months) parts.push(plural(s.months, "month"));
  if (s.restDays || parts.length === 0) parts.push(plural(s.restDays, "day"));
  return parts.join(", ");
};

const EN: typeof KO = {
  spanTitle: "Date calculator — days between two dates",
  shiftTitle: "Date calculator — add or subtract days",
  needDates: "Enter both dates",
  needBase: "Enter a start date",
  needInt: "Enter a whole number, 0 or more",
  swapped: "The end date was before the start date, so the two dates were swapped.",
  spanLabel: (incl: boolean) => (incl ? "Days between (end date included)" : "Days between"),
  days: (v: number) => plural(v, "day"),
  spanSub: (s: Span) => `${spanTextEn(s)} · ${plural(s.weeks, "week")}, ${plural(s.weekRest, "day")}`,
  spanChips: (s: Span): [string, string][] => [
    ["Weekdays (Mon–Fri)", plural(s.weekdays, "day")],
    ["Dates", `${labelEn(s.from)} → ${labelEn(s.to)}`],
  ],
  spanNotes: () => [],
  unitName: (u: Unit) => ({ day: "day", week: "week", month: "month", year: "year" })[u],
  shiftWhat: (amount: number, unitName: string, after: boolean) => `${plural(amount, unitName)} ${after ? "after" : "before"}`,
  bizOut: "",
  label: labelEn,
  todaySub: (target: number, today: number) => {
    const d = target - today;
    return d === 0 ? "That's today" : d > 0 ? `${plural(d, "day")} from today` : `${plural(-d, "day")} ago`;
  },
  baseChip: "Start date",
  betweenChip: "Days between",
  between: (s: Span) => `${plural(s.days, "day")} (${spanTextEn(s)})`,
  monthEnd: "If that day doesn't exist in the month (the 31st, Feb 29), the last day of the month is used.",
  shareText: "Date calculator result - jupocket.com",
};

/**
 * 번체판(/zh-tw/·/zh-hk/ 공용). 날짜는 페이지 lang(zh-Hant-TW·zh-Hant-HK)의 Intl 표기('2026年10月20日週二'), timeZone "UTC" 필수.
 * 두 판이 같이 쓰므로 한쪽에만 쓰는 말(民國·國定假日 등)은 넣지 않는다. 업무일(공휴일 빼기)·시간 환산은 넣지 않는다.
 */
const zhLang = document.documentElement.lang || "zh-Hant-TW";
const labelZh = (d: number) =>
  new Date(d * 86_400_000).toLocaleDateString(zhLang, { timeZone: "UTC", weekday: "short", year: "numeric", month: "long", day: "numeric" });
const dayZh = (v: number) => `${n(v, zhLang)}天`;
const spanTextZh = (s: Span) => {
  const parts: string[] = [];
  if (s.years) parts.push(`${n(s.years, zhLang)}年`);
  if (s.months) parts.push(`${n(s.months, zhLang)}個月`);
  if (s.restDays || parts.length === 0) parts.push(dayZh(s.restDays));
  return parts.join("");
};

const ZH_HANT: typeof KO = {
  spanTitle: "日期計算結果 — 兩個日期相差幾天",
  shiftTitle: "日期計算結果 — 幾天後、幾天前",
  needDates: "請輸入兩個日期",
  needBase: "請輸入基準日期",
  needInt: "請輸入 0 以上的整數",
  swapped: "結束日期早於開始日期，已將兩個日期對調後計算。",
  spanLabel: (incl: boolean) => (incl ? "兩個日期相差（含頭尾）" : "兩個日期相差"),
  days: dayZh,
  spanSub: (s: Span) => `${spanTextZh(s)} · ${n(s.weeks, zhLang)}週${n(s.weekRest, zhLang)}天`,
  spanChips: (s: Span): [string, string][] => [
    ["平日（週一到週五）", dayZh(s.weekdays)],
    ["期間", `${labelZh(s.from)} → ${labelZh(s.to)}`],
  ],
  spanNotes: () => [],
  unitName: (u: Unit) => ({ day: "天", week: "週", month: "個月", year: "年" })[u],
  shiftWhat: (amount: number, unitName: string, after: boolean) => `${n(amount, zhLang)}${unitName}${after ? "後" : "前"}`,
  bizOut: "",
  label: labelZh,
  todaySub: (target: number, today: number) => {
    const d = target - today;
    return d === 0 ? "就是今天" : d > 0 ? `距今天還有${dayZh(d)}` : `${dayZh(-d)}前`;
  },
  baseChip: "基準日期",
  betweenChip: "相差",
  between: (s: Span) => `${dayZh(s.days)}（${spanTextZh(s)}）`,
  monthEnd: "如果那個月沒有這一天（31日、2月29日），就取那個月的最後一天。",
  shareText: "日期計算結果 - jupocket.com",
};

/**
 * 독일어판(/de/tools/date-diff/). 표기는 lib/de/date-format.ts — 긴 날짜 'Dienstag, 20. Oktober 2026', 칩은 '20.10.2026'(BGB 원문 꼴).
 * 업무일(공휴일 빼기)·시간 환산은 넣지 않는다 — 독일 공휴일은 곳마다 다르고(§ 193 BGB) 서머타임 전환일이 있다.
 * 월·년 더하기에서 없는 날을 말일로 맞추는 것은 § 188 Abs. 3 BGB 와 같다.
 */
const DE: typeof KO = {
  spanTitle: "Tagerechner — Tage zwischen zwei Daten",
  shiftTitle: "Tagerechner — Datum plus oder minus",
  needDates: "Bitte beide Daten eingeben",
  needBase: "Bitte ein Ausgangsdatum eingeben",
  needInt: "Bitte eine ganze Zahl ab 0 eingeben",
  swapped: "Das Enddatum lag vor dem Startdatum — die beiden Daten wurden getauscht.",
  spanLabel: (incl: boolean) => (incl ? "Tage mit Anfangs- und Endtag" : "Tage zwischen den Daten"),
  days: (v: number) => countDe(v, "day"),
  spanSub: (s: Span) => `${spanTextDe(s)} · ${weeksTextDe(s.weeks, s.weekRest)}`,
  spanChips: (s: Span): [string, string][] => [
    ["Montag bis Freitag", countDe(s.weekdays, "day")],
    ["Zeitraum", `${shortDe(s.from)} → ${shortDe(s.to)}`],
  ],
  spanNotes: () => [],
  unitName: (u: Unit) => u,
  shiftWhat: (amount: number, unitName: string, after: boolean) => `${countDe(amount, unitName as UnitDe)} ${after ? "später" : "früher"}`,
  bizOut: "",
  label: labelDe,
  todaySub: (target: number, today: number) => `Von heute aus: ${relDe(target, today)}`,
  baseChip: "Ausgangsdatum",
  betweenChip: "Abstand",
  between: (s: Span) => `${countDe(s.days, "day")} (${spanTextDe(s)})`,
  monthEnd: "Gibt es den Tag im Zielmonat nicht (31., 29. Februar), gilt der letzte Tag des Monats — wie in § 188 Abs. 3 BGB.",
  shareText: "Tagerechner-Ergebnis - jupocket.com",
};

/**
 * 인도네시아어판(/id/tools/date-diff/). 날짜는 id-ID Intl 표기('Rabu, 21 Oktober 2026'), timeZone "UTC" 필수.
 * 업무일(공휴일 빼기)·시간 환산은 넣지 않는다 — 인도네시아 공휴일·cuti bersama 를 원문으로 확인하지 않았다. 복수형 없음.
 */
const labelId = (d: number) =>
  new Date(d * 86_400_000).toLocaleDateString("id-ID", { timeZone: "UTC", weekday: "long", year: "numeric", month: "long", day: "numeric" });
const dayId = (v: number) => `${n(v, "id-ID")} hari`;
const spanTextId = (s: Span) => {
  const parts: string[] = [];
  if (s.years) parts.push(`${n(s.years, "id-ID")} tahun`);
  if (s.months) parts.push(`${n(s.months, "id-ID")} bulan`);
  if (s.restDays || parts.length === 0) parts.push(dayId(s.restDays));
  return parts.join(" ");
};

const ID: typeof KO = {
  spanTitle: "Kalkulator tanggal — selisih dua tanggal",
  shiftTitle: "Kalkulator tanggal — tambah atau kurangi tanggal",
  needDates: "Masukkan kedua tanggal",
  needBase: "Masukkan tanggal awal",
  needInt: "Masukkan bilangan bulat, 0 atau lebih",
  swapped: "Tanggal akhir lebih dulu dari tanggal awal, jadi kedua tanggal ditukar.",
  spanLabel: (incl: boolean) => (incl ? "Selisih dua tanggal (hari pertama ikut dihitung)" : "Selisih dua tanggal"),
  days: dayId,
  spanSub: (s: Span) => `${spanTextId(s)} · ${n(s.weeks, "id-ID")} minggu ${dayId(s.weekRest)}`,
  spanChips: (s: Span): [string, string][] => [
    ["Hari Senin–Jumat", dayId(s.weekdays)],
    ["Periode", `${labelId(s.from)} → ${labelId(s.to)}`],
  ],
  spanNotes: () => [],
  unitName: (u: Unit) => ({ day: "hari", week: "minggu", month: "bulan", year: "tahun" })[u],
  shiftWhat: (amount: number, unitName: string, after: boolean) => `${n(amount, "id-ID")} ${unitName} ${after ? "sesudahnya" : "sebelumnya"}`,
  bizOut: "",
  label: labelId,
  todaySub: (target: number, today: number) => {
    const d = target - today;
    return d === 0 ? "Hari ini" : d > 0 ? `${dayId(d)} lagi dari hari ini` : `${dayId(-d)} yang lalu`;
  },
  baseChip: "Tanggal awal",
  betweenChip: "Selisih",
  between: (s: Span) => `${dayId(s.days)} (${spanTextId(s)})`,
  monthEnd: "Bila tanggal itu tidak ada di bulan tujuan (tanggal 31, 29 Februari), dipakai hari terakhir bulan itu.",
  shareText: "Hasil kalkulator tanggal - jupocket.com",
};

/**
 * 프랑스어판(/fr/tools/date-diff/). 표기는 lib/fr/date-format.ts — 'mar. 20 octobre 2026', 0·1 은 단수(0 jour).
 * 업무일(공휴일 빼기)·시간 환산은 넣지 않는다 — fêtes légales 중 의무 휴무는 1er Mai 뿐이라 회사마다 다르고(service-public F2405), 서머타임 전환일이 있다.
 */
const UNIT_FR: Record<Unit, [string, string]> = { day: ["jour", "jours"], week: ["semaine", "semaines"], month: ["mois", "mois"], year: ["an", "ans"] };

const FR: typeof KO = {
  spanTitle: "Calcul de dates — nombre de jours entre deux dates",
  shiftTitle: "Calcul de dates — ajouter ou retirer des jours",
  needDates: "Saisissez les deux dates",
  needBase: "Saisissez une date de départ",
  needInt: "Saisissez un nombre entier, 0 ou plus",
  swapped: "La date de fin était avant la date de début : les deux dates ont été inversées.",
  spanLabel: (incl: boolean) => (incl ? "Nombre de jours, bornes incluses" : "Nombre de jours entre les deux dates"),
  days: joursFr,
  spanSub: (s: Span) => `${spanTextFr(s)} · ${semainesFr(s.weeks)} et ${joursFr(s.weekRest)}`,
  spanChips: (s: Span): [string, string][] => [
    ["Du lundi au vendredi", joursFr(s.weekdays)],
    ["Période", `${labelFr(s.from)} → ${labelFr(s.to)}`],
  ],
  spanNotes: () => [],
  unitName: (u: Unit) => u,
  shiftWhat: (amount: number, unitName: string, after: boolean) =>
    `${pluralFr(amount, ...UNIT_FR[unitName as Unit])} ${after ? "après" : "avant"}`,
  bizOut: "",
  label: labelFr,
  todaySub: (target: number, today: number) => {
    const r = ddayFr(target, today);
    return r === "aujourd’hui" ? "C’est aujourd’hui" : `Par rapport à aujourd’hui : ${r}`;
  },
  baseChip: "Date de départ",
  betweenChip: "Écart",
  between: (s: Span) => `${joursFr(s.days)} (${spanTextFr(s)})`,
  monthEnd: "Si ce jour n’existe pas dans le mois d’arrivée (le 31, le 29 février), le dernier jour du mois est retenu.",
  shareText: "Résultat du calcul de dates - jupocket.com",
};

const S = pickLang({ ko: KO, ja: JA, en: EN, "zh-Hant": ZH_HANT, de: DE, id: ID, fr: FR });

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
