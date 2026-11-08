/**
 * HUG 전세 상담 — components/HugChat.astro 의 동작.
 * 대화는 이 탭 메모리에만 두고, 보낼 때마다 최근 대화를 서버에 함께 보낸다(서버는 저장하지 않는다).
 * GA4: hug_chat_send · hug_chat_answer(kind) · hug_chat_error · hug_chat_reset
 */
import { PUSH_API } from "../data/push";

interface Msg {
  role: "user" | "assistant";
  content: string;
}
interface Res {
  ok: boolean;
  text?: string;
  lines?: { label: string; value: string }[];
  sources?: { name: string; url: string }[];
  note?: string;
  error?: string;
}

const log = document.getElementById("hc-log");
const form = document.getElementById("hc-form") as HTMLFormElement | null;
const input = document.getElementById("hc-q") as HTMLTextAreaElement | null;
const go = document.getElementById("hc-go") as HTMLButtonElement | null;
const chips = document.getElementById("hc-chips");
const reset = document.getElementById("hc-reset");
const greeting = log?.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
let history: Msg[] = [];
let busy = false;

const track = (name: string, p: Record<string, unknown> = {}) => {
  if (typeof window.gtag === "function") window.gtag("event", name, p);
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string) {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

function scrollDown() {
  if (log) log.scrollTop = log.scrollHeight;
}

function bubble(who: "user" | "bot", text: string) {
  const b = el("div", undefined, `hc-msg hc-${who}`);
  b.append(el("p", text));
  log?.append(b);
  scrollDown();
  return b;
}

function botAnswer(r: Res) {
  // 모델이 "· 항목"을 한 줄에 이어 쓰면 줄을 나눈다
  const b = bubble("bot", (r.text ?? "답을 만들지 못했어요.").replace(/\s+·\s+/g, "\n· "));
  if (r.lines?.length) {
    const dl = el("dl");
    for (const l of r.lines) dl.append(el("dt", l.label), el("dd", l.value));
    b.append(dl);
  }
  if (r.sources?.length) {
    const s = el("p", undefined, "hc-src");
    s.append(el("span", "출처"));
    for (const x of r.sources) {
      const a = el("a", x.name);
      a.href = x.url;
      a.target = "_blank";
      a.rel = "noopener";
      s.append(a);
    }
    b.append(s);
  }
  if (r.note) b.append(el("p", r.note, "hc-note"));
  scrollDown();
}

async function send(q: string) {
  const text = q.trim().slice(0, 500);
  if (!text || busy || !go) return;
  busy = true;
  go.disabled = true;
  if (chips) chips.hidden = true;
  if (reset) reset.hidden = false;
  bubble("user", text);
  history.push({ role: "user", content: text });
  const wait = bubble("bot", "답을 찾는 중…");
  wait.classList.add("hc-typing");
  track("hug_chat_send", { turn: history.filter((m) => m.role === "user").length });
  try {
    const res = await fetch(`${PUSH_API}/api/hug-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-12), page: location.pathname }),
    });
    const r = (await res.json().catch(() => ({ ok: false }))) as Res;
    wait.remove();
    if (res.status === 429) {
      botAnswer({ ok: false, text: "오늘은 질문이 많아 잠시 쉬어요. 내일 다시 물어봐 주시거나 아래 계산기와 체크리스트를 써 주세요." });
      history.pop();
    } else if (!r.ok) throw new Error(String(res.status));
    else {
      botAnswer(r);
      // 다음 질문의 맥락 — 표·출처 대신 문장과 표 값을 글로 넘긴다
      const linesTxt = r.lines?.map((l) => `${l.label}: ${l.value}`).join("\n");
      history.push({ role: "assistant", content: [r.text ?? "", linesTxt].filter(Boolean).join("\n").slice(0, 500) });
      track("hug_chat_answer", { kind: r.lines ? "check" : r.sources?.length ? "kb" : "fallback" });
    }
  } catch {
    wait.remove();
    history.pop();
    botAnswer({ ok: false, text: "지금은 답을 받지 못했어요. 잠시 뒤 다시 보내 주세요." });
    track("hug_chat_error");
  } finally {
    busy = false;
    go.disabled = false;
  }
}

function grow() {
  if (!input) return;
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
}

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!input) return;
  const q = input.value;
  input.value = "";
  grow();
  send(q);
});
input?.addEventListener("input", grow);
input?.addEventListener("keydown", (e) => {
  // 엔터는 보내기, 쉬프트+엔터는 줄바꿈(한글 조합 중에는 보내지 않는다)
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    form?.requestSubmit();
  }
});
chips?.querySelectorAll<HTMLButtonElement>("[data-q]").forEach((b) => b.addEventListener("click", () => send(b.dataset.q ?? "")));
reset?.addEventListener("click", () => {
  if (busy || !log) return;
  history = [];
  log.replaceChildren(...(greeting ? [greeting.cloneNode(true)] : []));
  if (chips) chips.hidden = false;
  reset.hidden = true;
  track("hug_chat_reset");
});
