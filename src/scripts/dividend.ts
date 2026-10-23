/**
 * 배당금 계산기 — /guide/dividend-calculator/.
 * 계산은 src/lib/dividend.ts dividend() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { dividend, type DividendBasis, type DividendFreq } from "../lib/dividend";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("dividend");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const freq = $<HTMLSelectElement>("dv-freq");
const basis = $<HTMLSelectElement>("dv-basis");
const per = $<HTMLInputElement>("dv-per");
const shares = $<HTMLInputElement>("dv-shares");
const price = $<HTMLInputElement>("dv-price");
const target = $<HTMLInputElement>("dv-target");
const FREQ_NAME: Record<string, string> = { "12": "매달", "4": "분기마다", "2": "반기마다", "1": "1년에 한 번" };
const n = (v: number) => v.toLocaleString("ko-KR");
const dash = "—";

function render() {
  const f = Number(freq.value) as DividendFreq;
  const x = dividend({
    perShare: parseAmount(per.value),
    basis: basis.value as DividendBasis,
    freq: f,
    shares: Math.min(100_000_000, Math.max(0, Math.floor(Number(shares.value) || 0))),
    price: parseAmount(price.value),
    targetMonthly: parseAmount(target.value),
  });

  $("dv-hero").textContent = formatWon(x.monthlyNet);
  $("dv-note").textContent =
    f === 12
      ? `1년 세후 ${formatWon(x.annualNet)} — 매달 ${formatWon(x.perPayment.net)}씩 들어옵니다`
      : `1년 세후 ${formatWon(x.annualNet)} ÷ 12 — 실제로는 ${FREQ_NAME[freq.value]} ${formatWon(x.perPayment.net)}씩 들어옵니다`;
  $("dv-gross").textContent = formatWon(x.annualGross);
  $("dv-itax").textContent = `−${formatWon(x.annualIncomeTax)}`;
  $("dv-ltax").textContent = `−${formatWon(x.annualLocalTax)}`;
  $("dv-tax2").textContent = formatWon(x.annualTax);
  $("dv-net").textContent = formatWon(x.annualNet);
  $("dv-pgross").textContent = formatWon(x.perPayment.gross);
  $("dv-pnet").textContent = formatWon(x.perPayment.net);
  $("dv-value").textContent = x.value > 0 ? formatWon(x.value) : dash;
  $("dv-gy").textContent = x.grossYield === null ? dash : `${(x.grossYield * 100).toFixed(2)}%`;
  $("dv-ny").textContent = x.netYield === null ? dash : `${(x.netYield * 100).toFixed(2)}%`;
  const t = x.target;
  $("dv-need").textContent = t ? `${n(t.shares)}주` : dash;
  $("dv-invest").textContent = t && t.invest !== null ? formatWon(t.invest) : dash;
  $("dv-more").textContent = t ? `${n(t.moreShares)}주` : dash;
  $("dv-moreinv").textContent = t && t.moreInvest !== null ? formatWon(t.moreInvest) : dash;
  $("dv-exempt").hidden = !(x.perPayment.exempt && x.perPayment.gross > 0);
  $("dv-threshold").hidden = !(x.overThreshold || (t?.overThreshold ?? false));
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(per.value) * (Number(shares.value) || 0));
}

for (const el of [per, price, target]) {
  el.addEventListener("input", () => {
    const v = parseAmount(el.value);
    el.value = v ? formatAmountInput(v) : el.value.trim() === "" ? "" : "0";
    onUserInput();
  });
}
shares.addEventListener("input", onUserInput);
for (const el of [freq, basis]) el.addEventListener("change", onUserInput);
render();
