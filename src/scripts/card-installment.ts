/**
 * 신용카드 할부 수수료 — /tools/card-installment/ (한국어판 전용). 계산은 src/lib/card-installment.ts installmentPlan() 이 한다.
 * 여기서는 입력을 읽고, 무이자 방식에 따라 '앞 회차' 칸을, 날수 방식에 따라 날짜 칸을 보이고 숨긴다.
 * 날짜 칸이 비어 있으면 오늘을 이용일로, 다음 달 같은 날을 첫 결제일로 채운다.
 */
import { installmentPlan, approxTotalFee, type FeeMode } from "../lib/card-installment";
import { formatWon, parseAmount } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("card-installment");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const amountEl = $<HTMLInputElement>("ci-amount");
const monthsEl = $<HTMLInputElement>("ci-months");
const rateEl = $<HTMLInputElement>("ci-rate");
const modeEl = $<HTMLSelectElement>("ci-mode");
const paidEl = $<HTMLInputElement>("ci-paid");
const howEl = $<HTMLSelectElement>("ci-how");
const useEl = $<HTMLInputElement>("ci-use");
const billEl = $<HTMLInputElement>("ci-bill");
const COMPARE = [2, 3, 6, 10, 12, 24];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = new Date();
useEl.value ||= iso(today);
billEl.value ||= iso(new Date(today.getFullYear(), today.getMonth() + 1, Math.min(today.getDate(), 28)));

const set = (id: string, text: string) => {
  $(id).textContent = text;
};
const md = (s: string) => `${Number(s.slice(5, 7))}월 ${Number(s.slice(8, 10))}일`;

function cell(tr: HTMLTableRowElement, text: string, head = false) {
  const el = document.createElement(head ? "th" : "td");
  if (head) el.setAttribute("scope", "row");
  el.textContent = text;
  tr.appendChild(el);
}

let lastLines: [string, string][] = [];

function compute() {
  const mode = modeEl.value as FeeMode;
  const byDate = howEl.value === "date";
  $("ci-paid-wrap").hidden = mode !== "partial";
  for (const el of document.querySelectorAll<HTMLElement>("[data-date]")) el.hidden = !byDate;

  const amount = parseAmount(amountEl.value);
  const months = Number(monthsEl.value);
  const ratePct = Number(rateEl.value);
  paidEl.max = String(Math.max(1, months - 1));
  const base = { amount, months, ratePct, dates: byDate ? { use: useEl.value, firstBill: billEl.value } : undefined };
  const r = installmentPlan({ ...base, mode, paidTerms: Number(paidEl.value) });
  const rowsEl = $("ci-rows");
  const cmpEl = $("ci-compare");
  if (!r.ok) {
    const msg = {
      amount: "결제 금액을 넣어 주세요.",
      months: "할부 개월은 2~60 사이로 넣어 주세요.",
      rate: "연 수수료율은 0~100% 사이로 넣어 주세요.",
      "paid-terms": `수수료를 내는 앞 회차는 1~${Math.max(1, months - 1)} 사이로 넣어 주세요.`,
      dates: "첫 결제일은 이용일보다 뒤여야 합니다.",
    }[r.reason];
    set("ci-err", msg);
    for (const id of ["ci-hero", "ci-principal", "ci-fee", "ci-total", "ci-first", "ci-saved", "ci-approx"]) set(id, "—");
    set("ci-note", "");
    rowsEl.replaceChildren();
    cmpEl.replaceChildren();
    lastLines = [];
    return;
  }
  set("ci-err", "");
  set("ci-hero", formatWon(r.totalFee));
  set("ci-note", `원금의 ${((r.totalFee / amount) * 100).toFixed(2)}% · 1회차 ${formatWon(r.firstPayment)}`);
  set("ci-principal", formatWon(amount));
  set("ci-fee", formatWon(r.totalFee));
  set("ci-total", formatWon(r.totalPaid));
  set("ci-first", formatWon(r.firstPayment));
  set("ci-saved", mode === "normal" ? "무이자 없음" : formatWon(r.normalFee - r.totalFee));
  set("ci-approx", formatWon(approxTotalFee(amount, months, ratePct)));

  rowsEl.replaceChildren(
    ...r.rows.map((x) => {
      const tr = document.createElement("tr");
      cell(tr, x.bill ? `${x.term}회 (${md(x.bill)}, ${x.days}일)` : `${x.term}회`, true);
      cell(tr, formatWon(x.balance));
      cell(tr, formatWon(x.principal));
      cell(tr, x.free ? "0원 (무이자)" : formatWon(x.fee));
      cell(tr, formatWon(x.payment));
      return tr;
    }),
  );
  cmpEl.replaceChildren(
    ...COMPARE.map((m) => {
      const c = installmentPlan({ amount, months: m, ratePct, mode: "normal" });
      const tr = document.createElement("tr");
      cell(tr, `${m}개월`, true);
      cell(tr, c.ok ? formatWon(c.totalFee) : "—");
      cell(tr, c.ok ? formatWon(c.firstPayment) : "—");
      return tr;
    }),
  );
  lastLines = [
    ["결제 금액", formatWon(amount)],
    ["할부", `${months}개월 · 연 ${ratePct}%${mode === "partial" ? ` · 1~${paidEl.value}회 부담` : mode === "free" ? " · 무이자" : ""}`],
    ["총 할부 수수료", formatWon(r.totalFee)],
    ["1회차 청구", formatWon(r.firstPayment)],
  ];
}

const card = document.querySelector(".calc-card")!;
for (const ev of ["input", "change"]) {
  card.addEventListener(ev, () => {
    reportUse(1);
    compute();
  });
}

const buildCard = () => renderCard({ title: "카드 할부 수수료", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  if (!lastLines.length) return;
  track("save_result", { calculator: "card-installment" });
  downloadCard(buildCard(), "card-installment-result.png");
});
$("btn-share").addEventListener("click", async () => {
  if (!lastLines.length) return;
  track("share_result", { calculator: "card-installment" });
  await shareCard(buildCard(), "카드 할부 수수료 - jupocket.com");
});

compute();
