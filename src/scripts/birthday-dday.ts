import { toDay, fromDay, label, dday, countdown, durationText, weekday, WEEKDAYS, holidayName, holidayCovered, holidayRange } from "../lib/date-calc";
import { birthdayDday, upcomingBirthdays, validMonthDay, type LeapRule } from "../lib/birthday-dday";
import { labelJa, ddayJa, durationTextJa, WEEKDAYS_JA } from "../lib/date-format-ja";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";
import { pageLocale } from "../i18n/ui";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("birthday-dday");

const $ = (id: string) => document.getElementById(id)!;
const monthIn = $("month") as HTMLSelectElement;
const dayIn = $("day") as HTMLSelectElement;
const yearIn = $("year") as HTMLInputElement;
const leapIn = $("leap") as HTMLSelectElement;
const baseIn = $("base") as HTMLInputElement;


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

/**
 * 화면 문구 — 한국어판(/tools/birthday-dday/)과 일본어판(/ja/tools/birthday-dday/)이 같은 계산(lib/birthday-dday.ts)을 쓴다.
 * 일본어판은 한국 공휴일(관공서 공휴일 목록)을 쓰지 않는다 — 일본 祝日 원문은 미확인이라 요일만 낸다.
 */
const KO = {
  fmt: (n: number) => n.toLocaleString("ko-KR"),
  label,
  dday,
  duration: durationText,
  dayLabel: withHoliday,
  weekdayText: (n: number) => `${WEEKDAYS[weekday(n)]}요일${holidayName(n) ? ` · ${holidayName(n)}` : ""}`,
  birthWeekday: (n: number) => `${WEEKDAYS[weekday(n)]}요일`,
  age: (a: number) => `만 ${a}세`,
  needBase: "기준일을 넣어 주세요",
  noSuchDate: (m: number, d: number) => `${m}월 ${d}일은 없는 날짜입니다`,
  yearRange: "태어난 해는 1900 ~ 2100 사이로 넣어 주세요",
  noLeapDay: (y: number) => `${y}년에는 2월 29일이 없습니다`,
  bornAfter: "태어난 날이 기준일보다 뒤입니다",
  heroToday: "오늘이 생일입니다",
  heroUntil: (when: string) => `다음 생일 ${when}까지`,
  happy: "생일 축하합니다",
  daysLeft: (n: string) => `${n}일 남음`,
  turning: (today: boolean, a: number) => `${today ? "오늘" : "이번 생일에"} 만 ${a}세`,
  todayLeft: (t: string) => `오늘 끝까지 ${t}`,
  needYear: "태어난 해를 넣으면 나옵니다",
  days: (n: string) => `${n}일`,
  bar: (prev: string, next: string, pct: string) => `${prev} → ${next} · ${pct}% 지남`,
  nowAge: (a: number, w: string) => `지금 만 ${a}세 · 태어난 날은 ${w}`,
  feb28: "2월 28일에 축하해도 만 나이는 법대로 3월 1일에 오릅니다.",
  feb29: "윤년에만 생일이 옵니다 — 진행 막대는 지난 윤년 생일부터 셉니다.",
  notToday: (b: string) => `기준일 ${b} 기준으로 셌습니다. 남은 시간은 그날 0시부터입니다.`,
  rowsNote: (list: number[]) =>
    list.some((b) => !holidayCovered(b))
      ? `공휴일 표시는 관공서 공휴일 목록(${holidayRange.from.slice(0, 4)}~${holidayRange.to.slice(0, 4)}년) 안에서만 합니다.`
      : "",
  cardTitle: "생일 디데이",
  title: (m: number, d: number) => `생일 디데이 — ${m}월 ${d}일`,
  cardNext: "다음 생일",
  cardDday: "D-day",
  cardAge: "이번 생일 나이",
  cardLived: "살아온 날",
  shareText: "생일 디데이 - jupocket.com",
};

const JA: typeof KO = {
  fmt: (n: number) => n.toLocaleString("ja-JP"),
  label: labelJa,
  dday: ddayJa,
  duration: durationTextJa,
  dayLabel: labelJa,
  weekdayText: (n: number) => `${WEEKDAYS_JA[weekday(n)]}曜日`,
  birthWeekday: (n: number) => `${WEEKDAYS_JA[weekday(n)]}曜日`,
  age: (a: number) => `満${a}歳`,
  needBase: "基準日を入れてください",
  noSuchDate: (m: number, d: number) => `${m}月${d}日はない日付です`,
  yearRange: "生まれた年は1900〜2100の間で入れてください",
  noLeapDay: (y: number) => `${y}年に2月29日はありません`,
  bornAfter: "生まれた日が基準日より後になっています",
  heroToday: "今日が誕生日です",
  heroUntil: (when: string) => `次の誕生日 ${when}まで`,
  happy: "お誕生日おめでとうございます",
  daysLeft: (n: string) => `残り${n}日`,
  turning: (today: boolean, a: number) => `${today ? "今日で" : "次の誕生日で"}満${a}歳`,
  todayLeft: (t: string) => `今日が終わるまで ${t}`,
  needYear: "生まれた年を入れると表示します",
  days: (n: string) => `${n}日`,
  bar: (prev: string, next: string, pct: string) => `${prev} → ${next} · ${pct}%経過`,
  nowAge: (a: number, w: string) => `いまは満${a}歳 · 生まれた日は${w}`,
  feb28: "誕生日を2月28日として数えても、満年齢は法律どおり2月28日が終わる時に1歳加わります。",
  feb29: "うるう年にだけ誕生日が来ます。進み具合のバーは前のうるう年の誕生日から数えます。",
  notToday: (b: string) => `基準日 ${b} で数えました。残り時間はその日の午前0時からです。`,
  rowsNote: () => "",
  cardTitle: "次の誕生日まであと何日",
  title: (m: number, d: number) => `次の誕生日まであと何日 — ${m}月${d}日`,
  cardNext: "次の誕生日",
  cardDday: "あと何日",
  cardAge: "次の誕生日で",
  cardLived: "生まれてからの日数",
  shareText: "誕生日まであと何日 - jupocket.com",
};

const S = pageLocale() === "ja" ? JA : KO;

function set(id: string, text: string) {
  $(id).textContent = text;
}

let lastLines: [string, string][] = [];
let lastTitle = S.cardTitle;

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
  if (base === null) return clear(S.needBase);
  if (!validMonthDay(m, d)) return clear(S.noSuchDate(m, d));

  const yText = yearIn.value.trim();
  const year = yText === "" ? null : Number(yText);
  if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2100)) return clear(S.yearRange);
  const r = birthdayDday(m, d, year, base, rule);
  if (!r) {
    if (year !== null && isLeapDay) return clear(S.noLeapDay(year));
    return clear(S.bornAfter);
  }

  const n = now();
  const isToday = base === n.day;
  // 생일 당일은 그날이 끝날 때까지, 아니면 생일 0시까지. 기준일이 오늘이 아니면 '지금'을 그날 0시로 본다
  const c = countdown(r.next, r.daysLeft === 0 ? null : 0, base, isToday ? n.sec : 0);

  set("hero-label", r.daysLeft === 0 ? S.heroToday : S.heroUntil(S.label(r.next)));
  set("hero-value", S.dday(r.next, base));
  const sub = [r.daysLeft === 0 ? S.happy : S.daysLeft(S.fmt(r.daysLeft))];
  if (r.turningAge !== null) sub.push(S.turning(r.daysLeft === 0, r.turningAge));
  set("hero-sub", sub.join(" · "));
  set("v-time", r.daysLeft === 0 ? S.todayLeft(S.duration(c.seconds)) : S.duration(c.seconds));
  set("v-weekday", S.weekdayText(r.next));
  set("v-age", r.turningAge === null ? S.needYear : S.age(r.turningAge));
  set("v-lived", r.livedDays === null ? S.needYear : S.days(S.fmt(r.livedDays)));

  const pct = Math.min(100, Math.max(0, r.progress));
  ($("bar-fill") as HTMLElement).style.width = `${pct.toFixed(1)}%`;
  $("bar").setAttribute("aria-valuenow", String(Math.round(pct)));
  set("bar-text", S.bar(S.label(r.prev), S.label(r.next), pct.toFixed(1)));

  const notes: string[] = [];
  if (r.currentAge !== null && r.birth !== null) notes.push(S.nowAge(r.currentAge, S.birthWeekday(r.birth)));
  if (isLeapDay && rule === "feb28") notes.push(S.feb28);
  if (isLeapDay && rule === "feb29") notes.push(S.feb29);
  if (!isToday) notes.push(S.notToday(S.label(base)));
  set("note", notes.join(" "));

  const list = upcomingBirthdays(m, d, base, rule, 10);
  $("rows").replaceChildren(
    ...list.map((b) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = S.dayLabel(b);
      const td1 = document.createElement("td");
      td1.textContent = year === null ? "—" : S.age(Number(fromDay(b).slice(0, 4)) - year);
      const td2 = document.createElement("td");
      td2.textContent = S.dday(b, base);
      tr.append(th, td1, td2);
      if (b === base) tr.setAttribute("aria-current", "date");
      return tr;
    }),
  );
  set("rows-note", S.rowsNote(list));

  lastTitle = S.title(m, d);
  lastLines = [
    [S.cardNext, S.label(r.next)],
    [S.cardDday, S.dday(r.next, base)],
    ...(r.turningAge !== null ? ([[S.cardAge, S.age(r.turningAge)]] as [string, string][]) : []),
    ...(r.livedDays !== null ? ([[S.cardLived, S.days(S.fmt(r.livedDays))]] as [string, string][]) : []),
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
  await shareCard(buildCard(), S.shareText);
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
