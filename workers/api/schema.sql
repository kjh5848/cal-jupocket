-- api.jupocket.com 알림 저장소(D1 jupocket-push). 이름·연락처는 없다 — 푸시 주소·키와 할 일 날짜뿐
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,          -- endpoint 의 SHA-256
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  platform TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sub_id TEXT NOT NULL,
  send_on TEXT NOT NULL,        -- 한국 날짜 YYYY-MM-DD
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT NOT NULL,
  tag TEXT NOT NULL,
  sent_at TEXT
);

CREATE INDEX IF NOT EXISTS reminders_due ON reminders (send_on, sent_at);
CREATE INDEX IF NOT EXISTS reminders_sub ON reminders (sub_id);
