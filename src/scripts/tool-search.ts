/**
 * 홈 도구 검색 — #tool-q 입력마다 결과 창(#tool-pop)을 그린다. 설계 3-2·5.
 * 데이터는 페이지에 박힌 #tools-data(JSON, 레지스트리의 필요한 칸만) — 클러스터 전체를 번들에 넣지 않으려고.
 * ↑↓ 고르기 · Enter 열기 · Esc 닫기 · 데스크톱은 '/' 로 바로 입력.
 */
import { searchTools } from "../lib/search";
import type { Tool } from "../data/tools";

type Lite = Pick<Tool, "no" | "href" | "name" | "blurb" | "type" | "keywords" | "status"> & { label: string; color: string };

const input = document.getElementById("tool-q") as HTMLInputElement | null;
const pop = document.getElementById("tool-pop");
const data = document.getElementById("tools-data");
if (input && pop && data) {
  const list = JSON.parse(data.textContent || "[]") as Lite[];
  let hits: { tool: Lite; ranges: [number, number][] }[] = [];
  let sel = 0;

  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const mark = (name: string, ranges: [number, number][]) => {
    if (!ranges.length) return esc(name);
    const [a, b] = ranges[0];
    return esc(name.slice(0, a)) + "<mark>" + esc(name.slice(a, b)) + "</mark>" + esc(name.slice(b));
  };
  const row = (h: (typeof hits)[number], i: number) => {
    const t = h.tool;
    const no = t.no ? `No.${String(t.no).padStart(3, "0")}` : "No.???";
    const sub = t.status === "live" ? `${t.label} · ${t.blurb}` : `${t.label} · 곧 담깁니다`;
    const attrs = t.status === "live" ? `href="${t.href}"` : 'aria-disabled="true"';
    return `<a role="option" id="tool-opt-${i}" class="${t.status === "next" ? "soon" : ""}" ${attrs} aria-selected="${i === sel}" style="--cm:${t.color}"><i class="dot"></i><span class="nm">${mark(t.name, h.ranges)}<small>${esc(sub)}</small></span><span class="no">${no}</span></a>`;
  };

  const close = () => { pop.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); };
  const render = () => {
    const q = input.value;
    if (!q.trim()) return close();
    hits = searchTools(list as unknown as Tool[], q) as unknown as typeof hits;
    sel = 0;
    const live = hits.filter((h) => h.tool.status === "live");
    const next = hits.filter((h) => h.tool.status === "next");
    let html = "";
    if (!hits.length) html = `<p class="empty">아직 없는 도구예요. 곧 담을 목록에 있는지 확인하고 있어요.</p>`;
    if (live.length) html += `<div class="lbl">‘${esc(q.trim())}’ · ${live.length}개</div>` + live.map((h, i) => row(h, i)).join("");
    if (next.length) html += `<div class="lbl">곧 담길 도구</div>` + next.map((h, i) => row(h, live.length + i)).join("");
    if (hits.length) html += `<div class="foot"><span>↑↓ 고르기 · Enter 열기</span><span>Esc 닫기</span></div>`;
    pop.innerHTML = html;
    pop.hidden = false;
    input.setAttribute("aria-expanded", "true");
    paintSel();
  };
  const paintSel = () => {
    pop.querySelectorAll<HTMLElement>("[role=option]").forEach((el, i) => el.setAttribute("aria-selected", String(i === sel)));
    if (hits.length) input.setAttribute("aria-activedescendant", `tool-opt-${sel}`);
  };

  input.addEventListener("input", render);
  input.addEventListener("focus", () => input.value.trim() && render());
  input.addEventListener("keydown", (e) => {
    if (pop.hidden) return;
    if (e.key === "ArrowDown") { sel = Math.min(hits.length - 1, sel + 1); paintSel(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); paintSel(); e.preventDefault(); }
    else if (e.key === "Enter") { const t = hits[sel]?.tool; if (t?.status === "live") location.href = t.href; e.preventDefault(); }
    else if (e.key === "Escape") { close(); }
  });
  document.addEventListener("click", (e) => { if (!(e.target as Element).closest(".hero-find")) close(); });
  document.addEventListener("keydown", (e) => {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    if (e.key === "/" && tag !== "input" && tag !== "textarea" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); input.focus(); }
  });
}
