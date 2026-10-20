/*
 * Service worker — только push-уведомления (20.10.2026, решение операционного
 * директора: push всем, кто включил, даже если подключён бот).
 *
 * Обработчика fetch нет намеренно: страницы и файлы не кэшируем, чтобы после
 * выкладки никто не застревал на старой версии сайта.
 *
 * Сообщение приходит от edge-функции web-push: { title, body, url, tag }.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "WowSpeak", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || undefined,
      data: { url: data.url || "/" },
    }),
  );
});

// Нажали на уведомление — открыть нужную страницу; если сайт уже открыт,
// переключиться на его вкладку, а не плодить новые.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(
    (event.notification.data && event.notification.data.url) || "/",
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if (new URL(c.url).origin === self.location.origin && "focus" in c) {
            if ("navigate" in c && c.url !== url)
              c.navigate(url).catch(() => {});
            return c.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
