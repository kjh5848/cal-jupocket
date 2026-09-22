/**
 * 큐 파일(.md) 파서 + 게시 전 값 정리.
 *
 * 게시 직전에 조용히 틀리면 곤란한 부분(본문이 잘리거나, 링크와 이미지가
 * 동시에 붙거나, 상대경로가 절대 URL로 안 바뀌거나)이라 게시 코드에서
 * 떼어내 테스트로 묶어둔다.
 */

export const SITE = "https://jupocket.com";
/** Threads 문서상 500자. 한글·이모지 계산이 모호해 여유를 두고 경고한다. */
export const TEXT_WARN = 450;
export const TEXT_HARD = 500;

/**
 * 본문 목표 길이. 상한이 아니라 목표라서 막지 않고 알리기만 한다.
 *
 * 48시간 이상 지난 38편을 길이 절반으로 가르면 조회 중앙값이 176 대 58 이다.
 * 주제 안에서만 비교해도 여섯 주제 전부 짧은 쪽이 이겼다(2026-09-22,
 * docs/threads-findings.md 7절). 지금 중앙값이 268자라 목표를 내린다.
 *
 * 덜어낼 것은 사실이 아니라 설명이다 — 조문 번호 반복, 예외의 예외,
 * "~이기 때문입니다" 식 배경. 사실을 빼면 이 사이트의 자산을 버리는 것이다.
 */
export const TEXT_TARGET = 190;
/** 캐러셀은 2장 이상 20장 이하. */
export const CAROUSEL_MIN = 2;
export const CAROUSEL_MAX = 20;

/**
 * frontmatter 는 `key: value` 와 목록 두 가지를 받는다.
 *
 *   images:
 *     - /cards/a.jpg
 *     - /cards/b.jpg
 *
 * 값이 비어 있는 key 뒤에 "- 항목" 줄이 이어지면 목록으로 모은다.
 */
export function parsePost(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, text: raw.trim() };

  const meta = {};
  let listKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && listKey) {
      meta[listKey].push(unquote(item[1]));
      continue;
    }
    const kv = line.match(/^\s*([a-z_]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const value = unquote(kv[2]);
    if (value === "") {
      listKey = kv[1];
      meta[listKey] = [];
    } else {
      listKey = null;
      meta[kv[1]] = value;
    }
  }
  return { meta, text: m[2].trim() };
}

function unquote(s) {
  return s.trim().replace(/^["']|["']$/g, "");
}

/** 상대경로 이미지는 공개 URL로 바꾼다. 이미 절대 URL이면 그대로. */
export function resolveImage(image) {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return SITE + (image.startsWith("/") ? "" : "/") + image;
}

/** 카드 여러 장을 공개 URL 목록으로. 캐러셀 판정에 쓴다. */
export function resolveImages(meta) {
  const list = Array.isArray(meta.images) ? meta.images : [];
  return list.map(resolveImage).filter(Boolean);
}

/**
 * 링크 카드는 텍스트 전용 글에만 붙는다(문서). 이미지가 있으면 link는 버린다 —
 * 둘 다 보내면 API가 거절하므로 여기서 미리 정리한다.
 *
 * 참고: 본문에 링크를 달면 도달이 줄어든다. 링크는 답글(reply)로 빼는 것이
 * 기본이고, link 는 그렇게 하지 않을 때만 쓴다.
 */
export function resolveLink(meta) {
  const hasImage = Boolean(meta.image) || (Array.isArray(meta.images) && meta.images.length > 0);
  return !hasImage && meta.link ? meta.link : null;
}

/**
 * ── 유입 계측 ──────────────────────────────────────────────────
 *
 * 왜 필요한가: 스레드 조회 9,237 에 사이트 세션 25 였다(2026-09-16 측정).
 * 어느 글이 그 25 를 만들었는지는 알 수 없었다. 답글 링크에 표식이 없어서다.
 * 조회수는 어느 글이 읽혔는지만 말하고, 읽은 사람이 왔는지는 말하지 않는다.
 *
 * GA4 는 utm_* 를 기본 채널 분류로 읽는다. medium=social 이면 Organic Social
 * 로 묶이고, campaign 으로 글 단위까지 갈린다.
 */
export function withUtm(url, { source, campaign }) {
  const u = new URL(url);
  u.searchParams.set("utm_source", source);
  u.searchParams.set("utm_medium", "social");
  if (campaign) u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

/** 큐 파일 이름 앞의 일련번호가 캠페인 이름이 된다. 022-vat-….md -> "022" */
export function campaignOf(file) {
  const m = String(file ?? "").match(/^(\d+)-/);
  return m ? m[1] : null;
}

/**
 * 손으로 쓴 답글에서 링크 안내 꼬리를 떼고 문장만 남긴다.
 *
 * 기존 큐 글은 "… 프로필 링크에서 24번 글입니다 → jupocket.com/link/" 를
 * 문자열로 달고 있다. 그 문구는 인스타 때문에 생겼다 — 캡션 URL 이 눌리지
 * 않으니 프로필로 보내야 했다. 스레드는 링크가 눌리는데도 같은 문구를 그대로
 * 썼고, 그래서 독자가 답글 -> 프로필 -> 허브 -> 글로 세 번 건너뛰어야 했다.
 * 꼬리를 떼고 플랫폼마다 다시 붙인다.
 */
export function replySentence(reply) {
  return String(reply ?? "")
    .replace(/\s*프로필 링크에서\s*\d+번 글입니다\s*(?:→[^\r\n]*)?$/u, "")
    .trim();
}

/**
 * 답글을 플랫폼에 맞게 만든다.
 *
 * ref(글 경로)가 없으면 손으로 쓴 답글을 그대로 쓴다 — 계측을 넣는다고
 * 이미 예약된 글이 조용히 달라지면 안 된다.
 */
export function resolveReply(meta, { platform, file }) {
  const sentence = replySentence(meta?.reply);
  if (!sentence) return meta?.reply ?? null;
  if (!meta.ref) return meta.reply;

  const campaign = campaignOf(file);
  if (platform === "threads") {
    // 스레드는 답글 링크가 눌린다. 글로 바로 보낸다.
    return `${sentence} → ${withUtm(SITE + meta.ref, { source: "threads", campaign })}`;
  }
  // 인스타는 캡션 URL 이 눌리지 않는다. 프로필 링크 안내가 여전히 최선이고,
  // 그래서 인스타 쪽은 글 단위 유입을 귀속할 방법이 없다(알려진 한계).
  const no = meta.ref_no ? `${meta.ref_no}번 글입니다` : "찾으실 수 있어요";
  return `${sentence} 프로필 링크에서 ${no} → jupocket.com/link/`;
}

/** 코드포인트 기준 길이. 이모지를 서러게이트 쌍으로 두 번 세지 않기 위해. */
export function textLength(text) {
  return [...text].length;
}

/**
 * 커맨드라인 인자 해석.
 *
 * `--file` 뒤에 값이 없거나(`--file` 이 마지막) `--file=x` 형태로 쓰면
 * 조용히 "큐의 첫 글"로 넘어가 버린다. --publish 와 같이 쓰면 의도하지 않은
 * 글이 실제 계정에 올라간다. 그래서 여기서 명시적으로 걸러낸다.
 */
export function parseArgs(args) {
  const publish = args.includes("--publish");
  const due = args.includes("--due");
  const replyMissing = args.includes("--reply-missing");
  const i = args.findIndex((a) => a === "--file" || a.startsWith("--file="));
  if (i === -1)
    return { publish, due, replyMissing, file: null, error: null };

  const a = args[i];
  const file = a.startsWith("--file=") ? a.slice("--file=".length) : args[i + 1];
  if (!file || file.startsWith("--")) {
    return {
      publish,
      due,
      replyMissing,
      file: null,
      error: "--file 뒤에 큐 파일 이름이 필요합니다. 예: --file 002-vat-january-deadline.md",
    };
  }
  return { publish, due, replyMissing, file, error: null };
}

/**
 * 예약 시각(at: "09:00")을 분으로 바꾼다. 형식이 아니면 null.
 *
 * 하루 안의 시각만 쓴다 — 날짜까지 적게 하면 큐 글마다 날짜를 고쳐야 해서
 * 하루 열 편씩 올리는 흐름에서 금방 어긋난다.
 */
export function parseAt(value) {
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * 본문에 링크가 있는지 본다.
 *
 * Threads 는 본문에 링크가 있으면 도달이 죽는다. 링크는 두 번째 스레드
 * (reply)로만 내보낸다. 사람이 실수로 본문에 붙이는 걸 여기서 막는다 —
 * 한 번 나가면 회수할 수 없고, 왜 조회수가 안 나오는지도 알기 어렵다.
 */
export function findBodyLink(text) {
  if (typeof text !== "string") return null;
  const url = /https?:[/][/]\S+/i;
  const bare = /(?:^|[^a-zA-Z0-9@._-])((?:[a-z0-9-]+\.)+(?:com|co\.kr|kr|net|org|io|me)(?:[/][^\s]*)?)/i;
  const m = text.match(url) ?? text.match(bare);
  return m ? (m[1] ?? m[0]).trim() : null;
}

/** 예약 시각을 놓친 것으로 보는 기준(분). */
export const DUE_GRACE_MIN = 90;

/**
 * 지금이 예약 시각 직후인가.
 *
 * "지났으면 무조건 올린다" 로 만들면 안 된다. 저녁에 처음 돌리는 순간
 * 아침·점심 예약분이 한꺼번에 밀려나와, 시간대를 나눈 이유가 사라진다.
 * PC 가 꺼져 있었을 때도 같은 일이 생긴다.
 *
 * 그래서 유예 창을 둔다. 창을 넘긴 것은 오늘은 건너뛰고, at 이 하루 중
 * 시각이므로 내일 그 시간대에 다시 후보가 된다.
 */
export function isDue(value, now = new Date(), graceMin = DUE_GRACE_MIN) {
  const at = parseAt(value);
  if (at === null) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= at && mins - at <= graceMin;
}
