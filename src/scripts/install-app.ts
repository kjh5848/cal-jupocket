/**
 * 홈 화면에 추가(PWA) — components/InstallApp.astro 의 동작.
 * 서비스 워커 등록 · 휴대폰 팝업 · 크롬 설치 창 · 아이폰/안드로이드 메뉴/앱 안 브라우저 안내
 * · "나중에" 3일/× 14일 숨김 · 설치 측정(GA4 pwa_install_*).
 */
const pop = document.getElementById("install-app");
const btn = document.getElementById("install-app-btn");
const close = document.getElementById("install-app-x");
const later = document.getElementById("install-app-later");
const ios = document.getElementById("install-ios");
const iosClose = document.getElementById("install-ios-close");

const KEY = "jp-install-dismissed"; // 다시 띄워도 되는 시각(ms)
const standalone =
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const ua = navigator.userAgent;
const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
/** 카카오톡·네이버·인스타 등 앱 안 브라우저 — 홈 화면 추가가 안 된다 */
const inApp = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp|Whale\/.*inapp/i.test(ua);
const isMobile = isIOS || /Android|Mobi/i.test(ua);
const track = (name: string) => {
  if (typeof window.gtag === "function") window.gtag("event", name, { platform: isIOS ? "ios" : inApp ? "inapp" : "other" });
};
const guide = (kind: "ios" | "android" | "inapp") => {
  ios?.querySelectorAll<HTMLElement>("[data-guide]").forEach((el) => (el.hidden = el.dataset.guide !== kind));
  if (ios) ios.hidden = false;
};

function dismissedRecently(): boolean {
  try {
    return Date.now() < Number(localStorage.getItem(KEY) || 0);
  } catch {
    return false;
  }
}

// 서비스 워커 — 페이지를 캐시하지 않는다(public/sw.js). 설치 조건과 알림 수신용
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

if (standalone) {
  track("pwa_open");
} else if (pop && btn && close && isMobile) {
  let deferred: (Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }) | null = null;

  // 글 페이지는 검색에서 막 들어온 첫 화면을 가리지 않는다 — 두 번째 페이지이거나 절반쯤 읽었을 때. 홈은 1.5초 뒤
  let views = 1;
  try {
    views = Number(sessionStorage.getItem("jp-views") || 0) + 1;
    sessionStorage.setItem("jp-views", String(views));
  } catch {
    /* 저장이 막혀 있으면 첫 페이지로 본다 */
  }
  const isHome = location.pathname === "/";
  let ready = false; // 설치 신호를 받았거나, 기다릴 만큼 기다렸다
  let allowed = isHome || views >= 2;
  let shown = false;

  const open = () => {
    if (shown || !ready || !allowed || dismissedRecently()) return;
    shown = true;
    setTimeout(() => {
      pop.hidden = false;
      document.documentElement.style.overflow = "hidden";
      track("pwa_install_shown");
    }, isHome ? 1500 : 0);
  };
  const ready_ = () => {
    ready = true;
    open();
  };
  const hide = (days: number) => {
    pop.hidden = true;
    document.documentElement.style.overflow = "";
    try {
      localStorage.setItem(KEY, String(Date.now() + days * 86_400_000));
    } catch {
      /* 저장이 막혀 있으면 이번에만 숨긴다 */
    }
  };

  if (!allowed) {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if (h > 0 && scrollY / h > 0.5) {
        allowed = true;
        removeEventListener("scroll", onScroll);
        open();
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // 브라우저 기본 띠 대신 우리 팝업으로
    deferred = e as typeof deferred;
    ready_();
  });
  if (isIOS || inApp) ready_();
  else {
    // 삼성 인터넷 등은 설치 신호를 주지 않는다 — 잠깐 기다려도 없으면 팝업을 띄우고 메뉴 안내로 돕는다.
    // 이미 설치한 사람은 크롬이 신호를 안 주므로, 확인할 수 있으면(getInstalledRelatedApps) 건너뛴다
    setTimeout(async () => {
      if (ready) return;
      try {
        const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<unknown[]> };
        if (nav.getInstalledRelatedApps && (await nav.getInstalledRelatedApps()).length) return;
      } catch {
        /* 확인이 안 되면 그냥 띄운다 */
      }
      ready_();
    }, 2500);
  }

  btn.addEventListener("click", async () => {
    track("pwa_install_click");
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        track("pwa_install_accepted");
        hide(3650);
      }
      deferred = null;
    } else {
      guide(inApp ? "inapp" : isIOS ? "ios" : "android");
    }
  });
  close.addEventListener("click", () => {
    track("pwa_install_close");
    hide(14);
  });
  later?.addEventListener("click", () => {
    track("pwa_install_later");
    hide(3);
  });
  pop.addEventListener("click", (e) => {
    if (e.target === pop) hide(3);
  });
  window.addEventListener("appinstalled", () => {
    hide(3650);
    track("pwa_installed");
  });
}

iosClose?.addEventListener("click", () => {
  if (ios) ios.hidden = true;
});
ios?.addEventListener("click", (e) => {
  if (e.target === ios) ios.hidden = true;
});
