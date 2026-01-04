class et {
  v0;
  v1;
  v2;
  v3;
  buf = 0n;
  bufLen = 0;
  totalLen = 0;
  constructor(t) {
    const n = this.readU64LE(t, 0), s = this.readU64LE(t, 8);
    this.v0 = n ^ 0x736f6d6570736575n, this.v1 = s ^ 0x646f72616e646f6dn, this.v2 = n ^ 0x6c7967656e657261n, this.v3 = s ^ 0x7465646279746573n;
  }
  readU64LE(t, n) {
    let s = 0n;
    for (let r = 0; r < 8; r++)
      s |= BigInt(t[n + r]) << BigInt(r * 8);
    return s;
  }
  rotl(t, n) {
    const s = 0xFFFFFFFFFFFFFFFFn;
    return (t << BigInt(n) | t >> BigInt(64 - n)) & s;
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
function yt(e, t, n) {
  const s = new et(e);
  s.writeU64(2n * t);
  const r = s.finish() & n, o = new et(e);
  o.writeU64(2n * t + 1n);
  const i = o.finish() & n;
  return [r, i];
}
const mt = new Uint32Array([
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
function Y(e) {
  let t = 1779033703, n = 3144134277, s = 1013904242, r = 2773480762, o = 1359893119, i = 2600822924, c = 528734635, l = 1541459225;
  const _ = BigInt(e.length * 8), d = (64 - (e.length + 1 + 8) % 64) % 64, u = new Uint8Array(e.length + 1 + d + 8);
  u.set(e), u[e.length] = 128;
  for (let h = 0; h < 8; h++)
    u[u.length - 1 - h] = Number(_ >> BigInt(h * 8) & 0xFFn);
  const a = new Uint32Array(64);
  for (let h = 0; h < u.length; h += 64) {
    for (let b = 0; b < 16; b++)
      a[b] = u[h + b * 4] << 24 | u[h + b * 4 + 1] << 16 | u[h + b * 4 + 2] << 8 | u[h + b * 4 + 3];
    for (let b = 16; b < 64; b++) {
      const W = (F(a[b - 15], 7) ^ F(a[b - 15], 18) ^ a[b - 15] >>> 3) >>> 0, R = (F(a[b - 2], 17) ^ F(a[b - 2], 19) ^ a[b - 2] >>> 10) >>> 0;
      a[b] = a[b - 16] + W + a[b - 7] + R >>> 0;
    }
    let y = t, S = n, A = s, M = r, v = o, B = i, x = c, I = l;
    for (let b = 0; b < 64; b++) {
      const W = (F(v, 6) ^ F(v, 11) ^ F(v, 25)) >>> 0, R = (v & B ^ ~v & x) >>> 0, N = I + W + R + mt[b] + a[b] >>> 0, P = (F(y, 2) ^ F(y, 13) ^ F(y, 22)) >>> 0, K = (y & S ^ y & A ^ S & A) >>> 0, gt = P + K >>> 0;
      I = x, x = B, B = v, v = M + N >>> 0, M = A, A = S, S = y, y = N + gt >>> 0;
    }
    t = t + y >>> 0, n = n + S >>> 0, s = s + A >>> 0, r = r + M >>> 0, o = o + v >>> 0, i = i + B >>> 0, c = c + x >>> 0, l = l + I >>> 0;
  }
  const m = new Uint8Array(32), g = new DataView(m.buffer);
  return g.setUint32(0, t, !1), g.setUint32(4, n, !1), g.setUint32(8, s, !1), g.setUint32(12, r, !1), g.setUint32(16, o, !1), g.setUint32(20, i, !1), g.setUint32(24, c, !1), g.setUint32(28, l, !1), m;
}
function F(e, t) {
  return (e >>> t | e << 32 - t) >>> 0;
}
function $(e) {
  if (e === 0n)
    return new Uint8Array([0]);
  if (e > 0n) {
    let t = e.toString(16);
    return t.length % 2 === 1 && (t = "0" + t), parseInt(t.substring(0, 2), 16) & 128 && (t = "00" + t), G(t);
  } else {
    let t = 1;
    for (; ; ) {
      const o = -(1n << BigInt(t * 8) - 1n);
      if (e >= o)
        break;
      t++;
    }
    let r = ((1n << 8n * BigInt(t)) + e).toString(16);
    for (; r.length < t * 2; )
      r = "0" + r;
    return G(r);
  }
}
function tt(e) {
  let t = 0n;
  for (const n of e)
    t = t << 8n | BigInt(n);
  return t;
}
function j(e) {
  const t = $(e.a), n = $(e.b), s = new Uint8Array(2 + t.length + 2 + n.length), r = new DataView(s.buffer);
  return r.setUint16(0, t.length, !1), s.set(t, 2), r.setUint16(2 + t.length, n.length, !1), s.set(n, 4 + t.length), s;
}
function nt(e) {
  const t = 2n * e.a;
  let n = (e.b % t + t) % t;
  n > e.a ? n -= t : n <= -e.a && (n += t);
  const r = n * n - e.discriminant, o = 4n * e.a, i = r / o;
  return { a: e.a, b: n, c: i, discriminant: e.discriminant };
}
function lt(e) {
  let t = nt(e);
  for (; ; )
    if (t.a > t.c) {
      const n = t.a;
      t = {
        a: t.c,
        b: -t.b,
        c: n,
        discriminant: t.discriminant
      }, t = nt(t);
    } else {
      t.a === t.c && t.b < 0n && (t = { ...t, b: -t.b });
      break;
    }
  return t;
}
function pt(e) {
  const t = 1n, n = (t - e) / 4n;
  return { a: t, b: t, c: n, discriminant: e };
}
function st(e, t) {
  let n = e, s = t, r = 1n, o = 0n, i = 0n, c = 1n;
  for (; s !== 0n; ) {
    const l = n / s;
    let _ = n;
    n = s, s = _ - l * s, _ = r, r = o, o = _ - l * o, _ = i, i = c, c = _ - l * c;
  }
  return n < 0n && (n = -n, r = -r, i = -i), { gcd: n, x: r, y: i };
}
function at(e, t) {
  const n = e.a, s = t.a, r = e.b, o = t.b, i = t.c, c = (r + o) / 2n, l = st(n, s), _ = l.gcd, w = l.y, d = st(_, c), u = d.gcd, a = d.x, m = d.y, g = a * w, h = m, y = g * (r - o), S = h * i * 2n, A = y - S, M = 2n * n / u;
  let v = A % M;
  v < 0n && (v += M);
  const B = v, x = u * u, I = n * s / x, W = s / u * B, R = o + W, N = R * R - e.discriminant, P = I * 4n, K = N / P;
  return lt({ a: I, b: R, c: K, discriminant: e.discriminant });
}
function ft(e) {
  return at(e, e);
}
function vt(e, t) {
  let n = pt(e.discriminant), s = e, r = t;
  for (; r > 0n; )
    r & 1n && (n = at(n, s)), s = ft(s), r >>= 1n;
  return n;
}
function U(e, t, n) {
  let s = 1n;
  for (e = (e % n + n) % n; t > 0n; )
    t & 1n && (s = s * e % n), t >>= 1n, e = e * e % n;
  return s;
}
function ut(e, t) {
  if (e < 2n)
    return !1;
  if (e === 2n || e === 3n)
    return !0;
  if (e % 2n === 0n)
    return !1;
  let n = 0n, s = e - 1n;
  for (; s % 2n === 0n; )
    s /= 2n, n++;
  const r = [
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
  for (const o of r) {
    if (e <= o)
      break;
    let i = U(o, s, e);
    if (i === 1n || i === e - 1n)
      continue;
    let c = !0;
    for (let l = 0n; l < n - 1n; l++)
      if (i = U(i, 2n, e), i === e - 1n) {
        c = !1;
        break;
      }
    if (c)
      return !1;
  }
  return !0;
}
function St(e, t) {
  if (U(e, (t - 1n) / 2n, t) !== 1n)
    return 0n;
  if (t % 4n === 3n)
    return U(e, (t + 1n) / 4n, t);
  let n = 0n, s = t - 1n;
  for (; s % 2n === 0n; )
    s /= 2n, n++;
  let r = 2n;
  for (; U(r, (t - 1n) / 2n, t) === 1n; )
    r++;
  let o = U(r, s, t), i = U(e, (s + 1n) / 2n, t), c = U(e, s, t), l = n;
  for (; c !== 1n; ) {
    let _ = c, w = 0n;
    for (; _ !== 1n; )
      if (_ = _ * _ % t, w++, w === l)
        return 0n;
    let d = o;
    for (let u = 0n; u < l - w - 1n; u++)
      d = d * d % t;
    l = w, o = d * d % t, c = c * o % t, i = i * d % t;
  }
  return i;
}
function Ft(e, t) {
  const n = Y(e);
  let s = tt(n);
  for (; ; ) {
    if (s % 2n === 0n) {
      s++;
      continue;
    }
    if (ut(s)) {
      const u = U(t, (s - 1n) / 2n, s), a = (1n % s + s) % s;
      if (u === a || u === 1n)
        break;
    }
    s++;
  }
  const r = s, o = (t % r + r) % r;
  let i = St(o, r);
  const c = i % 2n === 0n ? r - i : i, l = c * c, _ = r * 4n, d = (l - t) / _;
  return lt({ a: r, b: c, c: d, discriminant: t });
}
function At(e, t, n) {
  const s = j(e), r = j(t), o = $(n), i = new Uint8Array(s.length + r.length + o.length);
  i.set(s, 0), i.set(r, s.length), i.set(o, s.length + r.length);
  const c = Y(i);
  let l = 0n;
  for (; ; ) {
    const _ = new Uint8Array(8);
    new DataView(_.buffer).setBigUint64(0, l, !1);
    const d = new Uint8Array(c.length + 8);
    d.set(c, 0), d.set(_, c.length);
    const u = Y(d);
    let a = tt(u.slice(0, 16));
    if (a |= 1n, ut(a))
      return a;
    l++;
  }
}
function Ut(e) {
  const t = [...e].sort((r, o) => r - o), n = new Uint8Array(t.length * 4), s = new DataView(n.buffer);
  for (let r = 0; r < t.length; r++)
    s.setUint32(r * 4, t[r], !0);
  return n;
}
function Et(e, t, n) {
  if (e.length < 16)
    throw new Error("Seed too short");
  const s = e.slice(0, 16), r = 1n << BigInt(t + 2), o = (1n << BigInt(t)) - 1n, i = 1 << t, c = new Array(i);
  for (let a = 0; a < i; a++)
    c[a] = [];
  const l = Number(r), _ = Math.floor(l / 100);
  for (let a = 0; a < l; a++) {
    const [m, g] = yt(s, BigInt(a), o), h = Number(m), y = Number(g);
    h !== y && (c[h].push([y, a]), c[y].push([h, a]), n && a % _ === 0 && n(Math.floor(a / l * 50)));
  }
  const w = /* @__PURE__ */ new Set(), d = [];
  function u(a, m, g) {
    w.add(a);
    for (const [h, y] of c[a]) {
      if (h === m && g === 41)
        return [...d, y];
      if (!w.has(h) && g < 42) {
        d.push(y);
        const S = u(h, m, g + 1);
        if (S)
          return S;
        d.pop();
      }
    }
    return w.delete(a), null;
  }
  for (let a = 0; a < i; a++) {
    if (c[a].length === 0)
      continue;
    n && a % 1e3 === 0 && n(50 + Math.floor(a / i * 50)), w.clear(), d.length = 0;
    const m = u(a, a, 0);
    if (m)
      return n && n(100), m;
  }
  return null;
}
function Bt(e, t, n, s, r) {
  const o = G(e), i = G(t), l = -tt(i), w = Et(o, s, r ? (b) => r(Math.floor(b * 0.6)) : void 0);
  if (!w)
    throw new Error("No 42-cycle found (try different seed)");
  r && r(60);
  const d = Ut(w), u = Ft(d, l), a = V(j(u)), m = V($(l));
  console.log("DEBUG_X_CLIENT:", a), console.log("DEBUG_SEED_CLIENT:", e), console.log("DEBUG_D_CLIENT:", m), r && r(65);
  let g = u;
  const h = 65, S = 90 - h;
  for (let b = 0; b < n; b++)
    if (g = ft(g), r && b % 100 === 0) {
      const W = b / n * S;
      r(Math.floor(h + W));
    }
  r && r(90);
  const A = At(u, g, l), v = xt(n) / A, B = vt(u, v);
  r && r(100);
  const x = j(g), I = j(B);
  return {
    cycle: w,
    y: V(x),
    pi: V(I),
    memory_bytes: (1 << s) * 1200
    // Fallback estimate: ~1.2KB per node overhead for JS objects
  };
}
function xt(e) {
  return 1n << BigInt(e);
}
function G(e) {
  const t = new Uint8Array(e.length / 2);
  for (let n = 0; n < t.length; n++)
    t[n] = parseInt(e.substr(n * 2, 2), 16);
  return t;
}
function V(e) {
  return Array.from(e).map((t) => t.toString(16).padStart(2, "0")).join("");
}
function It() {
  try {
    if (typeof WebAssembly > "u")
      return !1;
    if (typeof WebAssembly == "object" && typeof WebAssembly.instantiate == "function") {
      const e = new Uint8Array([
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
      return WebAssembly.validate(e);
    }
  } catch {
    return !1;
  }
  return !1;
}
let dt = null, H = !1, rt = !0, O = !1;
try {
  O = It();
} catch (e) {
  console.warn("Failed to check WASM support, defaulting to false:", e), O = !1;
}
async function Mt(e) {
  if (!O)
    return console.warn("WebAssembly not supported in this environment. Using JS fallback."), !1;
  try {
    const t = (await Promise.resolve().then(function() {
      return ct;
    })).default;
    return await t(e || "zeno.wasm"), dt = await Promise.resolve().then(function() {
      return ct;
    }), H = !0, console.log("WASM solver initialized successfully"), !0;
  } catch (t) {
    return console.warn("WASM initialization failed, falling back to JS solver:", t), !1;
  }
}
self.onmessage = async (e) => {
  const { type: t, challenge: n, wasm_url: s, force_js: r } = e.data;
  if (t === "SOLVE")
    try {
      const o = r || !O;
      !o && !H && (rt = await Mt(s));
      const i = rt && H && !o;
      self.postMessage({
        type: "STATUS",
        mode: i ? "wasm" : "js",
        wasmSupported: O
      }), console.log(`Starting Zeno Solver (${i ? "WASM" : "JS fallback"})...`);
      let c, l = 0;
      if (i) {
        const _ = new dt.WasmVdfSolver(
          n.seed,
          n.discriminant,
          BigInt(n.vdf),
          n.graph_bits
        );
        let w = !1;
        for (; !w; ) {
          const d = _.step(1e4);
          if (d.status === "progress") {
            if (self.performance?.memory?.usedJSHeapSize) {
              const u = self.performance.memory.usedJSHeapSize;
              u > l && (l = u);
            }
            self.postMessage({ type: "PROGRESS", percent: Math.floor(d.percent) }), await new Promise((u) => setTimeout(u, 0));
          } else
            d.status === "done" && (c = d.output, l = c.memory_bytes || l, w = !0);
        }
        _.free && _.free();
      } else {
        const _ = (w) => {
          if (self.performance?.memory?.usedJSHeapSize) {
            const d = self.performance.memory.usedJSHeapSize;
            d > l && (l = d);
          }
          self.postMessage({ type: "PROGRESS", percent: w });
        };
        c = Bt(
          n.seed,
          n.discriminant,
          n.vdf,
          n.graph_bits,
          _
        ), l === 0 && c.memory_bytes && (l = c.memory_bytes);
      }
      self.postMessage({
        type: "SOLVED",
        payload: c,
        memory: l,
        mode: i ? "wasm" : "js"
      });
    } catch (o) {
      console.error("Solver Error:", o), self.postMessage({ type: "ERROR", error: o.toString() });
    }
  t === "CHECK_WASM" && self.postMessage({
    type: "WASM_STATUS",
    supported: O,
    initialized: H
  });
};
let f;
function Wt(e) {
  const t = f.__externref_table_alloc();
  return f.__wbindgen_externrefs.set(t, e), t;
}
function Z(e) {
  const t = typeof e;
  if (t == "number" || t == "boolean" || e == null)
    return `${e}`;
  if (t == "string")
    return `"${e}"`;
  if (t == "symbol") {
    const r = e.description;
    return r == null ? "Symbol" : `Symbol(${r})`;
  }
  if (t == "function") {
    const r = e.name;
    return typeof r == "string" && r.length > 0 ? `Function(${r})` : "Function";
  }
  if (Array.isArray(e)) {
    const r = e.length;
    let o = "[";
    r > 0 && (o += Z(e[0]));
    for (let i = 1; i < r; i++)
      o += ", " + Z(e[i]);
    return o += "]", o;
  }
  const n = /\[object ([^\]]+)\]/.exec(toString.call(e));
  let s;
  if (n && n.length > 1)
    s = n[1];
  else
    return toString.call(e);
  if (s == "Object")
    try {
      return "Object(" + JSON.stringify(e) + ")";
    } catch {
      return "Object";
    }
  return e instanceof Error ? `${e.name}: ${e.message}
${e.stack}` : s;
}
function Rt(e, t) {
  return e = e >>> 0, z().subarray(e / 1, e / 1 + t);
}
let T = null;
function q() {
  return (T === null || T.buffer.detached === !0 || T.buffer.detached === void 0 && T.buffer !== f.memory.buffer) && (T = new DataView(f.memory.buffer)), T;
}
function it(e, t) {
  return e = e >>> 0, Dt(e, t);
}
let D = null;
function Tt() {
  return (D === null || D.byteLength === 0) && (D = new Uint32Array(f.memory.buffer)), D;
}
let L = null;
function z() {
  return (L === null || L.byteLength === 0) && (L = new Uint8Array(f.memory.buffer)), L;
}
function Ot(e, t) {
  try {
    return e.apply(this, t);
  } catch (n) {
    const s = Wt(n);
    f.__wbindgen_exn_store(s);
  }
}
function _t(e, t) {
  const n = t(e.length * 4, 4) >>> 0;
  return Tt().set(e, n / 4), p = e.length, n;
}
function zt(e, t) {
  const n = t(e.length * 1, 1) >>> 0;
  return z().set(e, n / 1), p = e.length, n;
}
function E(e, t, n) {
  if (n === void 0) {
    const c = C.encode(e), l = t(c.length, 1) >>> 0;
    return z().subarray(l, l + c.length).set(c), p = c.length, l;
  }
  let s = e.length, r = t(s, 1) >>> 0;
  const o = z();
  let i = 0;
  for (; i < s; i++) {
    const c = e.charCodeAt(i);
    if (c > 127)
      break;
    o[r + i] = c;
  }
  if (i !== s) {
    i !== 0 && (e = e.slice(i)), r = n(r, s, s = i + e.length * 3, 1) >>> 0;
    const c = z().subarray(r + i, r + s), l = C.encodeInto(e, c);
    i += l.written, r = n(r, s, i, 1) >>> 0;
  }
  return p = i, r;
}
function k(e) {
  const t = f.__wbindgen_externrefs.get(e);
  return f.__externref_table_dealloc(e), t;
}
let J = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 });
J.decode();
const kt = 2146435072;
let X = 0;
function Dt(e, t) {
  return X += t, X >= kt && (J = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }), J.decode(), X = t), J.decode(z().subarray(e, e + t));
}
const C = new TextEncoder();
"encodeInto" in C || (C.encodeInto = function(e, t) {
  const n = C.encode(e);
  return t.set(n), {
    read: e.length,
    written: n.length
  };
});
let p = 0;
const ot = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((e) => f.__wbg_wasmvdfsolver_free(e >>> 0, 1));
class Q {
  __destroy_into_raw() {
    const t = this.__wbg_ptr;
    return this.__wbg_ptr = 0, ot.unregister(this), t;
  }
  free() {
    const t = this.__destroy_into_raw();
    f.__wbg_wasmvdfsolver_free(t, 0);
  }
  /**
   * @param {string} seed_hex
   * @param {string} discriminant_hex
   * @param {bigint} vdf_iters
   * @param {number} graph_bits
   */
  constructor(t, n, s, r) {
    const o = E(t, f.__wbindgen_malloc, f.__wbindgen_realloc), i = p, c = E(n, f.__wbindgen_malloc, f.__wbindgen_realloc), l = p, _ = f.wasmvdfsolver_new(o, i, c, l, s, r);
    if (_[2])
      throw k(_[1]);
    return this.__wbg_ptr = _[0] >>> 0, ot.register(this, this.__wbg_ptr, this), this;
  }
  /**
   * @param {number} iterations
   * @returns {any}
   */
  step(t) {
    const n = f.wasmvdfsolver_step(this.__wbg_ptr, t);
    if (n[2])
      throw k(n[1]);
    return k(n[0]);
  }
}
Symbol.dispose && (Q.prototype[Symbol.dispose] = Q.prototype.free);
function Lt() {
  return f.get_memory_bytes() >>> 0;
}
function jt(e) {
  const t = _t(e, f.__wbindgen_malloc), n = p, s = f.serialize_cycle(t, n);
  var r = Rt(s[0], s[1]).slice();
  return f.__wbindgen_free(s[0], s[1] * 1, 1), r;
}
function Ct(e, t, n, s) {
  const r = E(e, f.__wbindgen_malloc, f.__wbindgen_realloc), o = p, i = E(t, f.__wbindgen_malloc, f.__wbindgen_realloc), c = p, l = f.solve_wasm(r, o, i, c, n, s);
  if (l[2])
    throw k(l[1]);
  return k(l[0]);
}
function Nt(e, t, n, s, r, o, i) {
  const c = E(e, f.__wbindgen_malloc, f.__wbindgen_realloc), l = p, _ = _t(t, f.__wbindgen_malloc), w = p, d = E(n, f.__wbindgen_malloc, f.__wbindgen_realloc), u = p, a = E(s, f.__wbindgen_malloc, f.__wbindgen_realloc), m = p, g = zt(r, f.__wbindgen_malloc), h = p, y = f.verify_proof(c, l, _, w, d, u, a, m, g, h, o, i);
  if (y[2])
    throw k(y[1]);
  return y[0] !== 0;
}
const Vt = /* @__PURE__ */ new Set(["basic", "cors", "default"]);
async function qt(e, t) {
  if (typeof Response == "function" && e instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function")
      try {
        return await WebAssembly.instantiateStreaming(e, t);
      } catch (s) {
        if (e.ok && Vt.has(e.type) && e.headers.get("Content-Type") !== "application/wasm")
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", s);
        else
          throw s;
      }
    const n = await e.arrayBuffer();
    return await WebAssembly.instantiate(n, t);
  } else {
    const n = await WebAssembly.instantiate(e, t);
    return n instanceof WebAssembly.Instance ? { instance: n, module: e } : n;
  }
}
function bt() {
  const e = {};
  return e.wbg = {}, e.wbg.__wbg_String_fed4d24b68977888 = function(t, n) {
    const s = String(n), r = E(s, f.__wbindgen_malloc, f.__wbindgen_realloc), o = p;
    q().setInt32(t + 4 * 1, o, !0), q().setInt32(t + 4 * 0, r, !0);
  }, e.wbg.__wbg___wbindgen_debug_string_adfb662ae34724b6 = function(t, n) {
    const s = Z(n), r = E(s, f.__wbindgen_malloc, f.__wbindgen_realloc), o = p;
    q().setInt32(t + 4 * 1, o, !0), q().setInt32(t + 4 * 0, r, !0);
  }, e.wbg.__wbg___wbindgen_throw_dd24417ed36fc46e = function(t, n) {
    throw new Error(it(t, n));
  }, e.wbg.__wbg_new_1ba21ce319a06297 = function() {
    return new Object();
  }, e.wbg.__wbg_new_25f239778d6112b9 = function() {
    return new Array();
  }, e.wbg.__wbg_set_3fda3bac07393de4 = function(t, n, s) {
    t[n] = s;
  }, e.wbg.__wbg_set_781438a03c0c3c81 = function() {
    return Ot(function(t, n, s) {
      return Reflect.set(t, n, s);
    }, arguments);
  }, e.wbg.__wbg_set_7df433eea03a5c14 = function(t, n, s) {
    t[n >>> 0] = s;
  }, e.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(t, n) {
    return it(t, n);
  }, e.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(t) {
    return t;
  }, e.wbg.__wbindgen_init_externref_table = function() {
    const t = f.__wbindgen_externrefs, n = t.grow(4);
    t.set(0, void 0), t.set(n + 0, void 0), t.set(n + 1, null), t.set(n + 2, !0), t.set(n + 3, !1);
  }, e;
}
function ht(e, t) {
  return f = e.exports, wt.__wbindgen_wasm_module = t, T = null, D = null, L = null, f.__wbindgen_start(), f;
}
function Ht(e) {
  if (f !== void 0)
    return f;
  typeof e < "u" && (Object.getPrototypeOf(e) === Object.prototype ? { module: e } = e : console.warn("using deprecated parameters for `initSync()`; pass a single object instead"));
  const t = bt();
  e instanceof WebAssembly.Module || (e = new WebAssembly.Module(e));
  const n = new WebAssembly.Instance(e, t);
  return ht(n, e);
}
async function wt(e) {
  if (f !== void 0)
    return f;
  typeof e < "u" && (Object.getPrototypeOf(e) === Object.prototype ? { module_or_path: e } = e : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), typeof e > "u" && (e = new URL("zeno.wasm", self.location));
  const t = bt();
  (typeof e == "string" || typeof Request == "function" && e instanceof Request || typeof URL == "function" && e instanceof URL) && (e = fetch(e));
  const { instance: n, module: s } = await qt(await e, t);
  return ht(n, s);
}
var ct = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  WasmVdfSolver: Q,
  default: wt,
  get_memory_bytes: Lt,
  initSync: Ht,
  serialize_cycle: jt,
  solve_wasm: Ct,
  verify_proof: Nt
});
