/**
 * 화폐가치 계산기 — /tools/inflation/ (한국어판 전용). 계산은 src/lib/inflation.ts 가 한다.
 * 여기서는 계산 방식(연도로 비교 / 상승률 직접 넣기)에 따라 칸을 숨기고 결과를 그린다.
 */
import { cpiAdjust, rateAdjust, won } from "../lib/inflation";
import { formatWon } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("inflation");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const mode = $<HTMLSelectElement>("if-mode");
const amountEl = $<HTMLInputElement>("if-amount");
const fromEl = $<HTMLSelectElement>("if-from");
const toEl = $<HTMLSelectElement>("if-to");
const dirEl = $<HTMLSelectElement>("if-dir");
const rateEl = $<HTMLInputElement>("if-rate");
const yearsEl = $<HTMLInputElement>("if-years");

const set = (id: string, text: string) => {
  $(id).textContent = text;
};
const pct = (x: number, d: number) => `${x > 0 ? "+" : ""}${x.toFixed(d)}%`;

let lastLines: [string, string][] = [];

function clear(msg: string) {
  set("if-err", msg);
  for (const id of ["if-hero", "if-ratio", "if-cum", "if-ann", "if-span"]) set(id, "—");
  set("if-note", "");
  lastLines = [];
}

function compute() {
  const isCpi = mode.value === "cpi";
  for (const el of document.querySelectorAll<HTMLElement>(".if-cpi")) el.hidden = !isCpi;
  for (const el of document.querySelectorAll<HTMLElement>(".if-rate")) el.hidden = isCpi;
  const amount = Number(amountEl.value.replace(/,/g, ""));
  const amountText = formatWon(won(amount));

  if (isCpi) {
    const from = Number(fromEl.value);
    const to = Number(toEl.value);
    const r = cpiAdjust(amount, from, to);
    if (!r.ok) return clear(r.reason === "amount" ? "금액을 넣어 주세요." : "연도를 다시 골라 주세요.");
    set("if-err", "");
    set("if-hero-label", `${to}년 돈으로`);
    set("if-hero", formatWon(won(r.value)));
    set(
      "if-note",
      r.direction === "same" ? "같은 해라 그대로입니다" : `${from}년 ${amountText} · 물가 ${(r.direction === "forward" ? r.ratio : 1 / r.ratio).toFixed(2)}배 ${r.direction === "forward" ? "올랐음" : "오르기 전"}`,
    );
    set("if-ratio", `${r.ratio.toFixed(2)}배`);
    set("if-cum", pct(r.cumulativePct, 1));
    set("if-ann", `${r.annualPct.toFixed(2)}%`);
    set("if-span", `${r.span}년`);
    lastLines = [
      [`${from}년 금액`, amountText],
      [`${to}년 돈으로`, formatWon(won(r.value))],
      [`누적 물가 (${Math.min(from, to)}→${Math.max(from, to)})`, pct(r.cumulativePct, 1)],
      ["연평균 물가 상승률", `${r.annualPct.toFixed(2)}%`],
    ];
    return;
  }

  const ratePct = Number(rateEl.value);
  const years = Number(yearsEl.value);
  const future = dirEl.value === "future";
  const r = rateAdjust(amount, ratePct, years, future ? "future" : "present");
  if (!r.ok) return clear({ amount: "금액을 넣어 주세요.", rate: "상승률은 −100%보다 커야 합니다.", years: "기간은 0~200년으로 넣어 주세요." }[r.reason]);
  set("if-err", "");
  set("if-hero-label", future ? `${years}년 뒤 가격` : `${years}년 뒤 ${amountText}의 오늘 가치`);
  set("if-hero", formatWon(won(r.value)));
  set("if-note", `연 ${ratePct}% · ${years}년 · 가정값`);
  set("if-ratio", `${r.factor.toFixed(2)}배`);
  set("if-cum", pct(r.cumulativePct, 1));
  set("if-ann", `${ratePct}%`);
  set("if-span", `${years}년`);
  lastLines = [
    ["금액", amountText],
    [future ? `${years}년 뒤 가격` : "오늘 가치", formatWon(won(r.value))],
    ["연 물가 상승률 (가정)", `${ratePct}%`],
  ];
}

for (const b of document.querySelectorAll<HTMLButtonElement>(".if-cpi button[data-amount]")) {
  b.addEventListener("click", () => {
    amountEl.value = Number(b.dataset.amount).toLocaleString("ko-KR");
    fromEl.value = b.dataset.from!;
    toEl.value = b.dataset.to!;
    reportUse(1);
    compute();
  });
}

const cardEl = document.querySelector(".calc-card")!;
for (const ev of ["input", "change"]) {
  cardEl.addEventListener(ev, () => {
    reportUse(1);
    compute();
  });
}

const buildCard = () => renderCard({ title: "화폐가치 계산 결과", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  if (!lastLines.length) return;
  track("save_result", { calculator: "inflation" });
  downloadCard(buildCard(), "inflation-result.png");
});
$("btn-share").addEventListener("click", async () => {
  if (!lastLines.length) return;
  track("share_result", { calculator: "inflation" });
  await shareCard(buildCard(), "화폐가치 계산 결과 - jupocket.com");
});

compute();
