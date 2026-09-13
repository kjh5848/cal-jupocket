# 스케줄러

`post-due.cmd` 는 예약 시각이 된 스레드 글 **하나**를 올린다.
30분마다 돌리면 큐 글의 `at:` 에 맞춰 저절로 벌어진다.

## 등록

```
schtasks /Create /TN "jupocket-threads" /TR "<repo>\scripts\post-due.cmd" ^
  /SC MINUTE /MO 30 /ST 07:00 /F
```

## 확인·중지

```
schtasks /Query  /TN "jupocket-threads" /V /FO LIST
schtasks /Run    /TN "jupocket-threads"      한 번 즉시 실행
schtasks /End    /TN "jupocket-threads"      실행 중인 것 중지
schtasks /Delete /TN "jupocket-threads" /F   등록 해제
```

로그는 `scripts/post-due.log`. 올릴 게 없을 때도 한 줄씩 남으므로
가끔 지워도 된다.

## 알아둘 것

- **PC가 켜져 있어야 한다.** 토큰이 로컬 `.env` 에만 있어서 클라우드로
  못 옮긴다. 꺼져 있던 시간대의 글은 켜진 뒤 다음 실행에서 순서대로 나간다
- 한 번에 **하나만** 올린다. 밀린 게 여러 건이어도 30분 간격으로 하나씩
- 인스타(카드뉴스)는 여기 없다 — 카드 렌더가 수동이라 사람이 돌린다
