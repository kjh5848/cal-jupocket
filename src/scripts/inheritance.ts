import { computeInheritance, taxFreeCeiling, type Household } from "../lib/inheritance";
import { formatWon, formatMan, parseAmount, formatAmountInput } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("inheritance");

let lastLines: [string, string][] = [];

const estateInput = document.getElementById("estate") as HTMLInputElement;
const spouseToggle = document.getElementById("has-spouse") as HTMLInputElement;
const spouseShareWrap = document.getElementById("spouse-share-wrap")!;
const spouseShareInput = document.getElementById("spouse-share") as HTMLInputElement;
const childrenInput = document.getElementById("children") as HTMLInputElement;

const heroValue = document.getElementById("hero-value")!;
const stat1 = document.getElementById("stat1-value")!;
const stat2 = document.getElementById("stat2-value")!;
const stat3 = document.getElementById("stat3-value")!;
const note = document.getElementById("ceiling-note")!;

const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const copyToast = document.getElementById("copy-toast")!;

const estatePresets =
  document.querySelectorAll<HTMLButtonElement>(".preset-chip[data-estate]");
const childPresets =
  document.querySelectorAll<HTMLButtonElement>(".preset-chip[data-children]");

const household = (): Household => ({
  estate: parseAmount(estateInput.value),
  hasSpouse: spouseToggle.checked,
  spouseShare: parseAmount(spouseShareInput.value),
  children: Math.max(0, Math.floor(parseAmount(childrenInput.value))),
});

function recompute() {
  const h = household();
  // 배우자가 없으면 "실제 상속받은 금액" 칸은 의미가 없다.
  spouseShareWrap.hidden = !h.hasSpouse;

  const r = computeInheritance(h);
  heroValue.textContent = formatWon(r.payable);
  stat1.textContent = formatWon(r.deductions.total);
  stat2.textContent = formatWon(r.base);
  stat3.textContent = r.base > 0 ? `${r.ratePercent}%` : "—";

  const ceiling = taxFreeCeiling(h);
  if (h.estate <= 0) {
    note.textContent = "";
  } else if (r.payable === 0) {
    // "얼마부터 내나" 가 이 주제에서 가장 많이 묻는 질문이다. 세금이 0일 때
    // 그 경계를 알려주는 것이 계산기가 할 수 있는 가장 쓸모 있는 한 줄이다.
    const room = ceiling - h.estate;
    note.textContent =
      room > 0
        ? `공제 합계가 ${formatMan(ceiling)}이라 세금이 없습니다. ${formatMan(room)}까지는 더 받아도 0원입니다.`
        : `공제 합계 ${formatMan(ceiling)}과 같아 세금이 없습니다. 1원이라도 넘으면 과세표준이 생깁니다.`;
  } else {
    const pct = Math.round(r.effectiveRate * 1000) / 10;
    note.textContent =
      `공제 합계 ${formatMan(ceiling)}을 넘은 ${formatWon(r.base)}에 세금이 붙었습니다. ` +
      `상속재산 대비 실효세율 ${pct}%입니다.`;
  }

  lastLines = [
    ["상속재산", formatWon(h.estate)],
    ["공제 합계", formatWon(r.deductions.total)],
    [r.deductions.chosenLabel, formatWon(r.deductions.chosen)],
    ["배우자공제", formatWon(r.deductions.spouse)],
    ["과세표준", formatWon(r.base)],
    ["산출세액", formatWon(r.computed)],
    ["신고세액공제 3%", `- ${formatWon(r.filingCredit)}`],
    ["낼 세금", formatWon(r.payable)],
  ];
}

function buildCard() {
  return renderCard({
    title: "상속세",
    lines: lastLines,
    footer: "jupocket.com",
  });
}

function money(el: HTMLInputElement) {
  el.addEventListener("input", () => {
    reportUse(parseAmount(estateInput.value));
    const v = parseAmount(el.value);
    el.value = v === 0 ? "" : formatAmountInput(v);
    const end = el.value.length;
    el.setSelectionRange(end, end);
    recompute();
  });
}
money(estateInput);
money(spouseShareInput);

childrenInput.addEventListener("input", () => {
  const v = Math.max(0, Math.floor(parseAmount(childrenInput.value)));
  childrenInput.value = v === 0 ? "" : String(v);
  recompute();
});

spouseToggle.addEventListener("change", () => {
  track("preset_click", { calculator: "inheritance" });
  recompute();
});

estatePresets.forEach((btn) => {
  btn.addEventListener("click", () => {
    track("preset_click", { calculator: "inheritance" });
    estateInput.value = formatAmountInput(Number(btn.dataset.estate ?? 0));
    recompute();
  });
});

childPresets.forEach((btn) => {
  btn.addEventListener("click", () => {
    track("preset_click", { calculator: "inheritance" });
    childrenInput.value = String(btn.dataset.children ?? 0);
    recompute();
  });
});

btnDownload.addEventListener("click", () => {
  track("save_result", { calculator: "inheritance" });
  downloadCard(buildCard(), "inheritance.png");
});

btnShare.addEventListener("click", async () => {
  track("share_result", { calculator: "inheritance" });
  await shareCard(buildCard(), "상속세 계산 결과 - jupocket.com");
});

btnCopy.addEventListener("click", async () => {
  track("copy_result", { calculator: "inheritance" });
  const text = lastLines.map(([k, v]) => `${k} ${v}`).join(" / ");
  if (!navigator.clipboard) return;
  await navigator.clipboard.writeText(text);
  copyToast.style.display = "block";
  setTimeout(() => {
    copyToast.style.display = "none";
  }, 1800);
});

recompute();
