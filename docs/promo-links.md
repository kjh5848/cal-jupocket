# 홍보 링크 (UTM) — 전세 도우미

2026-11-19 정함. 홍보 링크는 이 표에 있는 것만 쓴다. 같은 채널에 다른 이름을 쓰면 GA4 에서 둘로 갈려 합계가 틀린다.

## 규칙

- `utm_campaign` 은 홍보 대상 하나에 하나: 전세 도우미는 `jeonse-chat`.
- `utm_source` 는 채널 이름, 소문자: `threads` · `youtube` · `instagram` · `naver_blog` · `shorts`(영상 화면 짧은 주소).
- `utm_medium` 은 `social`(게시물·설명란 링크) 또는 `video`(영상 화면에 띄운 주소를 손으로 친 경우).
- `utm_content` 는 같은 채널 안에서 무엇이 데려왔는지 가를 때만: 영상 판(`shorts-v3`), 고정 댓글/설명란(`pinned` / `desc`).
- **사이트 안 링크(홈 카드·링크 허브·글 안 입구)에는 UTM 을 달지 않는다.** 달면 그 방문의 원래 출처가 지워진다.

## 채널별 링크

| 채널 | 어디에 | 링크 |
|---|---|---|
| 스레드 | 답글 | 큐 글에 `ref: /jeonse-chat/` 만 적는다. `social/parse.mjs` 가 `utm_source=threads&utm_medium=social&utm_campaign=<큐 번호>` 를 붙인다 (전세 홍보 글은 랜딩 페이지 `/jeonse-chat/` 로 묶어 본다) |
| 유튜브 쇼츠 | 설명란 | `https://jupocket.com/jeonse-chat/?utm_source=youtube&utm_medium=social&utm_campaign=jeonse-chat&utm_content=desc` |
| 유튜브 쇼츠 | 고정 댓글 | `https://jupocket.com/jeonse-chat/?utm_source=youtube&utm_medium=social&utm_campaign=jeonse-chat&utm_content=pinned` |
| 영상 화면 (쇼츠·릴스 끝 장면) | 화면에 띄우는 주소 | `jupocket.com/jeonse` → `public/_redirects` 가 `utm_source=shorts&utm_medium=video` 를 붙여 보낸다 |
| 인스타그램 | 프로필 링크 | `https://jupocket.com/link/?utm_source=instagram&utm_medium=social&utm_campaign=profile` (링크 허브 맨 위가 전세 도우미) |
| 네이버 블로그 | 글 본문 링크 | `https://jupocket.com/jeonse-chat/?utm_source=naver_blog&utm_medium=social&utm_campaign=jeonse-chat` |

## 보는 법

GA4 → 획득 → 트래픽 획득에서 세션 소스/매체, 캠페인 `jeonse-chat`. 답변이 어디서 났는지는 이벤트 `hug_chat_answer` 의 `kind`(bank / ai)로 가른다. 영상 화면 주소 없이 `jupocket.com/jeonse-chat` 을 쳐서 들어온 사람은 `(direct)` 로 잡힌다 — v2 영상 화면에 이 주소가 있어서 그 몫은 direct 에 섞인다.
