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
  const i = args.findIndex((a) => a === "--file" || a.startsWith("--file="));
  if (i === -1) return { publish, due, file: null, error: null };

  const a = args[i];
  const file = a.startsWith("--file=") ? a.slice("--file=".length) : args[i + 1];
  if (!file || file.startsWith("--")) {
    return {
      publish,
      due,
      file: null,
      error: "--file 뒤에 큐 파일 이름이 필요합니다. 예: --file 002-vat-january-deadline.md",
    };
  }
  return { publish, due, file, error: null };
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
