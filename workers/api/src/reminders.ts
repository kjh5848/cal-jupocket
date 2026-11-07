/**
 * 알림 일정 — 브라우저가 보낸 "할 일 key + 날짜"를 알림 행으로 펼친다.
 *
 * 제목은 브라우저가 보낸 글을 쓰지 않고 여기 정해 둔 것만 쓴다(아무 문구나 알림으로 나가지 않게).
 * 제목은 src/lib/hug-jeonse.ts hugSchedule() 의 title 과 같아야 한다 — 테스트가 대조한다.
 */
export const HUG_TITLES: Record<string, string> = {
  "lease-report": "임대차 신고 마감",
  "pre-limit": "HUG 사전한도심사 마감",
  "move-in": "전입신고·확정일자",
  "loan-guarantee": "버팀목 대출·전세안심보증 신청 마감",
  "return-guarantee": "전세반환보증 가입 마감(추산)",
  "renewal-open": "갱신·이사 의사 알리기 시작",
  "renewal-deadline": "갱신거절 통지 마감 — 증빙 보관",
  end: "계약 만료",
  accident: "보증사고 — 이행청구 준비",
};

/** 며칠 전에 보내나 — 3일 전·하루 전·당일 */
export const LEADS = [3, 1, 0] as const;
export const MAX_ITEMS = 20;
const MAX_DAYS_AHEAD = 365 * 3;
const URL_PATH = "/guide/hug-jeonse-checklist/?source=push";

export interface ReminderRow {
  sendOn: string; // YYYY-MM-DD (한국 날짜)
  title: string;
  body: string;
  url: string;
  tag: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const dayNum = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86_400_000;
const dayStr = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10);

/** 지금 한국 날짜(YYYY-MM-DD) */
export function todayKst(now = Date.now()): string {
  return new Date(now + 9 * 3_600_000).toISOString().slice(0, 10);
}

export function addDays(s: string, n: number): string {
  return dayStr(dayNum(s) + n);
}

/** 입력이 틀리면 null(400 으로 돌려보낸다). 이미 지난 알림은 만들지 않는다 */
export function expandReminders(items: unknown, today: string): ReminderRow[] | null {
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) return null;
  const rows: ReminderRow[] = [];
  const t = dayNum(today);
  for (const it of items) {
    if (!it || typeof it !== "object") return null;
    const { key, date } = it as { key?: unknown; date?: unknown };
    if (typeof key !== "string" || typeof date !== "string" || !DATE.test(date)) return null;
    const title = HUG_TITLES[key];
    if (!title) return null;
    const d = dayNum(date);
    if (!Number.isFinite(d) || d - t > MAX_DAYS_AHEAD) return null;
    for (const lead of LEADS) {
      const send = d - lead;
      if (send < t) continue;
      const when = lead === 0 ? "오늘" : lead === 1 ? "내일" : `${lead}일 남음`;
      rows.push({
        sendOn: dayStr(send),
        title: `[전세] ${title} — ${when}`,
        body: `${date} · 체크리스트에서 할 일과 근거를 확인하세요.`,
        url: URL_PATH,
        tag: `${key}-${date}`,
      });
    }
  }
  return rows;
}

/** 브라우저 푸시 서버만 받는다 — 우리 서버가 아무 주소로나 요청을 보내지 않게 */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/];

export function validEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length > 1000) return false;
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && PUSH_HOSTS.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}
