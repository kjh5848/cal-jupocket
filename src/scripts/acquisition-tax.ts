import type { Cause } from "../lib/acquisition-tax";
import { acquisitionPage } from "../lib/acquisition-total";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("acquisition-tax");
let lastLines: [string, string][] = [];

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const priceInput = $<HTMLInputElement>("price");
const causeSelect = $<HTMLSelectElement>("cause");
const isHouse = $<HTMLInputElement>("is-house");
const smallArea = $<HTMLInputElement>("small-area");
const houses = $<HTMLInputElement>("houses");
const regulated = $<HTMLInputElement>("regulated");
const corporate = $<HTMLInputElement>("corporate");
const houseWrap = $("house-wrap");
const areaWrap = $("area-wrap");
const surWrap = $("sur-wrap");

const heroValue = $("hero-value");
const stat1 = $("stat1-value");
const stat2 = $("stat2-value");
const stat3 = $("stat3-value");
const rural = $("acq-rural");
const eff = $("acq-eff");
const acqNote = $("acq-note");
const note = $("deadline-note");

const btnDownload = $<HTMLButtonElement>("btn-download");
const btnShare = $<HTMLButtonElement>("btn-share");
const btnCopy = $<HTMLButtonElement>("btn-copy");
const copyToast = $("copy-toast");

const pct = (v: number) => `${(v * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
/** 집이 될 수 있는 원인 — 주택이면 85㎡ 비과세가 붙는다 */
const MAYBE_HOUSE = new Set<Cause>(["original", "gift", "inheritanceOther"]);

function recompute() {
  const price = parseAmount(priceInput.value);
  const cause = causeSelect.value as Cause;
  const paidHouse = cause === "housePaid";
  houseWrap.hidden = !MAYBE_HOUSE.has(cause);
  const house = paidHouse || (MAYBE_HOUSE.has(cause) && isHouse.checked);
  areaWrap.hidden = !house;
  surWrap.hidden = !paidHouse;

  const b = acquisitionPage(price, {
    cause,
    house: isHouse.checked,
    smallArea: smallArea.checked,
    houses: Number(houses.value) || 1,
    regulated: regulated.checked,
    corporate: corporate.checked,
  });

  heroValue.textContent = formatWon(b.total);
  stat1.textContent = formatWon(b.acq);
  stat2.textContent = formatWon(b.edu);
  rural.textContent = b.rural === null ? "—" : formatWon(b.rural);
  stat3.textContent = b.times ? `${pct(b.rate)} (중과)` : pct(b.rate);
  eff.textContent = price > 0 ? pct(Math.round((b.total / price) * 10_000) / 10_000) : "—";

  let msg = "";
  if (b.times) {
    const why = corporate.checked
      ? "법인의 주택 취득"
      : `1세대 ${Math.max(1, Math.floor(Number(houses.value) || 1))}주택 · 조정대상지역 ${regulated.checked ? "안" : "밖"}`;
    msg = `${why}이라 4% + 2% × ${b.times} = ${pct(b.rate)} 중과입니다. 일시적 2주택 등 중과 제외에 해당하면 1~3%로 계산하세요. 중과 때 농어촌특별세는 확인하지 않아 합계에서 뺐습니다.`;
  } else if (house && smallArea.checked) {
    msg = "전용 85㎡ 이하 주택이라 농어촌특별세는 비과세입니다(농특세법 제4조 제11호).";
  } else {
    msg = "농어촌특별세는 취득가액의 0.2%(표준세율을 2%로 본 취득세의 10%)입니다.";
  }
  acqNote.textContent = msg;
  note.textContent = `신고·납부 기한은 ${b.deadline}입니다. 고지서가 오지 않으니 직접 신고해야 합니다.`;

  lastLines = [
    ["취득가액", formatWon(price)],
    ["취득 원인", causeSelect.options[causeSelect.selectedIndex].text],
    ["세율", stat3.textContent ?? ""],
    ["취득세", formatWon(b.acq)],
    ["지방교육세", formatWon(b.edu)],
    ["농어촌특별세", rural.textContent ?? ""],
    ["합계", formatWon(b.total)],
  ];
  reportUse();
}

priceInput.addEventListener("input", () => {
  formatAmountInput(priceInput);
  recompute();
});
causeSelect.addEventListener("change", () => {
  recompute();
  track("select_change", { calculator: "acquisition-tax", value: causeSelect.value });
});
for (const el of [isHouse, smallArea, regulated, corporate]) el.addEventListener("change", recompute);
houses.addEventListener("input", recompute);
houses.addEventListener("change", recompute);

const card = () =>
  renderCard({ title: "취득세 예상", hero: heroValue.textContent ?? "", lines: lastLines });

btnDownload.addEventListener("click", () => downloadCard(card(), "취득세.png"));
btnShare.addEventListener("click", () => shareCard(card(), "취득세.png"));
btnCopy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(lastLines.map(([k, v]) => `${k}: ${v}`).join("\n"));
  copyToast.style.display = "";
  setTimeout(() => (copyToast.style.display = "none"), 2000);
});

recompute();
