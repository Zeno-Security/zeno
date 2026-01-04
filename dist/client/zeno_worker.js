/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */

class C {
  v0;
  v1;
  v2;
  v3;
  buf = 0n;
  bufLen = 0;
  totalLen = 0;
  constructor(t) {
    const e = this.readU64LE(t, 0), s = this.readU64LE(t, 8);
    this.v0 = e ^ 0x736f6d6570736575n, this.v1 = s ^ 0x646f72616e646f6dn, this.v2 = e ^ 0x6c7967656e657261n, this.v3 = s ^ 0x7465646279746573n;
  }
  readU64LE(t, e) {
    let s = 0n;
    for (let i = 0; i < 8; i++)
      s |= BigInt(t[e + i]) << BigInt(i * 8);
    return s;
  }
  rotl(t, e) {
    const s = 0xFFFFFFFFFFFFFFFFn;
    return (t << BigInt(e) | t >> BigInt(64 - e)) & s;
  }
  sipRound() {
    const t = 0xFFFFFFFFFFFFFFFFn;
    this.v0 = this.v0 + this.v1 & t, this.v1 = this.rotl(this.v1, 13), this.v1 ^= this.v0, this.v0 = this.rotl(this.v0, 32), this.v2 = this.v2 + this.v3 & t, this.v3 = this.rotl(this.v3, 16), this.v3 ^= this.v2, this.v0 = this.v0 + this.v3 & t, this.v3 = this.rotl(this.v3, 21), this.v3 ^= this.v0, this.v2 = this.v2 + this.v1 & t, this.v1 = this.rotl(this.v1, 17), this.v1 ^= this.v2, this.v2 = this.rotl(this.v2, 32);
  }
  processBlock(t) {
    this.v3 ^= t, this.sipRound(), this.sipRound(), this.v0 ^= t;
  }
  writeU64(t) {
    this.processBlock(t & 0xFFFFFFFFFFFFFFFFn), this.totalLen += 8;
  }
  finish() {
    const t = (BigInt(this.totalLen) & 0xFFn) << 56n;
    return this.v3 ^= t, this.sipRound(), this.sipRound(), this.v0 ^= t, this.v2 ^= 0xFFn, this.sipRound(), this.sipRound(), this.sipRound(), this.sipRound(), this.v0 ^ this.v1 ^ this.v2 ^ this.v3;
  }
}
function X(n, t, e) {
  const s = new C(n);
  s.writeU64(2n * t);
  const i = s.finish() & e, r = new C(n);
  r.writeU64(2n * t + 1n);
  const c = r.finish() & e;
  return [i, c];
}
const Y = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
function z(n) {
  let t = 1779033703, e = 3144134277, s = 1013904242, i = 2773480762, r = 1359893119, c = 2600822924, l = 528734635, a = 1541459225;
  const m = BigInt(n.length * 8), u = (64 - (n.length + 1 + 8) % 64) % 64, f = new Uint8Array(n.length + 1 + u + 8);
  f.set(n), f[n.length] = 128;
  for (let d = 0; d < 8; d++)
    f[f.length - 1 - d] = Number(m >> BigInt(d * 8) & 0xFFn);
  const o = new Uint32Array(64);
  for (let d = 0; d < f.length; d += 64) {
    for (let h = 0; h < 16; h++)
      o[h] = f[d + h * 4] << 24 | f[d + h * 4 + 1] << 16 | f[d + h * 4 + 2] << 8 | f[d + h * 4 + 3];
    for (let h = 16; h < 64; h++) {
      const E = (S(o[h - 15], 7) ^ S(o[h - 15], 18) ^ o[h - 15] >>> 3) >>> 0, I = (S(o[h - 2], 17) ^ S(o[h - 2], 19) ^ o[h - 2] >>> 10) >>> 0;
      o[h] = o[h - 16] + E + o[h - 7] + I >>> 0;
    }
    let v = t, p = e, U = s, B = i, b = r, M = c, F = l, x = a;
    for (let h = 0; h < 64; h++) {
      const E = (S(b, 6) ^ S(b, 11) ^ S(b, 25)) >>> 0, I = (b & M ^ ~b & F) >>> 0, k = x + E + I + Y[h] + o[h] >>> 0, L = (S(v, 2) ^ S(v, 13) ^ S(v, 22)) >>> 0, _ = (v & p ^ v & U ^ p & U) >>> 0, Q = L + _ >>> 0;
      x = F, F = M, M = b, b = B + k >>> 0, B = U, U = p, p = v, v = k + Q >>> 0;
    }
    t = t + v >>> 0, e = e + p >>> 0, s = s + U >>> 0, i = i + B >>> 0, r = r + b >>> 0, c = c + M >>> 0, l = l + F >>> 0, a = a + x >>> 0;
  }
  const g = new Uint8Array(32), w = new DataView(g.buffer);
  return w.setUint32(0, t, !1), w.setUint32(4, e, !1), w.setUint32(8, s, !1), w.setUint32(12, i, !1), w.setUint32(16, r, !1), w.setUint32(20, c, !1), w.setUint32(24, l, !1), w.setUint32(28, a, !1), g;
}
function S(n, t) {
  return (n >>> t | n << 32 - t) >>> 0;
}
function N(n) {
  if (n === 0n)
    return new Uint8Array([0]);
  const t = n < 0n;
  let e = t ? -n : n;
  const s = [];
  for (; e > 0n; )
    s.unshift(Number(e & 0xFFn)), e >>= 8n;
  if (t) {
    let i = 1;
    for (let r = s.length - 1; r >= 0; r--) {
      const c = (~s[r] & 255) + i;
      s[r] = c & 255, i = c >> 8;
    }
    s[0] & 128 || s.unshift(255);
  } else
    s[0] & 128 && s.unshift(0);
  return new Uint8Array(s);
}
function j(n) {
  let t = 0n;
  for (const e of n)
    t = t << 8n | BigInt(e);
  return t;
}
function T(n) {
  const t = N(n.a), e = N(n.b), s = new Uint8Array(2 + t.length + 2 + e.length), i = new DataView(s.buffer);
  return i.setUint16(0, t.length, !1), s.set(t, 2), i.setUint16(2 + t.length, e.length, !1), s.set(e, 4 + t.length), s;
}
function q(n) {
  const t = 2n * n.a;
  let e = (n.b % t + t) % t;
  e > n.a ? e -= t : e <= -n.a && (e += t);
  const i = e * e - n.discriminant, r = 4n * n.a, c = i / r;
  return { a: n.a, b: e, c, discriminant: n.discriminant };
}
function O(n) {
  let t = q(n);
  for (; ; )
    if (t.a > t.c) {
      const e = t.a;
      t = {
        a: t.c,
        b: -t.b,
        c: e,
        discriminant: t.discriminant
      }, t = q(t);
    } else {
      t.a === t.c && t.b < 0n && (t = { ...t, b: -t.b });
      break;
    }
  return t;
}
function P(n) {
  const t = 1n, e = (t - n) / 4n;
  return { a: t, b: t, c: e, discriminant: n };
}
function V(n, t) {
  if (t === 0n)
    return { gcd: n, x: 1n, y: 0n };
  const { gcd: e, x: s, y: i } = V(t, n % t);
  return { gcd: e, x: i, y: s - n / t * i };
}
function K(n, t) {
  const e = n.a, s = t.a, i = n.b, r = t.b, c = t.c, l = (i + r) / 2n, a = V(e, s), m = a.gcd, y = a.y, u = V(m, l), f = u.gcd, o = u.x, g = u.y, w = o * y, d = g, v = w * (i - r), p = d * c, U = v - p, B = 2n * e / f;
  let b = U % B;
  b < 0n && (b += B);
  const M = b, F = f * f, x = e * s / F, E = s / f * M, I = r + E, k = I * I - n.discriminant, L = x * 4n, _ = k / L;
  return O({ a: x, b: I, c: _, discriminant: n.discriminant });
}
function G(n) {
  return K(n, n);
}
function tt(n, t) {
  let e = P(n.discriminant), s = n, i = t;
  for (; i > 0n; )
    i & 1n && (e = K(e, s)), s = G(s), i >>= 1n;
  return e;
}
function A(n, t, e) {
  let s = 1n;
  for (n = (n % e + e) % e; t > 0n; )
    t & 1n && (s = s * n % e), t >>= 1n, n = n * n % e;
  return s;
}
function Z(n, t) {
  if (n < 2n)
    return !1;
  if (n === 2n || n === 3n)
    return !0;
  if (n % 2n === 0n)
    return !1;
  let e = 0n, s = n - 1n;
  for (; s % 2n === 0n; )
    s /= 2n, e++;
  const i = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (let r = 0; r < Math.min(t, i.length); r++) {
    const c = i[r];
    if (c >= n)
      continue;
    let l = A(c, s, n);
    if (l === 1n || l === n - 1n)
      continue;
    let a = !0;
    for (let m = 0n; m < e - 1n; m++)
      if (l = A(l, 2n, n), l === n - 1n) {
        a = !1;
        break;
      }
    if (a)
      return !1;
  }
  return !0;
}
function nt(n, t) {
  if (A(n, (t - 1n) / 2n, t) !== 1n)
    return 0n;
  if (t % 4n === 3n)
    return A(n, (t + 1n) / 4n, t);
  let e = 0n, s = t - 1n;
  for (; s % 2n === 0n; )
    s /= 2n, e++;
  let i = 2n;
  for (; A(i, (t - 1n) / 2n, t) === 1n; )
    i++;
  let r = A(i, s, t), c = A(n, (s + 1n) / 2n, t), l = A(n, s, t), a = e;
  for (; l !== 1n; ) {
    let m = l, y = 0n;
    for (; m !== 1n; )
      if (m = m * m % t, y++, y === a)
        return 0n;
    let u = r;
    for (let f = 0n; f < a - y - 1n; f++)
      u = u * u % t;
    a = y, r = u * u % t, l = l * r % t, c = c * u % t;
  }
  return c;
}
function et(n, t) {
  const e = z(n);
  let s = j(e);
  for (; ; ) {
    if (s % 2n === 0n) {
      s++;
      continue;
    }
    if (Z(s, 40)) {
      const f = A(t, (s - 1n) / 2n, s), o = (1n % s + s) % s;
      if (f === o || f === 1n)
        break;
    }
    s++;
  }
  const i = s, r = (t % i + i) % i;
  let c = nt(r, i);
  const l = c % 2n === 0n ? i - c : c, a = l * l, m = i * 4n, u = (a - t) / m;
  return O({ a: i, b: l, c: u, discriminant: t });
}
function st(n, t, e) {
  const s = T(n), i = T(t), r = N(e), c = new Uint8Array(s.length + i.length + r.length);
  c.set(s, 0), c.set(i, s.length), c.set(r, s.length + i.length);
  const l = z(c);
  let a = 0n;
  for (; ; ) {
    const m = new Uint8Array(8);
    new DataView(m.buffer).setBigUint64(0, a, !1);
    const u = new Uint8Array(l.length + 8);
    u.set(l, 0), u.set(m, l.length);
    const f = z(u);
    let o = j(f.slice(0, 16));
    if (o |= 1n, Z(o, 40))
      return o;
    a++;
  }
}
function it(n) {
  const t = [...n].sort((i, r) => i - r), e = new Uint8Array(t.length * 4), s = new DataView(e.buffer);
  for (let i = 0; i < t.length; i++)
    s.setUint32(i * 4, t[i], !0);
  return e;
}
function ot(n, t, e) {
  if (n.length < 16)
    throw new Error("Seed too short");
  const s = n.slice(0, 16), i = 1n << BigInt(t + 2), r = (1n << BigInt(t)) - 1n, c = 1 << t, l = new Array(c);
  for (let o = 0; o < c; o++)
    l[o] = [];
  const a = Number(i), m = Math.floor(a / 100);
  for (let o = 0; o < a; o++) {
    const [g, w] = X(s, BigInt(o), r), d = Number(g), v = Number(w);
    d !== v && (l[d].push([v, o]), l[v].push([d, o]), e && o % m === 0 && e(Math.floor(o / a * 50)));
  }
  const y = /* @__PURE__ */ new Set(), u = [];
  function f(o, g, w) {
    y.add(o);
    for (const [d, v] of l[o]) {
      if (d === g && w === 41)
        return [...u, v];
      if (!y.has(d) && w < 42) {
        u.push(v);
        const p = f(d, g, w + 1);
        if (p)
          return p;
        u.pop();
      }
    }
    return y.delete(o), null;
  }
  for (let o = 0; o < c; o++) {
    if (l[o].length === 0)
      continue;
    e && o % 1e3 === 0 && e(50 + Math.floor(o / c * 50)), y.clear(), u.length = 0;
    const g = f(o, o, 0);
    if (g)
      return e && e(100), g;
  }
  return null;
}
function rt(n, t, e, s, i) {
  const r = D(n), c = D(t), a = -j(c), y = ot(r, s, i ? (F) => i(Math.floor(F * 0.6)) : void 0);
  if (!y)
    throw new Error("No 42-cycle found (try different seed)");
  i && i(60);
  const u = it(y), f = et(u, a);
  i && i(65);
  let o = f;
  const g = 65, d = 90 - g;
  for (let F = 0; F < e; F++)
    if (o = G(o), i && F % 100 === 0) {
      const x = F / e * d;
      i(Math.floor(g + x));
    }
  i && i(90);
  const v = st(f, o, a), U = ct(e) / v, B = tt(f, U);
  i && i(100);
  const b = T(o), M = T(B);
  return {
    cycle: y,
    y: H(b),
    pi: H(M),
    memory_bytes: (1 << s) * 1200
    // Fallback estimate: ~1.2KB per node overhead for JS objects
  };
}
function ct(n) {
  return 1n << BigInt(n);
}
function D(n) {
  const t = new Uint8Array(n.length / 2);
  for (let e = 0; e < t.length; e++)
    t[e] = parseInt(n.substr(e * 2, 2), 16);
  return t;
}
function H(n) {
  return Array.from(n).map((t) => t.toString(16).padStart(2, "0")).join("");
}
function lt() {
  try {
    if (typeof WebAssembly > "u")
      return !1;
    if (typeof WebAssembly == "object" && typeof WebAssembly.instantiate == "function") {
      const n = new Uint8Array([
        0,
        97,
        115,
        109,
        // Magic number
        1,
        0,
        0,
        0
        // Version
      ]);
      return WebAssembly.validate(n);
    }
  } catch {
    return !1;
  }
  return !1;
}
let $ = null, W = !1, J = !0, R = !1;
try {
  R = lt();
} catch (n) {
  console.warn("Failed to check WASM support, defaulting to false:", n), R = !1;
}
async function at(n) {
  if (!R)
    return console.warn("WebAssembly not supported in this environment. Using JS fallback."), !1;
  try {
    const t = (await import("./assets/zeno_core-26a7c4c3.js")).default;
    return await t(n || "zeno.wasm"), $ = await import("./assets/zeno_core-26a7c4c3.js"), W = !0, console.log("WASM solver initialized successfully"), !0;
  } catch (t) {
    return console.warn("WASM initialization failed, falling back to JS solver:", t), !1;
  }
}
self.onmessage = async (n) => {
  const { type: t, challenge: e, wasm_url: s, force_js: i } = n.data;
  if (t === "SOLVE")
    try {
      const r = i || !R;
      !r && !W && (J = await at(s));
      const c = J && W && !r;
      self.postMessage({
        type: "STATUS",
        mode: c ? "wasm" : "js",
        wasmSupported: R
      }), console.log(`Starting Zeno Solver (${c ? "WASM" : "JS fallback"})...`);
      let l, a = 0;
      if (c)
        l = $.solve_wasm(
          e.seed,
          e.discriminant,
          BigInt(e.vdf),
          e.graph_bits
        ), a = l.memory_bytes || 0;
      else {
        const m = (y) => {
          if (self.performance?.memory?.usedJSHeapSize) {
            const u = self.performance.memory.usedJSHeapSize;
            u > a && (a = u);
          }
          self.postMessage({ type: "PROGRESS", percent: y });
        };
        l = rt(
          e.seed,
          e.discriminant,
          e.vdf,
          e.graph_bits,
          m
        ), a === 0 && l.memory_bytes && (a = l.memory_bytes);
      }
      self.postMessage({
        type: "SOLVED",
        payload: l,
        memory: a,
        mode: c ? "wasm" : "js"
      });
    } catch (r) {
      console.error("Solver Error:", r), self.postMessage({ type: "ERROR", error: r.toString() });
    }
  t === "CHECK_WASM" && self.postMessage({
    type: "WASM_STATUS",
    supported: R,
    initialized: W
  });
};
