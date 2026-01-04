/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */

class Y {
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
  const s = new Y(n);
  s.writeU64(2n * t);
  const i = s.finish() & e, l = new Y(n);
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
function K(n) {
  let t = 1779033703, e = 3144134277, s = 1013904242, i = 2773480762, l = 1359893119, o = 2600822924, r = 528734635, a = 1541459225;
  const d = BigInt(n.length * 8), u = (64 - (n.length + 1 + 8) % 64) % 64, f = new Uint8Array(n.length + 1 + u + 8);
  f.set(n), f[n.length] = 128;
  for (let b = 0; b < 8; b++)
    f[f.length - 1 - b] = Number(d >> BigInt(b * 8) & 0xFFn);
  const c = new Uint32Array(64);
  for (let b = 0; b < f.length; b += 64) {
    for (let w = 0; w < 16; w++)
      c[w] = f[b + w * 4] << 24 | f[b + w * 4 + 1] << 16 | f[b + w * 4 + 2] << 8 | f[b + w * 4 + 3];
    for (let w = 16; w < 64; w++) {
      const x = (A(c[w - 15], 7) ^ A(c[w - 15], 18) ^ c[w - 15] >>> 3) >>> 0, R = (A(c[w - 2], 17) ^ A(c[w - 2], 19) ^ c[w - 2] >>> 10) >>> 0;
      c[w] = c[w - 16] + x + c[w - 7] + R >>> 0;
    }
    let y = t, F = e, U = s, E = i, v = l, W = o, p = r, M = a;
    for (let w = 0; w < 64; w++) {
      const x = (A(v, 6) ^ A(v, 11) ^ A(v, 25)) >>> 0, R = (v & W ^ ~v & p) >>> 0, j = M + x + R + bt[w] + c[w] >>> 0, q = (A(y, 2) ^ A(y, 13) ^ A(y, 22)) >>> 0, H = (y & F ^ y & U ^ F & U) >>> 0, ht = q + H >>> 0;
      M = p, p = W, W = v, v = E + j >>> 0, E = U, U = F, F = y, y = j + ht >>> 0;
    }
    t = t + y >>> 0, e = e + F >>> 0, s = s + U >>> 0, i = i + E >>> 0, l = l + v >>> 0, o = o + W >>> 0, r = r + p >>> 0, a = a + M >>> 0;
  }
  const m = new Uint8Array(32), _ = new DataView(m.buffer);
  return _.setUint32(0, t, !1), _.setUint32(4, e, !1), _.setUint32(8, s, !1), _.setUint32(12, i, !1), _.setUint32(16, l, !1), _.setUint32(20, o, !1), _.setUint32(24, r, !1), _.setUint32(28, a, !1), m;
}
function A(n, t) {
  return (n >>> t | n << 32 - t) >>> 0;
}
function P(n) {
  if (n === 0n)
    return new Uint8Array([0]);
  if (n > 0n) {
    let t = n.toString(16);
    return t.length % 2 === 1 && (t = "0" + t), parseInt(t.substring(0, 2), 16) & 128 && (t = "00" + t), V(t);
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
    return V(i);
  }
}
function X(n) {
  let t = 0n;
  for (const e of n)
    t = t << 8n | BigInt(e);
  return t;
}
function N(n) {
  const t = P(n.a), e = P(n.b), s = new Uint8Array(2 + t.length + 2 + e.length), i = new DataView(s.buffer);
  return i.setUint16(0, t.length, !1), s.set(t, 2), i.setUint16(2 + t.length, e.length, !1), s.set(e, 4 + t.length), s;
}
function Z(n) {
  const t = 2n * n.a;
  let e = (n.b % t + t) % t;
  e > n.a ? e -= t : e <= -n.a && (e += t);
  const i = e * e - n.discriminant, l = 4n * n.a, o = i / l;
  return { a: n.a, b: e, c: o, discriminant: n.discriminant };
}
function st(n) {
  let t = Z(n);
  for (; ; )
    if (t.a > t.c) {
      const e = t.a;
      t = {
        a: t.c,
        b: -t.b,
        c: e,
        discriminant: t.discriminant
      }, t = Z(t);
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
function $(n, t) {
  let e = n, s = t, i = 1n, l = 0n, o = 0n, r = 1n;
  for (; s !== 0n; ) {
    const a = e / s;
    let d = e;
    e = s, s = d - a * s, d = i, i = l, l = d - a * l, d = o, o = r, r = d - a * r;
  }
  return e < 0n && (e = -e, i = -i, o = -o), { gcd: e, x: i, y: o };
}
function it(n, t) {
  const e = n.a, s = t.a, i = n.b, l = t.b, o = t.c, r = (i + l) / 2n, a = $(e, s), d = a.gcd, g = a.y, u = $(d, r), f = u.gcd, c = u.x, m = u.y, _ = c * g, b = m, y = _ * (i - l), F = b * o, U = y - F, E = 2n * e / f;
  let v = U % E;
  v < 0n && (v += E);
  const W = v, p = f * f, M = e * s / p, x = s / f * W, R = l + x, j = R * R - n.discriminant, q = M * 4n, H = j / q;
  return st({ a: M, b: R, c: H, discriminant: n.discriminant });
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
function B(n, t, e) {
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
    let o = B(l, s, n);
    if (o === 1n || o === n - 1n)
      continue;
    let r = !0;
    for (let a = 0n; a < e - 1n; a++)
      if (o = B(o, 2n, n), o === n - 1n) {
        r = !1;
        break;
      }
    if (r)
      return !1;
  }
  return !0;
}
function gt(n, t) {
  if (B(n, (t - 1n) / 2n, t) !== 1n)
    return 0n;
  if (t % 4n === 3n)
    return B(n, (t + 1n) / 4n, t);
  let e = 0n, s = t - 1n;
  for (; s % 2n === 0n; )
    s /= 2n, e++;
  let i = 2n;
  for (; B(i, (t - 1n) / 2n, t) === 1n; )
    i++;
  let l = B(i, s, t), o = B(n, (s + 1n) / 2n, t), r = B(n, s, t), a = e;
  for (; r !== 1n; ) {
    let d = r, g = 0n;
    for (; d !== 1n; )
      if (d = d * d % t, g++, g === a)
        return 0n;
    let u = l;
    for (let f = 0n; f < a - g - 1n; f++)
      u = u * u % t;
    a = g, l = u * u % t, r = r * l % t, o = o * u % t;
  }
  return o;
}
function _t(n, t) {
  const e = K(n);
  let s = X(e);
  for (; ; ) {
    if (s % 2n === 0n) {
      s++;
      continue;
    }
    if (rt(s)) {
      const f = B(t, (s - 1n) / 2n, s), c = (1n % s + s) % s;
      if (f === c || f === 1n)
        break;
    }
    s++;
  }
  const i = s, l = (t % i + i) % i;
  let o = gt(l, i);
  const r = o % 2n === 0n ? i - o : o, a = r * r, d = i * 4n, u = (a - t) / d;
  return st({ a: i, b: r, c: u, discriminant: t });
}
function mt(n, t, e) {
  const s = N(n), i = N(t), l = P(e), o = new Uint8Array(s.length + i.length + l.length);
  o.set(s, 0), o.set(i, s.length), o.set(l, s.length + i.length);
  const r = K(o);
  let a = 0n;
  for (; ; ) {
    const d = new Uint8Array(8);
    new DataView(d.buffer).setBigUint64(0, a, !1);
    const u = new Uint8Array(r.length + 8);
    u.set(r, 0), u.set(d, r.length);
    const f = K(u);
    let c = X(f.slice(0, 16));
    if (c |= 1n, rt(c))
      return c;
    a++;
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
  for (let c = 0; c < o; c++)
    r[c] = [];
  const a = Number(i), d = Math.floor(a / 100);
  for (let c = 0; c < a; c++) {
    const [m, _] = dt(s, BigInt(c), l), b = Number(m), y = Number(_);
    b !== y && (r[b].push([y, c]), r[y].push([b, c]), e && c % d === 0 && e(Math.floor(c / a * 50)));
  }
  const g = /* @__PURE__ */ new Set(), u = [];
  function f(c, m, _) {
    g.add(c);
    for (const [b, y] of r[c]) {
      if (b === m && _ === 41)
        return [...u, y];
      if (!g.has(b) && _ < 42) {
        u.push(y);
        const F = f(b, m, _ + 1);
        if (F)
          return F;
        u.pop();
      }
    }
    return g.delete(c), null;
  }
  for (let c = 0; c < o; c++) {
    if (r[c].length === 0)
      continue;
    e && c % 1e3 === 0 && e(50 + Math.floor(c / o * 50)), g.clear(), u.length = 0;
    const m = f(c, c, 0);
    if (m)
      return e && e(100), m;
  }
  return null;
}
function St(n, t, e, s, i) {
  const l = V(n), o = V(t), a = -X(o), g = pt(l, s, i ? (p) => i(Math.floor(p * 0.6)) : void 0);
  if (!g)
    throw new Error("No 42-cycle found (try different seed)");
  i && i(60);
  const u = vt(g), f = _t(u, a);
  i && i(65);
  let c = f;
  const m = 65, b = 90 - m;
  for (let p = 0; p < e; p++)
    if (c = ot(c), i && p % 100 === 0) {
      const M = p / e * b;
      i(Math.floor(m + M));
    }
  i && i(90);
  const y = mt(f, c, a), U = Ft(e) / y, E = yt(f, U);
  i && i(100);
  const v = N(c), W = N(E);
  return {
    cycle: g,
    y: Q(v),
    pi: Q(W),
    memory_bytes: (1 << s) * 1200
    // Fallback estimate: ~1.2KB per node overhead for JS objects
  };
}
function Ft(n) {
  return 1n << BigInt(n);
}
function V(n) {
  const t = new Uint8Array(n.length / 2);
  for (let e = 0; e < t.length; e++)
    t[e] = parseInt(n.substr(e * 2, 2), 16);
  return t;
}
function Q(n) {
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
let ct = null, C = !1, tt = !0, T = !1;
try {
  T = At();
} catch (n) {
  console.warn("Failed to check WASM support, defaulting to false:", n), T = !1;
}
async function Ut(n) {
  if (!T)
    return console.warn("WebAssembly not supported in this environment. Using JS fallback."), !1;
  try {
    const t = (await Promise.resolve().then(function() {
      return et;
    })).default;
    return await t(n || "zeno.wasm"), ct = await Promise.resolve().then(function() {
      return et;
    }), C = !0, console.log("WASM solver initialized successfully"), !0;
  } catch (t) {
    return console.warn("WASM initialization failed, falling back to JS solver:", t), !1;
  }
}
self.onmessage = async (n) => {
  const { type: t, challenge: e, wasm_url: s, force_js: i } = n.data;
  if (t === "SOLVE")
    try {
      const l = i || !T;
      !l && !C && (tt = await Ut(s));
      const o = tt && C && !l;
      self.postMessage({
        type: "STATUS",
        mode: o ? "wasm" : "js",
        wasmSupported: T
      }), console.log(`Starting Zeno Solver (${o ? "WASM" : "JS fallback"})...`);
      let r, a = 0;
      if (o)
        r = ct.solve_wasm(
          e.seed,
          e.discriminant,
          BigInt(e.vdf),
          e.graph_bits
        ), a = r.memory_bytes || 0;
      else {
        const d = (g) => {
          if (self.performance?.memory?.usedJSHeapSize) {
            const u = self.performance.memory.usedJSHeapSize;
            u > a && (a = u);
          }
          self.postMessage({ type: "PROGRESS", percent: g });
        };
        r = St(
          e.seed,
          e.discriminant,
          e.vdf,
          e.graph_bits,
          d
        ), a === 0 && r.memory_bytes && (a = r.memory_bytes);
      }
      self.postMessage({
        type: "SOLVED",
        payload: r,
        memory: a,
        mode: o ? "wasm" : "js"
      });
    } catch (l) {
      console.error("Solver Error:", l), self.postMessage({ type: "ERROR", error: l.toString() });
    }
  t === "CHECK_WASM" && self.postMessage({
    type: "WASM_STATUS",
    supported: T,
    initialized: C
  });
};
let h;
function Bt(n, t) {
  return n = n >>> 0, I().subarray(n / 1, n / 1 + t);
}
function nt(n, t) {
  return n = n >>> 0, Rt(n, t);
}
let k = null;
function Et() {
  return (k === null || k.byteLength === 0) && (k = new Uint32Array(h.memory.buffer)), k;
}
let O = null;
function I() {
  return (O === null || O.byteLength === 0) && (O = new Uint8Array(h.memory.buffer)), O;
}
function lt(n, t) {
  const e = t(n.length * 4, 4) >>> 0;
  return Et().set(n, e / 4), S = n.length, e;
}
function Wt(n, t) {
  const e = t(n.length * 1, 1) >>> 0;
  return I().set(n, e / 1), S = n.length, e;
}
function z(n, t, e) {
  if (e === void 0) {
    const r = L.encode(n), a = t(r.length, 1) >>> 0;
    return I().subarray(a, a + r.length).set(r), S = r.length, a;
  }
  let s = n.length, i = t(s, 1) >>> 0;
  const l = I();
  let o = 0;
  for (; o < s; o++) {
    const r = n.charCodeAt(o);
    if (r > 127)
      break;
    l[i + o] = r;
  }
  if (o !== s) {
    o !== 0 && (n = n.slice(o)), i = e(i, s, s = o + n.length * 3, 1) >>> 0;
    const r = I().subarray(i + o, i + s), a = L.encodeInto(n, r);
    o += a.written, i = e(i, s, o, 1) >>> 0;
  }
  return S = o, i;
}
function G(n) {
  const t = h.__wbindgen_externrefs.get(n);
  return h.__externref_table_dealloc(n), t;
}
let D = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 });
D.decode();
const Mt = 2146435072;
let J = 0;
function Rt(n, t) {
  return J += t, J >= Mt && (D = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }), D.decode(), J = t), D.decode(I().subarray(n, n + t));
}
const L = new TextEncoder();
"encodeInto" in L || (L.encodeInto = function(n, t) {
  const e = L.encode(n);
  return t.set(e), {
    read: n.length,
    written: e.length
  };
});
let S = 0;
function Tt() {
  return h.get_memory_bytes() >>> 0;
}
function It(n) {
  const t = lt(n, h.__wbindgen_malloc), e = S, s = h.serialize_cycle(t, e);
  var i = Bt(s[0], s[1]).slice();
  return h.__wbindgen_free(s[0], s[1] * 1, 1), i;
}
function xt(n, t, e, s) {
  const i = z(n, h.__wbindgen_malloc, h.__wbindgen_realloc), l = S, o = z(t, h.__wbindgen_malloc, h.__wbindgen_realloc), r = S, a = h.solve_wasm(i, l, o, r, e, s);
  if (a[2])
    throw G(a[1]);
  return G(a[0]);
}
function kt(n, t, e, s, i, l, o) {
  const r = z(n, h.__wbindgen_malloc, h.__wbindgen_realloc), a = S, d = lt(t, h.__wbindgen_malloc), g = S, u = z(e, h.__wbindgen_malloc, h.__wbindgen_realloc), f = S, c = z(s, h.__wbindgen_malloc, h.__wbindgen_realloc), m = S, _ = Wt(i, h.__wbindgen_malloc), b = S, y = h.verify_proof(r, a, d, g, u, f, c, m, _, b, l, o);
  if (y[2])
    throw G(y[1]);
  return y[0] !== 0;
}
const Ot = /* @__PURE__ */ new Set(["basic", "cors", "default"]);
async function zt(n, t) {
  if (typeof Response == "function" && n instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function")
      try {
        return await WebAssembly.instantiateStreaming(n, t);
      } catch (s) {
        if (n.ok && Ot.has(n.type) && n.headers.get("Content-Type") !== "application/wasm")
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
    const t = h.__wbindgen_externrefs, e = t.grow(4);
    t.set(0, void 0), t.set(e + 0, void 0), t.set(e + 1, null), t.set(e + 2, !0), t.set(e + 3, !1);
  }, n;
}
function ft(n, t) {
  return h = n.exports, ut.__wbindgen_wasm_module = t, k = null, O = null, h.__wbindgen_start(), h;
}
function Lt(n) {
  if (h !== void 0)
    return h;
  typeof n < "u" && (Object.getPrototypeOf(n) === Object.prototype ? { module: n } = n : console.warn("using deprecated parameters for `initSync()`; pass a single object instead"));
  const t = at();
  n instanceof WebAssembly.Module || (n = new WebAssembly.Module(n));
  const e = new WebAssembly.Instance(n, t);
  return ft(e, n);
}
async function ut(n) {
  if (h !== void 0)
    return h;
  typeof n < "u" && (Object.getPrototypeOf(n) === Object.prototype ? { module_or_path: n } = n : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), typeof n > "u" && (n = new URL("zeno.wasm", self.location));
  const t = at();
  (typeof n == "string" || typeof Request == "function" && n instanceof Request || typeof URL == "function" && n instanceof URL) && (n = fetch(n));
  const { instance: e, module: s } = await zt(await n, t);
  return ft(e, s);
}
var et = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: ut,
  get_memory_bytes: Tt,
  initSync: Lt,
  serialize_cycle: It,
  solve_wasm: xt,
  verify_proof: kt
});
