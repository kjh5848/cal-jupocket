/**
 * 부채 상환 계획 — /tools/debt-payoff/ · 영어판(/en-sg/tools/debt-payoff/ 등). 계산은 src/lib/debt-payoff.ts payoffPlan() 이 한다.
 * 여기서는 빚 5줄·예산을 읽고, 고른 순서 · 눈사태 · 눈덩이 · 추가 상환 없음을 같이 돌려 비교 칸을 채운다.
 * 몇 년 몇 월은 이 화면에서만 정한다 — 첫 달은 다음 달(오늘이 10월이면 11월).
 * 여러 언어판이 같은 계산을 쓰고 말·통화 표기만 다르다(pickLang). lib 은 금액을 정수 단위로 버림하므로
 * 영어 사전은 센트(× 100)로 넣고 꺼낼 때 ÷ 100 — 이자는 센트 미만 버림. 통화는 판의 currency·numberLocale(src/i18n/locales.ts).
 * 독일어판(/de/tools/debt-payoff/)은 DE 사전 — 같은 센트 단위, 표기는 lib/de/debt-payoff('1 234,56 Euro'·'November 2027', Intl 안 씀).
 * 스페인판(/es/tools/debt-payoff/)은 ES 사전 — 같은 센트 단위, 표기는 lib/es/debt-payoff('1234,56 euros'·'noviembre de 2027', Intl 안 씀).
 * 번체판(/zh-hk/tools/debt-payoff/)은 ZH_HANT 사전 — 읽기·금액·달은 EN 과 같은 센트 단위·판 Intl(zh-HK → 'HK$1,234.50'·'2027年11月'), 중립 서면어라 대만판도 쓸 수 있다.
 * 인도네시아어판(/id/tools/debt-payoff/)은 ID 사전 — 루피아 정수 단위(한국어판처럼 parseAmount, 이자는 1 루피아 미만 버림),
 * 표시는 판의 IDR·id-ID('Rp 50.000.000'), 달은 Intl id-ID('November 2027').
 */
import { payoffPlan, monthLabel, spellMonths, type Debt, type Strategy } from "../lib/debt-payoff";
import { formatWon, parseAmount } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";
import { pageLocale, pickLang } from "../i18n/ui";
import { meta } from "../i18n/locales";
import { centsDe, euroCentDe, monthLabelDe, spellMonthsDe } from "../lib/de/debt-payoff";
import { centsEs, euroCentEs, monthLabelEs, spellMonthsEs } from "../lib/es/debt-payoff";

const KO = {
  /** 입력칸 → lib 정수 단위 */
  read: parseAmount,
  /** lib 정수 단위 → 표시 */
  money: formatWon,
  month: (y: number, m: number, n: number) => monthLabel(y, m, n),
  spell: spellMonths,
  debtName: (n: number) => `빚 ${n}`,
  errEmpty: "남은 잔액이 있는 빚을 하나 이상 넣어 주세요.",
  errMin: (name: string, first: string) => `${name}: 월 최소 상환액이 첫 달 이자 ${first} 이하라 잔액이 줄지 않습니다. 이 금액보다 크게 넣어 주세요.`,
  errLong: "50년(600개월) 안에 다 갚지 못합니다. 상환액을 늘려 주세요.",
  note: (end: string, months: number, budget: string) => `${end}에 끝 · ${months}개월 · 첫 달 예산 ${budget}`,
  vsSame: (monthGap: number) => `같음${monthGap ? ` · 기간 ${Math.abs(monthGap)}개월 차이` : ""}`,
  vs: (gap: string, less: boolean, monthGap: number) =>
    `눈사태가 ${gap} ${less ? "적음" : "많음"}${monthGap ? ` · ${Math.abs(monthGap)}개월 ${monthGap > 0 ? "빠름" : "느림"}` : ""}`,
  saved: (amount: string, months: number) => `${amount} · ${months}개월 빨리`,
  savedNever: "추가 없이는 50년 안에 못 갚음",
  noExtra: "더 갚을 돈 0원",
  payoffAt: (end: string, m: number) => `${end} (${m}개월째)`,
  lineDebt: "빚 합계",
  lineBudget: "첫 달 예산",
  lineEnd: "다 갚는 달",
  lineEndValue: (end: string, spelled: string) => `${end} (${spelled})`,
  lineInt: "총 이자",
  title: "부채 상환 계획",
  share: "부채 상환 계획 - jupocket.com",
};

const EN_META = meta(pageLocale());
const CENTS = 100;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const EN: typeof KO = {
  read: (raw) => {
    const v = parseFloat(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(v) ? Math.round(v * CENTS) : 0;
  },
  money: (cents) =>
    (cents / CENTS).toLocaleString(EN_META.numberLocale, {
      style: "currency",
      currency: EN_META.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  month: (y, m, n) => {
    const t = y * 12 + (m - 1) + (n - 1);
    return new Intl.DateTimeFormat(EN_META.numberLocale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(Date.UTC(Math.floor(t / 12), t % 12, 1)),
    );
  },
  spell: (months) => {
    const y = Math.floor(months / 12);
    const r = months % 12;
    return [y ? plural(y, "year") : "", r ? plural(r, "month") : ""].filter(Boolean).join(" ") || "0 months";
  },
  debtName: (n) => `Debt ${n}`,
  errEmpty: "Enter at least one debt with a balance left.",
  errMin: (name, first) =>
    `${name}: the minimum monthly payment is not more than the first month's interest of ${first}, so the balance never goes down. Enter a larger amount.`,
  errLong: "These debts are not cleared within 50 years (600 months). Pay more each month.",
  note: (end, months, budget) => `Debt-free in ${end} · ${months} months · first-month budget ${budget}`,
  vsSame: (monthGap) => `Same interest${monthGap ? ` · ${plural(Math.abs(monthGap), "month")} apart` : ""}`,
  vs: (gap, less, monthGap) =>
    `Avalanche pays ${gap} ${less ? "less" : "more"}${monthGap ? ` · ${plural(Math.abs(monthGap), "month")} ${monthGap > 0 ? "sooner" : "later"}` : ""}`,
  saved: (amount, months) => `${amount} · ${plural(months, "month")} sooner`,
  savedNever: "Not cleared within 50 years without the extra",
  noExtra: "No extra payment",
  payoffAt: (end, m) => `${end} (month ${m})`,
  lineDebt: "Total debt",
  lineBudget: "First-month budget",
  lineEnd: "Debt-free",
  lineEndValue: (end, spelled) => `${end} (${spelled})`,
  lineInt: "Total interest",
  title: "Debt payoff plan",
  share: "Debt payoff plan - jupocket.com",
};

/** Deutsch — /de/tools/debt-payoff/. 센트 정수로 계산, 금액 '1 234,56 Euro'(§ 32a EStG 꼴), 달 'November 2027' */
const DE: typeof KO = {
  read: centsDe,
  money: euroCentDe,
  month: monthLabelDe,
  spell: spellMonthsDe,
  debtName: (n) => `Schuld ${n}`,
  errEmpty: "Bitte mindestens eine Schuld mit Restschuld eingeben.",
  errMin: (name, first) =>
    `${name}: Die Mindestrate liegt nicht über den Zinsen des ersten Monats von ${first}, die Restschuld sinkt so nicht. Bitte einen höheren Betrag eingeben.`,
  errLong: "Diese Schulden sind in 50 Jahren (600 Monaten) nicht getilgt. Bitte mehr pro Monat zahlen.",
  note: (end, months, budget) => `Schuldenfrei im ${end} · ${months} Monate · Budget im ersten Monat ${budget}`,
  vsSame: (monthGap) => `Gleiche Zinsen${monthGap ? ` · ${spellMonthsDe(Math.abs(monthGap))} Unterschied` : ""}`,
  vs: (gap, less, monthGap) =>
    `Lawine ${gap} ${less ? "günstiger" : "teurer"}${monthGap ? ` · ${spellMonthsDe(Math.abs(monthGap))} ${monthGap > 0 ? "schneller" : "langsamer"}` : ""}`,
  saved: (amount, months) => `${amount} · ${months} ${months === 1 ? "Monat" : "Monate"} früher`,
  savedNever: "Ohne Zusatztilgung nicht in 50 Jahren getilgt",
  noExtra: "Keine Zusatztilgung",
  payoffAt: (end, m) => `${end} (${m}. Monat)`,
  lineDebt: "Schulden gesamt",
  lineBudget: "Budget im ersten Monat",
  lineEnd: "Schuldenfrei",
  lineEndValue: (end, spelled) => `${end} (${spelled})`,
  lineInt: "Zinsen gesamt",
  title: "Schuldenabbau-Plan",
  share: "Schuldenabbau-Plan - jupocket.com",
};

/** 繁體中文 — /zh-hk/tools/debt-payoff/. 센트 단위·Intl 은 EN 과 같음(판의 currency·numberLocale), 기간 '1年3個月' */
const zhSpell = (months: number) => {
  const y = Math.floor(months / 12);
  const r = months % 12;
  return [y ? `${y}年` : "", r ? `${r}個月` : ""].join("") || "0個月";
};
const ZH_HANT: typeof KO = {
  read: EN.read,
  money: EN.money,
  month: EN.month,
  spell: zhSpell,
  debtName: (n) => `債務${n}`,
  errEmpty: "請至少輸入一筆尚有結欠的債務。",
  errMin: (name, first) => `${name}：每月最低還款額不高於首月利息 ${first}，結欠不會減少。請輸入較大的金額。`,
  errLong: "50年（600個月）內未能還清，請提高每月還款額。",
  note: (end, months, budget) => `${end}還清 · ${months}個月 · 首月預算 ${budget}`,
  vsSame: (monthGap) => `利息相同${monthGap ? ` · 期間相差${Math.abs(monthGap)}個月` : ""}`,
  vs: (gap, less, monthGap) =>
    `雪崩法利息${less ? "少" : "多"} ${gap}${monthGap ? ` · ${monthGap > 0 ? "快" : "慢"}${Math.abs(monthGap)}個月` : ""}`,
  saved: (amount, months) => `${amount} · 提早${months}個月`,
  savedNever: "不額外還款，50年內未能還清",
  noExtra: "沒有額外還款",
  payoffAt: (end, m) => `${end}（第${m}個月）`,
  lineDebt: "債務總額",
  lineBudget: "首月預算",
  lineEnd: "還清月份",
  lineEndValue: (end, spelled) => `${end}（${spelled}）`,
  lineInt: "總利息",
  title: "債務還款計劃",
  share: "債務還款計劃 - jupocket.com",
};

/** Español — /es/tools/debt-payoff/. 센트 정수로 계산, 금액 '1234,56 euros'·'12 345,67 euros'(RD 2032/2009 Anexo III 2.8·2.9), 달 'noviembre de 2027' */
const ES: typeof KO = {
  read: centsEs,
  money: euroCentEs,
  month: monthLabelEs,
  spell: spellMonthsEs,
  debtName: (n) => `Deuda ${n}`,
  errEmpty: "Escribe al menos una deuda con saldo pendiente.",
  errMin: (name, first) =>
    `${name}: la cuota mínima no supera los intereses del primer mes, ${first}, así que el saldo no baja. Escribe una cantidad mayor.`,
  errLong: "Estas deudas no quedan pagadas en 50 años (600 meses). Paga más cada mes.",
  note: (end, months, budget) => `Sin deudas en ${end} · ${months} ${months === 1 ? "mes" : "meses"} · presupuesto del primer mes ${budget}`,
  vsSame: (monthGap) => `Mismos intereses${monthGap ? ` · ${spellMonthsEs(Math.abs(monthGap))} de diferencia` : ""}`,
  vs: (gap, less, monthGap) =>
    `La avalancha paga ${gap} ${less ? "menos" : "más"}${monthGap ? ` · ${spellMonthsEs(Math.abs(monthGap))} ${monthGap > 0 ? "antes" : "después"}` : ""}`,
  saved: (amount, months) => `${amount} · ${months} ${months === 1 ? "mes" : "meses"} antes`,
  savedNever: "Sin el pago extra no se termina en 50 años",
  noExtra: "Sin pago extra",
  payoffAt: (end, m) => `${end} (mes ${m})`,
  lineDebt: "Deuda total",
  lineBudget: "Presupuesto del primer mes",
  lineEnd: "Sin deudas en",
  lineEndValue: (end, spelled) => `${end} (${spelled})`,
  lineInt: "Intereses totales",
  title: "Plan para pagar deudas",
  share: "Plan para pagar deudas - jupocket.com",
};

/** Bahasa Indonesia — /id/tools/debt-payoff/. 루피아 정수 단위(센트 없음), 표시 'Rp 1.250.000' */
const ID_META = EN_META;
const ID: typeof KO = {
  read: parseAmount,
  money: (v) =>
    v.toLocaleString(ID_META.numberLocale, { style: "currency", currency: ID_META.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  month: (y, m, n) => {
    const t = y * 12 + (m - 1) + (n - 1);
    return new Intl.DateTimeFormat(ID_META.numberLocale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(Date.UTC(Math.floor(t / 12), t % 12, 1)),
    );
  },
  spell: (months) => {
    const y = Math.floor(months / 12);
    const r = months % 12;
    return [y ? `${y} tahun` : "", r ? `${r} bulan` : ""].filter(Boolean).join(" ") || "0 bulan";
  },
  debtName: (n) => `Utang ${n}`,
  errEmpty: "Masukkan minimal satu utang yang masih punya sisa pokok.",
  errMin: (name, first) =>
    `${name}: cicilan minimum per bulan tidak lebih besar dari bunga bulan pertama sebesar ${first}, jadi sisa utang tidak pernah berkurang. Masukkan angka yang lebih besar.`,
  errLong: "Utang ini tidak lunas dalam 50 tahun (600 bulan). Naikkan pembayaran per bulan.",
  note: (end, months, budget) => `Lunas pada ${end} · ${months} bulan · anggaran bulan pertama ${budget}`,
  vsSame: (monthGap) => `Bunga sama${monthGap ? ` · selisih ${Math.abs(monthGap)} bulan` : ""}`,
  vs: (gap, less, monthGap) =>
    `Avalanche ${less ? "lebih hemat" : "lebih mahal"} ${gap}${monthGap ? ` · ${Math.abs(monthGap)} bulan lebih ${monthGap > 0 ? "cepat" : "lambat"}` : ""}`,
  saved: (amount, months) => `${amount} · ${months} bulan lebih cepat`,
  savedNever: "Tanpa tambahan, tidak lunas dalam 50 tahun",
  noExtra: "Tanpa pembayaran tambahan",
  payoffAt: (end, m) => `${end} (bulan ke-${m})`,
  lineDebt: "Total utang",
  lineBudget: "Anggaran bulan pertama",
  lineEnd: "Lunas pada",
  lineEndValue: (end, spelled) => `${end} (${spelled})`,
  lineInt: "Total bunga",
  title: "Rencana pelunasan utang",
  share: "Rencana pelunasan utang - jupocket.com",
};

const S = pickLang({ ko: KO, en: EN, de: DE, es: ES, "zh-Hant": ZH_HANT, id: ID });

const reportUse = trackCalculatorUse("debt-payoff");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const strategy = $<HTMLSelectElement>("dp-strategy");
const extra = $<HTMLInputElement>("dp-extra");
const growth = $<HTMLInputElement>("dp-growth");
const ROWS = [1, 2, 3, 4, 5];

const now = new Date();
const startYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
const startMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
const when = (m: number) => S.month(startYear, startMonth, m);

const set = (id: string, text: string) => {
  $(id).textContent = text;
};

function readDebts(): Debt[] {
  return ROWS.map((n) => ({
    name: $<HTMLInputElement>(`dp-name-${n}`).value.trim() || S.debtName(n),
    balance: S.read($<HTMLInputElement>(`dp-bal-${n}`).value),
    ratePct: Number($<HTMLInputElement>(`dp-rate-${n}`).value) || 0,
    minPayment: S.read($<HTMLInputElement>(`dp-min-${n}`).value),
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
  const base = { debts, extra: S.read(extra.value), extraGrowthPct: Number(growth.value) || 0 };
  const r = payoffPlan({ ...base, strategy: s });
  const order = $("dp-order");
  const rowsEl = $("dp-rows");
  if (!r.ok) {
    const msg =
      r.reason === "empty"
        ? S.errEmpty
        : r.reason === "min-too-low"
          ? S.errMin(debts[r.index].name, S.money(r.firstInterest))
          : S.errLong;
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
  set("dp-hero", S.spell(r.months));
  set("dp-note", S.note(when(r.months), r.months, S.money(r.startBudget)));
  set("dp-debt", S.money(r.totalDebt));
  set("dp-int", S.money(r.totalInterest));
  set("dp-paid", S.money(r.totalPaid));

  const av = payoffPlan({ ...base, strategy: "avalanche" });
  const sb = payoffPlan({ ...base, strategy: "snowball" });
  if (av.ok && sb.ok) {
    const gap = sb.totalInterest - av.totalInterest;
    const monthGap = sb.months - av.months;
    set("dp-vs", gap === 0 ? S.vsSame(monthGap) : S.vs(S.money(Math.abs(gap)), gap > 0, monthGap));
  } else set("dp-vs", "—");

  if (base.extra > 0) {
    const none = payoffPlan({ ...base, extra: 0, strategy: s });
    set("dp-saved", none.ok ? S.saved(S.money(none.totalInterest - r.totalInterest), none.months - r.months) : S.savedNever);
  } else set("dp-saved", S.noExtra);

  order.replaceChildren(
    ...[...r.debts]
      .sort((a, b) => a.order - b.order)
      .map((d) => {
        const tr = document.createElement("tr");
        cell(tr, String(d.order), true);
        cell(tr, d.name);
        cell(tr, S.payoffAt(when(d.payoffMonth), d.payoffMonth));
        cell(tr, S.money(d.interest));
        return tr;
      }),
  );
  rowsEl.replaceChildren(
    ...r.rows.map((x) => {
      const tr = document.createElement("tr");
      cell(tr, when(x.month), true);
      cell(tr, S.money(x.payment));
      cell(tr, S.money(x.principal));
      cell(tr, S.money(x.interest));
      cell(tr, S.money(x.balance));
      return tr;
    }),
  );
  lastLines = [
    [S.lineDebt, S.money(r.totalDebt)],
    [S.lineBudget, S.money(r.startBudget)],
    [S.lineEnd, S.lineEndValue(when(r.months), S.spell(r.months))],
    [S.lineInt, S.money(r.totalInterest)],
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

const buildCard = () => renderCard({ title: S.title, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  if (!lastLines.length) return;
  track("save_result", { calculator: "debt-payoff" });
  downloadCard(buildCard(), "debt-payoff-result.png");
});
$("btn-share").addEventListener("click", async () => {
  if (!lastLines.length) return;
  track("share_result", { calculator: "debt-payoff" });
  await shareCard(buildCard(), S.share);
});

compute();
