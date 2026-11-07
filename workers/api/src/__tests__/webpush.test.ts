import { describe, it, expect } from "vitest";
import { encryptPayload, vapidAuth, unb64url, b64url } from "../webpush";

// RFC 8291 부록 A 의 예시값
const A = {
  plaintext: "When I grow up, I want to be a watermelon",
  asPrivate: "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw",
  asPublic: "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8",
  uaPublic: "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
  salt: "DGv6ra1nlYgDCS1FRnbzlw",
  auth: "BTBZMqHH6r4Tts7J_aSIgg",
  body: "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
};

describe("webpush — RFC 8291 aes128gcm", () => {
  it("부록 A 예시와 바이트 단위로 같다", async () => {
    const out = await encryptPayload(A.uaPublic, A.auth, new TextEncoder().encode(A.plaintext), {
      senderPrivate: unb64url(A.asPrivate),
      senderPublic: unb64url(A.asPublic),
      salt: unb64url(A.salt),
    });
    expect(b64url(out)).toBe(A.body);
  });

  it("매번 다른 키·salt 로 암호화한다", async () => {
    const p = new TextEncoder().encode("x");
    const a = await encryptPayload(A.uaPublic, A.auth, p);
    const b = await encryptPayload(A.uaPublic, A.auth, p);
    expect(b64url(a)).not.toBe(b64url(b));
    expect(a.length).toBe(16 + 4 + 1 + 65 + 1 + 1 + 16); // 헤더 + 키 + (본문1 + 구분자1) + 태그16
  });
});

describe("webpush — VAPID", () => {
  it("ES256 JWT 서명이 공개키로 검증된다", async () => {
    const kp = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const pub = b64url(await crypto.subtle.exportKey("raw", kp.publicKey));
    const d = (await crypto.subtle.exportKey("jwk", kp.privateKey)).d!;
    const h = await vapidAuth("https://fcm.googleapis.com/fcm/send/abc", pub, d, "https://jupocket.com", 0);
    const m = h.match(/^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/)!;
    expect(m[4]).toBe(pub);
    const claims = JSON.parse(new TextDecoder().decode(unb64url(m[2])));
    expect(claims).toEqual({ aud: "https://fcm.googleapis.com", exp: 12 * 3600, sub: "https://jupocket.com" });
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, kp.publicKey, unb64url(m[3]), new TextEncoder().encode(`${m[1]}.${m[2]}`));
    expect(ok).toBe(true);
  });
});
