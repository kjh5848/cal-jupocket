/**
 * 선납이연 계산기 — /guide/prepay-defer-calculator/.
 * 계산은 src/lib/prepay-defer.ts prepayDefer() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { prepayDefer, parseGroups, koDate } from "../lib/prepay-defer";
import type { SavingsMethod } from "../lib/installment-savings";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("prepay-defer");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const start = $<HTMLInputElement>("pd-start");
const months = $<HTMLInputElement>("pd-months");
const monthly = $<HTMLInputElement>("pd-monthly");
const rate = $<HTMLInputElement>("pd-rate");
const method = $<HTMLSelectElement>("pd-method");
const pattern = $<HTMLSelectElement>("pd-pattern");
const custom = $<HTMLInputElement>("pd-custom");
const last = $<HTMLInputElement>("pd-last");
const n = (v: number) => v.toLocaleString("ko-KR");
const days = (v: number) => `${+v.toFixed(2)}일`;
const ERROR = {
  date: "날짜를 확인해 주세요.",
  groups: "묶음은 6-1-5처럼 1 이상의 숫자를 -로 이어 적어 주세요.",
  sum: "묶음 회분의 합이 계약 개월 수와 같아야 합니다.",
} as const;

function groupsFor(m: number): number[] | null {
  if (pattern.value === "each") return Array(m).fill(1);
  if (pattern.value === "custom") return parseGroups(custom.value);
  return parseGroups(pattern.value);
}

function render() {
  const m = Math.min(120, Math.max(1, Math.floor(Number(months.value) || 1)));
  $("pd-custom-wrap").hidden = pattern.value !== "custom";
  const groups = groupsFor(m);
  const x = groups
    ? prepayDefer({
        start: start.value,
        months: m,
        monthly: parseAmount(monthly.value),
        ratePct: Math.min(30, Math.max(0, Number(rate.value) || 0)),
        method: method.value as SavingsMethod,
        groups,
        lastDate: last.value || undefined,
      })
    : ({ ok: false, reason: "groups" } as const);

  const err = $("pd-error");
  if (!x.ok) {
    err.textContent = pattern.value !== "custom" && x.reason === "sum" ? `${pattern.value}은 12개월 적금 방식입니다. 개월 수를 12로 두거나 '직접'에서 묶음을 적어 주세요.` : ERROR[x.reason];
    err.hidden = false;
    return;
  }
  err.hidden = true;

  $("pd-hero").textContent = koDate(x.avgDelay > 0 ? x.delayedFloor : x.maturity);
  $("pd-note").textContent =
    x.avgDelay > 0
      ? `순지연 ${n(x.net)}일 ÷ ${m}개월 = 월평균 ${days(x.avgDelay)}만큼 원래 만기 ${koDate(x.maturity)}에서 늦어질 수 있습니다${x.delayedCeil !== x.delayedFloor ? `(올림이면 ${koDate(x.delayedCeil)})` : ""}`
      : `순지연일수가 0 이하라 만기가 늦어지지 않습니다 — 마지막 묶음을 ${koDate(x.latestLastDate)}까지 넣으면 됩니다`;
  $("pd-early").textContent = `${n(x.totalEarly)}일`;
  $("pd-late").textContent = `${n(x.totalLate)}일`;
  $("pd-net").textContent = `${n(x.net)}일`;
  $("pd-avg").textContent = days(x.avgDelay);
  $("pd-lastv").textContent = koDate(x.lastDate);
  $("pd-latest").textContent = koDate(x.latestLastDate);
  $("pd-gross").textContent = formatWon(x.savings.grossInterest);
  $("pd-tax").textContent = `−${formatWon(x.savings.tax)}`;
  $("pd-p").textContent = formatWon(x.savings.principal);
  $("pd-netint").textContent = formatWon(x.savings.netInterest);

  const warn = $("pd-warn");
  const notes: string[] = [];
  if (x.afterMaturity) notes.push("마지막 묶음 날이 만기일 이후입니다. 만기일까지 모든 회차를 넣지 않으면 중도해지이율이 적용될 수 있습니다(약관 제6조 ③).");
  if (x.beforePrevious) notes.push("마지막 묶음 날이 앞 묶음보다 이릅니다.");
  warn.textContent = notes.join(" ");
  warn.hidden = !notes.length;

  $("pd-rows").replaceChildren(
    ...x.rows.map((v) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = `${v.round}회`;
      const cells = [v.due, v.paid, v.early ? `${v.early}일` : "", v.late ? `${v.late}일` : ""].map((t) => {
        const td = document.createElement("td");
        td.textContent = t;
        return td;
      });
      tr.append(th, ...cells);
      return tr;
    }),
  );
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(monthly.value));
}

monthly.addEventListener("input", () => {
  const v = parseAmount(monthly.value);
  monthly.value = v ? formatAmountInput(v) : monthly.value.trim() === "" ? "" : "0";
  onUserInput();
});
for (const el of [months, rate, custom, start, last]) el.addEventListener("input", onUserInput);
for (const el of [method, pattern]) el.addEventListener("change", onUserInput);
render();
