/**
 * 나라판 루틴이 고칠 수 있는 파일 — 동시에 도는 루틴끼리 같은 파일을 고치지 않게 막는 목록.
 * docs/superpowers/plans/2026-10-20-country-routine.md '내 파일' 과 같다(바꾸면 둘 다).
 *
 * own    : 그 나라만 쓰는 파일 — 언제든 고쳐도 된다
 * shared : 여러 나라가 같이 쓰는 산술 도구 스크립트·lib·테스트 — **main 잠금을 잡은 채로만**(ship --shared)
 * 나머지(i18n·컴포넌트·스타일·조사표·package·social·.claude)는 나라 루틴이 고치지 않는다 — 사람이 기초를 고친다.
 * kr(한국 루틴)은 저장소 전체를 쓰되 social/*.json·.claude/ 만 막는다.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** src/i18n/locales.ts 에서 나라 코드 → 판(locale) 을 읽는다(TS 라 import 대신 정규식) */
export function localeTable(root) {
  const src = readFileSync(join(root, "src/i18n/locales.ts"), "utf8");
  const out = {};
  for (const m of src.matchAll(/locale:\s*"([^"]+)"[^}]*?code:\s*"([^"]+)"/g)) out[m[2]] = m[1];
  return out;
}

const NEVER = [/^social\/[^/]+\.json$/, /^\.claude\//, /^package(-lock)?\.json$/];

export function classify(code, locale, file) {
  const f = file.split("\\").join("/");
  if (NEVER.some((r) => r.test(f))) return "forbidden";
  if (code === "kr") return "own";
  const own = [
    `src/pages/${locale}/`,
    `src/data/${locale}/`,
    `src/rates/${code}/`,
    `src/lib/${code}/`,
    `src/lib/__tests__/${code}-`,
    `docs/countries/${code}.md`,
    `keywords/${code}-`,
    ...(code === "jp" ? ["keywords/ja-"] : []),
  ];
  if (own.some((p) => f.startsWith(p))) return "own";
  if (/^src\/scripts\/[^/]+\.ts$/.test(f) || /^src\/lib\/[^/]+\.ts$/.test(f) || /^src\/lib\/__tests__\/[^/]+\.test\.ts$/.test(f)) return "shared";
  return "forbidden";
}

/** 바뀐 파일 목록 검사 — shared 는 잠금을 잡았을 때(allowShared)만 통과 */
export function checkPaths(code, locale, files, { allowShared = false } = {}) {
  const bad = [];
  const shared = [];
  for (const f of files) {
    const c = classify(code, locale, f);
    if (c === "forbidden") bad.push(f);
    else if (c === "shared") (allowShared ? shared : bad).push(f);
  }
  return { ok: bad.length === 0, bad, shared };
}
