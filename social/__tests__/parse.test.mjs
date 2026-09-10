/**
 * 큐 파서 테스트 + 실제 큐 파일 검사.
 *
 * 두 번째 묶음이 핵심이다 — 게시 스크립트를 돌리기 전에, 지금 큐에 들어
 * 있는 글이 Threads 제약(500자·본문 필수·링크와 이미지 동시 사용 불가)을
 * 어기지 않는지 CI에서 미리 걸러낸다.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  parsePost,
  resolveImage,
  resolveLink,
  textLength,
  TEXT_HARD,
  parseArgs,
  SITE,
} from "../parse.mjs";

describe("parsePost", () => {
  it("frontmatter와 본문을 분리한다", () => {
    const { meta, text } = parsePost("---\nlink: https://a.com/\n---\n본문입니다.");
    expect(meta.link).toBe("https://a.com/");
    expect(text).toBe("본문입니다.");
  });

  it("frontmatter가 없으면 전체가 본문", () => {
    const { meta, text } = parsePost("그냥 본문");
    expect(meta).toEqual({});
    expect(text).toBe("그냥 본문");
  });

  it("CRLF 줄바꿈도 처리한다", () => {
    const { meta, text } = parsePost("---\r\nimage: /a.webp\r\n---\r\n본문");
    expect(meta.image).toBe("/a.webp");
    expect(text).toBe("본문");
  });

  it("값의 따옴표를 벗긴다", () => {
    const { meta } = parsePost('---\nlink: "https://a.com/"\n---\n본문');
    expect(meta.link).toBe("https://a.com/");
  });

  it("여러 줄 본문의 내부 줄바꿈은 보존한다", () => {
    const { text } = parsePost("---\nlink: x\n---\n첫 줄\n\n셋째 줄\n");
    expect(text).toBe("첫 줄\n\n셋째 줄");
  });
});

describe("resolveImage", () => {
  it("상대경로에 사이트 주소를 붙인다", () => {
    expect(resolveImage("/photos/a.webp")).toBe(`${SITE}/photos/a.webp`);
  });

  it("슬래시가 없어도 붙인다", () => {
    expect(resolveImage("photos/a.webp")).toBe(`${SITE}/photos/a.webp`);
  });

  it("절대 URL은 그대로 둔다", () => {
    expect(resolveImage("https://x.com/a.png")).toBe("https://x.com/a.png");
  });

  it("없으면 null", () => {
    expect(resolveImage(undefined)).toBeNull();
  });
});

describe("resolveLink", () => {
  it("이미지가 없을 때만 링크를 쓴다", () => {
    expect(resolveLink({ link: "https://a.com/" })).toBe("https://a.com/");
  });

  it("이미지가 있으면 링크를 버린다 (API가 동시 사용을 거절한다)", () => {
    expect(resolveLink({ link: "https://a.com/", image: "/a.webp" })).toBeNull();
  });
});

describe("textLength", () => {
  it("한글을 1자로 센다", () => {
    expect(textLength("가나다")).toBe(3);
  });

  it("이모지를 서러게이트 쌍으로 두 번 세지 않는다", () => {
    expect(textLength("🙂")).toBe(1);
  });
});

describe("실제 큐 파일", () => {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "queue");
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));

  it("큐가 비어 있지 않다", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s — 본문이 있고 %i자 이내다", (file) => {
    const { text } = parsePost(readFileSync(join(dir, file), "utf8"));
    expect(text.length).toBeGreaterThan(0);
    expect(textLength(text)).toBeLessThanOrEqual(TEXT_HARD);
  });

  it.each(files)("%s — link와 image를 동시에 쓰지 않는다", (file) => {
    const { meta } = parsePost(readFileSync(join(dir, file), "utf8"));
    expect(Boolean(meta.link && meta.image)).toBe(false);
  });
});

describe("parseArgs", () => {
  it("--publish 를 읽는다", () => {
    expect(parseArgs(["--publish"]).publish).toBe(true);
    expect(parseArgs([]).publish).toBe(false);
  });

  it("--file 값을 읽는다", () => {
    expect(parseArgs(["--file", "002.md"]).file).toBe("002.md");
  });

  it("--file=값 형태도 받는다", () => {
    expect(parseArgs(["--file=002.md"]).file).toBe("002.md");
  });

  // 아래 두 경우가 예전엔 조용히 "큐의 첫 글"로 넘어갔다.
  // --publish 와 같이 쓰면 의도하지 않은 글이 실제 계정에 올라간다.
  it("--file 이 마지막이면 오류 (첫 글로 넘어가지 않는다)", () => {
    const r = parseArgs(["--file"]);
    expect(r.file).toBeNull();
    expect(r.error).toMatch(/큐 파일 이름/);
  });

  it("--file 다음이 또 다른 플래그면 오류", () => {
    const r = parseArgs(["--file", "--publish"]);
    expect(r.file).toBeNull();
    expect(r.error).toMatch(/큐 파일 이름/);
  });

  it("--file 없으면 file 은 null 이고 오류도 없다", () => {
    expect(parseArgs(["--publish"])).toEqual({
      publish: true,
      file: null,
      error: null,
    });
  });
});
