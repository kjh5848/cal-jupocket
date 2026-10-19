import { toDay, fromDay, label } from "../lib/date-calc";
import { age, type Age } from "../lib/age";
import { labelJa } from "../lib/date-format-ja";
import { schoolGrade, type SchoolGrade } from "../lib/jp/school-grade";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";
import { pageLocale } from "../i18n/ui";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("age");

const $ = (id: string) => document.getElementById(id)!;
const birthIn = $("birth") as HTMLInputElement;
const baseIn = $("base") as HTMLInputElement;
const n = (v: number, loc: string) => v.toLocaleString(loc);

/** 이 기기 기준 오늘(지역 날짜) */
function today(): number {
  const t = new Date();
  return toDay(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`)!;
}

/**
 * 화면 문구 — 한국어판(/tools/age/)과 일본어판(/ja/tools/age/)이 같은 계산(lib/age.ts)을 쓴다.
 * 일본어판은 연 나이 대신 '今年の誕生日で', 세는 나이 대신 '数え年'(같은 셈), 학년(lib/jp/school-grade.ts)을 더 낸다.
 */
const KO = {
  needDate: "날짜를 넣어 주세요",
  baseLabel: (base: number) => `${label(base)} 기준`,
  future: "생년월일이 기준일보다 뒤입니다. 날짜를 확인해 주세요.",
  nextEmpty: "다음 생일",
  hero: (a: Age) => (a.years === 0 ? `${a.totalMonths}개월` : `만 ${a.years}세`),
  detail: (a: Age) => (a.years === 0 ? `${a.totalMonths}개월 ${a.days}일 · 만 0세` : `${a.years}세 ${a.months}개월 ${a.days}일`),
  until: (a: Age) => (a.turnsToday ? "오늘 한 살 더 먹는 날" : `다음 생일까지 ${n(a.daysToNext, "ko-KR")}일`),
  year: (a: Age) => `${a.yearAge}세`,
  korean: (a: Age) => `${a.koreanAge}살`,
  months: (a: Age) => `${n(a.totalMonths, "ko-KR")}개월`,
  lived: (a: Age) => `${n(a.livedDays, "ko-KR")}일`,
  nextLabel: (a: Age) => `만 ${a.nextAge}세 되는 날`,
  label,
  leap: "2월 29일생은 평년엔 3월 1일부터 한 살 더 먹습니다(민법 제160조 ③).",
  dayCount: (a: Age) => `태어난 날을 1일째로 세면 ${n(a.dayCount, "ko-KR")}일째입니다.`,
  notToday: "기준일이 오늘이 아닙니다.",
  title: "만 나이",
  cardTitle: (base: number) => `만 나이 — ${label(base)} 기준`,
  cardLines: (a: Age, hero: string): [string, string][] => [
    ["만 나이", hero],
    ["연 나이 · 세는 나이", `${a.yearAge}세 · ${a.koreanAge}살`],
    ["살아온 날", `${n(a.livedDays, "ko-KR")}일`],
    [`만 ${a.nextAge}세 되는 날`, label(a.next)],
  ],
  shareText: "만 나이 계산 결과 - jupocket.com",
};

const STAGE_JA = (g: SchoolGrade) =>
  g.stage === "preschool"
    ? "小学校入学前"
    : g.stage === "elementary"
      ? `小学${g.grade}年生`
      : g.stage === "junior"
        ? `中学${g.grade}年生`
        : "中学校卒業後";

const JA: typeof KO = {
  needDate: "日付を入れてください",
  baseLabel: (base: number) => `${labelJa(base)}時点`,
  future: "生年月日が基準日より後になっています。日付を確かめてください。",
  nextEmpty: "次の誕生日",
  hero: (a: Age) => (a.years === 0 ? `${a.totalMonths}か月` : `満${a.years}歳`),
  detail: (a: Age) => (a.years === 0 ? `${a.totalMonths}か月${a.days}日 · 満0歳` : `${a.years}歳${a.months}か月${a.days}日`),
  until: (a: Age) => (a.turnsToday ? "今日が誕生日です" : `次の誕生日まであと${n(a.daysToNext, "ja-JP")}日`),
  year: (a: Age) => `${a.yearAge}歳`,
  korean: (a: Age) => `${a.koreanAge}歳`,
  months: (a: Age) => `${n(a.totalMonths, "ja-JP")}か月`,
  lived: (a: Age) => `${n(a.livedDays, "ja-JP")}日（${n(Math.floor(a.livedDays / 7), "ja-JP")}週${a.livedDays % 7}日）`,
  nextLabel: (a: Age) => `次の誕生日（${a.nextAge}歳）`,
  label: labelJa,
  leap: "2月29日生まれは、平年は3月1日から1つ上の年齢として数えます（民法 第143条 第2項ただし書）。",
  dayCount: (a: Age) => `生まれた日を1日目と数えると${n(a.dayCount, "ja-JP")}日目です。`,
  notToday: "基準日が今日ではありません。",
  title: "満年齢",
  cardTitle: (base: number) => `満年齢 — ${labelJa(base)}時点`,
  cardLines: (a: Age, hero: string): [string, string][] => [
    ["満年齢", hero],
    ["今年の誕生日で · 数え年", `${a.yearAge}歳 · ${a.koreanAge}歳`],
    ["生まれてから", `${n(a.livedDays, "ja-JP")}日`],
    [`次の誕生日（${a.nextAge}歳）`, labelJa(a.next)],
  ],
  shareText: "満年齢の計算結果 - jupocket.com",
};

const isJa = pageLocale() === "ja";
const S = isJa ? JA : KO;

let lastLines: [string, string][] = [];
let lastTitle = S.title;

function set(id: string, text: string) {
  $(id).textContent = text;
}

/** 일본어판에만 있는 칸 — 한국어판에는 없으니 있을 때만 쓴다 */
function setIf(id: string, text: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/** 年齢早見表(일본어판만) — 기준일 연도로 다시 만든다 */
function renderTable(year: number) {
  const body = document.getElementById("hayami-body");
  if (!body) return;
  setIf("hayami-year", `${year}`);
  const rows: string[] = [];
  for (let by = year; by >= year - 100; by--) {
    const after = year - by;
    rows.push(`<tr><td>${by}年</td><td>${after}歳</td><td>${after === 0 ? "—" : `${after - 1}歳`}</td><td>${after + 1}歳</td></tr>`);
  }
  body.innerHTML = rows.join("");
}

/** 계산할 수 없을 때 — 지난 결과가 남지 않게 칸을 비운다 */
function clear(heroLabel: string, note: string) {
  set("hero-label", heroLabel);
  set("hero-value", "—");
  set("hero-sub", "");
  for (const id of ["v-year", "v-korean", "v-months", "v-lived", "v-next", "v-grade", "v-entry"]) setIf(id, "—");
  set("l-next", S.nextEmpty);
  set("note", note);
  lastLines = [];
}

function compute() {
  const birth = toDay(birthIn.value);
  const base = toDay(baseIn.value);
  if (base !== null) renderTable(Number(fromDay(base).slice(0, 4)));
  if (birth === null || base === null) return clear(S.needDate, "");
  const a = age(birth, base);
  if (!a) return clear(S.baseLabel(base), S.future);

  // 1세 미만은 개월로(민법 제158조 단서 · 年齢のとなえ方に関する法律)
  const hero = S.hero(a);

  set("hero-label", S.baseLabel(base));
  set("hero-value", hero);
  set("hero-sub", `${S.detail(a)} · ${S.until(a)}`);
  set("v-year", S.year(a));
  set("v-korean", S.korean(a));
  set("v-months", S.months(a));
  set("v-lived", S.lived(a));
  set("l-next", S.nextLabel(a));
  set("v-next", S.label(a.next));
  if (isJa) {
    const g = schoolGrade(birth, base);
    setIf("v-grade", STAGE_JA(g));
    setIf("v-entry", `${g.elementaryEntry}年4月`);
  }

  const notes: string[] = [];
  if (birthIn.value.slice(5) === "02-29") notes.push(S.leap);
  if (a.livedDays > 0) notes.push(S.dayCount(a));
  if (base !== today()) notes.push(S.notToday);
  set("note", notes.join(isJa ? "" : " "));

  lastTitle = S.cardTitle(base);
  lastLines = S.cardLines(a, hero);
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
    const p = b.dataset.preset;
    if (p === "newyear") baseIn.value = `${y + 1}-01-01`;
    else if (p === "april") {
      // 다음 4월 1일(오늘이 4월 1일이면 오늘) — 일본어판 학년 기준일
      const apr = toDay(`${y}-04-01`)!;
      baseIn.value = t <= apr ? fromDay(apr) : `${y + 1}-04-01`;
    } else baseIn.value = fromDay(t);
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
  await shareCard(buildCard(), S.shareText);
});

// 처음 열면 기준일은 오늘
baseIn.value = fromDay(today());
compute();
