/**
 * 육아휴직 급여 계산 — /guide/parental-leave-pay-calculator/.
 * 계산은 src/lib/parental-leave.ts schedule() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { schedule, bandTotals, type Mode } from "../lib/parental-leave";
import r from "../rates/parental-leave-2026.json";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("parental-leave");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const pay = $<HTMLInputElement>("pl-pay");
const months = $<HTMLInputElement>("pl-months");
const mode = $<HTMLSelectElement>("pl-mode");

function render() {
  const n = Math.min(18, Math.max(0, Math.floor(Number(months.value) || 0)));
  const x = schedule(parseAmount(pay.value), n, mode.value as Mode);
  $("pl-hero").textContent = formatWon(x.total);
  const b = bandTotals(x.rows);
  const m = mode.value as Mode;
  const caps = m === "single" ? r.pay.single.bands : r.pay.bands;
  const man = (v: number) => `${(v / 10_000).toLocaleString("ko-KR")}만원`;
  $("pl-n").textContent = String(x.rows.length);
  $("pl-avg").textContent = formatWon(x.rows.length ? Math.floor(x.total / x.rows.length) : 0);
  $("pl-b1").textContent = formatWon(b.first3);
  $("pl-b2").textContent = formatWon(b.next3);
  $("pl-b3").textContent = formatWon(b.after6);
  // 6+6 특례는 첫 6개월 상한이 달마다 오른다(제95조의3 제1항 제1호)
  $("pl-c1").textContent = m === "sixSix" ? "250·250·300만원" : man(caps[0].cap);
  $("pl-c2").textContent = m === "sixSix" ? "350·400·450만원" : man(caps[1].cap);
  const tbody = $("pl-rows");
  tbody.replaceChildren(
    ...x.rows.map((row) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = `${row.month}개월째`;
      const td = document.createElement("td");
      td.textContent = formatWon(row.pay);
      tr.append(th, td);
      return tr;
    }),
  );
}

function onUserInput() {
  render();
  reportUse(parseAmount(pay.value));
}

pay.addEventListener("input", () => {
  const n = parseAmount(pay.value);
  pay.value = n ? formatAmountInput(n) : "";
  onUserInput();
});
months.addEventListener("input", onUserInput);
mode.addEventListener("input", onUserInput);
render();
