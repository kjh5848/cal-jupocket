import { servicePeriodOf, periodText, type ServicePeriod } from "../lib/service-period";
import { label } from "../lib/date-calc";
import { labelJa, spanTextJa } from "../lib/date-format-ja";
import { pageLocale } from "../i18n/ui";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("service-period");

const $ = (id: string) => document.getElementById(id)!;
const val = (id: string) => ($(id) as HTMLInputElement).value;
const set = (id: string, text: string) => ($(id).textContent = text);
const n = (x: number, loc: string) => x.toLocaleString(loc);

let lastLines: [string, string][] = [];

/**
 * 화면 문구 — 한국어판(/tools/service-period/)과 일본어판(/ja/tools/service-period/)이 같은 계산(lib/service-period.ts)을 쓴다.
 * 일본어판은 퇴직일(마지막 근무일 다음 날)·퇴직금 대상 같은 한국 노동 제도 문구 없이, 終了日(그날 포함)까지 센 기간만 보여 준다.
 */
const KO = {
  badOrder: "종료일이 입사일보다 앞입니다",
  badDate: "입사일·종료일을 확인해 주세요",
  label: "근속 기간",
  text: (p: ServicePeriod) => periodText(p),
  sub: (p: ServicePeriod) => `${label(p.start)} 입사 → ${label(p.last)}까지 근무 · 퇴직일 ${label(p.retire)}`,
  days: (p: ServicePeriod) => `${n(p.serviceDays, "ko-KR")}일`,
  months: (p: ServicePeriod) => `${n(p.totalMonths, "ko-KR")}개월`,
  weeks: (p: ServicePeriod) => `${n(p.weeks, "ko-KR")}주 ${p.weekRest}일`,
  yd: (p: ServicePeriod) => `${p.yearsDecimal.toFixed(2)}년`,
  one: (p: ServicePeriod) =>
    p.oneYear
      ? "계속근로 1년 이상입니다. 퇴직금은 4주 평균 주 15시간 이상 일했다면 받는 대상입니다."
      : `아직 1년이 안 됩니다. 계속근로 1년 미만이면 퇴직금 대상이 아닙니다(근로자퇴직급여 보장법 제4조).`,
  next: (p: ServicePeriod) =>
    `만 ${p.nextYears}년은 ${label(p.nextLastDay)}까지 일하면 찹니다 — 마지막 근무일에서 ${n(p.daysToNext, "ko-KR")}일 뒤.`,
  lines: (p: ServicePeriod, text: string): [string, string][] => [
    ["입사일", label(p.start)],
    ["마지막 근무일", label(p.last)],
    ["근속 기간", text],
    ["재직일수", `${n(p.serviceDays, "ko-KR")}일`],
  ],
  cardTitle: "근속 기간",
  shareText: "근속 기간 - jupocket.com",
};

const JA: typeof KO = {
  badOrder: "終了日が入社日より前になっています",
  badDate: "入社日・終了日を確認してください",
  label: "勤続年数",
  text: (p) => spanTextJa({ years: p.years, months: p.months, restDays: p.days }),
  sub: (p) => `${labelJa(p.start)} 入社 → ${labelJa(p.last)} まで（両日を含む）`,
  days: (p) => `${n(p.serviceDays, "ja-JP")}日`,
  months: (p) => `${n(p.totalMonths, "ja-JP")}か月`,
  weeks: (p) => `${n(p.weeks, "ja-JP")}週${p.weekRest}日`,
  yd: (p) => `${p.yearsDecimal.toFixed(2)}年`,
  one: (p) => `入社した年を1年目と数えると、${p.years + 1}年目です。`,
  next: (p) =>
    `満${p.nextYears}年になるのは ${labelJa(p.nextLastDay)} まで勤めたとき — 終了日の${n(p.daysToNext, "ja-JP")}日後です。`,
  lines: (p, text) => [
    ["入社日", labelJa(p.start)],
    ["終了日", labelJa(p.last)],
    ["勤続年数", text],
    ["在籍日数", `${n(p.serviceDays, "ja-JP")}日`],
  ],
  cardTitle: "勤続年数",
  shareText: "勤続年数の計算 - jupocket.com",
};

const S = pageLocale() === "ja" ? JA : KO;

function calc() {
  const retireMode = val("sp-kind") === "retire";
  const p = servicePeriodOf(val("sp-start"), val("sp-end"), retireMode);
  if (p === null) {
    const bad = val("sp-start") && val("sp-end");
    set("sp-label", bad ? S.badOrder : S.badDate);
    set("sp-hero", "—");
    set("sp-sub", "");
    for (const id of ["sp-days", "sp-months", "sp-weeks", "sp-yd"]) set(id, "—");
    set("sp-one", "");
    set("sp-next", "");
    lastLines = [];
    return;
  }
  const text = S.text(p);
  set("sp-label", S.label);
  set("sp-hero", text);
  set("sp-sub", S.sub(p));
  set("sp-days", S.days(p));
  set("sp-months", S.months(p));
  set("sp-weeks", S.weeks(p));
  set("sp-yd", S.yd(p));
  set("sp-one", S.one(p));
  set("sp-next", S.next(p));
  lastLines = S.lines(p, text);
}

/** 이 기기의 오늘(YYYY-MM-DD) */
function today(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

for (const id of ["sp-start", "sp-end", "sp-kind"]) {
  $(id).addEventListener("input", () => { reportUse(1); calc(); });
  $(id).addEventListener("change", calc);
}

$("sp-today").addEventListener("click", () => {
  reportUse(1);
  ($("sp-end") as HTMLInputElement).value = today();
  ($("sp-kind") as HTMLSelectElement).value = "last";
  ($("sp-kind") as HTMLSelectElement).dispatchEvent(new Event("change"));
  calc();
});

const buildCard = () => renderCard({ title: S.cardTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "service-period" });
  downloadCard(buildCard(), "service-period-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "service-period" });
  await shareCard(buildCard(), S.shareText);
});

// 처음 열면 종료일을 오늘로(지금 다니는 회사 기준)
($("sp-end") as HTMLInputElement).value = today();
calc();
