/**
 * 소셜 계정 한 곳.
 *
 * 핸들이 푸터·홈·카드 갤러리 여러 곳에 나오는데, 흩어 적어두면 계정을
 * 바꿀 때 한 군데가 남는다. 마크가 네 군데 따로 그려져 있던 것과 같은 병이라
 * 처음부터 모아둔다.
 */
export interface SocialAccount {
  id: string;
  label: string;
  handle: string;
  url: string;
  /** 아직 글을 올리지 않은 계정은 홍보하지 않는다. */
  live: boolean;
}

export const HANDLE = "jupocket.money";

export const socials: SocialAccount[] = [
  {
    id: "threads",
    label: "스레드",
    handle: `@${HANDLE}`,
    url: `https://www.threads.com/@${HANDLE}`,
    live: true,
  },
  {
    id: "instagram",
    label: "인스타그램",
    handle: `@${HANDLE}`,
    url: `https://www.instagram.com/${HANDLE}/`,
    live: true,
  },
];

export const liveSocials = socials.filter((s) => s.live);
