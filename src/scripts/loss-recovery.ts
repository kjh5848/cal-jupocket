/**
 * 손실 원금 복구 계산기 — /tools/loss-recovery/ · 영어판(/en-au/tools/loss-recovery/ 등). 계산은 src/lib/loss-recovery.ts 가 한다.
 * 평가액과 손실률 칸은 서로 맞춰 준다(마지막에 고친 칸이 기준).
 * 여러 언어판이 같은 계산을 쓰고 말·통화 표기만 다르다(pickLang). 영어 사전은 판의 currency·numberLocale(src/i18n/locales.ts)로
 * 'A$3,000' 처럼 적고 소수 둘째 자리까지 받는다. 한국어는 원 정수 단위 그대로.
 * 독일어판(/de/tools/loss-recovery/)은 DE 사전 — 표기·종가 줄 읽기는 lib/de/loss-recovery('3 000,00 Euro'·'42,86 %'·'31.12.2026; 20,50', Intl 안 씀).
 */
import { recovery, currentFromLoss, recoveryMonths, formatMonths, parseCloses, series, type RecoveryResult } from "../lib/loss-recovery";
import { numDe, eurDe, readEurDe, formatMonthsDe, parseClosesDe } from "../lib/de/loss-recovery";
import { formatWon } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";
import { pageLocale, pickLang } from "../i18n/ui";
import { meta } from "../i18n/locales";

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
const L = meta(pageLocale());
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

const KO = {
  num: (el: HTMLInputElement) => Number(el.value.replace(/,/g, "")),
  /** 퍼센트 기호 앞 */
  pu: "%",
  closes: parseCloses,
  fmt: (x: number) => x.toLocaleString("ko-KR", { maximumFractionDigits: 2 }),
  money: (x: number) => formatWon(x),
  zero: "0원",
  inputMoney: (x: number) => Math.round(x).toLocaleString("ko-KR"),
  price: (x: number) => x.toLocaleString("ko-KR"),
  months: (m: number | null) => formatMonths(m),
  alreadyShort: "이미 원금",
  rateLabel: (r: string) => `연 ${r}%로 회복`,
  wipedHero: "회복 불가",
  wipedNote: "평가액이 0원이면 몇 %가 올라도 원금으로 돌아오지 않습니다.",
  aboveHero: "이미 원금 이상",
  aboveNote: (base: string, cur: string, fee: string, principal: string) => `${base} ${cur} — ${fee ? `팔 때 비용 ${fee}%를 빼도 ` : ""}원금(${principal}) 이상입니다.`,
  needNote: (base: string, cur: string, short: string, extra: string) => `${base} ${cur}에서 ${short} 늘어야 원금` + (extra ? ` · 잃은 ${extra}` : ""),
  needNoteExtra: (loss: string, more: string) => `${loss}%보다 ${more}%p 더`,
  noFeeAbove: (fee: string, target: string) => `평가액은 원금 이상이지만 팔 때 ${fee}%를 떼면 원금에 못 미칩니다(목표 평가액 ${target}).`,
  noFeeNeed: (need: string, fee: string, target: string) => `비용 빼고 보면 +${need}% — 팔 때 ${fee}%를 떼므로 목표 평가액은 ${target}입니다.`,
  lPrincipal: "투자 원금",
  lVsPrincipal: "원금 대비",
  lNeed: "원금까지 필요한 상승률",
  lNeedSeries: "원금까지 필요한 상승률(마지막 종가 기준)",
  lMdd: "최대 낙폭",
  none: "없음",
  atHigh: "지금이 최고",
  nowValue: "지금 평가액",
  baseAt: (label: string) => `${label} 평가액`,
  nth: (i: number) => `${i}번째`,
  times: (n: number) => `${n}회`,
  errPrincipal: "원금을 넣어 주세요.",
  errCurrent: "평가액은 0원 이상으로 넣어 주세요.",
  errFee: "팔 때 비용은 0~100% 사이로 넣어 주세요.",
  errFew: "종가를 두 줄 이상 넣어 주세요.",
  cardTitle: "손실 원금 복구 계산 결과",
  share: "손실 원금 복구 계산 결과 - jupocket.com",
};

const EN: typeof KO = {
  num: (el) => parseFloat(el.value.replace(/[^0-9.]/g, "")) || 0,
  pu: "%",
  closes: parseCloses,
  fmt: (x) => x.toLocaleString(L.numberLocale, { maximumFractionDigits: 2 }),
  money: (x) => new Intl.NumberFormat(L.numberLocale, { style: "currency", currency: L.currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(x),
  zero: new Intl.NumberFormat(L.numberLocale, { style: "currency", currency: L.currency, minimumFractionDigits: 0 }).format(0),
  inputMoney: (x) => (Math.round(x * 100) / 100).toLocaleString(L.numberLocale, { maximumFractionDigits: 2 }),
  price: (x) => x.toLocaleString(L.numberLocale),
  months: (m) => {
    if (m === null) return "Never at this rate";
    if (m === Infinity) return "Over 100 years";
    if (m === 0) return "Already there";
    const y = Math.floor(m / 12);
    const r = m % 12;
    return [y ? plural(y, "year") : "", r ? plural(r, "month") : ""].filter(Boolean).join(" ");
  },
  alreadyShort: "Already there",
  rateLabel: (r) => `Back to even at ${r}% a year`,
  wipedHero: "Can't recover",
  wipedNote: "If the value is zero, no percentage gain gets you back to your starting amount.",
  aboveHero: "Already at or above cost",
  aboveNote: (base, cur, fee, principal) => `${base} ${cur} — ${fee ? `even after ${fee}% selling costs, ` : ""}that is at or above what you put in (${principal}).`,
  needNote: (base, cur, short, extra) => `${base} ${cur} needs to grow by ${short} to get back to even` + (extra ? ` · ${extra}` : ""),
  needNoteExtra: (loss, more) => `${more} percentage points more than the ${loss}% you lost`,
  noFeeAbove: (fee, target) => `The value is above cost, but selling costs of ${fee}% would leave you short (target value ${target}).`,
  noFeeNeed: (need, fee, target) => `Before costs it is +${need}% — with ${fee}% taken off when you sell, the target value is ${target}.`,
  lPrincipal: "Amount invested",
  lVsPrincipal: "Versus cost",
  lNeed: "Gain needed to break even",
  lNeedSeries: "Gain needed to break even (from the last close)",
  lMdd: "Maximum drawdown",
  none: "None",
  atHigh: "At the high now",
  nowValue: "Current value",
  baseAt: (label) => `Value on ${label}`,
  nth: (i) => `entry ${i}`,
  times: (n) => `${n} ${n === 1 ? "step" : "steps"}`,
  errPrincipal: "Enter the amount you invested.",
  errCurrent: "Enter a current value of zero or more.",
  errFee: "Enter selling costs between 0% and 100%.",
  errFew: "Enter at least two closing prices.",
  cardTitle: "Loss recovery result",
  share: "Loss recovery result - jupocket.com",
};

const DE: typeof KO = {
  num: (el) => readEurDe(el.value),
  pu: " %",
  closes: parseClosesDe,
  fmt: numDe,
  money: eurDe,
  zero: "0,00 Euro",
  inputMoney: (x) => numDe(Math.round(x * 100) / 100),
  price: numDe,
  months: formatMonthsDe,
  alreadyShort: "Bereits erreicht",
  rateLabel: (r) => `Aufholen mit ${r} % pro Jahr`,
  wipedHero: "Nicht aufholbar",
  wipedNote: "Bei einem Wert von 0 Euro führt kein noch so hoher Prozentsatz zurück zum Einsatz.",
  aboveHero: "Einsatz bereits erreicht",
  aboveNote: (base, cur, fee, principal) => `${base} ${cur} — ${fee ? `auch nach ${fee} % Verkaufskosten ` : ""}liegt das auf oder über dem Einsatz (${principal}).`,
  needNote: (base, cur, short, extra) => `${base} ${cur}, bis zum Einsatz fehlen ${short}` + (extra ? ` · ${extra}` : ""),
  needNoteExtra: (loss, more) => `${more} Prozentpunkte mehr als die verlorenen ${loss} %`,
  noFeeAbove: (fee, target) => `Der Wert liegt über dem Einsatz, aber nach ${fee} % Verkaufskosten bliebe weniger übrig (Zielwert ${target}).`,
  noFeeNeed: (need, fee, target) => `Ohne Kosten sind es +${need} % — da beim Verkauf ${fee} % abgehen, liegt der Zielwert bei ${target}.`,
  lPrincipal: "Einsatz",
  lVsPrincipal: "Gegenüber dem Einsatz",
  lNeed: "Nötiger Gewinn bis zum Einsatz",
  lNeedSeries: "Nötiger Gewinn bis zum Einsatz (vom letzten Kurs aus)",
  lMdd: "Max Drawdown",
  none: "Keiner",
  atHigh: "Jetzt am Höchstkurs",
  nowValue: "Aktueller Wert",
  baseAt: (label) => `Wert am ${label}`,
  nth: (i) => `Zeile ${i}`,
  times: (n) => `${n} ${n === 1 ? "Schritt" : "Schritte"}`,
  errPrincipal: "Bitte den Einsatz eintragen.",
  errCurrent: "Bitte einen aktuellen Wert von 0 Euro oder mehr eintragen.",
  errFee: "Verkaufskosten zwischen 0 und 100 % eintragen.",
  errFew: "Bitte mindestens zwei Schlusskurse eintragen.",
  cardTitle: "Verlust-Aufhol-Rechner: Ergebnis",
  share: "Verlust-Aufhol-Rechner: Ergebnis - jupocket.com",
};
const S = pickLang({ ko: KO, en: EN, de: DE });
const num = S.num;
const fmt = S.fmt;
const signed = (x: number) => (x > 0 ? `+${fmt(x)}${S.pu}` : x < 0 ? `−${fmt(-x)}${S.pu}` : `0${S.pu}`);
const signedWon = (x: number) => (x < 0 ? `−${S.money(-x)}` : x > 0 ? `+${S.money(x)}` : S.zero);

let lastLines: [string, string][] = [];

function clear(msg: string) {
  set("lr-err", msg);
  for (const id of ["lr-hero", "lr-chg", "lr-pnl", "lr-short", "lr-months", "lr-mdd", "lr-mdd-span", "lr-high", "lr-day", "lr-avg"]) set(id, "—");
  set("lr-note", "");
  set("lr-nofee", "");
  lastLines = [];
}

function showMain(r: Extract<RecoveryResult, { ok: true }>, feePct: number, ratePct: number, baseLabel: string) {
  const money = S.money;
  set("lr-err", "");
  set("lr-chg", signed(r.changePct));
  set("lr-pnl", signedWon(r.pnl));
  set("lr-short", money(r.shortfall));
  set("lr-months", r.above ? S.alreadyShort : S.months(recoveryMonths(r.needPct, ratePct)));
  $("lr-months").previousElementSibling!.textContent = S.rateLabel(fmt(ratePct));
  if (r.wiped) {
    set("lr-hero", S.wipedHero);
    set("lr-note", S.wipedNote);
  } else if (r.above) {
    set("lr-hero", S.aboveHero);
    set("lr-note", S.aboveNote(baseLabel, money(r.current), feePct > 0 ? fmt(feePct) : "", money(r.principal)));
  } else {
    set("lr-hero", `+${fmt(r.needPct)}${S.pu}`);
    const loss = -r.changePct;
    set("lr-note", S.needNote(baseLabel, money(r.current), money(r.shortfall), loss > 0 ? S.needNoteExtra(fmt(loss), fmt(r.needPct - loss)) : ""));
  }
  set(
    "lr-nofee",
    feePct > 0 && !r.wiped && !r.above
      ? r.needPctNoFee === 0
        ? S.noFeeAbove(fmt(feePct), money(r.target))
        : S.noFeeNeed(fmt(r.needPctNoFee), fmt(feePct), money(r.target))
      : "",
  );
  lastLines = [
    [S.lPrincipal, money(r.principal)],
    [baseLabel, money(r.current)],
    [S.lVsPrincipal, signed(r.changePct)],
    [S.lNeed, r.wiped ? S.wipedHero : r.above ? S.aboveHero : `+${fmt(r.needPct)}${S.pu}`],
  ];
}

function compute(source?: "current" | "loss") {
  const isValue = mode.value === "value";
  for (const el of document.querySelectorAll<HTMLElement>(".lr-value")) el.hidden = !isValue;
  for (const el of document.querySelectorAll<HTMLElement>(".lr-series")) el.hidden = isValue;
  const principal = num(principalEl);
  const feePct = Number(feeEl.value || 0);
  const ratePct = Number(rateEl.value);
  set("lr-hero-label", isValue ? S.lNeed : S.lNeedSeries);

  if (isValue) {
    if (source === "loss") {
      const c = currentFromLoss(principal, Number(lossEl.value));
      if (c !== null) currentEl.value = S.inputMoney(c);
    }
    const r = recovery(principal, num(currentEl), feePct);
    if (!r.ok) return clear({ principal: S.errPrincipal, current: S.errCurrent, fee: S.errFee }[r.reason]);
    if (source !== "loss") lossEl.value = String(Math.max(0, Math.round(-r.changePct * 100) / 100));
    return showMain(r, feePct, ratePct, S.nowValue);
  }

  const closes = S.closes(closesEl.value);
  const s = series(principal, closes, feePct);
  if (!s.ok) return clear({ principal: S.errPrincipal, few: S.errFew, fee: S.errFee }[s.reason]);
  const label = (i: number) => closes[i].date ?? S.nth(i + 1);
  showMain(s.rec, feePct, ratePct, S.baseAt(label(closes.length - 1)));
  set("lr-mdd", s.mddPct < 0 ? signed(s.mddPct) : S.none);
  set("lr-mdd-span", s.mddPct < 0 ? `${label(s.peakIdx)} → ${label(s.troughIdx)}` : "—");
  set("lr-high", s.toHighPct > 0 ? `+${fmt(s.toHighPct)}${S.pu} (${S.price(s.highest)})` : S.atHigh);
  set("lr-day", signed(s.dayPct));
  set("lr-avg", `${signed(s.avgSimplePct)} / ${signed(s.avgCompoundPct)} (${S.times(s.steps)})`);
  lastLines.push([S.lMdd, s.mddPct < 0 ? signed(s.mddPct) : S.none]);
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

const buildCard = () => renderCard({ title: S.cardTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  if (!lastLines.length) return;
  track("save_result", { calculator: "loss-recovery" });
  downloadCard(buildCard(), "loss-recovery-result.png");
});
$("btn-share").addEventListener("click", async () => {
  if (!lastLines.length) return;
  track("share_result", { calculator: "loss-recovery" });
  await shareCard(buildCard(), S.share);
});

compute();
