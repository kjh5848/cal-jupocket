/**
 * 큐 파일(.md) 파서 — frontmatter + 본문.
 *
 * 게시 직전에 조용히 틀리면 곤란한 부분(본문이 잘리거나, 링크와 이미지가
 * 동시에 붙거나, 상대경로가 절대 URL로 안 바뀌거나)이라 게시 코드에서
 * 떼어내 테스트로 묶어둔다.
 */

export const SITE = "https://jupocket.com";
/** Threads 문서상 500자. 한글·이모지 계산이 모호해 여유를 두고 경고한다. */
export const TEXT_WARN = 450;
export const TEXT_HARD = 500;

/** frontmatter는 `key: value` 한 줄짜리만 받는다. 없으면 전부 본문. */
export function parsePost(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, text: raw.trim() };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^\s*([a-z_]+)\s*:\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return { meta, text: m[2].trim() };
}

/** 상대경로 이미지는 공개 URL로 바꾼다. 이미 절대 URL이면 그대로. */
export function resolveImage(image) {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return SITE + (image.startsWith("/") ? "" : "/") + image;
}

/**
 * 링크 카드는 텍스트 전용 글에만 붙는다(문서). 이미지가 있으면 link는 버린다 —
 * 둘 다 보내면 API가 거절하므로 여기서 미리 정리한다.
 */
export function resolveLink(meta) {
  return !meta.image && meta.link ? meta.link : null;
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
 *
 * 반환 { publish, file, error } — error 가 있으면 호출부가 죽인다.
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
