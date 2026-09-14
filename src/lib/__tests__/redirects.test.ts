/**
 * public/_redirects 가 살아 있는 주소를 가리는지 본다.
 *
 * 왜 생겼나: cal.jupocket.com 이 apex 로 301 되면서 경로를 그대로 넘기는데,
 * 가이드가 /guide/ 아래로 옮겨진 뒤라 넘어간 자리가 404였다. 구글 색인에
 * 남아 있던 옛 주소 9개가 전부 그리로 흘러들고 있었다.
 *
 * 이 파일을 손으로 늘리다 보면 언젠가 /vat/ 같은 살아 있는 계산기 주소를
 * 리다이렉트로 덮게 된다. 그러면 계산기가 통째로 사라지는데, 빌드도
 * 통과하고 링크 검사도 통과한다 — 여기서만 잡힌다.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = join(process.cwd(), "dist");
const FILE = join(process.cwd(), "public", "_redirects");

interface Rule {
  from: string;
  to: string;
  code: string;
}

function rules(): Rule[] {
  if (!existsSync(FILE)) return [];
  return readFileSync(FILE, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const [from, to, code] = l.split(/\s+/);
      return { from, to, code };
    });
}

/** dist 에 실제 페이지가 있는 경로인가. */
function pageExists(path: string): boolean {
  const clean = path.replace(/^\/|\/$/g, "");
  return existsSync(join(DIST, clean, "index.html"));
}

const list = rules();
const built = existsSync(DIST);

describe.skipIf(list.length === 0)("_redirects", () => {
  it("모든 규칙이 301 이다", () => {
    expect(list.filter((r) => r.code !== "301")).toEqual([]);
  });

  it("출발지가 중복되지 않는다", () => {
    const seen = new Set<string>();
    const dups = list.filter((r) => !seen.add(r.from) || false);
    expect(dups.map((r) => r.from)).toEqual([]);
  });

  it.skipIf(!built)("살아 있는 페이지를 가리지 않는다", () => {
    // 루트에 실제 페이지가 있는데 리다이렉트를 걸면 그 페이지가 사라진다.
    const shadowed = list.filter((r) => pageExists(r.from));
    expect(shadowed.map((r) => r.from)).toEqual([]);
  });

  it.skipIf(!built)("도착지가 실제로 존재한다", () => {
    // 404 로 보내면 리다이렉트를 안 건 것만 못하다 — 구글이 색인에서 뺀다.
    const dead = list.filter((r) => !pageExists(r.to));
    expect(dead.map((r) => r.to)).toEqual([]);
  });

  it.skipIf(!built)("모든 가이드가 옛 주소에서 찾아진다", () => {
    // 가이드가 늘 때마다 _redirects 도 같이 늘어야 한다.
    const guides = readdirSync(join(DIST, "guide")).filter((g) =>
      statSync(join(DIST, "guide", g)).isDirectory(),
    );
    const covered = new Set(list.map((r) => r.to.replace(/^\/|\/$/g, "")));
    const missing = guides.filter((g) => !covered.has(`guide/${g}`));
    expect(missing).toEqual([]);
  });
});
