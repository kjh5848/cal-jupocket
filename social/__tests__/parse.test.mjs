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
  resolveImages,
  SITE,
  parseAt,
  isDue,
  findBodyLink,
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
      due: false,
      file: null,
      error: null,
    });
  });
});

describe("frontmatter 목록", () => {
  const withImages = [
    "---",
    "images:",
    "  - /cards/pension-2026/1.jpg",
    "  - /cards/pension-2026/2.jpg",
    "reply: 프로필 링크에서 13번 글",
    "---",
    "본문입니다.",
  ].join("\n");

  it("목록을 배열로 모은다", () => {
    const { meta } = parsePost(withImages);
    expect(meta.images).toEqual([
      "/cards/pension-2026/1.jpg",
      "/cards/pension-2026/2.jpg",
    ]);
  });

  it("목록 다음의 일반 키도 읽는다", () => {
    expect(parsePost(withImages).meta.reply).toBe("프로필 링크에서 13번 글");
  });

  it("본문을 잃지 않는다", () => {
    expect(parsePost(withImages).text).toBe("본문입니다.");
  });

  it("목록이 없으면 images 는 없다", () => {
    expect(parsePost("---\nlink: x\n---\n본문").meta.images).toBeUndefined();
  });
});

describe("resolveImages", () => {
  it("상대경로를 전부 절대 URL로 바꾼다", () => {
    const meta = { images: ["/a.jpg", "b.jpg"] };
    expect(resolveImages(meta)).toEqual([`${SITE}/a.jpg`, `${SITE}/b.jpg`]);
  });

  it("images 가 없으면 빈 배열", () => {
    expect(resolveImages({})).toEqual([]);
  });
});

describe("resolveLink — 이미지가 여러 장일 때", () => {
  it("캐러셀에는 링크 카드를 붙이지 않는다", () => {
    expect(resolveLink({ link: "https://a.com/", images: ["/a.jpg"] })).toBeNull();
  });
});

describe("예약 시각", () => {
  it("HH:MM 을 분으로 바꾼다", () => {
    expect(parseAt("09:00")).toBe(540);
    expect(parseAt("21:30")).toBe(1290);
    expect(parseAt("00:00")).toBe(0);
    expect(parseAt("23:59")).toBe(1439);
  });

  it("형식이 아니면 null — 잘못 적은 시각에 글이 나가면 안 된다", () => {
    for (const bad of ["9:5", "25:00", "12:60", "아침", "", "9시", undefined, null, 900]) {
      expect(parseAt(bad)).toBeNull();
    }
  });

  it("isDue 는 지난 시각에만 참", () => {
    const at10 = new Date(2026, 0, 1, 10, 0);
    expect(isDue("09:00", at10)).toBe(true);
    expect(isDue("10:00", at10)).toBe(true);
    expect(isDue("10:01", at10)).toBe(false);
    expect(isDue("23:00", at10)).toBe(false);
  });

  it("at 이 없으면 --due 가 집어가지 않는다", () => {
    expect(isDue(undefined, new Date())).toBe(false);
    expect(isDue("아무거나", new Date())).toBe(false);
  });
});

describe("--due 플래그", () => {
  it("붙이면 true, 없으면 false", () => {
    expect(parseArgs(["--due", "--publish"]).due).toBe(true);
    expect(parseArgs(["--publish"]).due).toBe(false);
  });
});

describe("예약 유예 창", () => {
  const at = (h, m) => new Date(2026, 0, 1, h, m);

  it("시각 직후에는 올린다", () => {
    expect(isDue("09:00", at(9, 0))).toBe(true);
    expect(isDue("09:00", at(9, 30))).toBe(true);
    expect(isDue("09:00", at(10, 30))).toBe(true);
  });

  it("창을 넘기면 건너뛴다 — 저녁에 아침 글이 몰려 나오면 안 된다", () => {
    expect(isDue("09:00", at(10, 31))).toBe(false);
    expect(isDue("07:30", at(16, 0))).toBe(false);
    expect(isDue("12:30", at(20, 0))).toBe(false);
  });

  it("아직 시각 전이면 당연히 안 올린다", () => {
    expect(isDue("21:00", at(16, 0))).toBe(false);
  });

  it("창 크기는 바꿀 수 있다", () => {
    expect(isDue("09:00", at(12, 0), 30)).toBe(false);
    expect(isDue("09:00", at(12, 0), 24 * 60)).toBe(true);
  });
});

describe("본문 링크 탐지 — 링크는 두 번째 스레드부터", () => {
  it("본문에 링크가 있으면 잡아낸다", () => {
    expect(findBodyLink("자세한 건 jupocket.com 에서")).toBe("jupocket.com");
    expect(findBodyLink("여기 https://jupocket.com/guide/")).toMatch(/^https:/);
    expect(findBodyLink("주소는 www.nts.go.kr 입니다")).toBe("www.nts.go.kr");
  });

  it("날짜·금액·비율을 링크로 오인하지 않는다", () => {
    for (const t of [
      "1월 1일~25일에 신고합니다.",
      "9.5% 입니다. 월 285,000원.",
      "2026.7.1~2027.6.30 적용",
      "기준소득월액 6,590,000원",
      "3.3% 떼고 받는 프리랜서인데",
    ]) {
      expect(findBodyLink(t), t).toBeNull();
    }
  });
});
