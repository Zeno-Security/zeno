# Zeno Master Implementation Instructions

**Source of Truth:** This document consolidates all previous specifications (.md files, e.g. spec.md, reqs.md, client_spec.md, ac.md, etc..)

**File Name:** arch.md

**File Location:** Root folder

THIS FILE SHOULD NOT BE UPLOADED TO THE GITHUB REPOSITORY.

---

## 1. Core Architecture & Physics

Zeno is a "Physics-Based" CAPTCHA that replaces "Cost-Based" (SHA-256) or "Surveillance-Based" (Cookies) systems. It enforces strict physical constraints on the client device to neutralize Bot Farms, ASICs, and GPUs.

### 1.1 Reference Benchmark Data (M1 Max, WASM)
*Verified December 2025.*

**Round 1: Memory Scaling (Graph Bits) — VDF=100 fixed**
| Graph Bits | Memory (MB) | Time (ms) | Status |
| :--- | :--- | :--- | :--- |
| **10** | 1.19 | 327 | ✅ Minimal |
| **11** | 1.31 | 335 | ✅ Minimal |
| **12** | 1.56 | 315 | ✅ Minimal |
| **13** | 2.06 | 313 | ✅ Light |
| **14** | 3.00 | 356 | ✅ Light |
| **15** | 4.88 | 374 | ✅ **Default** |
| **16** | 8.69 | 427 | ✅ Standard |
| **17** | 16.31 | 511 | ✅ Strong |
| **18** | 31.50 | 839 | ✅ Heavy |
| **19** | 61.88 | 2093 | ⚠️ Slow |
| **20** | 122.63 | 3863 | ⚠️ Very Slow |
| **21** | 244.13 | 10478 | ❌ Too Slow |

**Round 2: Time Scaling (VDF) — GB=10 fixed**
| VDF | Time (ms) | Δ per 100 VDF |
| :--- | :--- | :--- |
| **100** | 314 | — |
| **200** | 833 | +519 |
| **300** | 1442 | +609 |
| **400** | 2060 | +618 |
| **500** | 2713 | +653 |
| **600** | 3302 | +589 |
| **700** | 3953 | +651 |
| **800** | 4568 | +615 |
| **900** | 5166 | +598 |

**Round 3: Combined Defense (Sample)**
| GB | VDF | Time (ms) | Memory (MB) |
| :--- | :--- | :--- | :--- |
| 13 | 150 | 529 | 2.06 |
| 14 | 200 | 881 | 3.00 |
| 15 | 200 | 891 | 4.88 |
| 15 | 300 | 1506 | 4.88 |
| 16 | 300 | 1579 | 8.69 |
| 17 | 200 | 1036 | 16.31 |
| 18 | 200 | 1375 | 31.50 |

### 1.2 Empirical Formulas

**Memory:**
$$\text{Memory (MB)} \approx 1.2 \times 2^{(GB - 10)}$$

**Time:**
$$T_{\text{total}} \approx T_{\text{cycle}}(GB) + 6 \times VDF \text{ (ms)}$$

Where $T_{\text{cycle}}$ (cycle-finding base time in ms):

| GB Range | T_cycle (ms) |
| :--- | :--- |
| 10–15 | ~300–400 |
| 16 | ~420 |
| 17 | ~520 |
| 18 | ~860 |
| 19 | ~2100 |
| 20 | ~3900 |
| 21 | ~10500 |

**Key Insight:** VDF adds ~6ms per iteration regardless of GraphBits. Memory cost is independent of VDF.

---

### 1.3 Recommended Configurations by Protection Target

| Protection Target | GB | VDF | Time | Memory | Threat Model |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Script Bots** | 13 | 100 | ~0.9s | 2 MB | Headless browsers, simple automation |
| **Bot Farms** | 15 | 150 | ~1.3s | 5 MB | Parallel attacks, cheap VPS instances |
| **GPU Attacks** | 17 | 100 | ~0.5s | 16 MB | Memory-bound; GPUs lack large cache |
| **ASIC/GPU Hybrid** | 18 | 100 | ~0.9s | 32 MB | **Default.** Memory wall + sequential wall |
| **High-Value Actions** | 18 | 300 | ~2.7s | 32 MB | Financial transactions, account creation |
| **Maximum Security** | 19 | 200 | ~2.6s | 62 MB | Critical infrastructure, enterprise |

**Why Memory Matters More Than Time:**
- **GPUs:** Have limited per-core memory; 32MB × 1000 threads = 32GB VRAM (exceeds most GPUs)
- **ASICs:** Custom silicon cannot magically create RAM; memory is the bottleneck
- **Bot Farms:** Each parallel instance requires dedicated RAM allocation
- **VDF:** Provides sequential guarantee but low VDF is sufficient when memory wall is strong

**Hardcoded Defaults (ASIC/GPU Resistant):**
- `DEFAULT_GRAPH_BITS = 18`
- `DEFAULT_VDF = 450`
- Expected solve time: **~2.5 seconds**
- Expected memory: **~32 MB**

**Tuning Guidelines:**
| Goal | Action | Trade-off |
| :--- | :--- | :--- |
| Faster UX | Reduce GB by 1 | Memory halves (weaker vs GPU) |
| Stronger vs parallelization | Increase VDF by 100 | +600ms solve time |
| Stronger vs GPU/ASIC | Increase GB by 1 | Memory doubles, time may increase |
| Mobile-friendly | Use GB=15, VDF=100 | Reduced protection vs GPU |

---

### 1.4 The "Hybrid" Defense Strategy

1.  **Space (Memory Wall) — PRIMARY DEFENSE:**

    * **Mechanism:** **Cuckatoo Cycle** (Cycle 42 on $2^{GB}$ nodes).
    * **Effect:** Requires **~32MB RAM** at default settings (GB=18). 
    * **vs GPU:** A GPU with 24GB VRAM can only run ~750 parallel instances. Memory bandwidth becomes bottleneck.
    * **vs ASIC:** Custom silicon cannot manufacture RAM cheaply. Memory is the irreducible cost.
    * **vs Bot Farms:** 1,000 parallel threads × 32MB = **32GB RAM** required.
    * **Scaling:** Memory doubles per GraphBit increase.

2.  **Time (Sequential Wall) — SECONDARY DEFENSE:**

    * **Mechanism:** **Wesolowski VDF over Class Groups**.
    * **Effect:** Enforces sequential time delay (~0.6s at VDF=100) that **cannot be parallelized**.
    * **Purpose:** Prevents pre-computation attacks; ensures real-time solving.
    * **Scaling:** Each VDF iteration adds ~6ms (linear).

> [!NOTE]
> **Design Philosophy:**
> Memory wall is the primary defense because:
> - RAM is expensive and cannot be parallelized away
> - GPUs/ASICs excel at computation, not memory capacity
> - VDF provides "insurance" against pre-computation, not primary security
>
> **Max Safe Limits:**
> - `graph_bits ≤ 19` for web interaction (<3s on modern devices)
> - `graph_bits = 20` causes ~4s delay (borderline acceptable)
> - `graph_bits ≥ 21` is too slow for interactive use

### 1.5 Solver Implementations (WASM vs JS)
Zeno provides two bit-identical solver implementations ensuring coverage across all environments:

**A. Primary: WebAssembly (WASM)**
- **File:** `src/core/target/wasm32-unknown-unknown`
- **Architecture:** **Stateful & Iterative**. The WASM module exports a `WasmVdfSolver` class that executes the solution in discrete steps (yielding to the JS event loop) to allow for non-blocking progress reporting and UI updates.
- **Performance:** Native speed (Reference benchmark).
- **Memory:** Managed via WASM linear memory.

**B. Fallback: Pure JavaScript (JS)**
- **File:** `src/client/src/solver-js.ts`
- **Trigger:** Automatically engaged when WASM is unsupported or fails to initialize.
- **Crypto Suite:** Full re-implementation of core primitives:
    - **SipHash-2-4:** For edge generation.
    - **SHA-256:** For hashing cycle nodes and seed generation.
    - **BQF (Binary Quadratic Forms):** For class group arithmetic.
    - **Miller-Rabin:** For primality testing (40 rounds).
    - **Tonelli-Shanks:** For square root extraction in `HashToGroup`.
    - **Cuckatoo:** Cycle finding with JS-optimized graph traversal.
- **Performance:** Significantly slower (~10-20x) than WASM.
- **UX:** Widget displays a specific sublabel ("Running in compatibility mode") when active.


---

## 2. Build & Artifact Structure (Strict)

**A. Source Directory (`/src`)**

* `src/core`: Shared Rust logic (Crypto, Serialization). Compiles to WASM.

* `src/client`: Client-side logic (TypeScript Widget + Web Worker).

* `src/server`: Server-side logic (Cloudflare Worker TypeScript).

* `src/demo`: **(CHANGED)** The demo application source code (HTML/CSS/JS) consuming the client build.

**B. Client Artifacts (`/dist/client`)**

The build pipeline (`npm run build`) compiles in `src` and copies artifacts to `dist`:

1.  `zeno.js`: The main Client Library / Widget wrapper (ESM).
    *   **CDN Usage:** Use `https://cdn.jsdelivr.net/gh/zeno-security/zeno/dist/client/zeno.min.js`.
    *   **Note:** JsDelivr automatically serves `zeno.js` when `zeno.min.js` is requested if it's the package main, OR we explicitly commit `zeno.min.js`. To keep it simple, we point users to `.min.js` as the standard convention, which maps to `dist/client/zeno.js` (minified by Vite).

**Testing Rule:** When performing local testing, ALWAYS use an up-to-date copy of `src/demo`, modified to import `zeno.js` locally (e.g. `../dist/client/zeno.js`) OR use the production URL for integration testing. Do NOT test with stale artifacts.

2.  `zeno_core.js`: The WASM glue code. **STRICT RULE:** Must NOT contain inlined WASM (Base64). It MUST fetch `zeno.wasm` externally.
    *   **Sanitization:** The build pipeline (`scripts/sanitize_wasm.mjs`) forcefully removes Vite/Wasm-Pack's default inlining logic.
    *   **Verification:** CI/CD must fail if `zeno_core.js` > 100KB.

3.  *(Verified)* `zeno.wasm`: Distributed effectively in `dist/client`.

**C. Server Artifacts (`/dist/server`)**

1.  `worker.js`: The Cloudflare Worker bundle (compiled from `src/server`).

2.  `zeno.wasm`: **Synchronized Copy** of `zeno_core_bg.wasm` from the client build (ensures cryptographic consistency).

**D. Cloudflare Deployment (`/cloudflare`)**

*   **Purpose:** Dedicated deployment folder (gitignored) containing the latest production artifacts.
*   **Contents:**
    1.  `worker.js` (from `dist/server`)
    2.  `zeno.wasm` (from `dist/server`)
    3.  `wrangler.toml` (Root config)

**E. Root Configuration:**

* **Package.json:** `npm run build` orchestrates the full pipeline:
  1. `build:wasm` (Rust -> WASM)
  2. `build:client` (Vite -> `dist/client`)
  3. `build:server` (Esbuild + WASM Copy -> `dist/server`)

* **distribution**:
  * `"jsdelivr": "https://cdn.jsdelivr.net/gh/zeno-security/zeno/dist/client/zeno.min.js"` (Virtual, for CDN)
  * `"browser": "./dist/client/zeno.js"`

---

## 3. Byte-Level Implementation Specification

### 3.1 Constants

| Constant | Value | Description |
| :--- | :--- | :--- |
| `CYCLE_LENGTH` | **42** | Edges in Cuckatoo cycle. |
| `DEFAULT_GRAPH_BITS` | **18** | Log2 of graph size. **~32MB RAM. ASIC/GPU resistant.** |
| `MIN_GRAPH_BITS` | **10** | Minimum (testing only). |
| `MAX_GRAPH_BITS` | **20** | Hard max. GB>20 causes OOM/timeout. |
| `DISCRIMINANT_BITS` | **2048** | Bit-length of the VDF Discriminant $|D|$. |
| `VDF_PRIME_BITS` | **128** | Bit-length of Wesolowski prime $l$. |
| `DEFAULT_VDF` | **450** | VDF Iterations (~2.5s). Strong sequential guarantee. |
| `MIN_VDF` | **10** | Minimum security floor. |
| `MAX_VDF` | **1,000,000** | Maximum supported VDF. (Server clamps to 1M). |

### 3.2 Byte Ordering & Serialization

* **Integers (u16, u32):** **Little-Endian (LE)**.

* **Big Integers (ClassGroup components):** **Big-Endian (BE)** byte arrays.

* **Wire Format:** Class Group forms $(a, b, c)$ must be serialized as:

  `[Len a (u16 BE)] || [a bytes] || [Len b (u16 BE)] || [b bytes]`

### 3.3 Cryptographic Primitives (Rust)

**CRITICAL:** You must verify the VDF by composing granular primitives, NOT by calling a "black box" verification function.

**Required Imports:**

`use crate::crypto::{hash_to_group, hash_to_prime, miller_rabin};`

**Mandated Abstraction (WASM Safety):**
To ensure safe BigInt handling across the WASM boundary, verification logic MUST be encapsulated in `zeno-core`.

**Required Imports:**
`use crate::crypto::{hash_to_group, hash_to_prime, miller_rabin, verify_wesolowski};`

**Logic Constraints:**

1.  **HashToGroup:** Maps `cycle_bytes` to a valid form $(a, b, c)$.

    * **Primality Check:** MUST use **Miller-Rabin (40 rounds)**.

    * **Square Root:** MUST use **Tonelli-Shanks** algorithm.

2.  **HashToPrime:** Generates Wesolowski prime $l$.

    * **Primality Check:** MUST use **Miller-Rabin (40 rounds)**.

3.  **Discriminant Generation (Server):**

    * Generate random 2048-bit integer $U$.

    * Set $U = U \lor 3$.

    * Set $D = -U$.

---

## 4. Server Logic: Configuration & Storage

### 4.1 Dynamic Configuration Strategy

The Server supports **Open Usage** with **Environment Variable Overrides**.

1.  **Client Request** contains `site_key`.

2.  **Configuration Check:**

    * **Tier 1 (Specific):** Env Var matching `{SITE_KEY}_{SETTING}`.

    * **Tier 2 (Global):** Env Var matching `{SETTING}`.

    * **Tier 3 (Hardcoded Default):** Safe defaults.

**Configuration Parameters:**

* `allowed_origins` (Regex string)

* `allowed_referers` (Regex string)

* `challenge_ttl` (Seconds)

* `token_ttl` (Seconds)

* `token_reuse` (Boolean, default `true`)

* `rate_limit_ip_min`, `rate_limit_ip_hour`, `rate_limit_ip_day` (Integers): Requests allowed per IP.

* `vdf` (VDF Iterations) — **Default: 100**

* `graph_bits` (Memory size log2) — **Default: 18**

* `dynamic_sites` (Boolean):

    * If `false`: **Strict Mode.** The server MUST reject "Unknown" site keys.

    * If `true`: **Open Mode.** Unknown site keys fall back to defaults.

**Important:** If a request comes without a `site_key`, apply Global Defaults.

### 4.2 Storage Infrastructure (R2 Bindings)

The Cloudflare Worker must communicate with **three specific R2 bucket bindings**:

1.  **`zeno_challenges`**: Stores pending challenges.

2.  **`zeno_tokens`**: Stores active session tokens.

3.  **`zeno_bans_day`**: Stores IP bans.

**Critical Storage Rules:**

1.  **No KV/Durable Objects:** Use R2 for all state.

2.  **1-Day Auto-Expiry:** Every object written to R2 **MUST** be written with a strictly defined infrastructure expiry/TTL of **1 day** (or less if config dictates).

---

## 5. API Security & Cleanup Logic

**Universal Validation Rule:**

For **EVERY** endpoint, before processing any logic:

1.  Load Configuration.

2.  **Validate Context:** Check `Origin` and `Referer` headers against the loaded regex config. Return `403` if invalid.

### A. Endpoint: Request Challenge (`/api/challenge`)

* **Ban Check:** Check `zeno_bans_day` for IP. Return `403` if banned.

* **Rate Limit:** Check/Update IP counters (Min/Hour/Day). If exceeded, return `429` and add to `zeno_bans_day`.

* **Logic:** Generate challenge using config parameters.

* **Storage:** Write to `zeno_challenges`.

### B. Endpoint: Redeem Solution (`/api/redeem`)

* **Logic:**

    1.  **Retrieve:** Fetch object from `zeno_challenges`. (If missing: Return `404`).

    2.  **Cleanup (CRITICAL):** **IMMEDIATELY DELETE** the challenge from R2. (Prevent Replay).

    3.  **Ownership Check:** Verify `req.site_key` matches `stored.site_key`.

    4.  **Expiry Check:** Verify `now < stored.expires_at`.

    5.  **Verify Math:** Perform Cuckatoo + VDF verification using granular primitives (`hash_to_group`, etc.).

    6.  **Issue:** If valid, write to `zeno_tokens` (using `token_ttl` from config).

### C. Endpoint: Verify Token (`/api/verify`)

* **Logic:**

    1.  **Retrieve:** Fetch object from `zeno_tokens`. (If missing: Return `valid: false`).

    2.  **Ownership Check:** Verify `req.site_key` matches `stored.site_key`.

    3.  **Expiry Check:** Verify `now < stored.expires_at`.

    4.  **Burn Policy:** Determine if deletion is required.

        * Burn if `req.single === true`.

        * Burn if `config.token_reuse === false`.

    5.  **Cleanup:** If burn required, `await zeno_tokens.delete(token_id)`.

* **Response:** `{ "valid": true }`

### D. Endpoint: Delete Token (`/api/delete`)

* **Logic:**

    1.  **Retrieve:** Fetch object from `zeno_tokens`.

    2.  **Ownership Check:** Verify `req.site_key` matches `stored.site_key`.

    3.  **Cleanup:** `await zeno_tokens.delete(token_id)`.

* **Response:** `{ "deleted": true }`

### E. Input Sanitization

* All inputs (`site_key`, `challenge_id`, `token`) must be strictly validated.

    * **UUIDs:** Must match UUID v4 format: `f6486d57-006a-4914-b82f-b8d5c7e5b118`.

    * **Hex:** Must match `^[0-9a-fA-F]+$`.

---

## 6. Client Logic & Widget

### 6.1 Branding

The `<zeno-widget>` must include a small "Zeno" link in the bottom right corner.

*   **Positioning:** Must be **inside** the widget container. It must be dynamically positioned with sufficient **right padding** to ensuring it never touches the widget border.
*   **Link Target:** `https://github.com/zeno-security/zeno` (New tab).
*   **Contrast (Strict Compliance):**
    *   **Formula:** You MUST use the **Standard WCAG Relative Luminance** formula to calculate the text color.
    *   **Forbidden:** Do NOT use the simple YIQ formula (it fails on edge cases like bright reds).
    *   **Requirement:** The contrast ratio between the text and the widget background must be **> 4.5:1** (WCAG AA).

### 6.2 Performance

Default configuration (`GB=18, VDF=100`) targets **~0.9 seconds** solve time with **32MB memory** for ASIC/GPU resistance.

**Tuning Guidelines:**
- For faster UX on low-end devices: Reduce GB to 15-16 (sacrifices GPU resistance)
- For stronger sequential guarantee: Increase VDF (each +100 adds ~600ms)
- Keep total time < 5 seconds for acceptable UX

### 6.3 Browser Safety

* **Web Workers:** The WASM solver **MUST** run inside a Web Worker to avoid UI freezing and background throttling.

* **Visibility API:** Listen to `document.visibilitychange` to handle throttling.

### 6.4 Widget Usage

* **Standard:** `<zeno-widget>` (Dimensions: **320px × 50px**).
    * `<zeno-widget zeno-api-endpoint="/api" zeno-site-key="..."></zeno-widget>`

* **Invisible:** `new Zeno({ ... }).solve()`

* **Floating:** Popover mode triggered by a button.

* **Floating:** Popover mode triggered by a button.

* **Widget UI Enhancements:**
    * **Red Banner:** Displays "Enable WASM for significantly faster solving" when falling back to JS (configurable via `--zeno-i18n-wasm-banner` CSS variable or `zeno-i18n-wasm-banner` attribute).
    * **Progress Indication:** Displays "Verifying... X%" during both WASM and JS solve (update frequency: ~0.5s).
    * **Compatibility Label:** Shows "Running in compatibility mode" sublabel (configurable via `--zeno-i18n-js-mode-label` CSS variable or `zeno-i18n-js-mode-label` attribute).

* **Client Configuration:**
    * `forceJS` (boolean): Forces usage of the JS solver even if WASM is supported (useful for testing). Can be set via config object or `zeno-force-js` attribute on widget.

* **Events:**
    * `solve`: Emitted on success with token.
    * `error`: Emitted on failure.
    * `progress`: Emitted with percent completion (`{ detail: { percent: number } }`).
    * `modedetected`: Emitted when solver mode is determined (`{ detail: { mode: 'wasm' | 'js', wasmSupported: boolean } }`).


---

## 7. Documentation & Inconsistencies

**Warning:** The existing documentation (uploaded to the project) is **OUTDATED**. It describes a legacy SHA-256 system.

**Directive:** You must ignore legacy docs when implementing logic. This Master Document is the only sources of truth. Any changes must be explicitly approved and updated in this document.

**Action:** Overwrite the documentation files in `/docs` to align with the new Space-Time architecture defined here.

---

## 8. Action Plan

1.  **Project Setup:** Initialize repo structure (`src/client`, `src/server`, `src/core`, `src/demo`, `dist/client`, `dist/server`).

2.  **Scaffold `src/core` (Rust):** Implement the math traits and serialization. Ensure `wasm32-unknown-unknown` compilation.

3.  **Build Server:** Implement the Cloudflare Worker (TypeScript) + R2 logic + Rust WASM import.

4.  **Build Client:** Implement the TypeScript Widget + Web Worker + Rust WASM import.

5.  **Docs:** Overwrite documentation to match the new spec.

6.  **Test:** Validate end-to-end flow with the local demo found in `src/demo`.

---

## 9. License Headers (Strict Compliance)

All files must include the relevant copyright and license notice.

### 9.1 JS, CSS, Rust, TypeScript (`.js`, `.css`, `.rs`, `.ts`)
```javascript
/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */
```

### 9.2 HTML (`.html`) & Markdown (`.md`)
```html
<!--
 Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

 This software is licensed under the PolyForm Strict License 1.0.0.
 You may obtain a copy of the License at:
 
 https://polyformproject.org/licenses/strict/1.0.0/

 SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
```

### 9.3 TOML, YAML (`.toml`, `.yaml`, `.yml`)
```yaml
# Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
#
# This software is licensed under the PolyForm Strict License 1.0.0.
# You may obtain a copy of the License at:
# 
# https://polyformproject.org/licenses/strict/1.0.0/
#
# SPDX-License-Identifier: PolyForm-Strict-1.0.0
```

### 9.4 JSON Variants

#### Standard `package.json`
```json
{
  "name": "zeno",
  "version": "1.0.0",
  "description": "Zeno Security Software - Metadata and License Specification",
  "author": {
    "name": "Erez Kalman",
    "email": "kaerez@gmail.com",
    "url": "https://www.kalman.co.il"
  },
  "license": "PolyForm-Strict-1.0.0",
  "homepage": "https://github.com/Zeno-Security/zeno",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/zeno-security/zeno.git"
  },
  "keywords": [
    "security",
    "zeno",
    "ksec",
    "erez",
    "kalman"
  ]
}
```

#### JSON Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://github.com/zeno-security/zeno",
  "title": "Zeno License",
  "description": "License schema for Zeno software.",
  "$comment": "License: PolyForm-Strict-1.0.0. Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)",
  "type": "object",
  "properties": {
    "metadata": {
      "type": "object",
      "description": "Metadata including licensing information",
      "properties": {
        "license": { 
          "type": "string", 
          "const": "PolyForm-Strict-1.0.0" 
        }
      }
    }
  }
}
```

#### JSON-LD
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Zeno",
  "author": {
    "@type": "Person",
    "name": "Erez Kalman",
    "url": "https://www.kalman.co.il"
  },
  "copyrightYear": "2025",
  "copyrightHolder": {
    "@type": "Person",
    "name": "Erez Kalman"
  },
  "license": "https://polyformproject.org/licenses/strict/1.0.0/"
}
```

#### Custom JSON Metadata
```json
{
  "metadata": {
    "copyright": "© 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)",
    "license": "PolyForm-Strict-1.0.0",
    "license_url": "https://polyformproject.org/licenses/strict/1.0.0/",
    "notice": "This software is licensed under the PolyForm Strict License 1.0.0."
  }
}
```