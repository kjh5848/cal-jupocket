/**
 * .env 왕복 테스트.
 *
 * 토큰 갱신은 60일마다 이 파일을 다시 쓴다. 여기서 다른 줄(네이버 검색광고
 * 키 등)을 날려먹으면 조용히 다른 도구가 망가지므로, "건드리지 않은 줄은
 * 그대로"를 못박아 둔다.
 *
 * 실제 .env 를 건드리지 않도록 SOCIAL_ENV_PATH 로 임시 파일을 가리킨다.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as envModule from "../env.mjs";
import { writeFileSync, readFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir;
let path;
let env;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "jupocket-env-"));
  path = join(dir, ".env");
  process.env.SOCIAL_ENV_PATH = path;
  // envPath()가 호출 시점에 SOCIAL_ENV_PATH를 읽으므로 정적 import로 충분하다.
  env = envModule;
});

afterEach(() => {
  delete process.env.SOCIAL_ENV_PATH;
  rmSync(dir, { recursive: true, force: true });
});

const SAMPLE = [
  "# 주석",
  "NAVER_SEARCHAD_API_KEY=naver-key",
  "",
  "# 두 번째 주석",
  "THREADS_APP_SECRET=app-secret",
  "THREADS_ACCESS_TOKEN=",
  "",
].join("\n");

describe("readEnv", () => {
  it("키·값을 읽고 주석은 무시한다", () => {
    writeFileSync(path, SAMPLE);
    const e = env.readEnv();
    expect(e.NAVER_SEARCHAD_API_KEY).toBe("naver-key");
    expect(e.THREADS_APP_SECRET).toBe("app-secret");
    expect(e.THREADS_ACCESS_TOKEN).toBe("");
  });

  it("파일이 없으면 빈 객체", () => {
    expect(env.readEnv()).toEqual({});
  });

  it("값의 따옴표를 벗긴다", () => {
    writeFileSync(path, 'A="quoted"\n');
    expect(env.readEnv().A).toBe("quoted");
  });
});

describe("updateEnv", () => {
  it("기존 키는 제자리에서 값만 바꾼다", () => {
    writeFileSync(path, SAMPLE);
    env.updateEnv({ THREADS_ACCESS_TOKEN: "new-token" });
    expect(env.readEnv().THREADS_ACCESS_TOKEN).toBe("new-token");
  });

  it("건드리지 않은 키와 주석을 보존한다", () => {
    writeFileSync(path, SAMPLE);
    env.updateEnv({ THREADS_ACCESS_TOKEN: "new-token" });
    const raw = readFileSync(path, "utf8");
    expect(raw).toContain("# 주석");
    expect(raw).toContain("# 두 번째 주석");
    expect(env.readEnv().NAVER_SEARCHAD_API_KEY).toBe("naver-key");
    expect(env.readEnv().THREADS_APP_SECRET).toBe("app-secret");
  });

  it("새 키는 파일 끝에 붙인다", () => {
    writeFileSync(path, SAMPLE);
    env.updateEnv({ THREADS_USER_ID: "999" });
    expect(env.readEnv().THREADS_USER_ID).toBe("999");
    expect(env.readEnv().NAVER_SEARCHAD_API_KEY).toBe("naver-key");
  });

  it("파일이 없어도 새로 만든다", () => {
    env.updateEnv({ THREADS_ACCESS_TOKEN: "t" });
    expect(env.readEnv().THREADS_ACCESS_TOKEN).toBe("t");
  });

  it("연속 갱신해도 키가 중복되지 않는다", () => {
    writeFileSync(path, SAMPLE);
    env.updateEnv({ THREADS_ACCESS_TOKEN: "a" });
    env.updateEnv({ THREADS_ACCESS_TOKEN: "b" });
    env.updateEnv({ THREADS_ACCESS_TOKEN: "c" });
    const hits = readFileSync(path, "utf8").match(/^THREADS_ACCESS_TOKEN=/gm);
    expect(hits).toHaveLength(1);
    expect(env.readEnv().THREADS_ACCESS_TOKEN).toBe("c");
  });
});
