/**
 * 공통 계산기 틀 — 마크업의 data-* 표시를 읽어 입력·결과 표시를 바꾼다(설계 3-6). 계산은 각 계산기 스크립트가 한다.
 * 스크립트가 없어도 원래 입력(드롭다운·숫자칸)과 결과는 그대로 동작한다(점진적 향상).
 *
 * 마크업 계약
 *   input[data-won]                    아래에 '3,600만원' 읽어 주기
 *   input[data-presets='{"set":[..]}'] 자주 넣는 금액 버튼. data-presets-by="<select id>" 면 그 선택 값의 세트
 *   select[data-seg]                   선택지 2~3개 → 버튼
 *   input[type=number][data-step]      − / + (이어진 둘은 나란히)
 *   .stat-row[data-receipt]            영수증 목록. 칩의 data-group="이름" 이 무리의 시작 → 소계 줄
 *   .result-hero[data-bar="a,b|c|d"]   구성 비율 막대(무리는 |, 무리 안 합산), data-bar-labels="이름|이름|이름"
 *   .result-hero[data-dock="<값 id>"]  폰에서 결과가 화면 밖이면 아래 고정 띠
 *   .calc-card[data-two]               900px 이상 입력 왼쪽 · 결과 오른쪽
 */
import { readWon, shares } from "../lib/calc-ui";

const num = (s: string | null | undefined) => Number(String(s ?? "").replace(/[^\d.-]/g, "")) || 0;
const fire = (el: HTMLElement) => { el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); };
const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
};

/** −/+ 를 붙일 단위 — 사람 수·기간·개수. 금액(원)·비율(%)·배기량(cc)은 키보드 입력이 낫다 */
const STEP_UNITS = new Set(["명", "개월", "년", "일", "세", "시간", "년생", "개", "회"]);

/**
 * 표시가 없는 계산기에도 기본 틀을 입힌다 — 원 단위 금액 칸 · 사람 수·기간 칸 · 선택지 2~3개 ·
 * 세부 결과 3개 이상 · 결과 카드. 두 칸 배치·비율 막대·소계·프리셋은 계산기마다 표시를 붙여야 한다.
 * 끄고 싶은 칸은 data-ui="off".
 */
function autoTag(card: HTMLElement) {
  for (const w of card.querySelectorAll<HTMLElement>(".calc-input-wrap")) {
    const input = w.querySelector<HTMLInputElement>("input");
    const unit = w.querySelector(".unit")?.textContent?.trim() ?? "";
    if (!input || input.dataset.ui === "off") continue;
    if (unit === "원" && input.type === "text") input.dataset.won ??= "";
    if (input.type === "number" && STEP_UNITS.has(unit)) input.dataset.step ??= "";
  }
  for (const sel of card.querySelectorAll<HTMLSelectElement>(".calc-input-wrap select")) {
    // 버튼 안에 한 줄로 들어갈 때만(긴 선택지는 드롭다운이 낫다)
    const short = [...sel.options].every((o) => (o.textContent || "").trim().length <= 8);
    if (sel.dataset.ui !== "off" && short && sel.options.length >= 2 && sel.options.length <= 3) sel.dataset.seg ??= "";
  }
  for (const row of card.querySelectorAll<HTMLElement>(".stat-row")) {
    if (row.querySelectorAll(".stat-chip").length >= 3) row.dataset.receipt ??= "";
  }
  const hero = card.querySelector<HTMLElement>(".result-hero");
  const big = hero?.querySelector<HTMLElement>(".big");
  if (hero && big && hero.dataset.dock === undefined) {
    big.id ||= `calc-big-${Math.random().toString(36).slice(2, 7)}`;
    hero.dataset.dock = big.id;
  }
}

function enhance(card: HTMLElement) {
  autoTag(card);
  // 0) 입력칸과 단위를 한 상자로
  for (const w of card.querySelectorAll<HTMLElement>(".calc-input-wrap")) {
    const input = w.querySelector("input");
    const unit = w.querySelector(".unit");
    if (input && unit && !input.parentElement?.classList.contains("ux-field")) {
      const f = h("div", "ux-field");
      input.before(f);
      f.append(input, unit);
    }
  }

  // 1) 금액 읽어 주기
  for (const input of card.querySelectorAll<HTMLInputElement>("input[data-won]")) {
    const say = h("p", "won-read");
    say.setAttribute("aria-live", "polite");
    (input.closest(".ux-field") ?? input).after(say);
    const paint = () => (say.textContent = readWon(num(input.value)));
    // 계산기 스크립트가 값을 직접 바꾸기도 한다(연봉 ↔ 월급 환산) — 카드 안 어떤 입력이든 끝난 뒤 다시 읽는다
    card.addEventListener("input", paint);
    card.addEventListener("change", paint);
    paint();
  }

  // 2) 자주 넣는 금액
  for (const input of card.querySelectorAll<HTMLInputElement>("input[data-presets]")) {
    let sets: Record<string, number[]> = {};
    try { sets = JSON.parse(input.dataset.presets || "{}"); } catch { /* 표시 안 함 */ }
    const by = input.dataset.presetsBy ? (document.getElementById(input.dataset.presetsBy) as HTMLSelectElement | null) : null;
    const box = h("div", "ux-presets");
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "자주 넣는 금액");
    (input.closest(".calc-input-wrap") ?? input).append(box);
    const paint = () => {
      box.replaceChildren(...(sets[by?.value ?? "default"] ?? []).map((v) => {
        const b = h("button", "", readWon(v).replace(/원$/, ""));
        b.type = "button";
        b.addEventListener("click", () => { input.value = v.toLocaleString("ko-KR"); fire(input); });
        return b;
      }));
    };
    by?.addEventListener("change", paint);
    paint();
  }

  // 3) 선택지 버튼
  for (const sel of card.querySelectorAll<HTMLSelectElement>("select[data-seg]")) {
    if (sel.options.length > 3) continue;
    const seg = h("div", "ux-seg");
    seg.setAttribute("role", "group");
    const label = sel.closest(".calc-input-wrap")?.querySelector("label");
    if (label) seg.setAttribute("aria-label", label.textContent || "");
    seg.style.setProperty("--n", String(sel.options.length));
    const btns = [...sel.options].map((o) => {
      const b = h("button", "", o.textContent || "");
      b.type = "button";
      b.addEventListener("click", () => { sel.value = o.value; fire(sel); });
      return b;
    });
    const paint = () => btns.forEach((b, i) => b.setAttribute("aria-pressed", String(sel.selectedIndex === i)));
    sel.addEventListener("change", paint);
    seg.append(...btns);
    sel.hidden = true;
    sel.after(seg);
    paint();
  }

  // 4) − / +
  for (const input of card.querySelectorAll<HTMLInputElement>("input[type=number][data-step]")) {
    const field = input.closest(".ux-field") ?? input.parentElement!;
    field.classList.add("ux-step");
    const step = (d: number) => {
      const min = input.min === "" ? -Infinity : Number(input.min);
      const max = input.max === "" ? Infinity : Number(input.max);
      input.value = String(Math.min(max, Math.max(min, (Number(input.value) || 0) + d * (Number(input.step) || 1))));
      fire(input);
    };
    const minus = h("button", "", "−"); minus.type = "button"; minus.setAttribute("aria-label", "줄이기"); minus.addEventListener("click", () => step(-1));
    const plus = h("button", "", "+"); plus.type = "button"; plus.setAttribute("aria-label", "늘리기"); plus.addEventListener("click", () => step(1));
    field.prepend(minus);
    input.after(plus);
  }
  // 이어진 − / + 칸 둘은 나란히
  const steps = [...card.querySelectorAll<HTMLElement>(".calc-input-wrap")].filter((w) => w.querySelector(".ux-step"));
  for (let i = 0; i + 1 < steps.length; i++) {
    if (steps[i].nextElementSibling === steps[i + 1]) {
      const pair = h("div", "ux-pair");
      steps[i].before(pair);
      pair.append(steps[i], steps[i + 1]);
      i++;
    }
  }

  // 5) 결과 — 영수증 소계 · 비율 막대 · 고정 띠
  const hero = card.querySelector<HTMLElement>(".result-hero");
  const receipt = card.querySelector<HTMLElement>(".stat-row[data-receipt]");
  const subs: { el: HTMLElement; chips: HTMLElement[] }[] = [];
  if (receipt) {
    let cur: { el: HTMLElement; chips: HTMLElement[] } | null = null;
    for (const chip of [...receipt.querySelectorAll<HTMLElement>(".stat-chip")]) {
      if (chip.dataset.group) {
        const el = h("div", "ux-sub");
        el.append(h("span", "", chip.dataset.group), h("b"));
        chip.before(el);
        cur = { el, chips: [] };
        subs.push(cur);
      }
      cur?.chips.push(chip);
    }
  }
  let bar: HTMLElement | null = null;
  let legend: HTMLElement | null = null;
  const groups = (hero?.dataset.bar || "").split("|").filter(Boolean).map((g) => g.split(","));
  const labels = (hero?.dataset.barLabels || "").split("|");
  if (hero && groups.length) {
    bar = h("div", "ux-bar");
    bar.setAttribute("aria-hidden", "true");
    groups.forEach((_, i) => bar!.append(h("i", `p${i}`)));
    legend = h("div", "ux-legend");
    hero.append(bar, legend);
  }
  let dock: HTMLElement | null = null;
  const dockSrc = hero?.dataset.dock ? document.getElementById(hero.dataset.dock) : null;
  if (hero && dockSrc) {
    dock = h("div", "ux-dock");
    const left = h("div");
    left.append(h("small", "", hero.querySelector(".label")?.textContent || "결과"), h("b"));
    const go = h("a", "", "자세히 ↓") as HTMLAnchorElement;
    go.href = "#" + (hero.id || (hero.id = "calc-result"));
    dock.append(left, go);
    document.body.append(dock);
    new IntersectionObserver(([e]) => dock!.classList.toggle("on", !e.isIntersecting && e.boundingClientRect.top > 0)).observe(hero);
  }
  const paintResults = () => {
    for (const s of subs) s.el.querySelector("b")!.textContent = s.chips.reduce((a, c) => a + num(c.querySelector(".value")?.textContent), 0).toLocaleString("ko-KR") + "원";
    if (bar && legend) {
      const vals = groups.map((g) => g.reduce((a, id) => a + num(document.getElementById(id)?.textContent), 0));
      const pct = shares(vals);
      vals.forEach((v, i) => ((bar!.children[i] as HTMLElement).style.flexGrow = String(v)));
      legend.replaceChildren(...pct.map((p, i) => { const s = h("span", `p${i}`, `${labels[i] ?? ""} ${p}%`); return s; }));
    }
    if (dock && dockSrc) dock.querySelector("b")!.textContent = dockSrc.textContent;
  };
  // 결과 값 요소만 지켜본다(카드 전체를 보면 위에서 그리는 소계·막대가 다시 불러 무한 반복)
  if (hero) {
    const watch = [hero.querySelector(".big"), ...card.querySelectorAll(".stat-chip .value"), ...groups.flat().map((id) => document.getElementById(id)), dockSrc];
    const mo = new MutationObserver(paintResults);
    for (const el of new Set(watch)) if (el) mo.observe(el, { subtree: true, childList: true, characterData: true });
  }
  paintResults();

  // 6) 결과 복사 · 처음 값으로 — 새 틀로 옮긴 계산기만(옛 계산기는 자기 버튼이 있다)
  if (hero && card.hasAttribute("data-two")) {
    const actions = h("div", "ux-actions");
    const copy = h("button", "", "결과 복사"); copy.type = "button";
    const reset = h("button", "", "처음 값으로"); reset.type = "button";
    copy.addEventListener("click", async () => {
      const lines = [`${hero.querySelector(".label")?.textContent ?? ""} ${hero.querySelector(".big")?.textContent ?? ""}`];
      for (const c of card.querySelectorAll(".stat-chip")) lines.push(`${c.querySelector(".label")?.textContent ?? ""} ${c.querySelector(".value")?.textContent ?? ""}`);
      lines.push(location.href);
      try { await navigator.clipboard.writeText(lines.join("\n")); copy.textContent = "복사했어요"; } catch { copy.textContent = "복사 안 됨"; }
      setTimeout(() => (copy.textContent = "결과 복사"), 1600);
    });
    reset.addEventListener("click", () => {
      for (const el of card.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select")) {
        if (el instanceof HTMLSelectElement) el.value = [...el.options].find((o) => o.defaultSelected)?.value ?? el.options[0]?.value;
        else if (el.type === "checkbox" || el.type === "radio") el.checked = el.defaultChecked;
        else el.value = el.defaultValue;
        fire(el);
      }
    });
    actions.append(copy, reset);
    (receipt ?? hero).after(actions);
  }

  // 7) 두 칸 배치
  if (card.hasAttribute("data-two") && hero) {
    const results = h("div", "ux-results");
    const inputs = h("div", "ux-inputs");
    const kids = [...card.children] as HTMLElement[];
    const at = kids.indexOf(hero);
    kids.slice(0, at).filter((k) => !k.matches(".meta:first-child")).forEach((k) => inputs.append(k));
    kids.slice(at).forEach((k) => results.append(k));
    card.append(inputs, results);
  }
}

document.querySelectorAll<HTMLElement>(".calc-card").forEach(enhance);
