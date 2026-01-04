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
function Q(n, t, e) {
  const s = new C(n);
  s.writeU64(2n * t);
  const i = s.finish() & e, o = new C(n);
  o.writeU64(2n * t + 1n);
  const r = o.finish() & e;
  return [i, r];
}
const X = new Uint32Array([
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
function L(n) {
  let t = 1779033703, e = 3144134277, s = 1013904242, i = 2773480762, o = 1359893119, r = 2600822924, c = 528734635, f = 1541459225;
  const d = BigInt(n.length * 8), m = (n.length + 8) % 64 < 56 ? 56 - (n.length + 8) % 64 : 120 - (n.length + 8) % 64, a = new Uint8Array(n.length + 1 + m + 8);
  a.set(n), a[n.length] = 128;
  for (let v = 0; v < 8; v++)
    a[a.length - 1 - v] = Number(d >> BigInt(v * 8) & 0xFFn);
  const u = new Uint32Array(64);
  for (let v = 0; v < a.length; v += 64) {
    for (let h = 0; h < 16; h++)
      u[h] = a[v + h * 4] << 24 | a[v + h * 4 + 1] << 16 | a[v + h * 4 + 2] << 8 | a[v + h * 4 + 3];
    for (let h = 16; h < 64; h++) {
      const E = (U(u[h - 15], 7) ^ U(u[h - 15], 18) ^ u[h - 15] >>> 3) >>> 0, R = (U(u[h - 2], 17) ^ U(u[h - 2], 19) ^ u[h - 2] >>> 10) >>> 0;
      u[h] = u[h - 16] + E + u[h - 7] + R >>> 0;
    }
    let w = t, g = e, p = s, M = i, b = o, S = r, B = c, F = f;
    for (let h = 0; h < 64; h++) {
      const E = (U(b, 6) ^ U(b, 11) ^ U(b, 25)) >>> 0, R = (b & S ^ ~b & B) >>> 0, x = F + E + R + X[h] + u[h] >>> 0, T = (U(w, 2) ^ U(w, 13) ^ U(w, 22)) >>> 0, _ = (w & g ^ w & p ^ g & p) >>> 0, z = T + _ >>> 0;
      F = B, B = S, S = b, b = M + x >>> 0, M = p, p = g, g = w, w = x + z >>> 0;
    }
    t = t + w >>> 0, e = e + g >>> 0, s = s + p >>> 0, i = i + M >>> 0, o = o + b >>> 0, r = r + S >>> 0, c = c + B >>> 0, f = f + F >>> 0;
  }
  const l = new Uint8Array(32), y = new DataView(l.buffer);
  return y.setUint32(0, t, !1), y.setUint32(4, e, !1), y.setUint32(8, s, !1), y.setUint32(12, i, !1), y.setUint32(16, o, !1), y.setUint32(20, r, !1), y.setUint32(24, c, !1), y.setUint32(28, f, !1), l;
}
function U(n, t) {
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
    for (let o = s.length - 1; o >= 0; o--) {
      const r = (~s[o] & 255) + i;
      s[o] = r & 255, i = r >> 8;
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
function W(n) {
  const t = N(n.a), e = N(n.b), s = new Uint8Array(2 + t.length + 2 + e.length), i = new DataView(s.buffer);
  return i.setUint16(0, t.length, !1), s.set(t, 2), i.setUint16(2 + t.length, e.length, !1), s.set(e, 4 + t.length), s;
}
function q(n) {
  const t = 2n * n.a;
  let e = (n.b % t + t) % t;
  e > n.a ? e -= t : e <= -n.a && (e += t);
  const i = e * e - n.discriminant, o = 4n * n.a, r = i / o;
  return { a: n.a, b: e, c: r, discriminant: n.discriminant };
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
function Y(n) {
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
  const e = n.a, s = t.a, i = n.b, o = t.b, r = t.c, c = (i + o) / 2n, f = V(e, s), d = f.gcd, m = f.y, a = V(d, c), u = a.gcd, l = a.x, y = a.y, v = l * m, w = y, g = v * (i - o), p = w * r, M = g - p, b = 2n * e / u;
  let S = M % b;
  S < 0n && (S += b);
  const B = S, F = u * u, h = e * s / F, R = s / u * B, x = o + R, T = x * x - n.discriminant, _ = h * 4n, z = T / _;
  return O({ a: h, b: x, c: z, discriminant: n.discriminant });
}
function G(n) {
  return K(n, n);
}
function P(n, t) {
  let e = Y(n.discriminant), s = n, i = t;
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
  for (let o = 0; o < Math.min(t, i.length); o++) {
    const r = i[o];
    if (r >= n)
      continue;
    let c = A(r, s, n);
    if (c === 1n || c === n - 1n)
      continue;
    let f = !0;
    for (let d = 0n; d < e - 1n; d++)
      if (c = A(c, 2n, n), c === n - 1n) {
        f = !1;
        break;
      }
    if (f)
      return !1;
  }
  return !0;
}
function tt(n, t) {
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
  let o = A(i, s, t), r = A(n, (s + 1n) / 2n, t), c = A(n, s, t), f = e;
  for (; c !== 1n; ) {
    let d = c, m = 0n;
    for (; d !== 1n; )
      if (d = d * d % t, m++, m === f)
        return 0n;
    let a = o;
    for (let u = 0n; u < f - m - 1n; u++)
      a = a * a % t;
    f = m, o = a * a % t, c = c * o % t, r = r * a % t;
  }
  return r;
}
function nt(n, t) {
  const e = L(n);
  let s = j(e);
  for (; ; ) {
    if (s % 2n === 0n) {
      s++;
      continue;
    }
    if (Z(s, 40)) {
      const u = A(t, (s - 1n) / 2n, s), l = (1n % s + s) % s;
      if (u === l || u === 1n)
        break;
    }
    s++;
  }
  const i = s, o = (t % i + i) % i;
  let r = tt(o, i);
  const c = r % 2n === 0n ? i - r : r, f = c * c, d = i * 4n, a = (f - t) / d;
  return O({ a: i, b: c, c: a, discriminant: t });
}
function et(n, t, e) {
  const s = W(n), i = W(t), o = N(e), r = new Uint8Array(s.length + i.length + o.length);
  r.set(s, 0), r.set(i, s.length), r.set(o, s.length + i.length);
  const c = L(r);
  let f = 0n;
  for (; ; ) {
    const d = new Uint8Array(8);
    new DataView(d.buffer).setBigUint64(0, f, !1);
    const a = new Uint8Array(c.length + 8);
    a.set(c, 0), a.set(d, c.length);
    const u = L(a);
    let l = j(u.slice(0, 16));
    if (l |= 1n, Z(l, 40))
      return l;
    f++;
  }
}
function st(n) {
  const t = [...n].sort((i, o) => i - o), e = new Uint8Array(t.length * 4), s = new DataView(e.buffer);
  for (let i = 0; i < t.length; i++)
    s.setUint32(i * 4, t[i], !0);
  return e;
}
function it(n, t, e) {
  if (n.length < 16)
    throw new Error("Seed too short");
  const s = n.slice(0, 16), i = 1n << BigInt(t + 2), o = (1n << BigInt(t)) - 1n, r = 1 << t, c = new Array(r);
  for (let l = 0; l < r; l++)
    c[l] = [];
  const f = Number(i), d = Math.floor(f / 100);
  for (let l = 0; l < f; l++) {
    const [y, v] = Q(s, BigInt(l), o), w = Number(y), g = Number(v);
    w !== g && (c[w].push([g, l]), c[g].push([w, l]), e && l % d === 0 && e(Math.floor(l / f * 50)));
  }
  const m = /* @__PURE__ */ new Set(), a = [];
  function u(l, y, v) {
    m.add(l);
    for (const [w, g] of c[l]) {
      if (w === y && v === 41)
        return [...a, g];
      if (!m.has(w) && v < 42) {
        a.push(g);
        const p = u(w, y, v + 1);
        if (p)
          return p;
        a.pop();
      }
    }
    return m.delete(l), null;
  }
  for (let l = 0; l < r; l++) {
    if (c[l].length === 0)
      continue;
    e && l % 1e3 === 0 && e(50 + Math.floor(l / r * 50)), m.clear(), a.length = 0;
    const y = u(l, l, 0);
    if (y)
      return e && e(100), y;
  }
  return null;
}
function ot(n, t, e, s, i) {
  const o = D(n), r = D(t), f = -j(r), m = it(o, s, i ? (F) => i(Math.floor(F * 0.6)) : void 0);
  if (!m)
    throw new Error("No 42-cycle found (try different seed)");
  i && i(60);
  const a = st(m), u = nt(a, f);
  i && i(65);
  let l = u;
  const y = 65, w = 90 - y;
  for (let F = 0; F < e; F++)
    if (l = G(l), i && F % 100 === 0) {
      const h = F / e * w;
      i(Math.floor(y + h));
    }
  i && i(90);
  const g = et(u, l, f), M = rt(e) / g, b = P(u, M);
  i && i(100);
  const S = W(l), B = W(b);
  return {
    cycle: m,
    y: H(S),
    pi: H(B),
    memory_bytes: (1 << s) * 1200
    // Fallback estimate: ~1.2KB per node overhead for JS objects
  };
}
function rt(n) {
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
function ct() {
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
let $ = null, k = !1, J = !0, I = !1;
try {
  I = ct();
} catch (n) {
  console.warn("Failed to check WASM support, defaulting to false:", n), I = !1;
}
async function lt(n) {
  if (!I)
    return console.warn("WebAssembly not supported in this environment. Using JS fallback."), !1;
  try {
    const t = (await import("./assets/zeno_core-26a7c4c3.js")).default;
    return await t(n || "zeno.wasm"), $ = await import("./assets/zeno_core-26a7c4c3.js"), k = !0, console.log("WASM solver initialized successfully"), !0;
  } catch (t) {
    return console.warn("WASM initialization failed, falling back to JS solver:", t), !1;
  }
}
self.onmessage = async (n) => {
  const { type: t, challenge: e, wasm_url: s, force_js: i } = n.data;
  if (t === "SOLVE")
    try {
      const o = i || !I;
      !o && !k && (J = await lt(s));
      const r = J && k && !o;
      self.postMessage({
        type: "STATUS",
        mode: r ? "wasm" : "js",
        wasmSupported: I
      }), console.log(`Starting Zeno Solver (${r ? "WASM" : "JS fallback"})...`);
      let c, f = 0;
      if (r)
        c = $.solve_wasm(
          e.seed,
          e.discriminant,
          BigInt(e.vdf),
          e.graph_bits
        ), f = c.memory_bytes || 0;
      else {
        const d = (m) => {
          if (self.performance?.memory?.usedJSHeapSize) {
            const a = self.performance.memory.usedJSHeapSize;
            a > f && (f = a);
          }
          self.postMessage({ type: "PROGRESS", percent: m });
        };
        c = ot(
          e.seed,
          e.discriminant,
          e.vdf,
          e.graph_bits,
          d
        ), f === 0 && c.memory_bytes && (f = c.memory_bytes);
      }
      self.postMessage({
        type: "SOLVED",
        payload: c,
        memory: f,
        mode: r ? "wasm" : "js"
      });
    } catch (o) {
      console.error("Solver Error:", o), self.postMessage({ type: "ERROR", error: o.toString() });
    }
  t === "CHECK_WASM" && self.postMessage({
    type: "WASM_STATUS",
    supported: I,
    initialized: k
  });
};
