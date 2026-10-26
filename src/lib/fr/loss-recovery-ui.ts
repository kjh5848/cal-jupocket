/**
 * 손실 원금 복구 프랑스어판(/fr/tools/loss-recovery/) 화면 — 계산은 lib/loss-recovery.ts, 표기는 lib/fr/loss-recovery.ts.
 * 한국어판 공유 스크립트(src/scripts/loss-recovery.ts)는 문구가 한국어라 쓰지 않는다. 금액은 센트 정수로 계산한다.
 * calc-ui 의 data-won·data-presets(쉼표 천 단위 전제)는 쓰지 않는다 — '12,5' 가 깨진다.
 */
import { recovery, currentFromLoss, recoveryMonths, series, type RecoveryResult } from "../loss-recovery";
import { parseFixed, eur, eurosInput } from "./tva";
import { parseClosesFr, numFr, pctFr, signedPctFr, signedEuroFr, monthsFr } from "./loss-recovery";
import { parseNumberFr } from "./number";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "fr-loss-recovery";
const reportUse = trackCalculatorUse(CALC);
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
  set("lr-chg", signedPctFr(r.changePct));
  set("lr-pnl", signedEuroFr(Math.round(r.pnl), eur));
  set("lr-short", eur(Math.round(r.shortfall)));
  set("lr-months", r.above ? "Déjà au niveau du capital" : monthsFr(recoveryMonths(r.needPct, ratePct)));
  $("lr-months").previousElementSibling!.textContent = `Retour à ${pctFr(ratePct)} par an`;
  if (r.wiped) {
    set("lr-hero", "Retour impossible");
    set("lr-note", "Avec une valeur de 0 €, aucune hausse en pourcentage ne ramène au capital.");
  } else if (r.above) {
    set("lr-hero", "Capital déjà récupéré");
    set("lr-note", `${baseLabel} ${eur(Math.round(r.current))} — ${feePct > 0 ? `même après ${pctFr(feePct)} de frais à la vente, ` : ""}c’est au moins le capital (${eur(Math.round(r.principal))}).`);
  } else {
    set("lr-hero", `+${pctFr(r.needPct)}`);
    const loss = -r.changePct;
    set(
      "lr-note",
      `${baseLabel} ${eur(Math.round(r.current))} : il faut gagner ${eur(Math.round(r.shortfall))} pour retrouver le capital` +
        (loss > 0 ? ` · ${numFr(r.needPct - loss)} points de plus que les ${pctFr(loss)} perdus` : ""),
    );
  }
  set(
    "lr-nofee",
    feePct > 0 && !r.wiped && !r.above
      ? r.needPctNoFee === 0
        ? `La valeur dépasse le capital, mais ${pctFr(feePct)} de frais à la vente la ramènent en dessous (valeur cible ${eur(Math.round(r.target))}).`
        : `Hors frais, il faut +${pctFr(r.needPctNoFee)} ; avec ${pctFr(feePct)} prélevés à la vente, la valeur cible est ${eur(Math.round(r.target))}.`
      : "",
  );
  lastLines = [
    ["Capital investi", eur(Math.round(r.principal))],
    [baseLabel, eur(Math.round(r.current))],
    ["Variation par rapport au capital", signedPctFr(r.changePct)],
    ["Hausse nécessaire", r.wiped ? "Retour impossible" : r.above ? "Capital déjà récupéré" : `+${pctFr(r.needPct)}`],
  ];
}

function compute(source?: "current" | "loss") {
  const isValue = mode.value === "value";
  for (const el of document.querySelectorAll<HTMLElement>(".lr-value")) el.hidden = !isValue;
  for (const el of document.querySelectorAll<HTMLElement>(".lr-series")) el.hidden = isValue;
  const principal = parseFixed(principalEl.value);
  const feePct = feeEl.value.trim() === "" ? 0 : parseNumberFr(feeEl.value);
  const ratePct = parseNumberFr(rateEl.value);
  set("lr-hero-label", isValue ? "Hausse nécessaire pour retrouver le capital" : "Hausse nécessaire (dernier cours)");
  const errors = {
    principal: "Saisissez le capital investi en euros, par exemple 10 000.",
    current: "Saisissez une valeur actuelle de 0 € ou plus.",
    few: "Saisissez au moins deux cours, un par ligne.",
    fee: "Saisissez des frais à la vente entre 0 et 100 %.",
  };

  if (isValue) {
    if (source === "loss") {
      const c = currentFromLoss(principal, parseNumberFr(lossEl.value));
      if (c !== null) currentEl.value = eurosInput(Math.round(c));
    }
    const r = recovery(principal, parseFixed(currentEl.value), feePct);
    if (!r.ok) return clear(errors[r.reason]);
    if (source !== "loss") lossEl.value = String(Math.max(0, Math.round(-r.changePct * 100) / 100)); // type=number 는 소수점을 '.' 로만 받는다
    return showMain(r, feePct, ratePct, "Valeur actuelle");
  }

  const closes = parseClosesFr(closesEl.value);
  const s = series(principal, closes, feePct);
  if (!s.ok) return clear(errors[s.reason]);
  const label = (i: number) => closes[i].date ?? `cours n° ${i + 1}`;
  showMain(s.rec, feePct, ratePct, closes[closes.length - 1].date ? `Valeur au ${closes[closes.length - 1].date}` : "Valeur au dernier cours");
  set("lr-mdd", s.mddPct < 0 ? signedPctFr(s.mddPct) : "Aucune");
  set("lr-mdd-span", s.mddPct < 0 ? `${label(s.peakIdx)} → ${label(s.troughIdx)}` : "—");
  set("lr-high", s.toHighPct > 0 ? `+${pctFr(s.toHighPct)} (${numFr(s.highest)})` : "Le plus haut est atteint");
  set("lr-day", signedPctFr(s.dayPct));
  set("lr-avg", `${signedPctFr(s.avgSimplePct)} / ${signedPctFr(s.avgCompoundPct)} (${s.steps} variations)`);
  lastLines.push(["Baisse maximale", s.mddPct < 0 ? signedPctFr(s.mddPct) : "Aucune"]);
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

const buildCard = () => renderCard({ title: "Résultat : retour au capital après une perte", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  if (!lastLines.length) return;
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "perte-capital-resultat.png");
});
$("btn-share").addEventListener("click", async () => {
  if (!lastLines.length) return;
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "Retour au capital après une perte - jupocket.com");
});

compute();
