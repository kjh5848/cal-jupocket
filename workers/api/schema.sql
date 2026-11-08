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

-- AI에게 물어보기(2026-11-08). 횟수 세기 — key 는 날짜를 섞은 IP 해시(IP 원문 없음), 매일 지운다
CREATE TABLE IF NOT EXISTS chat_rate (
  key TEXT NOT NULL,
  day TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (key, day)
);

-- 계산 못 한 질문(범위 밖·값 부족) — 다음 글감. 질문 문장과 날짜·페이지뿐, 누가 물었는지는 없다
CREATE TABLE IF NOT EXISTS chat_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asked_on TEXT NOT NULL,
  page TEXT,
  question TEXT NOT NULL,
  kind TEXT NOT NULL,
  query_json TEXT
);
CREATE INDEX IF NOT EXISTS chat_questions_day ON chat_questions (asked_on);
