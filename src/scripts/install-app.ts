/**
 * 홈 화면에 추가(PWA) — components/InstallApp.astro 의 동작.
 * 서비스 워커 등록 · 크롬 설치 창 · 아이폰 안내 · 닫으면 14일 숨김 · 설치 측정(GA4 pwa_install_*).
 */
const bar = document.getElementById("install-app");
const btn = document.getElementById("install-app-btn");
const close = document.getElementById("install-app-x");
const ios = document.getElementById("install-ios");
const iosClose = document.getElementById("install-ios-close");

const KEY = "jp-install-dismissed";
const DAYS = 14;
const standalone =
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const track = (name: string) => {
  if (typeof window.gtag === "function") window.gtag("event", name, { platform: isIOS ? "ios" : "other" });
};

function dismissedRecently(): boolean {
  try {
    const t = Number(localStorage.getItem(KEY) || 0);
    return Date.now() - t < DAYS * 86_400_000;
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
} else if (bar && btn && close) {
  let deferred: (Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }) | null = null;
  // 글 페이지는 첫 화면에 계산기 버튼(CalcCta top)이 먼저 — 이 세션에서 두 번째 페이지부터 막대를 보인다. 홈은 바로
  let views = 1;
  try {
    views = Number(sessionStorage.getItem("jp-views") || 0) + 1;
    sessionStorage.setItem("jp-views", String(views));
  } catch {
    /* 저장이 막혀 있으면 첫 페이지로 본다 */
  }
  const allowedHere = location.pathname === "/" || views >= 2;
  const show = () => {
    if (allowedHere && !dismissedRecently()) {
      bar.hidden = false;
      track("pwa_install_shown");
    }
  };

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // 브라우저 기본 띠 대신 우리 막대로
    deferred = e as typeof deferred;
    show();
  });
  if (isIOS) show();

  btn.addEventListener("click", async () => {
    track("pwa_install_click");
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        track("pwa_install_accepted");
        bar.hidden = true;
      }
      deferred = null;
    } else if (ios) {
      ios.hidden = false;
    }
  });
  close.addEventListener("click", () => {
    bar.hidden = true;
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* 저장이 막혀 있으면 이번에만 숨긴다 */
    }
  });
  window.addEventListener("appinstalled", () => {
    bar.hidden = true;
    track("pwa_installed");
  });
}

iosClose?.addEventListener("click", () => {
  if (ios) ios.hidden = true;
});
ios?.addEventListener("click", (e) => {
  if (e.target === ios) ios.hidden = true;
});
