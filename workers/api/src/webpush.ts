/**
 * 웹 푸시 보내기 — 라이브러리 없이 WebCrypto 만 쓴다(Cloudflare Workers·Node 18+ 모두 동작).
 *
 * - 본문 암호화: RFC 8291(aes128gcm). 받는 브라우저의 공개키(p256dh)·auth 로 암호화한다
 * - 보낸 사람 증명: RFC 8292(VAPID). 우리 비공개키로 서명한 JWT 를 Authorization 에 싣는다
 *
 * 테스트(webpush.test.ts)가 RFC 8291 부록 A 의 예시값으로 암호문을 바이트 단위로 대조한다.
 */

const enc = new TextEncoder();

export function b64url(bytes: Uint8Array | ArrayBuffer): string {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of u) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function unb64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

async function hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}

/** 공개키(65바이트, 0x04||x||y)와 비공개 스칼라 d 로 JWK 를 만든다 */
function jwkFrom(publicRaw: Uint8Array, d?: Uint8Array): JsonWebKey {
  const jwk: JsonWebKey = { kty: "EC", crv: "P-256", x: b64url(publicRaw.slice(1, 33)), y: b64url(publicRaw.slice(33, 65)), ext: true };
  if (d) jwk.d = b64url(d);
  return jwk;
}

export interface EncryptOptions {
  /** 테스트용 — 정하지 않으면 매번 새로 만든다 */
  senderPrivate?: Uint8Array;
  senderPublic?: Uint8Array;
  salt?: Uint8Array;
}

/** RFC 8291 aes128gcm 본문(헤더 포함)을 만든다. 레코드 하나, 패딩 없음 */
export async function encryptPayload(p256dh: string, auth: string, plaintext: Uint8Array, opt: EncryptOptions = {}): Promise<Uint8Array> {
  const uaPublic = unb64url(p256dh);
  const authSecret = unb64url(auth);
  if (uaPublic.length !== 65 || authSecret.length !== 16) throw new Error("bad subscription keys");

  let asPrivate: CryptoKey;
  let asPublic: Uint8Array;
  if (opt.senderPrivate && opt.senderPublic) {
    asPublic = opt.senderPublic;
    asPrivate = await crypto.subtle.importKey("jwk", jwkFrom(asPublic, opt.senderPrivate), { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
  } else {
    const kp = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
    asPrivate = kp.privateKey;
    asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  }
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asPrivate, 256));

  // IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info"||0x00||ua_public||as_public, 32)
  const prkKey = await hmac(authSecret, ecdhSecret);
  const ikm = await hmac(prkKey, concat(enc.encode("WebPush: info\0"), uaPublic, asPublic, new Uint8Array([1])));

  const salt = opt.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(enc.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, concat(enc.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);

  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const record = concat(plaintext, new Uint8Array([2])); // 0x02 = 마지막 레코드
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, record));

  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, rs);
  header[20] = asPublic.length;
  return concat(header, asPublic, cipher);
}

/** VAPID JWT(ES256). aud 는 푸시 서버의 origin */
export async function vapidAuth(endpoint: string, vapidPublic: string, vapidPrivateD: string, subject: string, now = Date.now()): Promise<string> {
  const aud = new URL(endpoint).origin;
  const header = b64url(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64url(enc.encode(JSON.stringify({ aud, exp: Math.floor(now / 1000) + 12 * 3600, sub: subject })));
  const unsigned = `${header}.${claims}`;
  const key = await crypto.subtle.importKey("jwk", jwkFrom(unb64url(vapidPublic), unb64url(vapidPrivateD)), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(unsigned));
  return `vapid t=${unsigned}.${b64url(sig)}, k=${vapidPublic}`;
}

export interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface Vapid {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/** 알림 한 건을 보낸다. 반환값은 푸시 서버의 HTTP 상태(404·410 이면 구독이 끝난 것) */
export async function sendPush(sub: PushSubscriptionRow, payload: unknown, vapid: Vapid, ttlSeconds = 86_400): Promise<number> {
  const body = await encryptPayload(sub.p256dh, sub.auth, enc.encode(JSON.stringify(payload)));
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: await vapidAuth(sub.endpoint, vapid.publicKey, vapid.privateKey, vapid.subject),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(ttlSeconds),
      Urgency: "normal",
    },
    body,
  });
  return res.status;
}
