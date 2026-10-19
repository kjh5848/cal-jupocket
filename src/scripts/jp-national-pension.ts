/**
 * 일본어판 国民年金保険料 계산기(/ja/national-pension/) — 계산은 lib/jp/national-pension.ts(일본 제도).
 * 한국어판 국민연금 보험료(/national-pension-premium/)와 제도가 달라 짝이 아니고, 화면 문구는 일본어만 둔다.
 */
import { payment, premiumBaseline, addOnBaseline, addOnPension, addOnPaid, type Plan, type Method } from "../lib/jp/national-pension";
import { formatYen } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("jp-national-pension");

const $ = (id: string) => document.getElementById(id)!;
const planSel = $("np-plan") as HTMLSelectElement;
const methodSel = $("np-method") as HTMLSelectElement;
const addOnSel = $("np-addon") as HTMLSelectElement;
const yearsIn = $("np-years") as HTMLInputElement;

const PLANS: Plan[] = ["monthly", "early", "sixMonth", "oneYear", "twoYear"];
const PLAN_LABEL: Record<Plan, string> = {
  monthly: "毎月納付",
  early: "早割（当月末振替）",
  sixMonth: "6カ月前納",
  oneYear: "1年前納",
  twoYear: "2年前納",
};
const METHOD_LABEL: Record<Method, string> = { slip: "納付書・クレジットカード", debit: "口座振替" };

let lastTitle = "";
let lastLines: [string, string][] = [];

/** 全角の数字も半角に直してから読む */
const toHalf = (s: string) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

function compute() {
  const plan = (PLANS.includes(planSel.value as Plan) ? planSel.value : "oneYear") as Plan;
  const method = (methodSel.value === "debit" ? "debit" : "slip") as Method;
  const withAddOn = addOnSel.value === "yes";
  const r = payment(plan, method, withAddOn);

  if (!r) {
    $("hero-value").textContent = "―";
    $("np-hint").textContent = "早割（当月末振替）は口座振替だけの納付方法です。";
    for (const id of ["out-premium", "out-addon", "out-discount", "out-baseline"]) $(id).textContent = "―";
    lastTitle = "";
    lastLines = [];
  } else {
    const baseline = premiumBaseline(plan) + (withAddOn ? addOnBaseline(plan) : 0);
    $("hero-value").textContent = formatYen(r.total);
    $("np-hint").textContent =
      r.discount > 0
        ? `${r.months}カ月分・毎月納付より ${formatYen(r.discount)} 少ない`
        : `${r.months}カ月分・割引なし`;
    $("out-premium").textContent = formatYen(r.premium);
    $("out-addon").textContent = withAddOn ? formatYen(r.addOn) : "納付しない";
    $("out-discount").textContent = formatYen(r.discount);
    $("out-baseline").textContent = formatYen(baseline);
    lastTitle = `国民年金保険料 ${PLAN_LABEL[plan]}（${METHOD_LABEL[method]}）`;
    lastLines = [
      ["定額保険料", formatYen(r.premium)],
      ...(withAddOn ? ([["付加保険料", formatYen(r.addOn)]] as [string, string][]) : []),
      ["1回の納付額", formatYen(r.total)],
      ["割引額", formatYen(r.discount)],
    ];
  }

  const years = Math.min(50, Math.max(0, Math.floor(Number(toHalf(yearsIn.value)) || 0)));
  const months = years * 12;
  $("out-months").textContent = `${months}月`;
  $("out-pension").textContent = formatYen(addOnPension(months));
  $("out-paid").textContent = formatYen(addOnPaid(months));
}

for (const el of [planSel, methodSel, addOnSel]) el.addEventListener("change", compute);
yearsIn.addEventListener("input", () => {
  reportUse(Number(toHalf(yearsIn.value)) || 0);
  compute();
});

const buildCard = () => renderCard({ title: lastTitle || "国民年金保険料", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "jp-national-pension" });
  downloadCard(buildCard(), "national-pension-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "jp-national-pension" });
  await shareCard(buildCard(), "国民年金保険料の計算結果 - jupocket.com");
});

compute();
