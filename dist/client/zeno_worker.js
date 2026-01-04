/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */

var yt = (n, t) => () => (t || n((t = { exports: {} }).exports, t), t.exports);
var qt = yt((Jt, gt) => {
  class et {
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
      for (let r = 0; r < 8; r++)
        s |= BigInt(t[e + r]) << BigInt(r * 8);
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
  function mt(n, t, e) {
    const s = new et(n);
    s.writeU64(2n * t);
    const r = s.finish() & e, l = new et(n);
    l.writeU64(2n * t + 1n);
    const i = l.finish() & e;
    return [r, i];
  }
  const pt = new Uint32Array([
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
  function Y(n) {
    let t = 1779033703, e = 3144134277, s = 1013904242, r = 2773480762, l = 1359893119, i = 2600822924, o = 528734635, a = 1541459225;
    const g = BigInt(n.length * 8), f = (64 - (n.length + 1 + 8) % 64) % 64, u = new Uint8Array(n.length + 1 + f + 8);
    u.set(n), u[n.length] = 128;
    for (let w = 0; w < 8; w++)
      u[u.length - 1 - w] = Number(g >> BigInt(w * 8) & 0xFFn);
    const c = new Uint32Array(64);
    for (let w = 0; w < u.length; w += 64) {
      for (let d = 0; d < 16; d++)
        c[d] = u[w + d * 4] << 24 | u[w + d * 4 + 1] << 16 | u[w + d * 4 + 2] << 8 | u[w + d * 4 + 3];
      for (let d = 16; d < 64; d++) {
        const I = (A(c[d - 15], 7) ^ A(c[d - 15], 18) ^ c[d - 15] >>> 3) >>> 0, W = (A(c[d - 2], 17) ^ A(c[d - 2], 19) ^ c[d - 2] >>> 10) >>> 0;
        c[d] = c[d - 16] + I + c[d - 7] + W >>> 0;
      }
      let h = t, F = e, U = s, x = r, p = l, E = i, v = o, T = a;
      for (let d = 0; d < 64; d++) {
        const I = (A(p, 6) ^ A(p, 11) ^ A(p, 25)) >>> 0, W = (p & E ^ ~p & v) >>> 0, D = T + I + W + pt[d] + c[d] >>> 0, G = (A(h, 2) ^ A(h, 13) ^ A(h, 22)) >>> 0, K = (h & F ^ h & U ^ F & U) >>> 0, ht = G + K >>> 0;
        T = v, v = E, E = p, p = x + D >>> 0, x = U, U = F, F = h, h = D + ht >>> 0;
      }
      t = t + h >>> 0, e = e + F >>> 0, s = s + U >>> 0, r = r + x >>> 0, l = l + p >>> 0, i = i + E >>> 0, o = o + v >>> 0, a = a + T >>> 0;
    }
    const m = new Uint8Array(32), y = new DataView(m.buffer);
    return y.setUint32(0, t, !1), y.setUint32(4, e, !1), y.setUint32(8, s, !1), y.setUint32(12, r, !1), y.setUint32(16, l, !1), y.setUint32(20, i, !1), y.setUint32(24, o, !1), y.setUint32(28, a, !1), m;
  }
  function A(n, t) {
    return (n >>> t | n << 32 - t) >>> 0;
  }
  function Z(n) {
    if (n === 0n)
      return new Uint8Array([0]);
    if (n > 0n) {
      let t = n.toString(16);
      return t.length % 2 === 1 && (t = "0" + t), parseInt(t.substring(0, 2), 16) & 128 && (t = "00" + t), J(t);
    } else {
      let t = 1;
      for (; ; ) {
        const l = -(1n << BigInt(t * 8) - 1n);
        if (n >= l)
          break;
        t++;
      }
      let r = ((1n << 8n * BigInt(t)) + n).toString(16);
      for (; r.length < t * 2; )
        r = "0" + r;
      return J(r);
    }
  }
  function nt(n) {
    let t = 0n;
    for (const e of n)
      t = t << 8n | BigInt(e);
    return t;
  }
  function H(n) {
    const t = Z(n.a), e = Z(n.b), s = new Uint8Array(2 + t.length + 2 + e.length), r = new DataView(s.buffer);
    return r.setUint16(0, t.length, !1), s.set(t, 2), r.setUint16(2 + t.length, e.length, !1), s.set(e, 4 + t.length), s;
  }
  function st(n) {
    const t = 2n * n.a;
    let e = (n.b % t + t) % t;
    e > n.a ? e -= t : e <= -n.a && (e += t);
    const r = e * e - n.discriminant, l = 4n * n.a, i = r / l;
    return { a: n.a, b: e, c: i, discriminant: n.discriminant };
  }
  function ct(n) {
    let t = st(n);
    for (; ; )
      if (t.a > t.c) {
        const e = t.a;
        t = {
          a: t.c,
          b: -t.b,
          c: e,
          discriminant: t.discriminant
        }, t = st(t);
      } else {
        t.a === t.c && t.b < 0n && (t = { ...t, b: -t.b });
        break;
      }
    return t;
  }
  function vt(n) {
    const t = 1n, e = (t - n) / 4n;
    return { a: t, b: t, c: e, discriminant: n };
  }
  function $(n, t) {
    if (t === 0n)
      return { gcd: n, x: 1n, y: 0n };
    const { gcd: e, x: s, y: r } = $(t, n % t);
    return { gcd: e, x: r, y: s - n / t * r };
  }
  function at(n, t) {
    const e = n.a, s = t.a, r = n.b, l = t.b, i = t.c, o = (r + l) / 2n, a = $(e, s), g = a.gcd, b = a.y, f = $(g, o), u = f.gcd, c = f.x, m = f.y, y = c * b, w = m, h = y * (r - l), F = w * i, U = h - F, x = 2n * e / u;
    let p = U % x;
    p < 0n && (p += x);
    const E = p, v = u * u, T = e * s / v, I = s / u * E, W = l + I, D = W * W - n.discriminant, G = T * 4n, K = D / G;
    return ct({ a: T, b: W, c: K, discriminant: n.discriminant });
  }
  function lt(n) {
    return at(n, n);
  }
  function St(n, t) {
    let e = vt(n.discriminant), s = n, r = t;
    for (; r > 0n; )
      r & 1n && (e = at(e, s)), s = lt(s), r >>= 1n;
    return e;
  }
  function B(n, t, e) {
    let s = 1n;
    for (n = (n % e + e) % e; t > 0n; )
      t & 1n && (s = s * n % e), t >>= 1n, n = n * n % e;
    return s;
  }
  function ft(n, t) {
    if (n < 2n)
      return !1;
    if (n === 2n || n === 3n)
      return !0;
    if (n % 2n === 0n)
      return !1;
    let e = 0n, s = n - 1n;
    for (; s % 2n === 0n; )
      s /= 2n, e++;
    for (let r = 0; r < t; r++) {
      const l = n - 3n, i = l.toString(2).length;
      let o = 0n;
      for (; ; ) {
        let b = 0n;
        for (let f = 0; f < i; f += 32) {
          const u = Math.floor(Math.random() * 4294967295);
          b = b << 32n | BigInt(u);
        }
        if (o = b % l + 2n, o < n - 1n)
          break;
      }
      let a = B(o, s, n);
      if (a === 1n || a === n - 1n)
        continue;
      let g = !0;
      for (let b = 0n; b < e - 1n; b++)
        if (a = B(a, 2n, n), a === n - 1n) {
          g = !1;
          break;
        }
      if (g)
        return !1;
    }
    return !0;
  }
  function Ft(n, t) {
    if (B(n, (t - 1n) / 2n, t) !== 1n)
      return 0n;
    if (t % 4n === 3n)
      return B(n, (t + 1n) / 4n, t);
    let e = 0n, s = t - 1n;
    for (; s % 2n === 0n; )
      s /= 2n, e++;
    let r = 2n;
    for (; B(r, (t - 1n) / 2n, t) === 1n; )
      r++;
    let l = B(r, s, t), i = B(n, (s + 1n) / 2n, t), o = B(n, s, t), a = e;
    for (; o !== 1n; ) {
      let g = o, b = 0n;
      for (; g !== 1n; )
        if (g = g * g % t, b++, b === a)
          return 0n;
      let f = l;
      for (let u = 0n; u < a - b - 1n; u++)
        f = f * f % t;
      a = b, l = f * f % t, o = o * l % t, i = i * f % t;
    }
    return i;
  }
  function At(n, t) {
    const e = Y(n);
    let s = nt(e);
    for (; ; ) {
      if (s % 2n === 0n) {
        s++;
        continue;
      }
      if (ft(s, 40)) {
        const u = B(t, (s - 1n) / 2n, s), c = (1n % s + s) % s;
        if (u === c || u === 1n)
          break;
      }
      s++;
    }
    const r = s, l = (t % r + r) % r;
    let i = Ft(l, r);
    const o = i % 2n === 0n ? r - i : i, a = o * o, g = r * 4n, f = (a - t) / g;
    return ct({ a: r, b: o, c: f, discriminant: t });
  }
  function Ut(n, t, e) {
    const s = H(n), r = H(t), l = Z(e), i = new Uint8Array(s.length + r.length + l.length);
    i.set(s, 0), i.set(r, s.length), i.set(l, s.length + r.length);
    const o = Y(i);
    let a = 0n;
    for (; ; ) {
      const g = new Uint8Array(8);
      new DataView(g.buffer).setBigUint64(0, a, !1);
      const f = new Uint8Array(o.length + 8);
      f.set(o, 0), f.set(g, o.length);
      const u = Y(f);
      let c = nt(u.slice(0, 16));
      if (c |= 1n, ft(c, 40))
        return c;
      a++;
    }
  }
  function Bt(n) {
    const t = [...n].sort((r, l) => r - l), e = new Uint8Array(t.length * 4), s = new DataView(e.buffer);
    for (let r = 0; r < t.length; r++)
      s.setUint32(r * 4, t[r], !0);
    return e;
  }
  function xt(n, t, e) {
    if (n.length < 16)
      throw new Error("Seed too short");
    const s = n.slice(0, 16), r = 1n << BigInt(t + 2), l = (1n << BigInt(t)) - 1n, i = 1 << t, o = new Array(i);
    for (let c = 0; c < i; c++)
      o[c] = [];
    const a = Number(r), g = Math.floor(a / 100);
    for (let c = 0; c < a; c++) {
      const [m, y] = mt(s, BigInt(c), l), w = Number(m), h = Number(y);
      w !== h && (o[w].push([h, c]), o[h].push([w, c]), e && c % g === 0 && e(Math.floor(c / a * 50)));
    }
    const b = /* @__PURE__ */ new Set(), f = [];
    function u(c, m, y) {
      b.add(c);
      for (const [w, h] of o[c]) {
        if (w === m && y === 41)
          return [...f, h];
        if (!b.has(w) && y < 42) {
          f.push(h);
          const F = u(w, m, y + 1);
          if (F)
            return F;
          f.pop();
        }
      }
      return b.delete(c), null;
    }
    for (let c = 0; c < i; c++) {
      if (o[c].length === 0)
        continue;
      e && c % 1e3 === 0 && e(50 + Math.floor(c / i * 50)), b.clear(), f.length = 0;
      const m = u(c, c, 0);
      if (m)
        return e && e(100), m;
    }
    return null;
  }
  function Et(n, t, e, s, r) {
    const l = J(n), i = J(t), a = -nt(i), b = xt(l, s, r ? (v) => r(Math.floor(v * 0.6)) : void 0);
    if (!b)
      throw new Error("No 42-cycle found (try different seed)");
    r && r(60);
    const f = Bt(b), u = At(f, a);
    r && r(65);
    let c = u;
    const m = 65, w = 90 - m;
    for (let v = 0; v < e; v++)
      if (c = lt(c), r && v % 100 === 0) {
        const T = v / e * w;
        r(Math.floor(m + T));
      }
    r && r(90);
    const h = Ut(u, c, a), U = Tt(e) / h, x = St(u, U);
    r && r(100);
    const p = H(c), E = H(x);
    return {
      cycle: b,
      y: rt(p),
      pi: rt(E),
      memory_bytes: (1 << s) * 1200
      // Fallback estimate: ~1.2KB per node overhead for JS objects
    };
  }
  function Tt(n) {
    return 1n << BigInt(n);
  }
  function J(n) {
    const t = new Uint8Array(n.length / 2);
    for (let e = 0; e < t.length; e++)
      t[e] = parseInt(n.substr(e * 2, 2), 16);
    return t;
  }
  function rt(n) {
    return Array.from(n).map((t) => t.toString(16).padStart(2, "0")).join("");
  }
  function Wt() {
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
  let ut = null, V = !1, it = !0, M = !1;
  try {
    M = Wt();
  } catch (n) {
    console.warn("Failed to check WASM support, defaulting to false:", n), M = !1;
  }
  async function Mt(n) {
    if (!M)
      return console.warn("WebAssembly not supported in this environment. Using JS fallback."), !1;
    try {
      const t = (await Promise.resolve().then(function() {
        return ot;
      })).default;
      return await t(n || "zeno.wasm"), ut = await Promise.resolve().then(function() {
        return ot;
      }), V = !0, console.log("WASM solver initialized successfully"), !0;
    } catch (t) {
      return console.warn("WASM initialization failed, falling back to JS solver:", t), !1;
    }
  }
  self.onmessage = async (n) => {
    const { type: t, challenge: e, wasm_url: s, force_js: r } = n.data;
    if (t === "SOLVE")
      try {
        const l = r || !M;
        !l && !V && (it = await Mt(s));
        const i = it && V && !l;
        self.postMessage({
          type: "STATUS",
          mode: i ? "wasm" : "js",
          wasmSupported: M
        }), console.log(`Starting Zeno Solver (${i ? "WASM" : "JS fallback"})...`);
        let o, a = 0;
        if (i)
          o = ut.solve_wasm(
            e.seed,
            e.discriminant,
            BigInt(e.vdf),
            e.graph_bits
          ), a = o.memory_bytes || 0;
        else {
          const g = (b) => {
            if (self.performance?.memory?.usedJSHeapSize) {
              const f = self.performance.memory.usedJSHeapSize;
              f > a && (a = f);
            }
            self.postMessage({ type: "PROGRESS", percent: b });
          };
          o = Et(
            e.seed,
            e.discriminant,
            e.vdf,
            e.graph_bits,
            g
          ), a === 0 && o.memory_bytes && (a = o.memory_bytes);
        }
        self.postMessage({
          type: "SOLVED",
          payload: o,
          memory: a,
          mode: i ? "wasm" : "js"
        });
      } catch (l) {
        console.error("Solver Error:", l), self.postMessage({ type: "ERROR", error: l.toString() });
      }
    t === "CHECK_WASM" && self.postMessage({
      type: "WASM_STATUS",
      supported: M,
      initialized: V
    });
  };
  let _;
  function k(n) {
    const t = _.__externref_table_alloc();
    return _.__wbindgen_externrefs.set(t, n), t;
  }
  function Q(n, t) {
    return n = n >>> 0, R().subarray(n / 1, n / 1 + t);
  }
  function P(n, t) {
    return n = n >>> 0, kt(n, t);
  }
  let O = null;
  function Rt() {
    return (O === null || O.byteLength === 0) && (O = new Uint32Array(_.memory.buffer)), O;
  }
  let j = null;
  function R() {
    return (j === null || j.byteLength === 0) && (j = new Uint8Array(_.memory.buffer)), j;
  }
  function L(n, t) {
    try {
      return n.apply(this, t);
    } catch (e) {
      const s = k(e);
      _.__wbindgen_exn_store(s);
    }
  }
  function N(n) {
    return n == null;
  }
  function _t(n, t) {
    const e = t(n.length * 4, 4) >>> 0;
    return Rt().set(n, e / 4), S = n.length, e;
  }
  function It(n, t) {
    const e = t(n.length * 1, 1) >>> 0;
    return R().set(n, e / 1), S = n.length, e;
  }
  function z(n, t, e) {
    if (e === void 0) {
      const o = C.encode(n), a = t(o.length, 1) >>> 0;
      return R().subarray(a, a + o.length).set(o), S = o.length, a;
    }
    let s = n.length, r = t(s, 1) >>> 0;
    const l = R();
    let i = 0;
    for (; i < s; i++) {
      const o = n.charCodeAt(i);
      if (o > 127)
        break;
      l[r + i] = o;
    }
    if (i !== s) {
      i !== 0 && (n = n.slice(i)), r = e(r, s, s = i + n.length * 3, 1) >>> 0;
      const o = R().subarray(r + i, r + s), a = C.encodeInto(n, o);
      i += a.written, r = e(r, s, i, 1) >>> 0;
    }
    return S = i, r;
  }
  function tt(n) {
    const t = _.__wbindgen_externrefs.get(n);
    return _.__externref_table_dealloc(n), t;
  }
  let q = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 });
  q.decode();
  const Lt = 2146435072;
  let X = 0;
  function kt(n, t) {
    return X += t, X >= Lt && (q = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }), q.decode(), X = t), q.decode(R().subarray(n, n + t));
  }
  const C = new TextEncoder();
  "encodeInto" in C || (C.encodeInto = function(n, t) {
    const e = C.encode(n);
    return t.set(e), {
      read: n.length,
      written: e.length
    };
  });
  let S = 0;
  function Ot() {
    return _.get_memory_bytes() >>> 0;
  }
  function jt(n) {
    const t = _t(n, _.__wbindgen_malloc), e = S, s = _.serialize_cycle(t, e);
    var r = Q(s[0], s[1]).slice();
    return _.__wbindgen_free(s[0], s[1] * 1, 1), r;
  }
  function zt(n, t, e, s) {
    const r = z(n, _.__wbindgen_malloc, _.__wbindgen_realloc), l = S, i = z(t, _.__wbindgen_malloc, _.__wbindgen_realloc), o = S, a = _.solve_wasm(r, l, i, o, e, s);
    if (a[2])
      throw tt(a[1]);
    return tt(a[0]);
  }
  function Ct(n, t, e, s, r, l, i) {
    const o = z(n, _.__wbindgen_malloc, _.__wbindgen_realloc), a = S, g = _t(t, _.__wbindgen_malloc), b = S, f = z(e, _.__wbindgen_malloc, _.__wbindgen_realloc), u = S, c = z(s, _.__wbindgen_malloc, _.__wbindgen_realloc), m = S, y = It(r, _.__wbindgen_malloc), w = S, h = _.verify_proof(o, a, g, b, f, u, c, m, y, w, l, i);
    if (h[2])
      throw tt(h[1]);
    return h[0] !== 0;
  }
  const Dt = /* @__PURE__ */ new Set(["basic", "cors", "default"]);
  async function Nt(n, t) {
    if (typeof Response == "function" && n instanceof Response) {
      if (typeof WebAssembly.instantiateStreaming == "function")
        try {
          return await WebAssembly.instantiateStreaming(n, t);
        } catch (s) {
          if (n.ok && Dt.has(n.type) && n.headers.get("Content-Type") !== "application/wasm")
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
  function bt() {
    const n = {};
    return n.wbg = {}, n.wbg.__wbg___wbindgen_is_function_8d400b8b1af978cd = function(t) {
      return typeof t == "function";
    }, n.wbg.__wbg___wbindgen_is_object_ce774f3490692386 = function(t) {
      const e = t;
      return typeof e == "object" && e !== null;
    }, n.wbg.__wbg___wbindgen_is_string_704ef9c8fc131030 = function(t) {
      return typeof t == "string";
    }, n.wbg.__wbg___wbindgen_is_undefined_f6b95eab589e0269 = function(t) {
      return t === void 0;
    }, n.wbg.__wbg___wbindgen_throw_dd24417ed36fc46e = function(t, e) {
      throw new Error(P(t, e));
    }, n.wbg.__wbg_call_3020136f7a2d6e44 = function() {
      return L(function(t, e, s) {
        return t.call(e, s);
      }, arguments);
    }, n.wbg.__wbg_call_abb4ff46ce38be40 = function() {
      return L(function(t, e) {
        return t.call(e);
      }, arguments);
    }, n.wbg.__wbg_crypto_574e78ad8b13b65f = function(t) {
      return t.crypto;
    }, n.wbg.__wbg_getRandomValues_b8f5dbd5f3995a9e = function() {
      return L(function(t, e) {
        t.getRandomValues(e);
      }, arguments);
    }, n.wbg.__wbg_length_22ac23eaec9d8053 = function(t) {
      return t.length;
    }, n.wbg.__wbg_msCrypto_a61aeb35a24c1329 = function(t) {
      return t.msCrypto;
    }, n.wbg.__wbg_new_1ba21ce319a06297 = function() {
      return new Object();
    }, n.wbg.__wbg_new_25f239778d6112b9 = function() {
      return new Array();
    }, n.wbg.__wbg_new_no_args_cb138f77cf6151ee = function(t, e) {
      return new Function(P(t, e));
    }, n.wbg.__wbg_new_with_length_aa5eaf41d35235e5 = function(t) {
      return new Uint8Array(t >>> 0);
    }, n.wbg.__wbg_node_905d3e251edff8a2 = function(t) {
      return t.node;
    }, n.wbg.__wbg_process_dc0fbacc7c1c06f7 = function(t) {
      return t.process;
    }, n.wbg.__wbg_prototypesetcall_dfe9b766cdc1f1fd = function(t, e, s) {
      Uint8Array.prototype.set.call(Q(t, e), s);
    }, n.wbg.__wbg_randomFillSync_ac0988aba3254290 = function() {
      return L(function(t, e) {
        t.randomFillSync(e);
      }, arguments);
    }, n.wbg.__wbg_require_60cc747a6bc5215a = function() {
      return L(function() {
        return gt.require;
      }, arguments);
    }, n.wbg.__wbg_set_3fda3bac07393de4 = function(t, e, s) {
      t[e] = s;
    }, n.wbg.__wbg_set_7df433eea03a5c14 = function(t, e, s) {
      t[e >>> 0] = s;
    }, n.wbg.__wbg_static_accessor_GLOBAL_769e6b65d6557335 = function() {
      const t = typeof global > "u" ? null : global;
      return N(t) ? 0 : k(t);
    }, n.wbg.__wbg_static_accessor_GLOBAL_THIS_60cf02db4de8e1c1 = function() {
      const t = typeof globalThis > "u" ? null : globalThis;
      return N(t) ? 0 : k(t);
    }, n.wbg.__wbg_static_accessor_SELF_08f5a74c69739274 = function() {
      const t = typeof self > "u" ? null : self;
      return N(t) ? 0 : k(t);
    }, n.wbg.__wbg_static_accessor_WINDOW_a8924b26aa92d024 = function() {
      const t = typeof window > "u" ? null : window;
      return N(t) ? 0 : k(t);
    }, n.wbg.__wbg_subarray_845f2f5bce7d061a = function(t, e, s) {
      return t.subarray(e >>> 0, s >>> 0);
    }, n.wbg.__wbg_versions_c01dfd4722a88165 = function(t) {
      return t.versions;
    }, n.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(t, e) {
      return P(t, e);
    }, n.wbg.__wbindgen_cast_cb9088102bce6b30 = function(t, e) {
      return Q(t, e);
    }, n.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(t) {
      return t;
    }, n.wbg.__wbindgen_init_externref_table = function() {
      const t = _.__wbindgen_externrefs, e = t.grow(4);
      t.set(0, void 0), t.set(e + 0, void 0), t.set(e + 1, null), t.set(e + 2, !0), t.set(e + 3, !1);
    }, n;
  }
  function wt(n, t) {
    return _ = n.exports, dt.__wbindgen_wasm_module = t, O = null, j = null, _.__wbindgen_start(), _;
  }
  function Vt(n) {
    if (_ !== void 0)
      return _;
    typeof n < "u" && (Object.getPrototypeOf(n) === Object.prototype ? { module: n } = n : console.warn("using deprecated parameters for `initSync()`; pass a single object instead"));
    const t = bt();
    n instanceof WebAssembly.Module || (n = new WebAssembly.Module(n));
    const e = new WebAssembly.Instance(n, t);
    return wt(e, n);
  }
  async function dt(n) {
    if (_ !== void 0)
      return _;
    typeof n < "u" && (Object.getPrototypeOf(n) === Object.prototype ? { module_or_path: n } = n : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), typeof n > "u" && (n = new URL("zeno.wasm", self.location));
    const t = bt();
    (typeof n == "string" || typeof Request == "function" && n instanceof Request || typeof URL == "function" && n instanceof URL) && (n = fetch(n));
    const { instance: e, module: s } = await Nt(await n, t);
    return wt(e, s);
  }
  var ot = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    default: dt,
    get_memory_bytes: Ot,
    initSync: Vt,
    serialize_cycle: jt,
    solve_wasm: zt,
    verify_proof: Ct
  });
});
export default qt();
