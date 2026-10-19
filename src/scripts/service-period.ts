import { servicePeriodOf, periodText } from "../lib/service-period";
import { label } from "../lib/date-calc";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("service-period");

const $ = (id: string) => document.getElementById(id)!;
const val = (id: string) => ($(id) as HTMLInputElement).value;
const set = (id: string, text: string) => ($(id).textContent = text);

let lastLines: [string, string][] = [];

function calc() {
  const retireMode = val("sp-kind") === "retire";
  const p = servicePeriodOf(val("sp-start"), val("sp-end"), retireMode);
  if (p === null) {
    const bad = val("sp-start") && val("sp-end");
    set("sp-label", bad ? "종료일이 입사일보다 앞입니다" : "입사일·종료일을 확인해 주세요");
    set("sp-hero", "—");
    set("sp-sub", "");
    for (const id of ["sp-days", "sp-months", "sp-weeks", "sp-yd"]) set(id, "—");
    set("sp-one", "");
    set("sp-next", "");
    lastLines = [];
    return;
  }
  const text = periodText(p);
  set("sp-label", "근속 기간");
  set("sp-hero", text);
  set("sp-sub", `${label(p.start)} 입사 → ${label(p.last)}까지 근무 · 퇴직일 ${label(p.retire)}`);
  set("sp-days", `${p.serviceDays.toLocaleString("ko-KR")}일`);
  set("sp-months", `${p.totalMonths.toLocaleString("ko-KR")}개월`);
  set("sp-weeks", `${p.weeks.toLocaleString("ko-KR")}주 ${p.weekRest}일`);
  set("sp-yd", `${p.yearsDecimal.toFixed(2)}년`);
  set(
    "sp-one",
    p.oneYear
      ? "계속근로 1년 이상입니다. 퇴직금은 4주 평균 주 15시간 이상 일했다면 받는 대상입니다."
      : `아직 1년이 안 됩니다. 계속근로 1년 미만이면 퇴직금 대상이 아닙니다(근로자퇴직급여 보장법 제4조).`,
  );
  set("sp-next", `만 ${p.nextYears}년은 ${label(p.nextLastDay)}까지 일하면 찹니다 — 마지막 근무일에서 ${p.daysToNext.toLocaleString("ko-KR")}일 뒤.`);
  lastLines = [
    ["입사일", label(p.start)],
    ["마지막 근무일", label(p.last)],
    ["근속 기간", text],
    ["재직일수", `${p.serviceDays.toLocaleString("ko-KR")}일`],
  ];
}

/** 이 기기의 오늘(YYYY-MM-DD) */
function today(): string {
  const n = new Date();
  return new Date(n.getTime() - n.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
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

const buildCard = () => renderCard({ title: "근속 기간", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "service-period" });
  downloadCard(buildCard(), "service-period-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "service-period" });
  await shareCard(buildCard(), "근속 기간 - jupocket.com");
});

// 처음 열면 종료일을 오늘로(지금 다니는 회사 기준)
($("sp-end") as HTMLInputElement).value = today();
calc();
