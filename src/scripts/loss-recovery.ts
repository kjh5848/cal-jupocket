/**
 * 손실 원금 복구 계산기 — /tools/loss-recovery/ (한국어판 전용). 계산은 src/lib/loss-recovery.ts 가 한다.
 * 평가액과 손실률 칸은 서로 맞춰 준다(마지막에 고친 칸이 기준).
 */
import { recovery, currentFromLoss, recoveryMonths, formatMonths, parseCloses, series, type RecoveryResult } from "../lib/loss-recovery";
import { formatWon } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("loss-recovery");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const mode = $<HTMLSelectElement>("lr-mode");
const principalEl = $<HTMLInputElement>("lr-principal");
const currentEl = $<HTMLInputElement>("lr-current");
const lossEl = $<HTMLInputElement>("lr-loss");
const closesEl = $<HTMLTextAreaElement>("lr-closes");
const feeEl = $<HTMLInputElement>("lr-fee");
const rateEl = $<HTMLInputElement>("lr-rate");

const set = (id: string, text: string) => {
  $(id).textContent = text;
};
const num = (el: HTMLInputElement) => Number(el.value.replace(/,/g, ""));
const fmt = (x: number) => x.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
const signed = (x: number) => (x > 0 ? `+${fmt(x)}%` : x < 0 ? `−${fmt(-x)}%` : "0%");
const signedWon = (x: number) => (x < 0 ? `−${formatWon(-x)}` : x > 0 ? `+${formatWon(x)}` : "0원");

let lastLines: [string, string][] = [];

function clear(msg: string) {
  set("lr-err", msg);
  for (const id of ["lr-hero", "lr-chg", "lr-pnl", "lr-short", "lr-months", "lr-mdd", "lr-mdd-span", "lr-high", "lr-day", "lr-avg"]) set(id, "—");
  set("lr-note", "");
  set("lr-nofee", "");
  lastLines = [];
}

function showMain(r: Extract<RecoveryResult, { ok: true }>, feePct: number, ratePct: number, baseLabel: string) {
  set("lr-err", "");
  set("lr-chg", signed(r.changePct));
  set("lr-pnl", signedWon(r.pnl));
  set("lr-short", formatWon(r.shortfall));
  set("lr-months", r.above ? "이미 원금" : formatMonths(recoveryMonths(r.needPct, ratePct)));
  $("lr-months").previousElementSibling!.textContent = `연 ${fmt(ratePct)}%로 회복`;
  if (r.wiped) {
    set("lr-hero", "회복 불가");
    set("lr-note", "평가액이 0원이면 몇 %가 올라도 원금으로 돌아오지 않습니다.");
  } else if (r.above) {
    set("lr-hero", "이미 원금 이상");
    set("lr-note", `${baseLabel} ${formatWon(r.current)} — ${feePct > 0 ? `팔 때 비용 ${fmt(feePct)}%를 빼도 ` : ""}원금(${formatWon(r.principal)}) 이상입니다.`);
  } else {
    set("lr-hero", `+${fmt(r.needPct)}%`);
    const loss = -r.changePct;
    set(
      "lr-note",
      `${baseLabel} ${formatWon(r.current)}에서 ${formatWon(r.shortfall)} 늘어야 원금` + (loss > 0 ? ` · 잃은 ${fmt(loss)}%보다 ${fmt(r.needPct - loss)}%p 더` : ""),
    );
  }
  set("lr-nofee", feePct > 0 && !r.wiped && !r.above ? r.needPctNoFee === 0 ? `평가액은 원금 이상이지만 팔 때 ${fmt(feePct)}%를 떼면 원금에 못 미칩니다(목표 평가액 ${formatWon(r.target)}).` : `비용 빼고 보면 +${fmt(r.needPctNoFee)}% — 팔 때 ${fmt(feePct)}%를 떼므로 목표 평가액은 ${formatWon(r.target)}입니다.` : "");
  lastLines = [
    ["투자 원금", formatWon(r.principal)],
    [baseLabel, formatWon(r.current)],
    ["원금 대비", signed(r.changePct)],
    ["원금까지 필요한 상승률", r.wiped ? "회복 불가" : r.above ? "이미 원금 이상" : `+${fmt(r.needPct)}%`],
  ];
}

function compute(source?: "current" | "loss") {
  const isValue = mode.value === "value";
  for (const el of document.querySelectorAll<HTMLElement>(".lr-value")) el.hidden = !isValue;
  for (const el of document.querySelectorAll<HTMLElement>(".lr-series")) el.hidden = isValue;
  const principal = num(principalEl);
  const feePct = Number(feeEl.value || 0);
  const ratePct = Number(rateEl.value);
  set("lr-hero-label", isValue ? "원금까지 필요한 상승률" : "원금까지 필요한 상승률(마지막 종가 기준)");

  if (isValue) {
    if (source === "loss") {
      const c = currentFromLoss(principal, Number(lossEl.value));
      if (c !== null) currentEl.value = Math.round(c).toLocaleString("ko-KR");
    }
    const r = recovery(principal, num(currentEl), feePct);
    if (!r.ok) return clear({ principal: "원금을 넣어 주세요.", current: "평가액은 0원 이상으로 넣어 주세요.", fee: "팔 때 비용은 0~100% 사이로 넣어 주세요." }[r.reason]);
    if (source !== "loss") lossEl.value = String(Math.max(0, Math.round(-r.changePct * 100) / 100));
    return showMain(r, feePct, ratePct, "지금 평가액");
  }

  const closes = parseCloses(closesEl.value);
  const s = series(principal, closes, feePct);
  if (!s.ok) return clear({ principal: "원금을 넣어 주세요.", few: "종가를 두 줄 이상 넣어 주세요.", fee: "팔 때 비용은 0~100% 사이로 넣어 주세요." }[s.reason]);
  const label = (i: number) => closes[i].date ?? `${i + 1}번째`;
  showMain(s.rec, feePct, ratePct, `${label(closes.length - 1)} 평가액`);
  set("lr-mdd", s.mddPct < 0 ? signed(s.mddPct) : "없음");
  set("lr-mdd-span", s.mddPct < 0 ? `${label(s.peakIdx)} → ${label(s.troughIdx)}` : "—");
  set("lr-high", s.toHighPct > 0 ? `+${fmt(s.toHighPct)}% (${s.highest.toLocaleString("ko-KR")})` : "지금이 최고");
  set("lr-day", signed(s.dayPct));
  set("lr-avg", `${signed(s.avgSimplePct)} / ${signed(s.avgCompoundPct)} (${s.steps}회)`);
  lastLines.push(["최대 낙폭", s.mddPct < 0 ? signed(s.mddPct) : "없음"]);
}

for (const b of document.querySelectorAll<HTMLButtonElement>("button[data-loss]")) {
  b.addEventListener("click", () => {
    lossEl.value = b.dataset.loss!;
    reportUse(1);
    compute("loss");
  });
}

const cardEl = document.querySelector(".calc-card")!;
for (const ev of ["input", "change"]) {
  cardEl.addEventListener(ev, (e) => {
    reportUse(1);
    const t = e.target;
    compute(t === lossEl ? "loss" : t === currentEl ? "current" : undefined);
  });
}

const buildCard = () => renderCard({ title: "손실 원금 복구 계산 결과", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  if (!lastLines.length) return;
  track("save_result", { calculator: "loss-recovery" });
  downloadCard(buildCard(), "loss-recovery-result.png");
});
$("btn-share").addEventListener("click", async () => {
  if (!lastLines.length) return;
  track("share_result", { calculator: "loss-recovery" });
  await shareCard(buildCard(), "손실 원금 복구 계산 결과 - jupocket.com");
});

compute();
