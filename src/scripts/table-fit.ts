/**
 * 계산기 표를 휴대폰 폭에 맞춘다 (2026-11-07).
 *
 * 계산기 카드 안 표 130개(3~7열)가 휴대폰에서 옆으로 밀어야 보였다. 표가 실제로
 * 넘칠 때만 바꾼다 — 3열처럼 들어가는 표는 그대로 둔다.
 *
 *   행 8개 이하 → 카드: 한 행 = 카드 한 장, 첫 칸이 제목, 나머지는 "머리글  값" 줄
 *   행 9개 이상 → 표 유지, 첫 열 고정(상환표 360회를 카드 360장으로 만들지 않는다)
 *
 * 표는 계산할 때마다 tbody 를 다시 그리므로 바뀔 때마다 다시 붙인다.
 * 모양은 global.css 의 [data-fit] 규칙이 맡는다.
 */
const MAX_CARD_ROWS = 8;
const MOBILE = window.matchMedia("(max-width: 34rem)");

function label(table: HTMLTableElement) {
  const heads = [...table.querySelectorAll("thead th")].map((th) => th.textContent?.trim() ?? "");
  for (const tr of table.tBodies[0]?.rows ?? []) {
    [...tr.cells].forEach((cell, i) => {
      if (heads[i] && cell.getAttribute("data-label") !== heads[i]) cell.setAttribute("data-label", heads[i]);
    });
  }
}

function fit(table: HTMLTableElement) {
  label(table);
  const box = table.closest<HTMLElement>(".table-scroll") ?? table.parentElement!;
  table.removeAttribute("data-fit");
  if (!MOBILE.matches) return;
  if (table.scrollWidth <= box.clientWidth + 1) return; // 들어가면 손대지 않는다
  const rows = table.tBodies[0]?.rows.length ?? 0;
  table.setAttribute("data-fit", rows <= MAX_CARD_ROWS ? "cards" : "sticky");
}

const tables = [...document.querySelectorAll<HTMLTableElement>(".calc-card table")];
const all = () => tables.forEach(fit);

for (const t of tables) {
  const body = t.tBodies[0];
  if (body) new MutationObserver(() => fit(t)).observe(body, { childList: true, subtree: true, characterData: true });
}
MOBILE.addEventListener("change", all);
window.addEventListener("resize", all, { passive: true });
all();
