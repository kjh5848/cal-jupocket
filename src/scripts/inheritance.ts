import { computeInheritance, type Household } from "../lib/inheritance";
import rates from "../rates/inheritance-2026.json";
import { formatWon, formatMan, parseAmount } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("inheritance");

let lastLines: [string, string][] = [];

const $ = (id: string) => document.getElementById(id)!;
const estateInput = $("estate") as HTMLInputElement;
const debtsInput = $("debts") as HTMLInputElement;
const funeralInput = $("funeral") as HTMLInputElement;
const childrenInput = $("children") as HTMLInputElement;
const spouseToggle = $("has-spouse") as HTMLInputElement;
const parentsWrap = $("parents-wrap");
const parentsSelect = $("parents") as HTMLSelectElement;
const spouseShareWrap = $("spouse-share-wrap");
const spouseMeta = $("spouse-meta");
const spouseShareInput = $("spouse-share") as HTMLInputElement;

/** 배우자 법정상속분을 '3/7' 처럼 — 1.5/(n+1.5) = 3/(2n+3) */
const shareText = (coHeirs: number) => (coHeirs <= 0 ? "1 (혼자)" : `3/${2 * coHeirs + 3}`);
/** 소계가 음수로 읽도록 ASCII '-' (calc-ui 가 U+2212 는 버린다) */
const minus = (v: number) => (v > 0 ? `-${formatWon(v)}` : formatWon(0));

const household = (): Household => {
  const children = Math.max(0, Math.floor(Number(childrenInput.value) || 0));
  return {
    estate: parseAmount(estateInput.value),
    debts: parseAmount(debtsInput.value),
    funeral: { direct: parseAmount(funeralInput.value) },
    hasSpouse: spouseToggle.checked,
    spouseShare: parseAmount(spouseShareInput.value),
    children,
    parents: Number(parentsSelect.value) as 0 | 1 | 2,
  };
};

function recompute() {
  const h = household();
  // 배우자가 없으면 배우자 칸은 의미가 없고, 자녀가 있으면 부모는 상속인이 아니다(민법 제1000조).
  spouseShareWrap.hidden = !h.hasSpouse;
  spouseMeta.hidden = !h.hasSpouse;
  parentsWrap.hidden = !(h.hasSpouse && (h.children ?? 0) === 0);

  const r = computeInheritance(h);
  const d = r.deductions;
  const unclear = d.spouseUnclear;

  $("hero-value").textContent = unclear ? "—" : formatWon(r.payable);
  $("stat2-value").textContent = unclear ? "—" : formatWon(r.base);
  $("stat3-value").textContent = !unclear && r.base > 0 ? `${r.ratePercent}%` : "—";
  $("inh-computed").textContent = unclear ? "—" : formatWon(r.computed);
  $("inh-credit").textContent = unclear ? "—" : minus(r.filingCredit);
  $("inh-applied").textContent = unclear ? "—" : formatWon(r.appliedDeduction);
  const coHeirs = (h.children ?? 0) > 0 ? h.children! : h.parents!;
  $("inh-share").textContent = h.hasSpouse ? shareText(coHeirs) : "해당 없음";
  $("inh-limit").textContent = h.hasSpouse ? formatWon(d.spouseLimit) : "해당 없음";
  $("inh-estate").textContent = formatWon(r.estate);
  $("inh-debts").textContent = minus(r.debts);
  $("inh-funeral").textContent = minus(r.funeral);
  $("inh-chosen-label").textContent = d.spouseSole
    ? "기초공제 + 인적공제 (배우자 혼자 — 일괄공제 못 씀, 제21조 ②)"
    : d.chosenLabel === "일괄공제"
      ? `일괄공제 (기초 + 인적 ${formatMan(d.itemized)}보다 큼)`
      : "기초공제 + 인적공제 (일괄공제 5억보다 큼)";
  $("inh-chosen").textContent = formatWon(d.chosen);
  $("stat1-value").textContent = unclear ? "—" : formatWon(d.spouse);

  // 세금이 0이 되는 상속재산 합계 — 공제 합계 + 채무 + 장례비.
  // 배우자가 5억 이상 받으면 공제가 재산 크기(법정상속분 한도)에 따라 움직여 경계를 한 숫자로 말할 수 없다.
  const ceiling = d.total + r.debts + r.funeral;
  const ceilingFixed = !h.hasSpouse || (h.spouseShare ?? 0) < rates.spouse.minimum;
  const note = $("ceiling-note");
  if (unclear) {
    note.textContent =
      `배우자가 ${formatMan(rates.spouse.minimum)} 이상 받는데 법정상속분 한도가 ${formatWon(d.spouseLimit)}이라 ` +
      `최소 ${formatMan(rates.spouse.minimum)} 공제가 적용되는지 법조문만으로 닫히지 않아 금액을 내지 않습니다. 세무서(126)에 확인하세요.`;
  } else if (h.estate <= 0) {
    note.textContent = "";
  } else if (r.payable === 0) {
    const room = ceiling - h.estate;
    note.textContent = !ceilingFixed
      ? "세금이 없습니다."
      : room > 0
        ? `상속재산이 ${formatMan(ceiling)}까지는 세금이 없습니다. ${formatMan(room)} 더 있어도 0원입니다.`
        : `과세표준이 ${formatMan(rates.minimumBase.amount)} 미만이라 세금이 없습니다(제25조 ②).`;
  } else {
    const pct = Math.round(r.effectiveRate * 1000) / 10;
    note.textContent = ceilingFixed
      ? `상속재산 대비 실효세율 ${pct}% · ${formatMan(ceiling)}까지는 0원입니다.`
      : `상속재산 대비 실효세율 ${pct}%입니다.`;
  }

  $("inh-formula").textContent =
    `과세가액 ${formatWon(r.taxable)} = 상속재산 − 채무·공과금 − 장례비. ` +
    `과세표준 = 과세가액 − 상속공제(과세가액까지). ` +
    (h.hasSpouse
      ? `배우자공제 한도 = (상속재산 − 채무·공과금) × 법정상속분 ${shareText(coHeirs)}과 ${formatMan(rates.spouse.cap)} 중 작은 쪽(원 미만 버림, 유증·사전증여는 0으로 봄). `
      : "") +
    `금융재산·동거주택·가업상속 공제와 사전증여 합산은 넣지 않았습니다.`;

  lastLines = [
    ["상속재산", formatWon(h.estate)],
    ["과세가액", formatWon(r.taxable)],
    [d.chosenLabel, formatWon(d.chosen)],
    ["배우자공제", unclear ? "—" : formatWon(d.spouse)],
    ["과세표준", unclear ? "—" : formatWon(r.base)],
    ["산출세액", unclear ? "—" : formatWon(r.computed)],
    ["신고세액공제 3%", unclear ? "—" : `- ${formatWon(r.filingCredit)}`],
    ["낼 세금", unclear ? "—" : formatWon(r.payable)],
  ];
}

function buildCard() {
  return renderCard({ title: "상속세", lines: lastLines, footer: "jupocket.com" });
}

for (const el of [estateInput, debtsInput, funeralInput, spouseShareInput]) {
  el.addEventListener("input", () => {
    reportUse(parseAmount(estateInput.value));
    const v = parseAmount(el.value);
    el.value = v === 0 ? (el === debtsInput ? "0" : "") : v.toLocaleString("ko-KR");
    const end = el.value.length;
    el.setSelectionRange(end, end);
    recompute();
  });
}
childrenInput.addEventListener("input", recompute);
childrenInput.addEventListener("change", recompute);
parentsSelect.addEventListener("change", recompute);
spouseToggle.addEventListener("change", () => {
  track("preset_click", { calculator: "inheritance" });
  recompute();
});

$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "inheritance" });
  downloadCard(buildCard(), "inheritance.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "inheritance" });
  await shareCard(buildCard(), "상속세 계산 결과 - jupocket.com");
});

recompute();
