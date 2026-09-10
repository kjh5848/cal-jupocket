/**
 * .env 읽기·쓰기 (의존성 없음).
 *
 * 토큰은 60일마다 갱신되고 그때마다 파일에 다시 써야 하므로, 읽기만 하는
 * dotenv로는 부족하다. 기존 줄의 순서와 주석을 보존하면서 값만 바꿔 쓰는
 * 최소 구현을 둔다 — 이 파일에는 네이버 검색광고 키 등 다른 값도 들어
 * 있어서, 건드리지 않은 줄은 반드시 그대로 남아야 한다.
 *
 * .env 는 .gitignore 에 있다 — 절대 커밋되지 않는다.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * 경로는 호출 시점에 정한다 — 모듈 로드 때 고정하면 테스트에서 임시 파일로
 * 갈아끼울 수 없다. 평소에는 저장소 루트의 .env.
 */
export function envPath() {
  return process.env.SOCIAL_ENV_PATH ?? join(ROOT, ".env");
}

/** .env 를 파싱해 평범한 객체로 돌려준다. 없으면 빈 객체. */
export function readEnv() {
  const path = envPath();
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

/**
 * 주어진 키들만 갱신해 .env 에 다시 쓴다. 기존 줄은 제자리에서 값만 바뀌고,
 * 새 키는 파일 끝에 붙는다. 나머지 줄(주석·다른 키)은 그대로 둔다.
 */
export function updateEnv(patch) {
  const path = envPath();
  const raw = existsSync(path) ? readFileSync(path, "utf8") : "";
  // 원래 줄바꿈을 유지한다. 갱신 한 번에 파일 전체를 CRLF에서 LF로 바꿔
  // 버리면, 같은 파일을 읽는 다른 도구가 이유 없이 흔들린다.
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw ? raw.split(/\r?\n/) : [];
  const remaining = new Map(Object.entries(patch));

  const next = lines.map((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (!m || !remaining.has(m[1])) return line;
    const key = m[1];
    const value = remaining.get(key);
    remaining.delete(key);
    return `${key}=${value}`;
  });

  if (remaining.size) {
    if (next.length && next[next.length - 1] !== "") next.push("");
    for (const [key, value] of remaining) next.push(`${key}=${value}`);
    next.push("");
  }

  writeFileSync(path, next.join(eol), "utf8");
}

/** 없으면 즉시 죽는다 — 반쯤 설정된 상태로 API를 때리지 않기 위해. */
export function requireEnv(env, keys) {
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) {
    console.error(`\n✖ .env 에 다음 값이 없습니다: ${missing.join(", ")}`);
    console.error(`  ${envPath()}`);
    console.error(`  .env.example 을 복사해 채우세요.\n`);
    process.exit(1);
  }
}
