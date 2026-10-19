import { toDay, fromDay, label, dday } from "../lib/date-calc";
import { age } from "../lib/age";
import { milestones, nextMilestone } from "../lib/milestone-age";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("milestone-age");

const $ = (id: string) => document.getElementById(id)!;
const birthIn = $("birth") as HTMLInputElement;
const baseIn = $("base") as HTMLInputElement;

/** 이 기기 기준 오늘(지역 날짜) — toISOString 은 한국 0~9시에 하루 밀린다 */
function today(): number {
  const t = new Date();
  return toDay(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`)!;
}

function set(id: string, text: string) {
  $(id).textContent = text;
}

let lastLines: [string, string][] = [];

function clear(msg: string) {
  set("hero-label", msg);
  set("hero-value", "—");
  set("hero-sub", "");
  for (const id of ["v-age", "v-kage", "v-hwangap"]) set(id, "—");
  $("rows").replaceChildren();
  lastLines = [];
}

function compute() {
  const birth = toDay(birthIn.value);
  const base = toDay(baseIn.value);
  if (birth === null) return clear("생년월일을 넣어 주세요");
  if (base === null) return clear("기준일을 넣어 주세요");
  const list = milestones(birth, base);
  const a = age(birth, base);
  if (!list || !a) return clear("생년월일이 기준일보다 뒤입니다");

  const next = nextMilestone(list);
  if (next) {
    set("hero-label", `다가오는 기념 나이 — ${next.name}(${next.hanja})`);
    set("hero-value", dday(next.day, base));
    set("hero-sub", `${label(next.day)} · 만 ${next.n}세가 되는 날`);
  } else {
    const last = list[list.length - 1];
    set("hero-label", "기념 나이를 모두 지났습니다");
    set("hero-value", `${last.name} ${dday(last.day, base)}`);
    set("hero-sub", label(last.day));
  }
  set("v-age", `${a.years}세`);
  set("v-kage", `${a.koreanAge}세`);
  set("v-hwangap", `${list[0].year}년`);

  $("rows").replaceChildren(
    ...list.map((m) => {
      const tr = document.createElement("tr");
      if (m.daysLeft < 0) tr.className = "ms-past";
      const th = document.createElement("th");
      th.scope = "row";
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = `${m.hanja} · ${m.yearDefined ? `${m.n}돌` : `${m.n}세`}`;
      th.append(`${m.name} `, meta);
      const cells = [label(m.day), dday(m.day, base), m.yearDefined ? `${m.countingYear}년 (같은 해)` : `${m.countingYear}년`];
      tr.append(th, ...cells.map((c) => Object.assign(document.createElement("td"), { textContent: c })));
      return tr;
    }),
  );

  const pick = (k: string) => list.find((m) => m.key === k)!;
  lastLines = [
    ["생년월일", label(birth)],
    ["환갑", label(pick("hwangap").day)],
    ["칠순 (만 70세)", `${label(pick("chilsun").day)}`],
    ["팔순 (만 80세)", `${label(pick("palsun").day)}`],
  ];
}

for (const el of [birthIn, baseIn]) {
  el.addEventListener("input", () => {
    reportUse(1);
    compute();
  });
}

const buildCard = () => renderCard({ title: "환갑·칠순 날짜", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "milestone-age" });
  downloadCard(buildCard(), "milestone-age-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "milestone-age" });
  await shareCard(buildCard(), "환갑·칠순 계산기 - jupocket.com");
});

// 처음 열면 기준일은 오늘
baseIn.value = fromDay(today());
compute();
