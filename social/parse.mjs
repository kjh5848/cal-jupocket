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
  const i = args.findIndex((a) => a === "--file" || a.startsWith("--file="));
  if (i === -1) return { publish, file: null, error: null };

  const a = args[i];
  const file = a.startsWith("--file=") ? a.slice("--file=".length) : args[i + 1];
  if (!file || file.startsWith("--")) {
    return {
      publish,
      file: null,
      error: "--file 뒤에 큐 파일 이름이 필요합니다. 예: --file 002-vat-january-deadline.md",
    };
  }
  return { publish, file, error: null };
}
