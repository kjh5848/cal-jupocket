/**
 * AI에게 물어보기 — components/AskAi.astro 의 동작.
 * 서버 답(숫자는 loan.ts 계산 결과)을 그대로 보여 주고, 계산된 값은 아래 계산기 칸에 넣는다.
 * GA4: ask_ai_submit · ask_ai_answer(kind, source) · ask_ai_error · ask_ai_fill
 */
import { PUSH_API } from "../data/push";

interface Res {
  ok: boolean;
  kind?: "calc" | "ask" | "out";
  text?: string;
  lines?: { label: string; value: string }[];
  note?: string;
  query?: { principal?: number; ratePct?: number; months?: number; method?: string; graceMonths?: number };
  source?: string;
  error?: string;
}

const box = document.querySelector<HTMLElement>(".ask-ai");
const form = document.getElementById("ask-ai-form") as HTMLFormElement | null;
const input = document.getElementById("ask-ai-q") as HTMLInputElement | null;
const go = document.getElementById("ask-ai-go") as HTMLButtonElement | null;
const out = document.getElementById("ask-ai-out");
const track = (name: string, p: Record<string, unknown> = {}) => {
  if (typeof window.gtag === "function") window.gtag("event", name, p);
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string) {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

function fill(q: NonNullable<Res["query"]>) {
  const ids = JSON.parse(box?.dataset.ids ?? "{}") as Record<string, string>;
  const set = (id: string, v: string, ev = "input") => {
    const f = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    if (!f) return;
    f.value = v;
    f.dispatchEvent(new Event(ev, { bubbles: true }));
  };
  if (q.principal) set(ids.principal, q.principal.toLocaleString("ko-KR"));
  if (q.months) set(ids.months, String(q.months));
  if (q.ratePct !== undefined) set(ids.rate, String(q.ratePct));
  if (q.method) set(ids.method, q.method, "change");
  set(ids.grace, String(q.method === "bullet" ? 0 : (q.graceMonths ?? 0)));
  document.getElementById(ids.principal)?.closest(".calc-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  track("ask_ai_fill");
}

function show(r: Res) {
  if (!out) return;
  out.replaceChildren();
  out.append(el("p", r.text ?? "답을 만들지 못했습니다."));
  if (r.kind === "calc" && r.lines?.length) {
    const dl = el("dl");
    for (const l of r.lines) dl.append(el("dt", l.label), el("dd", l.value));
    out.append(dl);
    if (r.note) out.append(el("p", r.note, "note"));
    if (r.query) {
      const b = el("button", "계산기에 이 값 넣고 상환표 보기", "ask-ai-fill");
      b.type = "button";
      const q = r.query;
      b.addEventListener("click", () => fill(q));
      out.append(b);
    }
  }
  out.hidden = false;
}

async function ask(q: string) {
  if (!q.trim() || !go || !out) return;
  go.disabled = true;
  out.hidden = false;
  out.replaceChildren(el("p", "계산하는 중…", "note"));
  track("ask_ai_submit");
  try {
    const res = await fetch(`${PUSH_API}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, page: location.pathname }),
    });
    const r = (await res.json().catch(() => ({ ok: false }))) as Res;
    if (res.status === 429) show({ ok: false, text: "오늘 질문을 많이 하셨습니다. 내일 다시 써 주시거나 아래 계산기에 직접 넣어 주세요." });
    else if (!r.ok) throw new Error(String(res.status));
    else {
      show(r);
      track("ask_ai_answer", { kind: r.kind, source: r.source });
    }
  } catch {
    show({ ok: false, text: "지금은 답을 받지 못했습니다. 잠시 뒤 다시 묻거나 아래 계산기에 직접 넣어 주세요." });
    track("ask_ai_error");
  } finally {
    go.disabled = false;
  }
}

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input) ask(input.value);
});
box?.querySelectorAll<HTMLButtonElement>("[data-ex]").forEach((b) =>
  b.addEventListener("click", () => {
    if (input) input.value = b.dataset.ex ?? "";
    ask(b.dataset.ex ?? "");
  }),
);
