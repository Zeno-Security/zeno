let c;
function w(e) {
  const n = c.__externref_table_alloc();
  return c.__wbindgen_externrefs.set(n, e), n;
}
function E(e, n) {
  return e = e >>> 0, f().subarray(e / 1, e / 1 + n);
}
function A(e, n) {
  return e = e >>> 0, k(e, n);
}
let l = null;
function D() {
  return (l === null || l.byteLength === 0) && (l = new Uint32Array(c.memory.buffer)), l;
}
let g = null;
function f() {
  return (g === null || g.byteLength === 0) && (g = new Uint8Array(c.memory.buffer)), g;
}
function u(e, n) {
  try {
    return e.apply(this, n);
  } catch (t) {
    const r = w(t);
    c.__wbindgen_exn_store(r);
  }
}
function p(e) {
  return e == null;
}
function x(e, n) {
  const t = n(e.length * 4, 4) >>> 0;
  return D().set(e, t / 4), _ = e.length, t;
}
function B(e, n) {
  const t = n(e.length * 1, 1) >>> 0;
  return f().set(e, t / 1), _ = e.length, t;
}
function d(e, n, t) {
  if (t === void 0) {
    const i = y.encode(e), a = n(i.length, 1) >>> 0;
    return f().subarray(a, a + i.length).set(i), _ = i.length, a;
  }
  let r = e.length, o = n(r, 1) >>> 0;
  const b = f();
  let s = 0;
  for (; s < r; s++) {
    const i = e.charCodeAt(s);
    if (i > 127)
      break;
    b[o + s] = i;
  }
  if (s !== r) {
    s !== 0 && (e = e.slice(s)), o = t(o, r, r = s + e.length * 3, 1) >>> 0;
    const i = f().subarray(o + s, o + r), a = y.encodeInto(e, i);
    s += a.written, o = t(o, r, s, 1) >>> 0;
  }
  return _ = s, o;
}
function W(e) {
  const n = c.__wbindgen_externrefs.get(e);
  return c.__externref_table_dealloc(e), n;
}
let m = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 });
m.decode();
const C = 2146435072;
let T = 0;
function k(e, n) {
  return T += n, T >= C && (m = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }), m.decode(), T = n), m.decode(f().subarray(e, e + n));
}
const y = new TextEncoder();
"encodeInto" in y || (y.encodeInto = function(e, n) {
  const t = y.encode(e);
  return n.set(t), {
    read: e.length,
    written: t.length
  };
});
let _ = 0;
function N() {
  return c.get_memory_bytes() >>> 0;
}
function V(e) {
  const n = x(e, c.__wbindgen_malloc), t = _, r = c.serialize_cycle(n, t);
  var o = E(r[0], r[1]).slice();
  return c.__wbindgen_free(r[0], r[1] * 1, 1), o;
}
function G(e, n, t, r) {
  const o = d(e, c.__wbindgen_malloc, c.__wbindgen_realloc), b = _, s = d(n, c.__wbindgen_malloc, c.__wbindgen_realloc), i = _, a = c.solve_wasm(o, b, s, i, t, r);
  if (a[2])
    throw W(a[1]);
  return W(a[0]);
}
function X(e, n, t, r, o, b, s) {
  const i = d(e, c.__wbindgen_malloc, c.__wbindgen_realloc), a = _, v = x(n, c.__wbindgen_malloc), R = _, L = d(t, c.__wbindgen_malloc, c.__wbindgen_realloc), M = _, U = d(r, c.__wbindgen_malloc, c.__wbindgen_realloc), F = _, j = B(o, c.__wbindgen_malloc), I = _, h = c.verify_proof(i, a, v, R, L, M, U, F, j, I, b, s);
  if (h[2])
    throw W(h[1]);
  return h[0] !== 0;
}
const z = /* @__PURE__ */ new Set(["basic", "cors", "default"]);
async function P(e, n) {
  if (typeof Response == "function" && e instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function")
      try {
        return await WebAssembly.instantiateStreaming(e, n);
      } catch (r) {
        if (e.ok && z.has(e.type) && e.headers.get("Content-Type") !== "application/wasm")
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", r);
        else
          throw r;
      }
    const t = await e.arrayBuffer();
    return await WebAssembly.instantiate(t, n);
  } else {
    const t = await WebAssembly.instantiate(e, n);
    return t instanceof WebAssembly.Instance ? { instance: t, module: e } : t;
  }
}
function S() {
  const e = {};
  return e.wbg = {}, e.wbg.__wbg___wbindgen_is_function_8d400b8b1af978cd = function(n) {
    return typeof n == "function";
  }, e.wbg.__wbg___wbindgen_is_object_ce774f3490692386 = function(n) {
    const t = n;
    return typeof t == "object" && t !== null;
  }, e.wbg.__wbg___wbindgen_is_string_704ef9c8fc131030 = function(n) {
    return typeof n == "string";
  }, e.wbg.__wbg___wbindgen_is_undefined_f6b95eab589e0269 = function(n) {
    return n === void 0;
  }, e.wbg.__wbg___wbindgen_throw_dd24417ed36fc46e = function(n, t) {
    throw new Error(A(n, t));
  }, e.wbg.__wbg_call_3020136f7a2d6e44 = function() {
    return u(function(n, t, r) {
      return n.call(t, r);
    }, arguments);
  }, e.wbg.__wbg_call_abb4ff46ce38be40 = function() {
    return u(function(n, t) {
      return n.call(t);
    }, arguments);
  }, e.wbg.__wbg_crypto_574e78ad8b13b65f = function(n) {
    return n.crypto;
  }, e.wbg.__wbg_getRandomValues_b8f5dbd5f3995a9e = function() {
    return u(function(n, t) {
      n.getRandomValues(t);
    }, arguments);
  }, e.wbg.__wbg_length_22ac23eaec9d8053 = function(n) {
    return n.length;
  }, e.wbg.__wbg_msCrypto_a61aeb35a24c1329 = function(n) {
    return n.msCrypto;
  }, e.wbg.__wbg_new_1ba21ce319a06297 = function() {
    return new Object();
  }, e.wbg.__wbg_new_25f239778d6112b9 = function() {
    return new Array();
  }, e.wbg.__wbg_new_no_args_cb138f77cf6151ee = function(n, t) {
    return new Function(A(n, t));
  }, e.wbg.__wbg_new_with_length_aa5eaf41d35235e5 = function(n) {
    return new Uint8Array(n >>> 0);
  }, e.wbg.__wbg_node_905d3e251edff8a2 = function(n) {
    return n.node;
  }, e.wbg.__wbg_process_dc0fbacc7c1c06f7 = function(n) {
    return n.process;
  }, e.wbg.__wbg_prototypesetcall_dfe9b766cdc1f1fd = function(n, t, r) {
    Uint8Array.prototype.set.call(E(n, t), r);
  }, e.wbg.__wbg_randomFillSync_ac0988aba3254290 = function() {
    return u(function(n, t) {
      n.randomFillSync(t);
    }, arguments);
  }, e.wbg.__wbg_require_60cc747a6bc5215a = function() {
    return u(function() {
      return module.require;
    }, arguments);
  }, e.wbg.__wbg_set_3fda3bac07393de4 = function(n, t, r) {
    n[t] = r;
  }, e.wbg.__wbg_set_7df433eea03a5c14 = function(n, t, r) {
    n[t >>> 0] = r;
  }, e.wbg.__wbg_static_accessor_GLOBAL_769e6b65d6557335 = function() {
    const n = typeof global > "u" ? null : global;
    return p(n) ? 0 : w(n);
  }, e.wbg.__wbg_static_accessor_GLOBAL_THIS_60cf02db4de8e1c1 = function() {
    const n = typeof globalThis > "u" ? null : globalThis;
    return p(n) ? 0 : w(n);
  }, e.wbg.__wbg_static_accessor_SELF_08f5a74c69739274 = function() {
    const n = typeof self > "u" ? null : self;
    return p(n) ? 0 : w(n);
  }, e.wbg.__wbg_static_accessor_WINDOW_a8924b26aa92d024 = function() {
    const n = typeof window > "u" ? null : window;
    return p(n) ? 0 : w(n);
  }, e.wbg.__wbg_subarray_845f2f5bce7d061a = function(n, t, r) {
    return n.subarray(t >>> 0, r >>> 0);
  }, e.wbg.__wbg_versions_c01dfd4722a88165 = function(n) {
    return n.versions;
  }, e.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(n, t) {
    return A(n, t);
  }, e.wbg.__wbindgen_cast_cb9088102bce6b30 = function(n, t) {
    return E(n, t);
  }, e.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(n) {
    return n;
  }, e.wbg.__wbindgen_init_externref_table = function() {
    const n = c.__wbindgen_externrefs, t = n.grow(4);
    n.set(0, void 0), n.set(t + 0, void 0), n.set(t + 1, null), n.set(t + 2, !0), n.set(t + 3, !1);
  }, e;
}
function O(e, n) {
  return c = e.exports, q.__wbindgen_wasm_module = n, l = null, g = null, c.__wbindgen_start(), c;
}
function Y(e) {
  if (c !== void 0)
    return c;
  typeof e < "u" && (Object.getPrototypeOf(e) === Object.prototype ? { module: e } = e : console.warn("using deprecated parameters for `initSync()`; pass a single object instead"));
  const n = S();
  e instanceof WebAssembly.Module || (e = new WebAssembly.Module(e));
  const t = new WebAssembly.Instance(e, n);
  return O(t, e);
}
async function q(e) {
  if (c !== void 0)
    return c;
  typeof e < "u" && (Object.getPrototypeOf(e) === Object.prototype ? { module_or_path: e } = e : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), typeof e > "u" && (e = new URL("zeno.wasm", self.location));
  const n = S();
  (typeof e == "string" || typeof Request == "function" && e instanceof Request || typeof URL == "function" && e instanceof URL) && (e = fetch(e));
  const { instance: t, module: r } = await P(await e, n);
  return O(t, r);
}
export {
  q as default,
  N as get_memory_bytes,
  Y as initSync,
  V as serialize_cycle,
  G as solve_wasm,
  X as verify_proof
};
