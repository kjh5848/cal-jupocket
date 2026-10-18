/**
 * 적립식 복리 계산기 — /tools/compound/.
 * 계산은 src/lib/compound.ts compound() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { compound, won, type Timing } from "../lib/compound";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("compound");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const principal = $<HTMLInputElement>("cp-principal");
const monthly = $<HTMLInputElement>("cp-monthly");
const goal = $<HTMLInputElement>("cp-goal");
const rate = $<HTMLInputElement>("cp-rate");
const period = $<HTMLInputElement>("cp-period");
const unit = $<HTMLSelectElement>("cp-unit");
const timing = $<HTMLSelectElement>("cp-timing");
const tax = $<HTMLInputElement>("cp-tax");
const infl = $<HTMLInputElement>("cp-infl");

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const num = (el: HTMLInputElement, lo: number, hi: number) => clamp(Number(el.value) || 0, lo, hi);
const w = (x: number) => formatWon(won(x));
const signed = (x: number) => (won(x) < 0 ? `−${formatWon(-won(x))}` : formatWon(won(x)));

function spell(m: number) {
  const y = Math.floor(m / 12);
  const r = m % 12;
  return [y ? `${y}년` : "", r ? `${r}개월` : ""].filter(Boolean).join(" ") || "0개월";
}

let lastLines: [string, string][] = [];

function render() {
  const n = clamp(Math.floor(Number(period.value) || 1), 1, 600) * (unit.value === "years" ? 12 : 1);
  const months = Math.min(n, 1200);
  const ratePct = num(rate, -50, 100);
  const t = timing.value as Timing;
  const G = parseAmount(goal.value);
  const x = compound({
    principal: parseAmount(principal.value),
    monthly: parseAmount(monthly.value),
    ratePct,
    months,
    timing: t,
    taxPct: num(tax, 0, 100),
    inflationPct: num(infl, -20, 50),
    goal: G,
  });

  $("cp-hero").textContent = w(x.balance);
  $("cp-note").textContent = `${months}개월 · 월 이율 ${(ratePct / 12).toFixed(4)}% · ${t === "start" ? "매달 초" : "매달 말"} 적립`;
  $("cp-paid").textContent = w(x.paid);
  $("cp-gain2").textContent = signed(x.gain);
  $("cp-tax-v").textContent = won(x.tax) ? `−${w(x.tax)}` : "0원";
  $("cp-after").textContent = w(x.afterTax);
  $("cp-real").textContent = w(x.real);
  $("cp-goal-v").textContent = !G ? "목표 없음" : x.goalMonth === null ? "기간 안에 못 닿음" : x.goalMonth === 0 ? "처음부터 넘음" : `${spell(x.goalMonth)}째`;
  $("cp-rows").replaceChildren(
    ...x.years.map((y) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = y.month % 12 === 0 ? `${y.year}년째` : `${y.year}년째 (${y.month % 12}개월)`;
      const cells = [w(y.paid), signed(y.gain), w(y.balance)].map((v) => {
        const td = document.createElement("td");
        td.textContent = v;
        return td;
      });
      tr.append(th, ...cells);
      return tr;
    }),
  );
  lastLines = [
    [`${spell(months)} 뒤 잔액`, w(x.balance)],
    ["넣은 돈", w(x.paid)],
    ["불어난 돈", signed(x.gain)],
    ["세후 금액", w(x.afterTax)],
  ];
}

function onUserInput() {
  render();
  reportUse(parseAmount(monthly.value) || parseAmount(principal.value));
}

for (const el of [principal, monthly, goal]) {
  el.addEventListener("input", () => {
    const v = parseAmount(el.value);
    el.value = v ? formatAmountInput(v) : el.value.trim() === "" ? "" : "0";
    onUserInput();
  });
}
for (const el of [rate, period, tax, infl]) el.addEventListener("input", onUserInput);
for (const el of [unit, timing]) el.addEventListener("change", onUserInput);

const buildCard = () => renderCard({ title: "적립식 복리 계산 결과", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "compound" });
  downloadCard(buildCard(), "compound-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "compound" });
  await shareCard(buildCard(), "적립식 복리 계산 결과 - jupocket.com");
});

render();
