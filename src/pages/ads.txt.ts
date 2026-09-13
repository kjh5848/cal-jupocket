/**
 * /ads.txt — 애드센스가 "이 사이트의 광고를 누가 파는가"를 확인하는 파일.
 *
 * 없으면 콘솔에 "ads.txt 파일을 찾을 수 없습니다" 가 뜨고, 방치하면
 * 인증되지 않은 재고로 분류돼 수익이 깎인다.
 *
 * public/ 에 정적 파일로 두지 않는 이유: 그러면 퍼블리셔 ID가 코드와
 * 파일 두 군데에 살게 된다. 여기서 만들면 src/data/adsense.ts 한 곳만
 * 고치면 된다.
 */
import type { APIRoute } from "astro";
import { adsTxt } from "../data/adsense";

export const GET: APIRoute = () =>
  new Response(adsTxt(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
