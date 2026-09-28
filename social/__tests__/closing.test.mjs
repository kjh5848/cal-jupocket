/**
 * 마무리 한 줄 — 게시할 때 스레드 본문 끝에 붙는다.
 *
 * 왜 테스트가 있나: 이 줄은 큐 파일에 없어서 사람이 눈으로 볼 기회가
 * 드라이런 한 번뿐이다. 그런데 URL 이 섞이면 findBodyLink 가 게시를
 * 멈추고, 스케줄러가 도는 시각에는 아무도 그 로그를 보지 않는다.
 */
import { describe, it, expect } from "vitest";
import {
  CLOSINGS,
  FICTION_MARK,
  closingFor,
  withClosing,
  findBodyLink,
  igPaused,
  IG_PAUSE_REASON,
} from "../parse.mjs";

describe("마무리 문장 자체", () => {
  it("어느 것에도 URL 이 없다 — 있으면 게시가 멈춘다", () => {
    for (const c of CLOSINGS) {
      expect(findBodyLink(c.text), c.key).toBeNull();
    }
    expect(findBodyLink(FICTION_MARK)).toBeNull();
  });

  it('"아래 링크" 가 아니라 "댓글" 이라고 쓴다', () => {
    // 피드에서는 글 아래에 아무것도 보이지 않는다. 그래서 답글 조회가
    // 본문의 1.7% 다. 가리키는 곳의 이름이 틀리면 안 간다.
    for (const c of CLOSINGS) {
      expect(c.text, c.key).toMatch(/댓글/);
      expect(c.text, c.key).not.toMatch(/아래 링크|프로필 링크/);
    }
  });

  it("종류가 서로 다르다 — 같은 줄이 반복되면 그게 기계 티다", () => {
    const keys = CLOSINGS.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    const texts = CLOSINGS.map((c) => c.text);
    expect(new Set(texts).size).toBe(texts.length);
  });
});

describe("고르는 규칙", () => {
  it("글 번호로 돌아간다 — 연속한 글은 서로 다른 마무리를 받는다", () => {
    const meta = { ref: "/guide/x/" };
    const got = [63, 64, 65, 66].map(
      (n) => closingFor(`0${n}-x.md`, meta).key,
    );
    expect(new Set(got).size).toBe(4);
  });

  it("같은 글은 몇 번을 물어도 같은 것을 준다", () => {
    const meta = { ref: "/guide/x/" };
    expect(closingFor("068-a.md", meta).key).toBe(closingFor("068-a.md", meta).key);
  });

  it("ref 가 없으면 붙이지 않는다 — 가리킬 댓글이 없다", () => {
    expect(closingFor("068-a.md", {})).toBeNull();
    expect(closingFor("068-a.md", { ref: "" })).toBeNull();
  });

  it("번호가 없는 파일이면 붙이지 않는다", () => {
    expect(closingFor("draft.md", { ref: "/guide/x/" })).toBeNull();
  });
});

describe("가상 사례 표시", () => {
  const meta = (fiction) => ({ ref: "/guide/x/", fiction });

  it("fiction: true 면 마무리 앞에 한 줄로 합쳐진다", () => {
    const c = closingFor("068-a.md", meta("true"));
    expect(c.fiction).toBe(true);
    expect(c.text.startsWith(FICTION_MARK)).toBe(true);
    // 두 줄로 나가면 6~9줄 중 둘을 상투구에 쓰게 된다.
    expect(c.text.split("\n")).toHaveLength(1);
  });

  it("없으면 표시하지 않는다", () => {
    expect(closingFor("068-a.md", meta(undefined)).text.startsWith(FICTION_MARK)).toBe(false);
  });
});

describe("본문에 붙이기", () => {
  it("빈 줄 하나를 띄우고 끝에 붙인다", () => {
    const c = { key: "save", text: "끝." };
    expect(withClosing("본문\n", c)).toBe("본문\n\n끝.");
  });

  it("마무리가 없으면 본문 그대로다", () => {
    expect(withClosing("본문\n", null)).toBe("본문");
  });
});

describe("인스타 2주 정지", () => {
  it("2026-10-12 0시에 저절로 풀린다", () => {
    expect(igPaused(new Date("2026-10-11T23:59:00"))).toBe(true);
    expect(igPaused(new Date("2026-10-12T00:00:00"))).toBe(false);
  });

  it("왜 멈췄는지가 코드에 남아 있다", () => {
    // 이유가 없으면 재개일에 아무도 이게 뭐였는지 모른다.
    expect(IG_PAUSE_REASON).toBeTruthy();
  });
});
