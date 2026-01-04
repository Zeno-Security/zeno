/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */

class Z {
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
function dt(n, t, e) {
  const s = new Z(n);
  s.writeU64(2n * t);
  const i = s.finish() & e, l = new Z(n);
  l.writeU64(2n * t + 1n);
  const o = l.finish() & e;
  return [i, o];
}
const bt = new Uint32Array([
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
function P(n) {
  let t = 1779033703, e = 3144134277, s = 1013904242, i = 2773480762, l = 1359893119, o = 2600822924, r = 528734635, c = 1541459225;
  const b = BigInt(n.length * 8), h = (64 - (n.length + 1 + 8) % 64) % 64, f = new Uint8Array(n.length + 1 + h + 8);
  f.set(n), f[n.length] = 128;
  for (let w = 0; w < 8; w++)
    f[f.length - 1 - w] = Number(b >> BigInt(w * 8) & 0xFFn);
  const a = new Uint32Array(64);
  for (let w = 0; w < f.length; w += 64) {
    for (let u = 0; u < 16; u++)
      a[u] = f[w + u * 4] << 24 | f[w + u * 4 + 1] << 16 | f[w + u * 4 + 2] << 8 | f[w + u * 4 + 3];
    for (let u = 16; u < 64; u++) {
      const I = (F(a[u - 15], 7) ^ F(a[u - 15], 18) ^ a[u - 15] >>> 3) >>> 0, M = (F(a[u - 2], 17) ^ F(a[u - 2], 19) ^ a[u - 2] >>> 10) >>> 0;
      a[u] = a[u - 16] + I + a[u - 7] + M >>> 0;
    }
    let _ = t, p = e, A = s, W = i, v = l, E = o, B = r, T = c;
    for (let u = 0; u < 64; u++) {
      const I = (F(v, 6) ^ F(v, 11) ^ F(v, 25)) >>> 0, M = (v & E ^ ~v & B) >>> 0, C = T + I + M + bt[u] + a[u] >>> 0, J = (F(_, 2) ^ F(_, 13) ^ F(_, 22)) >>> 0, G = (_ & p ^ _ & A ^ p & A) >>> 0, ht = J + G >>> 0;
      T = B, B = E, E = v, v = W + C >>> 0, W = A, A = p, p = _, _ = C + ht >>> 0;
    }
    t = t + _ >>> 0, e = e + p >>> 0, s = s + A >>> 0, i = i + W >>> 0, l = l + v >>> 0, o = o + E >>> 0, r = r + B >>> 0, c = c + T >>> 0;
  }
  const m = new Uint8Array(32), y = new DataView(m.buffer);
  return y.setUint32(0, t, !1), y.setUint32(4, e, !1), y.setUint32(8, s, !1), y.setUint32(12, i, !1), y.setUint32(16, l, !1), y.setUint32(20, o, !1), y.setUint32(24, r, !1), y.setUint32(28, c, !1), m;
}
function F(n, t) {
  return (n >>> t | n << 32 - t) >>> 0;
}
function q(n) {
  if (n === 0n)
    return new Uint8Array([0]);
  if (n > 0n) {
    let t = n.toString(16);
    return t.length % 2 === 1 && (t = "0" + t), parseInt(t.substring(0, 2), 16) & 128 && (t = "00" + t), H(t);
  } else {
    let t = 1;
    for (; ; ) {
      const l = -(1n << BigInt(t * 8) - 1n);
      if (n >= l)
        break;
      t++;
    }
    let i = ((1n << 8n * BigInt(t)) + n).toString(16);
    for (; i.length < t * 2; )
      i = "0" + i;
    return H(i);
  }
}
function Y(n) {
  let t = 0n;
  for (const e of n)
    t = t << 8n | BigInt(e);
  return t;
}
function O(n) {
  const t = q(n.a), e = q(n.b), s = new Uint8Array(2 + t.length + 2 + e.length), i = new DataView(s.buffer);
  return i.setUint16(0, t.length, !1), s.set(t, 2), i.setUint16(2 + t.length, e.length, !1), s.set(e, 4 + t.length), s;
}
function $(n) {
  const t = 2n * n.a;
  let e = (n.b % t + t) % t;
  e > n.a ? e -= t : e <= -n.a && (e += t);
  const i = e * e - n.discriminant, l = 4n * n.a, o = i / l;
  return { a: n.a, b: e, c: o, discriminant: n.discriminant };
}
function st(n) {
  let t = $(n);
  for (; ; )
    if (t.a > t.c) {
      const e = t.a;
      t = {
        a: t.c,
        b: -t.b,
        c: e,
        discriminant: t.discriminant
      }, t = $(t);
    } else {
      t.a === t.c && t.b < 0n && (t = { ...t, b: -t.b });
      break;
    }
  return t;
}
function wt(n) {
  const t = 1n, e = (t - n) / 4n;
  return { a: t, b: t, c: e, discriminant: n };
}
function Q(n, t) {
  let e = n, s = t, i = 1n, l = 0n, o = 0n, r = 1n;
  for (; s !== 0n; ) {
    const c = e / s;
    let b = e;
    e = s, s = b - c * s, b = i, i = l, l = b - c * l, b = o, o = r, r = b - c * r;
  }
  return e < 0n && (e = -e, i = -i, o = -o), { gcd: e, x: i, y: o };
}
function it(n, t) {
  const e = n.a, s = t.a, i = n.b, l = t.b, o = t.c, r = (i + l) / 2n, c = Q(e, s), b = c.gcd, g = c.y, h = Q(b, r), f = h.gcd, a = h.x, m = h.y, y = a * g, w = m, _ = y * (i - l), p = w * o, A = _ - p, W = 2n * e / f;
  let v = A % W;
  v < 0n && (v += W);
  const E = v, B = f * f, T = e * s / B, I = s / f * E, M = l + I, C = M * M - n.discriminant, J = T * 4n, G = C / J;
  return st({ a: T, b: M, c: G, discriminant: n.discriminant });
}
function ot(n) {
  return it(n, n);
}
function yt(n, t) {
  let e = wt(n.discriminant), s = n, i = t;
  for (; i > 0n; )
    i & 1n && (e = it(e, s)), s = ot(s), i >>= 1n;
  return e;
}
function U(n, t, e) {
  let s = 1n;
  for (n = (n % e + e) % e; t > 0n; )
    t & 1n && (s = s * n % e), t >>= 1n, n = n * n % e;
  return s;
}
function rt(n, t) {
  if (n < 2n)
    return !1;
  if (n === 2n || n === 3n)
    return !0;
  if (n % 2n === 0n)
    return !1;
  let e = 0n, s = n - 1n;
  for (; s % 2n === 0n; )
    s /= 2n, e++;
  const i = [
    2n,
    3n,
    5n,
    7n,
    11n,
    13n,
    17n,
    19n,
    23n,
    29n,
    31n,
    37n,
    41n,
    43n,
    47n,
    53n,
    59n,
    61n,
    67n,
    71n,
    73n,
    79n,
    83n,
    89n,
    97n,
    101n,
    103n,
    107n,
    109n,
    113n,
    127n,
    131n,
    137n,
    139n,
    149n,
    151n,
    157n,
    163n,
    167n,
    173n
  ];
  for (const l of i) {
    if (n <= l)
      break;
    let o = U(l, s, n);
    if (o === 1n || o === n - 1n)
      continue;
    let r = !0;
    for (let c = 0n; c < e - 1n; c++)
      if (o = U(o, 2n, n), o === n - 1n) {
        r = !1;
        break;
      }
    if (r)
      return !1;
  }
  return !0;
}
function gt(n, t) {
  if (U(n, (t - 1n) / 2n, t) !== 1n)
    return 0n;
  if (t % 4n === 3n)
    return U(n, (t + 1n) / 4n, t);
  let e = 0n, s = t - 1n;
  for (; s % 2n === 0n; )
    s /= 2n, e++;
  let i = 2n;
  for (; U(i, (t - 1n) / 2n, t) === 1n; )
    i++;
  let l = U(i, s, t), o = U(n, (s + 1n) / 2n, t), r = U(n, s, t), c = e;
  for (; r !== 1n; ) {
    let b = r, g = 0n;
    for (; b !== 1n; )
      if (b = b * b % t, g++, g === c)
        return 0n;
    let h = l;
    for (let f = 0n; f < c - g - 1n; f++)
      h = h * h % t;
    c = g, l = h * h % t, r = r * l % t, o = o * h % t;
  }
  return o;
}
function _t(n, t) {
  const e = P(n);
  let s = Y(e);
  for (; ; ) {
    if (s % 2n === 0n) {
      s++;
      continue;
    }
    if (rt(s)) {
      const f = U(t, (s - 1n) / 2n, s), a = (1n % s + s) % s;
      if (f === a || f === 1n)
        break;
    }
    s++;
  }
  const i = s, l = (t % i + i) % i;
  let o = gt(l, i);
  const r = o % 2n === 0n ? i - o : o, c = r * r, b = i * 4n, h = (c - t) / b;
  return st({ a: i, b: r, c: h, discriminant: t });
}
function mt(n, t, e) {
  const s = O(n), i = O(t), l = q(e), o = new Uint8Array(s.length + i.length + l.length);
  o.set(s, 0), o.set(i, s.length), o.set(l, s.length + i.length);
  const r = P(o);
  let c = 0n;
  for (; ; ) {
    const b = new Uint8Array(8);
    new DataView(b.buffer).setBigUint64(0, c, !1);
    const h = new Uint8Array(r.length + 8);
    h.set(r, 0), h.set(b, r.length);
    const f = P(h);
    let a = Y(f.slice(0, 16));
    if (a |= 1n, rt(a))
      return a;
    c++;
  }
}
function vt(n) {
  const t = [...n].sort((i, l) => i - l), e = new Uint8Array(t.length * 4), s = new DataView(e.buffer);
  for (let i = 0; i < t.length; i++)
    s.setUint32(i * 4, t[i], !0);
  return e;
}
function pt(n, t, e) {
  if (n.length < 16)
    throw new Error("Seed too short");
  const s = n.slice(0, 16), i = 1n << BigInt(t + 2), l = (1n << BigInt(t)) - 1n, o = 1 << t, r = new Array(o);
  for (let a = 0; a < o; a++)
    r[a] = [];
  const c = Number(i), b = Math.floor(c / 100);
  for (let a = 0; a < c; a++) {
    const [m, y] = dt(s, BigInt(a), l), w = Number(m), _ = Number(y);
    w !== _ && (r[w].push([_, a]), r[_].push([w, a]), e && a % b === 0 && e(Math.floor(a / c * 50)));
  }
  const g = /* @__PURE__ */ new Set(), h = [];
  function f(a, m, y) {
    g.add(a);
    for (const [w, _] of r[a]) {
      if (w === m && y === 41)
        return [...h, _];
      if (!g.has(w) && y < 42) {
        h.push(_);
        const p = f(w, m, y + 1);
        if (p)
          return p;
        h.pop();
      }
    }
    return g.delete(a), null;
  }
  for (let a = 0; a < o; a++) {
    if (r[a].length === 0)
      continue;
    e && a % 1e3 === 0 && e(50 + Math.floor(a / o * 50)), g.clear(), h.length = 0;
    const m = f(a, a, 0);
    if (m)
      return e && e(100), m;
  }
  return null;
}
function St(n, t, e, s, i) {
  const l = H(n), o = H(t), c = -Y(o), g = pt(l, s, i ? (u) => i(Math.floor(u * 0.6)) : void 0);
  if (!g)
    throw new Error("No 42-cycle found (try different seed)");
  i && i(60);
  const h = vt(g), f = _t(h, c), a = j(O(f)), m = j(q(c));
  console.log("DEBUG_X_CLIENT:", a), console.log("DEBUG_SEED_CLIENT:", n), console.log("DEBUG_D_CLIENT:", m), i && i(65);
  let y = f;
  const w = 65, p = 90 - w;
  for (let u = 0; u < e; u++)
    if (y = ot(y), i && u % 100 === 0) {
      const I = u / e * p;
      i(Math.floor(w + I));
    }
  i && i(90);
  const A = mt(f, y, c), v = Ft(e) / A, E = yt(f, v);
  i && i(100);
  const B = O(y), T = O(E);
  return {
    cycle: g,
    y: j(B),
    pi: j(T),
    memory_bytes: (1 << s) * 1200
    // Fallback estimate: ~1.2KB per node overhead for JS objects
  };
}
function Ft(n) {
  return 1n << BigInt(n);
}
function H(n) {
  const t = new Uint8Array(n.length / 2);
  for (let e = 0; e < t.length; e++)
    t[e] = parseInt(n.substr(e * 2, 2), 16);
  return t;
}
function j(n) {
  return Array.from(n).map((t) => t.toString(16).padStart(2, "0")).join("");
}
function At() {
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
let ct = null, N = !1, tt = !0, x = !1;
try {
  x = At();
} catch (n) {
  console.warn("Failed to check WASM support, defaulting to false:", n), x = !1;
}
async function Ut(n) {
  if (!x)
    return console.warn("WebAssembly not supported in this environment. Using JS fallback."), !1;
  try {
    const t = (await Promise.resolve().then(function() {
      return et;
    })).default;
    return await t(n || "zeno.wasm"), ct = await Promise.resolve().then(function() {
      return et;
    }), N = !0, console.log("WASM solver initialized successfully"), !0;
  } catch (t) {
    return console.warn("WASM initialization failed, falling back to JS solver:", t), !1;
  }
}
self.onmessage = async (n) => {
  const { type: t, challenge: e, wasm_url: s, force_js: i } = n.data;
  if (t === "SOLVE")
    try {
      const l = i || !x;
      !l && !N && (tt = await Ut(s));
      const o = tt && N && !l;
      self.postMessage({
        type: "STATUS",
        mode: o ? "wasm" : "js",
        wasmSupported: x
      }), console.log(`Starting Zeno Solver (${o ? "WASM" : "JS fallback"})...`);
      let r, c = 0;
      if (o)
        r = ct.solve_wasm(
          e.seed,
          e.discriminant,
          BigInt(e.vdf),
          e.graph_bits
        ), c = r.memory_bytes || 0;
      else {
        const b = (g) => {
          if (self.performance?.memory?.usedJSHeapSize) {
            const h = self.performance.memory.usedJSHeapSize;
            h > c && (c = h);
          }
          self.postMessage({ type: "PROGRESS", percent: g });
        };
        r = St(
          e.seed,
          e.discriminant,
          e.vdf,
          e.graph_bits,
          b
        ), c === 0 && r.memory_bytes && (c = r.memory_bytes);
      }
      self.postMessage({
        type: "SOLVED",
        payload: r,
        memory: c,
        mode: o ? "wasm" : "js"
      });
    } catch (l) {
      console.error("Solver Error:", l), self.postMessage({ type: "ERROR", error: l.toString() });
    }
  t === "CHECK_WASM" && self.postMessage({
    type: "WASM_STATUS",
    supported: x,
    initialized: N
  });
};
let d;
function Et(n, t) {
  return n = n >>> 0, R().subarray(n / 1, n / 1 + t);
}
function nt(n, t) {
  return n = n >>> 0, It(n, t);
}
let k = null;
function Bt() {
  return (k === null || k.byteLength === 0) && (k = new Uint32Array(d.memory.buffer)), k;
}
let L = null;
function R() {
  return (L === null || L.byteLength === 0) && (L = new Uint8Array(d.memory.buffer)), L;
}
function lt(n, t) {
  const e = t(n.length * 4, 4) >>> 0;
  return Bt().set(n, e / 4), S = n.length, e;
}
function Tt(n, t) {
  const e = t(n.length * 1, 1) >>> 0;
  return R().set(n, e / 1), S = n.length, e;
}
function z(n, t, e) {
  if (e === void 0) {
    const r = D.encode(n), c = t(r.length, 1) >>> 0;
    return R().subarray(c, c + r.length).set(r), S = r.length, c;
  }
  let s = n.length, i = t(s, 1) >>> 0;
  const l = R();
  let o = 0;
  for (; o < s; o++) {
    const r = n.charCodeAt(o);
    if (r > 127)
      break;
    l[i + o] = r;
  }
  if (o !== s) {
    o !== 0 && (n = n.slice(o)), i = e(i, s, s = o + n.length * 3, 1) >>> 0;
    const r = R().subarray(i + o, i + s), c = D.encodeInto(n, r);
    o += c.written, i = e(i, s, o, 1) >>> 0;
  }
  return S = o, i;
}
function X(n) {
  const t = d.__wbindgen_externrefs.get(n);
  return d.__externref_table_dealloc(n), t;
}
let V = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 });
V.decode();
const Wt = 2146435072;
let K = 0;
function It(n, t) {
  return K += t, K >= Wt && (V = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }), V.decode(), K = t), V.decode(R().subarray(n, n + t));
}
const D = new TextEncoder();
"encodeInto" in D || (D.encodeInto = function(n, t) {
  const e = D.encode(n);
  return t.set(e), {
    read: n.length,
    written: e.length
  };
});
let S = 0;
function Mt() {
  return d.get_memory_bytes() >>> 0;
}
function xt(n) {
  const t = lt(n, d.__wbindgen_malloc), e = S, s = d.serialize_cycle(t, e);
  var i = Et(s[0], s[1]).slice();
  return d.__wbindgen_free(s[0], s[1] * 1, 1), i;
}
function Rt(n, t, e, s) {
  const i = z(n, d.__wbindgen_malloc, d.__wbindgen_realloc), l = S, o = z(t, d.__wbindgen_malloc, d.__wbindgen_realloc), r = S, c = d.solve_wasm(i, l, o, r, e, s);
  if (c[2])
    throw X(c[1]);
  return X(c[0]);
}
function kt(n, t, e, s, i, l, o) {
  const r = z(n, d.__wbindgen_malloc, d.__wbindgen_realloc), c = S, b = lt(t, d.__wbindgen_malloc), g = S, h = z(e, d.__wbindgen_malloc, d.__wbindgen_realloc), f = S, a = z(s, d.__wbindgen_malloc, d.__wbindgen_realloc), m = S, y = Tt(i, d.__wbindgen_malloc), w = S, _ = d.verify_proof(r, c, b, g, h, f, a, m, y, w, l, o);
  if (_[2])
    throw X(_[1]);
  return _[0] !== 0;
}
const Lt = /* @__PURE__ */ new Set(["basic", "cors", "default"]);
async function Ot(n, t) {
  if (typeof Response == "function" && n instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function")
      try {
        return await WebAssembly.instantiateStreaming(n, t);
      } catch (s) {
        if (n.ok && Lt.has(n.type) && n.headers.get("Content-Type") !== "application/wasm")
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", s);
        else
          throw s;
      }
    const e = await n.arrayBuffer();
    return await WebAssembly.instantiate(e, t);
  } else {
    const e = await WebAssembly.instantiate(n, t);
    return e instanceof WebAssembly.Instance ? { instance: e, module: n } : e;
  }
}
function at() {
  const n = {};
  return n.wbg = {}, n.wbg.__wbg___wbindgen_throw_dd24417ed36fc46e = function(t, e) {
    throw new Error(nt(t, e));
  }, n.wbg.__wbg_new_1ba21ce319a06297 = function() {
    return new Object();
  }, n.wbg.__wbg_new_25f239778d6112b9 = function() {
    return new Array();
  }, n.wbg.__wbg_set_3fda3bac07393de4 = function(t, e, s) {
    t[e] = s;
  }, n.wbg.__wbg_set_7df433eea03a5c14 = function(t, e, s) {
    t[e >>> 0] = s;
  }, n.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(t, e) {
    return nt(t, e);
  }, n.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(t) {
    return t;
  }, n.wbg.__wbindgen_init_externref_table = function() {
    const t = d.__wbindgen_externrefs, e = t.grow(4);
    t.set(0, void 0), t.set(e + 0, void 0), t.set(e + 1, null), t.set(e + 2, !0), t.set(e + 3, !1);
  }, n;
}
function ft(n, t) {
  return d = n.exports, ut.__wbindgen_wasm_module = t, k = null, L = null, d.__wbindgen_start(), d;
}
function zt(n) {
  if (d !== void 0)
    return d;
  typeof n < "u" && (Object.getPrototypeOf(n) === Object.prototype ? { module: n } = n : console.warn("using deprecated parameters for `initSync()`; pass a single object instead"));
  const t = at();
  n instanceof WebAssembly.Module || (n = new WebAssembly.Module(n));
  const e = new WebAssembly.Instance(n, t);
  return ft(e, n);
}
async function ut(n) {
  if (d !== void 0)
    return d;
  typeof n < "u" && (Object.getPrototypeOf(n) === Object.prototype ? { module_or_path: n } = n : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), typeof n > "u" && (n = new URL("zeno.wasm", self.location));
  const t = at();
  (typeof n == "string" || typeof Request == "function" && n instanceof Request || typeof URL == "function" && n instanceof URL) && (n = fetch(n));
  const { instance: e, module: s } = await Ot(await n, t);
  return ft(e, s);
}
var et = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: ut,
  get_memory_bytes: Mt,
  initSync: zt,
  serialize_cycle: xt,
  solve_wasm: Rt,
  verify_proof: kt
});
