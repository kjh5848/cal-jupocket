/**
 * 파킹통장 이자 계산기 — /guide/parking-account-interest-calculator/.
 * 계산은 src/lib/parking-account.ts parkingInterest() 가 한다. 여기서는 구간·바뀐 날 줄을 그리고 결과를 채운다.
 * 줄을 더하거나 지울 때만 다시 그리고, 값을 고칠 때는 상태만 바꿔 입력 중 포커스가 튀지 않게 한다.
 */
import { parkingInterest } from "../lib/parking-account";
import type { DepositTax } from "../lib/deposit";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("parking-account");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const start = $<HTMLInputElement>("pk-start");
const pay = $<HTMLInputElement>("pk-pay");
const open = $<HTMLInputElement>("pk-open");
const tax = $<HTMLSelectElement>("pk-tax");
const MAX_TIERS = 5;
const MAX_ROWS = 40;

/** 구간: 상한(마지막은 null)·이율 문자열 */
let tiers: { cap: number | null; rate: string }[] = [
  { cap: 5_000_000, rate: "2" },
  { cap: null, rate: "1" },
];
let bals: { date: string; bal: number }[] = [];
let rates: { date: string; rates: string[] }[] = [];

const w = (x: number) => formatWon(Math.round(x));
const rateNum = (s: string) => Math.min(100, Math.max(0, Number(s) || 0));

function field(label: string, input: HTMLInputElement) {
  const l = document.createElement("label");
  l.textContent = label;
  l.append(input);
  return l;
}
function inp(type: string, value: string, onInput: (v: string, el: HTMLInputElement) => void, mode?: string) {
  const el = document.createElement("input");
  el.type = type;
  el.value = value;
  if (mode) el.inputMode = mode;
  if (type === "number") el.step = "0.01";
  el.addEventListener("input", () => {
    onInput(el.value, el);
    onUserInput();
  });
  return el;
}
function moneyInp(value: number, set: (v: number) => void) {
  return inp("text", value ? formatAmountInput(value) : "", (v, el) => {
    const n = parseAmount(v);
    el.value = n ? formatAmountInput(n) : v.trim() === "" ? "" : "0";
    set(n);
  }, "numeric");
}
function delBtn(onClick: () => void) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "secondary";
  b.textContent = "삭제";
  b.addEventListener("click", () => {
    onClick();
    draw();
    onUserInput();
  });
  return b;
}
const row = (...kids: HTMLElement[]) => {
  const d = document.createElement("div");
  d.className = "pk-row";
  d.append(...kids);
  return d;
};

function draw() {
  $("pk-tiers").replaceChildren(
    ...tiers.map((t, i) => {
      const last = i === tiers.length - 1;
      const capEl = last
        ? (() => { const e = document.createElement("input"); e.type = "text"; e.value = "한도 없음"; e.disabled = true; return e; })()
        : moneyInp(t.cap ?? 0, (v) => (t.cap = v));
      const kids: HTMLElement[] = [
        field(last ? (tiers.length === 1 ? "잔액 전체" : "마지막 구간") : `${i + 1}구간 상한(원)`, capEl),
        field("연 이율(%)", inp("number", t.rate, (v) => (t.rate = v), "decimal")),
      ];
      if (tiers.length > 1) kids.push(delBtn(() => {
        tiers.splice(i, 1);
        tiers[tiers.length - 1].cap = null;
        for (const c of rates) c.rates.splice(i, 1);
      }));
      return row(...kids);
    }),
  );
  ($("pk-add-tier") as HTMLButtonElement).disabled = tiers.length >= MAX_TIERS;

  $("pk-bals").replaceChildren(
    ...bals.map((b, i) => row(
      field("바뀐 날", inp("date", b.date, (v) => (b.date = v))),
      field("그날 마감 잔액(원)", moneyInp(b.bal, (v) => (b.bal = v))),
      delBtn(() => bals.splice(i, 1)),
    )),
  );
  $("pk-rates").replaceChildren(
    ...rates.map((c, i) => row(
      field("바뀐 날", inp("date", c.date, (v) => (c.date = v))),
      ...tiers.map((_, k) => field(tiers.length === 1 ? "새 연 이율(%)" : `${k + 1}구간 새 이율(%)`, inp("number", c.rates[k] ?? "", (v) => (c.rates[k] = v), "decimal"))),
      delBtn(() => rates.splice(i, 1)),
    )),
  );
}

/** 새 줄의 기본 날짜 — 첫날 다음 날(기간 안) */
function nextDay(s: string) {
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return s;
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

$("pk-add-tier").addEventListener("click", () => {
  if (tiers.length >= MAX_TIERS) return;
  // 마지막 구간 앞에 새 상한을 하나 넣는다 — 앞 상한의 두 배를 기본값으로
  const prev = tiers.length > 1 ? tiers[tiers.length - 2].cap ?? 0 : 0;
  tiers.splice(tiers.length - 1, 0, { cap: prev ? prev * 2 : 5_000_000, rate: tiers[tiers.length - 1].rate });
  for (const c of rates) c.rates.splice(tiers.length - 2, 0, c.rates[tiers.length - 2] ?? "");
  draw();
  onUserInput();
});
$("pk-add-bal").addEventListener("click", () => {
  if (bals.length >= MAX_ROWS) return;
  const last = bals[bals.length - 1];
  bals.push({ date: last ? nextDay(last.date) : nextDay(start.value), bal: last ? last.bal : parseAmount(open.value) });
  draw();
  onUserInput();
});
$("pk-add-rate").addEventListener("click", () => {
  if (rates.length >= MAX_ROWS) return;
  const last = rates[rates.length - 1];
  rates.push({ date: last ? nextDay(last.date) : nextDay(start.value), rates: last ? [...last.rates] : tiers.map((t) => t.rate) });
  draw();
  onUserInput();
});

const ERR: Record<string, string> = {
  date: "날짜를 확인해 주세요.",
  order: "이자 받는 날은 첫날 다음 날 이후여야 합니다(받는 날은 세지 않습니다).",
  long: "10년(3,660일)까지만 계산합니다.",
  tiers: "구간 상한은 앞 구간보다 커야 합니다.",
};

function render() {
  const x = parkingInterest({
    start: start.value,
    payDay: pay.value,
    opening: parseAmount(open.value),
    caps: tiers.slice(0, -1).map((t) => t.cap ?? 0),
    rates: tiers.map((t) => rateNum(t.rate)),
    balances: bals.map((b) => ({ date: b.date, balance: b.bal })),
    rateChanges: rates.map((c) => ({ date: c.date, rates: tiers.map((_, k) => rateNum(c.rates[k] ?? "")) })),
    tax: tax.value as DepositTax,
  });
  const warn = $("pk-warn");
  if (x.error) {
    $("pk-hero").textContent = "—";
    $("pk-note").textContent = ERR[x.error];
    for (const id of ["pk-gross", "pk-itax", "pk-ltax", "pk-net2", "pk-tax-sum"]) $(id).textContent = "—";
    $("pk-months").replaceChildren();
    $("pk-tier-rows").replaceChildren();
    warn.hidden = true;
    return x;
  }
  $("pk-hero").textContent = formatWon(x.netInterest);
  $("pk-note").textContent = `${x.days}일 · ${x.lastDay}까지 · 평균 잔액 ${w(x.avgBalance)} · 평균 잔액 기준 연 ${x.effectiveRate.toFixed(2)}%`;
  $("pk-gross").textContent = formatWon(x.grossInterest);
  $("pk-itax").textContent = `−${formatWon(x.incomeTax)}`;
  $("pk-ltax").textContent = `−${formatWon(x.localTax)}`;
  $("pk-net2").textContent = formatWon(x.netInterest);
  $("pk-tax-sum").textContent = formatWon(x.tax);
  const tr = (cells: string[]) => {
    const t = document.createElement("tr");
    cells.forEach((c, i) => {
      const td = document.createElement(i ? "td" : "th");
      if (!i) td.setAttribute("scope", "row");
      td.textContent = c;
      t.append(td);
    });
    return t;
  };
  $("pk-months").replaceChildren(...x.months.map((m) => tr([m.month, `${m.days}일`, w(m.avgBalance), w(m.interest)])));
  $("pk-tier-rows").replaceChildren(...x.tiers.map((t) => tr([t.to === null ? (x.tiers.length === 1 ? "잔액 전체" : `${formatWon(t.from)} 넘는 부분`) : `${formatWon(t.to)}까지`, w(t.interest)])));
  warn.hidden = !x.ignored;
  warn.textContent = x.ignored ? `이자 받는 날 이후이거나 날짜가 비어 있는 변경 ${x.ignored}건은 빼고 계산했습니다.` : "";
  return x;
}

function onUserInput() {
  const x = render();
  reportUse(x.grossInterest);
}

open.addEventListener("input", () => {
  const v = parseAmount(open.value);
  open.value = v ? formatAmountInput(v) : open.value.trim() === "" ? "" : "0";
  onUserInput();
});
for (const el of [start, pay]) el.addEventListener("input", onUserInput);
tax.addEventListener("change", onUserInput);

draw();
render();
