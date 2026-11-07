/*
 * 주포켓 서비스 워커(2026-11-07) — 앱 설치(PWA)와 알림 수신만 한다.
 *
 * 페이지를 저장(캐시)하지 않는다. fetch 를 가로채지 않으므로 배포한 새 글·계산기가 언제나 그대로 보인다
 * (캐시하면 옛 글이 남아 숫자가 틀린 화면을 보여 줄 수 있다 — 세금 사이트에서 가장 비싼 사고).
 *
 * 알림(push)은 발송 서버(Cloudflare Worker + D1 + 예약 작업)를 붙인 뒤에 쓴다. 받는 쪽은 미리 준비해 둔다.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "주포켓", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "주포켓";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
      tag: data.tag,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if (c.url.includes(url) && "focus" in c) return c.focus();
      return self.clients.openWindow(url);
    }),
  );
});
