/**
 * 노령연금 나이 계산기 — /guide/old-age-pension-age/.
 * 계산은 src/lib/old-age-pension.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { pensionAges, rateAtStart } from "../lib/old-age-pension";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("old-age-pension");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const birth = $<HTMLInputElement>("op-birth");
const age = $<HTMLSelectElement>("op-age");
const pct = (v: number) => `${Number((v * 100).toFixed(1))}%`;

/** 출생연도가 바뀌면 고를 수 있는 나이(조기 최저 ~ 연기 최대)로 선택지를 다시 만든다 */
function syncOptions(a: { startAge: number; earliestAge: number; latestAge: number }) {
  const first = Number(age.options[0]?.value);
  const last = Number(age.options[age.options.length - 1]?.value);
  if (first === a.earliestAge && last === a.latestAge) return;
  const keep = Number(age.value);
  age.innerHTML = "";
  for (let x = a.earliestAge; x <= a.latestAge; x++) age.add(new Option(`${x}세`, String(x)));
  age.value = String(keep >= a.earliestAge && keep <= a.latestAge ? keep : a.startAge);
}

function render() {
  const y = Math.floor(Number(birth.value));
  if (!y || y < 1900) return;
  const a = pensionAges(y);
  syncOptions(a);
  const start = Number(age.value);
  const rate = rateAtStart(y, start);
  $("op-start").textContent = `${a.startAge}세`;
  $("op-early").textContent = `${a.earliestAge}세`;
  $("op-late").textContent = `${a.latestAge}세`;
  if (rate === null) {
    $("op-hero").textContent = "—";
    $("op-note").textContent = `${a.earliestAge}세보다 일찍은 받을 수 없습니다.`;
  } else {
    $("op-hero").textContent = pct(rate);
    $("op-note").textContent =
      start < a.startAge ? `${a.startAge - start}년 앞당긴 조기노령연금입니다(소득 있는 업무에 종사하지 않을 때).`
      : start === a.startAge ? `정상 수급 나이 ${a.startAge}세입니다.`
      : start > a.latestAge ? `연기는 ${a.latestAge}세까지라 그 비율로 계산했습니다.`
      : `${start - a.startAge}년 연기한 연금입니다.`;
  }
}

for (const el of [birth, age]) el.addEventListener("input", () => { render(); reportUse(Number(birth.value)); });
render();
