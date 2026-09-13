/**
 * 발행된 카드 이미지가 실제로 있는지 확인한다.
 *
 * 갤러리는 "지금 디자인"이 아니라 "실제로 나간 그림"을 보여줘야 하므로
 * public/cards/<slug>/<n>.jpg 가 있는 것만 고른다.
 *
 * 경로를 import.meta.url 로 잡으면 안 된다. 빌드하면 페이지가
 * dist/.prerender/chunks/*.mjs 로 번들되어 import.meta.url 이 소스 위치가
 * 아니게 되고, 소스 기준으로 센 ../ 개수가 통째로 어긋난다. 실제로 세트
 * 페이지(../../../../public/)는 리포 바깥을 가리켜 카드가 한 번도 뜬 적이
 * 없었고, 갤러리(../../../public/)는 우연히 맞아떨어져서 문제가 드러나지
 * 않았다. 우연에 기대지 않도록 두 곳 다 여기를 쓴다.
 *
 * process.cwd() 는 astro dev / astro build 모두 프로젝트 루트다.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

export function cardImagePath(slug: string, n: number): string {
  return join(process.cwd(), "public", "cards", slug, `${n}.jpg`);
}

/** 1..count 중 실제 파일이 있는 번호만. 없으면 빈 배열. */
export function publishedShots(slug: string, count: number): number[] {
  const out: number[] = [];
  for (let n = 1; n <= count; n++) {
    if (existsSync(cardImagePath(slug, n))) out.push(n);
  }
  return out;
}
