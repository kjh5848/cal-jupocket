/**
 * 알림(웹 푸시) 서버 주소와 공개키 — 서버는 workers/api(api.jupocket.com).
 * 공개키는 공개해도 되는 값이다. 짝이 되는 비공개키는 .env 와 워커 비밀값에만 있다.
 */
export const PUSH_API = "https://api.jupocket.com";
export const VAPID_PUBLIC = "BJxT2bnOGkEJ47wLWgt3garOFdSNX6JjzRnsPmTbLLWlzI9tBnctFLrMHyI5SWGyFRVYDxeaYw50jcN_fOUDwvE";
