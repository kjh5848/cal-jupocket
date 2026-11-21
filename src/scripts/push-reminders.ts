/**
 * 일정 알림 받기(웹 푸시) — 체크리스트 일정을 api.jupocket.com 에 맡기고, 3일 전·하루 전·당일에 알림을 받는다.
 *
 * - 안드로이드·PC 크롬·엣지·파이어폭스: 바로 된다
 * - 아이폰·아이패드: 홈 화면에 추가한 앱(standalone)에서만 된다(iOS 16.4+). 아니면 설치 안내를 연다
 * - 서버에 가는 것: 브라우저 알림 주소·키, 할 일 key·날짜. 이름·연락처·금액은 보내지 않는다
 */
import { PUSH_API, VAPID_PUBLIC } from "../data/push";

export interface PushItem {
  key: string;
  date: string; // YYYY-MM-DD
}

const FLAG = "jp-push-hug";
const nav = navigator as Navigator & { standalone?: boolean };
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const track = (name: string, p: Record<string, unknown> = {}) => {
  if (typeof window.gtag === "function") window.gtag("event", name, { platform: isIOS ? "ios" : "other", ...p });
};

function keyBytes(b64: string): Uint8Array {
  const s = atob(b64.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64.length + 3) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js");
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${PUSH_API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; count?: number; next?: string | null };
  if (!res.ok || !data.ok) throw new Error(`push ${res.status}`);
  return data;
}

const flagOn = () => {
  try {
    return localStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
};
const setFlag = (on: boolean) => {
  try {
    if (on) localStorage.setItem(FLAG, "1");
    else localStorage.removeItem(FLAG);
  } catch {
    /* 저장이 막혀도 알림은 동작한다 */
  }
};

/**
 * 안내 문구 — 체크리스트 글(합니다체)과 전세 도우미 대화(해요체)가 같이 쓴다. 내용은 같고 말끝만 다르다.
 * 대화 화면에는 "위의 캘린더 파일"이 없으므로 버튼 이름("내 캘린더에 넣기")으로 가리킨다.
 */
const TEXT = {
  formal: {
    on: "알림이 켜져 있습니다. 날짜를 바꿨다면 아래 버튼으로 다시 맞추세요.",
    ios: "아이폰은 홈 화면에 추가한 JU포켓 앱에서만 알림을 받을 수 있습니다. 홈 화면에 추가한 뒤 앱으로 열어 이 버튼을 다시 눌러 주세요.",
    unsupported: "이 브라우저는 알림을 지원하지 않습니다. 위의 캘린더 파일(.ics)로 일정을 넣어 주세요.",
    empty: "날짜를 먼저 모두 넣어 주세요.",
    denied: "알림이 차단되어 있습니다. 브라우저 설정 → 사이트 설정 → 알림에서 jupocket.com 을 허용한 뒤 다시 눌러 주세요.",
    done: (count: number, next?: string | null) => `알림 ${count}건을 맞췄습니다. 첫 알림은 ${next} 오전 9시쯤 옵니다. 확인 알림이 방금 갔을 거예요.`,
    none: "남은 일정이 없어 보낼 알림이 없습니다.",
    error: "알림을 맞추지 못했습니다. 잠시 뒤 다시 눌러 주세요. 계속 안 되면 캘린더 파일(.ics)을 쓰세요.",
    off: "알림을 끄고 저장된 날짜를 지웠습니다.",
  },
  chat: {
    on: "알림이 켜져 있어요. 날짜를 바꿨다면 아래 버튼으로 다시 맞춰 주세요.",
    ios: "아이폰은 홈 화면에 추가한 JU포켓에서만 알림을 받을 수 있어요. 추가한 뒤 그 아이콘으로 열어 이 버튼을 다시 눌러 주세요.",
    unsupported: "이 브라우저에서는 알림을 보낼 수 없어요. 대신 아래 '내 캘린더에 넣기'를 써 주세요.",
    empty: "날짜를 먼저 모두 넣어 주세요.",
    denied: "이 브라우저에서 jupocket.com 알림이 막혀 있어요. 브라우저 설정 → 사이트 설정 → 알림에서 허용한 뒤 다시 눌러 주세요.",
    done: (count: number, next?: string | null) => `알림 ${count}건을 맞췄어요. 첫 알림은 ${next} 오전 9시쯤 와요. 방금 확인 알림을 하나 보냈어요.`,
    none: "남은 일정이 없어 보낼 알림이 없어요.",
    error: "알림을 맞추지 못했어요. 잠시 뒤 다시 눌러 주세요. 계속 안 되면 아래 '내 캘린더에 넣기'를 써 주세요.",
    off: "알림을 껐어요. 서버에 저장된 날짜도 지웠어요.",
  },
};

/** 버튼·안내문·끄기 버튼을 묶는다. items() 는 지금 화면의 일정. voice: 글(formal)·대화(chat) 말투 */
export function setupPush(btn: HTMLButtonElement, msg: HTMLElement, off: HTMLButtonElement, items: () => PushItem[], voice: keyof typeof TEXT = "formal") {
  const T = TEXT[voice];
  const label = btn.textContent ?? "";
  const say = (t: string) => (msg.textContent = t);
  const showOn = (on: boolean) => {
    off.hidden = !on;
    btn.textContent = on ? "바뀐 날짜로 알림 다시 맞추기" : label;
  };

  if (supported && flagOn()) {
    registration()
      .then((r) => r.pushManager.getSubscription())
      .then((s) => {
        if (s) {
          showOn(true);
          say(T.on);
        } else setFlag(false);
      })
      .catch(() => {});
  }

  btn.addEventListener("click", async () => {
    track("push_click");
    if (isIOS && !standalone) {
      say(T.ios);
      const sheet = document.getElementById("install-ios");
      if (sheet) {
        sheet.querySelectorAll<HTMLElement>("[data-guide]").forEach((el) => (el.hidden = el.dataset.guide !== "ios"));
        sheet.hidden = false;
      }
      return;
    }
    if (!supported) {
      say(T.unsupported);
      return;
    }
    const list = items();
    if (!list.length) {
      say(T.empty);
      return;
    }
    btn.disabled = true;
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        say(T.denied);
        track("push_denied");
        return;
      }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) }));
      const r = await post("/push/subscribe", { subscription: sub.toJSON(), items: list, platform: isIOS ? "ios" : /Android/.test(navigator.userAgent) ? "android" : "desktop" });
      setFlag(true);
      showOn(true);
      say(r.count ? T.done(r.count, r.next) : T.none);
      track("push_subscribe", { items: r.count });
    } catch {
      say(T.error);
      track("push_error");
    } finally {
      btn.disabled = false;
    }
  });

  off.addEventListener("click", async () => {
    off.disabled = true;
    try {
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await post("/push/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe();
      }
      setFlag(false);
      showOn(false);
      say(T.off);
      track("push_unsubscribe");
    } finally {
      off.disabled = false;
    }
  });
}
