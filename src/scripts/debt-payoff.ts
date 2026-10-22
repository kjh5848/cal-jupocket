/**
 * 부채 상환 계획 — /tools/debt-payoff/ (한국어판 전용). 계산은 src/lib/debt-payoff.ts payoffPlan() 이 한다.
 * 여기서는 빚 5줄·예산을 읽고, 고른 순서 · 눈사태 · 눈덩이 · 추가 상환 없음을 같이 돌려 비교 칸을 채운다.
 * 몇 년 몇 월은 이 화면에서만 정한다 — 첫 달은 다음 달(오늘이 10월이면 11월).
 */
import { payoffPlan, monthLabel, spellMonths, type Debt, type Strategy } from "../lib/debt-payoff";
import { formatWon, parseAmount } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("debt-payoff");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const strategy = $<HTMLSelectElement>("dp-strategy");
const extra = $<HTMLInputElement>("dp-extra");
const growth = $<HTMLInputElement>("dp-growth");
const ROWS = [1, 2, 3, 4, 5];

const now = new Date();
const startYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
const startMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
const when = (m: number) => monthLabel(startYear, startMonth, m);

const set = (id: string, text: string) => {
  $(id).textContent = text;
};

function readDebts(): Debt[] {
  return ROWS.map((n) => ({
    name: $<HTMLInputElement>(`dp-name-${n}`).value.trim() || `빚 ${n}`,
    balance: parseAmount($<HTMLInputElement>(`dp-bal-${n}`).value),
    ratePct: Number($<HTMLInputElement>(`dp-rate-${n}`).value) || 0,
    minPayment: parseAmount($<HTMLInputElement>(`dp-min-${n}`).value),
    priority: Number($<HTMLSelectElement>(`dp-prio-${n}`).value),
  }));
}

let lastLines: [string, string][] = [];

function cell(tr: HTMLTableRowElement, text: string, head = false) {
  const el = document.createElement(head ? "th" : "td");
  if (head) el.setAttribute("scope", "row");
  el.textContent = text;
  tr.appendChild(el);
}

function compute() {
  const s = strategy.value as Strategy;
  for (const n of ROWS) $(`dp-prio-${n}`).closest<HTMLElement>(".dp-prio")!.hidden = s !== "custom";
  const all = readDebts();
  const debts = all.filter((d) => d.balance > 0);
  const base = { debts, extra: parseAmount(extra.value), extraGrowthPct: Number(growth.value) || 0 };
  const r = payoffPlan({ ...base, strategy: s });
  const order = $("dp-order");
  const rowsEl = $("dp-rows");
  if (!r.ok) {
    const msg =
      r.reason === "empty"
        ? "남은 잔액이 있는 빚을 하나 이상 넣어 주세요."
        : r.reason === "min-too-low"
          ? `${debts[r.index].name}: 월 최소 상환액이 첫 달 이자 ${formatWon(r.firstInterest)} 이하라 잔액이 줄지 않습니다. 이 금액보다 크게 넣어 주세요.`
          : "50년(600개월) 안에 다 갚지 못합니다. 상환액을 늘려 주세요.";
    set("dp-err", msg);
    set("dp-hero", "—");
    set("dp-note", "");
    for (const id of ["dp-debt", "dp-int", "dp-paid", "dp-vs", "dp-saved"]) set(id, "—");
    order.replaceChildren();
    rowsEl.replaceChildren();
    lastLines = [];
    return;
  }
  set("dp-err", "");
  set("dp-hero", spellMonths(r.months));
  set("dp-note", `${when(r.months)}에 끝 · ${r.months}개월 · 첫 달 예산 ${formatWon(r.startBudget)}`);
  set("dp-debt", formatWon(r.totalDebt));
  set("dp-int", formatWon(r.totalInterest));
  set("dp-paid", formatWon(r.totalPaid));

  const av = payoffPlan({ ...base, strategy: "avalanche" });
  const sb = payoffPlan({ ...base, strategy: "snowball" });
  if (av.ok && sb.ok) {
    const gap = sb.totalInterest - av.totalInterest;
    const monthGap = sb.months - av.months;
    set("dp-vs", gap === 0 ? `같음${monthGap ? ` · 기간 ${Math.abs(monthGap)}개월 차이` : ""}` : `눈사태가 ${formatWon(Math.abs(gap))} ${gap > 0 ? "적음" : "많음"}${monthGap ? ` · ${Math.abs(monthGap)}개월 ${monthGap > 0 ? "빠름" : "느림"}` : ""}`);
  } else set("dp-vs", "—");

  if (base.extra > 0) {
    const none = payoffPlan({ ...base, extra: 0, strategy: s });
    set("dp-saved", none.ok ? `${formatWon(none.totalInterest - r.totalInterest)} · ${none.months - r.months}개월 빨리` : "추가 없이는 50년 안에 못 갚음");
  } else set("dp-saved", "더 갚을 돈 0원");

  order.replaceChildren(
    ...[...r.debts]
      .sort((a, b) => a.order - b.order)
      .map((d) => {
        const tr = document.createElement("tr");
        cell(tr, String(d.order), true);
        cell(tr, d.name);
        cell(tr, `${when(d.payoffMonth)} (${d.payoffMonth}개월째)`);
        cell(tr, formatWon(d.interest));
        return tr;
      }),
  );
  rowsEl.replaceChildren(
    ...r.rows.map((x) => {
      const tr = document.createElement("tr");
      cell(tr, when(x.month), true);
      cell(tr, formatWon(x.payment));
      cell(tr, formatWon(x.principal));
      cell(tr, formatWon(x.interest));
      cell(tr, formatWon(x.balance));
      return tr;
    }),
  );
  lastLines = [
    ["빚 합계", formatWon(r.totalDebt)],
    ["첫 달 예산", formatWon(r.startBudget)],
    ["다 갚는 달", `${when(r.months)} (${spellMonths(r.months)})`],
    ["총 이자", formatWon(r.totalInterest)],
  ];
}

document.querySelector(".calc-card")!.addEventListener("input", () => {
  reportUse(1);
  compute();
});
document.querySelector(".calc-card")!.addEventListener("change", () => {
  reportUse(1);
  compute();
});

const buildCard = () => renderCard({ title: "부채 상환 계획", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  if (!lastLines.length) return;
  track("save_result", { calculator: "debt-payoff" });
  downloadCard(buildCard(), "debt-payoff-result.png");
});
$("btn-share").addEventListener("click", async () => {
  if (!lastLines.length) return;
  track("share_result", { calculator: "debt-payoff" });
  await shareCard(buildCard(), "부채 상환 계획 - jupocket.com");
});

compute();
