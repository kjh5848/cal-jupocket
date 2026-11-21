/**
 * 전세 도우미 사용 집계(2026-11-21) — 관리자 화면(jupocket.com/admin/)이 읽는다.
 *
 * 저장하는 것: 날짜·이벤트 이름·버튼 키별 횟수(chat_stats), 글로 적은 질문 문장(chat_questions).
 * IP·기기 정보·이름은 없다. 사람 수는 날짜와 섞은 IP 해시가 그날 처음 보일 때만 세고 해시는 다음 날 지운다.
 */
export interface StatEvent {
  n: string;
  k: string;
  page: string;
  q?: string;
}

/** 화면에서 온 이벤트를 걸러 낸다 — 이름은 hug_ 로 시작하는 것만, 키는 짧은 영문·숫자만 */
export function cleanEvent(b: Record<string, unknown> | null): StatEvent | null {
  if (!b || typeof b.n !== "string" || !/^hug_[a-z_]{1,30}$/.test(b.n)) return null;
  const k = typeof b.k === "string" && /^[\w.-]{0,40}$/.test(b.k) ? b.k : "";
  const page = typeof b.page === "string" && /^\/[\w\-/]{0,80}$/.test(b.page) ? b.page : "";
  // 질문 문장은 미리 준비한 답으로 답했을 때만 받는다(그 밖의 글 질문은 /api/hug-chat 이 남긴다)
  const q = b.n === "hug_chat_answer" && k && typeof b.q === "string" && b.q.trim() && !b.q.includes("�") ? b.q.trim().slice(0, 500) : undefined;
  return { n: b.n, k, page, ...(q ? { q } : {}) };
}

interface StatRow {
  day: string;
  name: string;
  key: string;
  n: number;
}

/** 날짜별로 접는다 — users(연 사람)·active(무언가 누른 사람)·이벤트별 합계 */
export function foldDays(rows: StatRow[]): { day: string; users: number; active: number; events: Record<string, number> }[] {
  const by = new Map<string, { day: string; users: number; active: number; events: Record<string, number> }>();
  for (const r of rows) {
    const d = by.get(r.day) ?? { day: r.day, users: 0, active: 0, events: {} };
    if (r.name === "users") d.users += r.n;
    else if (r.name === "active") d.active += r.n;
    else d.events[r.name] = (d.events[r.name] ?? 0) + r.n;
    by.set(r.day, d);
  }
  return [...by.values()].sort((a, b) => (a.day < b.day ? 1 : -1));
}

export async function adminStats(env: { DB: D1Database }, today: string) {
  const from = new Date(Date.parse(`${today}T00:00:00Z`) - 59 * 86_400_000).toISOString().slice(0, 10);
  const [stats, questions, subs, kinds, first] = await Promise.all([
    env.DB.prepare("SELECT day, name, key, n FROM chat_stats WHERE day >= ?1").bind(from).all<StatRow>(),
    // 우리가 시험하며 남긴 줄(page 가 eval·test)과 계산기 채팅 질문(kind 가 hug- 가 아닌 것)은 뺀다
    env.DB.prepare("SELECT asked_on, page, kind, question, query_json FROM chat_questions WHERE asked_on >= ?1 AND page NOT IN ('eval', 'test') AND kind LIKE 'hug-%' ORDER BY id DESC LIMIT 300")
      .bind(from)
      .all<{ asked_on: string; page: string; kind: string; question: string; query_json: string }>(),
    env.DB.prepare("SELECT (SELECT COUNT(*) FROM subscriptions) AS subs, (SELECT COUNT(*) FROM reminders WHERE sent_at IS NULL) AS pending").first<{ subs: number; pending: number }>(),
    // 300건 제한과 무관한 kind 별 전체 건수
    env.DB.prepare("SELECT kind, COUNT(*) AS n FROM chat_questions WHERE asked_on >= ?1 AND page NOT IN ('eval', 'test') AND kind LIKE 'hug-%' GROUP BY kind").bind(from).all<{ kind: string; n: number }>(),
    env.DB.prepare("SELECT MIN(day) AS d FROM chat_stats").first<{ d: string | null }>(),
  ]);
  const counts: Record<string, number> = {};
  for (const r of kinds.results) counts[r.kind] = r.n;
  const keys: Record<string, Record<string, number>> = {};
  for (const r of stats.results) {
    if (!r.key || r.name === "users" || r.name === "active") continue;
    (keys[r.name] ??= {})[r.key] = (keys[r.name][r.key] ?? 0) + r.n;
  }
  return { ok: true, today, from, since: first?.d ?? null, counts, days: foldDays(stats.results), keys, questions: questions.results, push: subs ?? { subs: 0, pending: 0 } };
}
