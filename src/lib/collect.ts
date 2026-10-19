/**
 * 내가 써 본 도구 — 도감 수집(설계 6-1). 그 브라우저의 localStorage('jp-used', 주소 배열)에만.
 * 로그인·서버 저장·알림·연속 방문 압박은 하지 않는다. 저장이 막혀도 화면은 정상(빈 수집).
 */
import { ui, pageLocale } from "../i18n/ui";

export const USED_KEY = "jp-used";

const defaultStore = (): Storage | null => {
  try { return typeof localStorage === "undefined" ? null : localStorage; } catch { return null; }
};

export function usedSet(store: Storage | null = defaultStore()): Set<string> {
  try {
    const v = JSON.parse(store?.getItem(USED_KEY) ?? "[]");
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  } catch { return new Set(); }
}

/** 처음 쓴 도구면 true(그때만 '담겼어요' 알림) */
export function markUsed(href: string, store: Storage | null = defaultStore()): boolean {
  try {
    if (!store) return false;
    const s = usedSet(store);
    if (s.has(href)) return false;
    s.add(href);
    store.setItem(USED_KEY, JSON.stringify([...s]));
    return true;
  } catch { return false; }
}

/** 계산기 페이지에서 처음 쓴 순간 한 번 — 아래쪽에 '주머니에 담겼어요' 알림(움직임 줄이기면 도장 동작 없이) */
export function showCollected(): void {
  if (typeof document === "undefined") return;
  const el = document.createElement("div");
  el.className = "collect-toast";
  el.setAttribute("role", "status");
  const T = ui(pageLocale());
  const stamp = document.createElement("span");
  stamp.className = "stamp";
  stamp.setAttribute("aria-hidden", "true");
  stamp.textContent = T.collectedStamp;
  const msg = document.createElement("span");
  const link = document.createElement("a");
  link.href = T.collectedHref;
  link.textContent = T.collectedLink;
  msg.append(`${T.collected} · `, link);
  el.append(stamp, msg);
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add("on"));
  setTimeout(() => { el.classList.remove("on"); setTimeout(() => el.remove(), 400); }, 3600);
}
