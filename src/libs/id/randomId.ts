// RFC4122 v4 の UUID 文字列を返す。
// crypto.randomUUID は secure context（https / localhost）でしか使えず、
// OBS ポータブル版の http://absolute/ 配信では undefined になるため、
// そのときは crypto.getRandomValues で同じ形式の UUID を組み立てる。
export const randomId = (): string => {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();

  const b = new Uint8Array(16);
  c.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant RFC4122
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
