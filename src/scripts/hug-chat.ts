/**
 * HUG 전세 상담 — components/HugChat.astro 의 동작.
 * 대화는 이 탭 메모리에만 두고, 보낼 때마다 최근 대화를 서버에 함께 보낸다(서버는 저장하지 않는다).
 * 처음에는 "전세보증을 얼마나 아세요"를 묻고(LEVELS), 고른 수준을 서버에 함께 보내 답의 깊이를 맞춘다.
 * GA4: hug_chat_level(level) · hug_chat_send · hug_chat_answer(kind) · hug_chat_error · hug_chat_reset
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
const levels = document.getElementById("hc-levels");
const reset = document.getElementById("hc-reset");
const greeting = log?.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
let history: Msg[] = [];
let busy = false;
type Level = "new" | "some" | "ready";
let level: Level | null = null;

// 수준을 고르면 바로 보이는 안내(서버를 거치지 않는다 — 숫자 없음)와 그 수준에 맞는 추천 질문
const LEVELS: Record<Level, { reply: string; chips: string[] }> = {
  new: {
    reply: "괜찮아요, 처음부터 쉽게 설명할게요.\n전세보증보험은 계약이 끝났는데 집주인이 보증금을 못 돌려주면, HUG(주택도시보증공사)가 대신 돌려주는 보험이에요. 세입자가 보증료를 내고 직접 가입해요.\n지금 어떤 상황이세요?",
    chips: ["집을 알아보는 중이에요", "계약을 했어요", "이미 살고 있어요", "제가 내야 하는 돈은 뭐예요?"],
  },
  some: {
    reply: "좋아요. 궁금한 것부터 편하게 물어보세요. 어려운 말이 나오면 풀어서 설명할게요.",
    chips: ["가입 조건이 뭐예요?", "보증료는 얼마나 내요?", "빌라도 되나요?", "버팀목 대출은 누가 받아요?"],
  },
  ready: {
    reply: "바로 계산해 볼게요. 아는 만큼만 적어 주세요.\n· 집 종류(아파트·오피스텔·빌라·단독)\n· 수도권인지\n· 보증금\n· 집값(시세나 공시가격)\n· 집에 걸린 대출(근저당, 없으면 없다고)\n가입이 되는지와 보증료를 같이 알려 드려요.",
    chips: ["수도권 빌라, 보증금 2억, 공시가격 1억 8천, 근저당 없어요", "보증료 할인은 누가 받아요?"],
  },
};

function showChips(list: string[]) {
  if (!chips) return;
  chips.replaceChildren(
    ...list.map((q) => {
      const b = el("button", q);
      b.type = "button";
      b.addEventListener("click", () => send(q));
      return b;
    }),
  );
  chips.hidden = false;
}

function pickLevel(l: Level, label: string) {
  if (busy) return;
  level = l;
  if (levels) levels.hidden = true;
  if (reset) reset.hidden = false;
  bubble("user", label);
  bubble("bot", LEVELS[l].reply);
  // 모델이 앞 대화로 알 수 있게 남긴다
  history.push({ role: "user", content: label }, { role: "assistant", content: LEVELS[l].reply });
  showChips(LEVELS[l].chips);
  track("hug_chat_level", { level: l });
}

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
  if (levels) levels.hidden = true;
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
      body: JSON.stringify({ messages: history.slice(-12), page: location.pathname, level }),
    });
    const r = (await res.json().catch(() => ({ ok: false }))) as Res;
    wait.remove();
    if (res.status === 429) {
      botAnswer({ ok: false, text: "오늘은 상담이 많아 AI가 잠시 쉬어요. 내일 오전 9시 뒤에 다시 물어봐 주세요. 가입 여부와 보증료는 HUG 보증 계산기 페이지에서 바로 계산할 수 있어요." });
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
levels?.querySelectorAll<HTMLButtonElement>("[data-level]").forEach((b) => b.addEventListener("click", () => pickLevel(b.dataset.level as Level, b.textContent ?? "")));
reset?.addEventListener("click", () => {
  if (busy || !log) return;
  history = [];
  level = null;
  log.replaceChildren(...(greeting ? [greeting.cloneNode(true)] : []));
  if (chips) chips.hidden = true;
  if (levels) levels.hidden = false;
  reset.hidden = true;
  track("hug_chat_reset");
});
