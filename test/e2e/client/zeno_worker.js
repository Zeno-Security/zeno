class q {
  v0;
  v1;
  v2;
  v3;
  buf = 0n;
  bufLen = 0;
  totalLen = 0;
  constructor(t) {
    const e = this.readU64LE(t, 0), i = this.readU64LE(t, 8);
    this.v0 = e ^ 0x736f6d6570736575n, this.v1 = i ^ 0x646f72616e646f6dn, this.v2 = e ^ 0x6c7967656e657261n, this.v3 = i ^ 0x7465646279746573n;
  }
  readU64LE(t, e) {
    let i = 0n;
    for (let s = 0; s < 8; s++)
      i |= BigInt(t[e + s]) << BigInt(s * 8);
    return i;
  }
  rotl(t, e) {
    const i = 0xFFFFFFFFFFFFFFFFn;
    return (t << BigInt(e) | t >> BigInt(64 - e)) & i;
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
  const i = new q(n);
  i.writeU64(2n * t);
  const s = i.finish() & e, r = new q(n);
  r.writeU64(2n * t + 1n);
  const l = r.finish() & e;
  return [s, l];
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
function C(n) {
  let t = 1779033703, e = 3144134277, i = 1013904242, s = 2773480762, r = 1359893119, l = 2600822924, c = 528734635, a = 1541459225;
  const m = BigInt(n.length * 8), u = (64 - (n.length + 1 + 8) % 64) % 64, f = new Uint8Array(n.length + 1 + u + 8);
  f.set(n), f[n.length] = 128;
  for (let d = 0; d < 8; d++)
    f[f.length - 1 - d] = Number(m >> BigInt(d * 8) & 0xFFn);
  const o = new Uint32Array(64);
  for (let d = 0; d < f.length; d += 64) {
    for (let h = 0; h < 16; h++)
      o[h] = f[d + h * 4] << 24 | f[d + h * 4 + 1] << 16 | f[d + h * 4 + 2] << 8 | f[d + h * 4 + 3];
    for (let h = 16; h < 64; h++) {
      const k = (S(o[h - 15], 7) ^ S(o[h - 15], 18) ^ o[h - 15] >>> 3) >>> 0, x = (S(o[h - 2], 17) ^ S(o[h - 2], 19) ^ o[h - 2] >>> 10) >>> 0;
      o[h] = o[h - 16] + k + o[h - 7] + x >>> 0;
    }
    let y = t, p = e, U = i, B = s, b = r, I = l, F = c, M = a;
    for (let h = 0; h < 64; h++) {
      const k = (S(b, 6) ^ S(b, 11) ^ S(b, 25)) >>> 0, x = (b & I ^ ~b & F) >>> 0, E = M + k + x + Y[h] + o[h] >>> 0, _ = (S(y, 2) ^ S(y, 13) ^ S(y, 22)) >>> 0, z = (y & p ^ y & U ^ p & U) >>> 0, Q = _ + z >>> 0;
      M = F, F = I, I = b, b = B + E >>> 0, B = U, U = p, p = y, y = E + Q >>> 0;
    }
    t = t + y >>> 0, e = e + p >>> 0, i = i + U >>> 0, s = s + B >>> 0, r = r + b >>> 0, l = l + I >>> 0, c = c + F >>> 0, a = a + M >>> 0;
  }
  const g = new Uint8Array(32), w = new DataView(g.buffer);
  return w.setUint32(0, t, !1), w.setUint32(4, e, !1), w.setUint32(8, i, !1), w.setUint32(12, s, !1), w.setUint32(16, r, !1), w.setUint32(20, l, !1), w.setUint32(24, c, !1), w.setUint32(28, a, !1), g;
}
function S(n, t) {
  return (n >>> t | n << 32 - t) >>> 0;
}
function N(n) {
  if (n === 0n)
    return new Uint8Array([0]);
  if (n > 0n) {
    let t = n.toString(16);
    return t.length % 2 === 1 && (t = "0" + t), parseInt(t.substring(0, 2), 16) & 128 && (t = "00" + t), L(t);
  } else {
    let t = 1;
    for (; ; ) {
      const r = -(1n << BigInt(t * 8) - 1n);
      if (n >= r)
        break;
      t++;
    }
    let s = ((1n << 8n * BigInt(t)) + n).toString(16);
    for (; s.length < t * 2; )
      s = "0" + s;
    return L(s);
  }
}
function j(n) {
  let t = 0n;
  for (const e of n)
    t = t << 8n | BigInt(e);
  return t;
}
function T(n) {
  const t = N(n.a), e = N(n.b), i = new Uint8Array(2 + t.length + 2 + e.length), s = new DataView(i.buffer);
  return s.setUint16(0, t.length, !1), i.set(t, 2), s.setUint16(2 + t.length, e.length, !1), i.set(e, 4 + t.length), i;
}
function D(n) {
  const t = 2n * n.a;
  let e = (n.b % t + t) % t;
  e > n.a ? e -= t : e <= -n.a && (e += t);
  const s = e * e - n.discriminant, r = 4n * n.a, l = s / r;
  return { a: n.a, b: e, c: l, discriminant: n.discriminant };
}
function O(n) {
  let t = D(n);
  for (; ; )
    if (t.a > t.c) {
      const e = t.a;
      t = {
        a: t.c,
        b: -t.b,
        c: e,
        discriminant: t.discriminant
      }, t = D(t);
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
  const { gcd: e, x: i, y: s } = V(t, n % t);
  return { gcd: e, x: s, y: i - n / t * s };
}
function K(n, t) {
  const e = n.a, i = t.a, s = n.b, r = t.b, l = t.c, c = (s + r) / 2n, a = V(e, i), m = a.gcd, v = a.y, u = V(m, c), f = u.gcd, o = u.x, g = u.y, w = o * v, d = g, y = w * (s - r), p = d * l, U = y - p, B = 2n * e / f;
  let b = U % B;
  b < 0n && (b += B);
  const I = b, F = f * f, M = e * i / F, k = i / f * I, x = r + k, E = x * x - n.discriminant, _ = M * 4n, z = E / _;
  return O({ a: M, b: x, c: z, discriminant: n.discriminant });
}
function G(n) {
  return K(n, n);
}
function tt(n, t) {
  let e = P(n.discriminant), i = n, s = t;
  for (; s > 0n; )
    s & 1n && (e = K(e, i)), i = G(i), s >>= 1n;
  return e;
}
function A(n, t, e) {
  let i = 1n;
  for (n = (n % e + e) % e; t > 0n; )
    t & 1n && (i = i * n % e), t >>= 1n, n = n * n % e;
  return i;
}
function Z(n, t) {
  if (n < 2n)
    return !1;
  if (n === 2n || n === 3n)
    return !0;
  if (n % 2n === 0n)
    return !1;
  let e = 0n, i = n - 1n;
  for (; i % 2n === 0n; )
    i /= 2n, e++;
  const s = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (let r = 0; r < Math.min(t, s.length); r++) {
    const l = s[r];
    if (l >= n)
      continue;
    let c = A(l, i, n);
    if (c === 1n || c === n - 1n)
      continue;
    let a = !0;
    for (let m = 0n; m < e - 1n; m++)
      if (c = A(c, 2n, n), c === n - 1n) {
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
  let e = 0n, i = t - 1n;
  for (; i % 2n === 0n; )
    i /= 2n, e++;
  let s = 2n;
  for (; A(s, (t - 1n) / 2n, t) === 1n; )
    s++;
  let r = A(s, i, t), l = A(n, (i + 1n) / 2n, t), c = A(n, i, t), a = e;
  for (; c !== 1n; ) {
    let m = c, v = 0n;
    for (; m !== 1n; )
      if (m = m * m % t, v++, v === a)
        return 0n;
    let u = r;
    for (let f = 0n; f < a - v - 1n; f++)
      u = u * u % t;
    a = v, r = u * u % t, c = c * r % t, l = l * u % t;
  }
  return l;
}
function et(n, t) {
  const e = C(n);
  let i = j(e);
  for (; ; ) {
    if (i % 2n === 0n) {
      i++;
      continue;
    }
    if (Z(i, 40)) {
      const f = A(t, (i - 1n) / 2n, i), o = (1n % i + i) % i;
      if (f === o || f === 1n)
        break;
    }
    i++;
  }
  const s = i, r = (t % s + s) % s;
  let l = nt(r, s);
  const c = l % 2n === 0n ? s - l : l, a = c * c, m = s * 4n, u = (a - t) / m;
  return O({ a: s, b: c, c: u, discriminant: t });
}
function st(n, t, e) {
  const i = T(n), s = T(t), r = N(e), l = new Uint8Array(i.length + s.length + r.length);
  l.set(i, 0), l.set(s, i.length), l.set(r, i.length + s.length);
  const c = C(l);
  let a = 0n;
  for (; ; ) {
    const m = new Uint8Array(8);
    new DataView(m.buffer).setBigUint64(0, a, !1);
    const u = new Uint8Array(c.length + 8);
    u.set(c, 0), u.set(m, c.length);
    const f = C(u);
    let o = j(f.slice(0, 16));
    if (o |= 1n, Z(o, 40))
      return o;
    a++;
  }
}
function it(n) {
  const t = [...n].sort((s, r) => s - r), e = new Uint8Array(t.length * 4), i = new DataView(e.buffer);
  for (let s = 0; s < t.length; s++)
    i.setUint32(s * 4, t[s], !0);
  return e;
}
function ot(n, t, e) {
  if (n.length < 16)
    throw new Error("Seed too short");
  const i = n.slice(0, 16), s = 1n << BigInt(t + 2), r = (1n << BigInt(t)) - 1n, l = 1 << t, c = new Array(l);
  for (let o = 0; o < l; o++)
    c[o] = [];
  const a = Number(s), m = Math.floor(a / 100);
  for (let o = 0; o < a; o++) {
    const [g, w] = X(i, BigInt(o), r), d = Number(g), y = Number(w);
    d !== y && (c[d].push([y, o]), c[y].push([d, o]), e && o % m === 0 && e(Math.floor(o / a * 50)));
  }
  const v = /* @__PURE__ */ new Set(), u = [];
  function f(o, g, w) {
    v.add(o);
    for (const [d, y] of c[o]) {
      if (d === g && w === 41)
        return [...u, y];
      if (!v.has(d) && w < 42) {
        u.push(y);
        const p = f(d, g, w + 1);
        if (p)
          return p;
        u.pop();
      }
    }
    return v.delete(o), null;
  }
  for (let o = 0; o < l; o++) {
    if (c[o].length === 0)
      continue;
    e && o % 1e3 === 0 && e(50 + Math.floor(o / l * 50)), v.clear(), u.length = 0;
    const g = f(o, o, 0);
    if (g)
      return e && e(100), g;
  }
  return null;
}
function rt(n, t, e, i, s) {
  const r = L(n), l = L(t), a = -j(l), v = ot(r, i, s ? (F) => s(Math.floor(F * 0.6)) : void 0);
  if (!v)
    throw new Error("No 42-cycle found (try different seed)");
  s && s(60);
  const u = it(v), f = et(u, a);
  s && s(65);
  let o = f;
  const g = 65, d = 90 - g;
  for (let F = 0; F < e; F++)
    if (o = G(o), s && F % 100 === 0) {
      const M = F / e * d;
      s(Math.floor(g + M));
    }
  s && s(90);
  const y = st(f, o, a), U = ct(e) / y, B = tt(f, U);
  s && s(100);
  const b = T(o), I = T(B);
  return {
    cycle: v,
    y: H(b),
    pi: H(I),
    memory_bytes: (1 << i) * 1200
    // Fallback estimate: ~1.2KB per node overhead for JS objects
  };
}
function ct(n) {
  return 1n << BigInt(n);
}
function L(n) {
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
  const { type: t, challenge: e, wasm_url: i, force_js: s } = n.data;
  if (t === "SOLVE")
    try {
      const r = s || !R;
      !r && !W && (J = await at(i));
      const l = J && W && !r;
      self.postMessage({
        type: "STATUS",
        mode: l ? "wasm" : "js",
        wasmSupported: R
      }), console.log(`Starting Zeno Solver (${l ? "WASM" : "JS fallback"})...`);
      let c, a = 0;
      if (l)
        c = $.solve_wasm(
          e.seed,
          e.discriminant,
          BigInt(e.vdf),
          e.graph_bits
        ), a = c.memory_bytes || 0;
      else {
        const m = (v) => {
          if (self.performance?.memory?.usedJSHeapSize) {
            const u = self.performance.memory.usedJSHeapSize;
            u > a && (a = u);
          }
          self.postMessage({ type: "PROGRESS", percent: v });
        };
        c = rt(
          e.seed,
          e.discriminant,
          e.vdf,
          e.graph_bits,
          m
        ), a === 0 && c.memory_bytes && (a = c.memory_bytes);
      }
      self.postMessage({
        type: "SOLVED",
        payload: c,
        memory: a,
        mode: l ? "wasm" : "js"
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
