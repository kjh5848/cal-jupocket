/**
 * 홈 도구 도감 — 써 본 도구 표시(진행 바·도장)와 분류 걸러 보기(페이지 이동 없음). 설계 3-3·6-1.
 * 수집은 이 브라우저에만(collect.ts). 저장이 막혀 있으면 진행 바를 숨기고 걸러 보기만 동작한다.
 */
import { usedSet } from "../lib/collect";

const grid = document.querySelector<HTMLElement>("#tools .tool-grid");
const bar = document.querySelector<HTMLElement>("[data-dex-progress]");
const types = document.querySelector<HTMLElement>(".dex-types");
if (grid && bar && types) {
  const cards = [...grid.querySelectorAll<HTMLElement>(".tool-card")];
  const live = cards.filter((c) => !c.classList.contains("dex-unseen"));
  const used = usedSet();
  for (const c of live) {
    if (used.has(c.getAttribute("href") || "")) {
      c.classList.add("dex-seen");
      const s = document.createElement("span");
      s.className = "dex-stamp";
      s.setAttribute("aria-label", "써 본 도구");
      s.textContent = "써봄";
      c.prepend(s);
    }
  }
  const paint = (type: string | null) => {
    const pool = type ? live.filter((c) => c.dataset.type === type) : live;
    const n = pool.filter((c) => c.classList.contains("dex-seen")).length;
    const label = type ? types.querySelector<HTMLElement>(`[data-type="${type}"]`)?.dataset.label ?? "" : "";
    const pct = pool.length ? Math.round((n / pool.length) * 100) : 0;
    bar.innerHTML = `${type ? `${label} ` : '<span class="wide">내가 </span>'}써 본 도구 <b>${n} / ${pool.length}</b><span class="bar"><i style="width:${pct}%"></i></span>`;
    bar.hidden = used.size === 0 && !type;
  };
  let cur: string | null = null;
  types.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>("button[data-type]");
    if (!btn) return;
    cur = cur === btn.dataset.type ? null : btn.dataset.type!;
    types.classList.toggle("filtering", cur !== null);
    for (const b of types.querySelectorAll<HTMLButtonElement>("button")) b.setAttribute("aria-pressed", String(b.dataset.type === cur));
    for (const c of cards) c.hidden = cur !== null && c.dataset.type !== cur;
    paint(cur);
  });
  paint(null);
}
