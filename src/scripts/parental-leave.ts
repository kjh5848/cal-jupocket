/**
 * 육아휴직 급여 계산 — /guide/parental-leave-pay-calculator/.
 * 계산은 src/lib/parental-leave.ts schedule() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { schedule, type Mode } from "../lib/parental-leave";
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
