<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Usage & API Endpoints

The Zeno Server exposes a REST API for challenge generation, solution redemption, and token verification.

## Endpoints

### 1. `POST /api/challenge`

Generates a new cryptographic challenge.

**Request:**
```json
{
  "site_key": "UUID-HERE"
}
```

**Response:**
```json
{
  "challenge_id": "UUID",
  "seed": "HEX",
  "discriminant": "HEX",
  "vdf": 100,
  "graph_bits": 18,
  "issued_at": 1234567890,
  "expires_at": 1234567950
}
```

### 2. `POST /api/redeem`

Redeems a solved challenge for a session token.

**Request:**
```json
{
  "site_key": "UUID-HERE",
  "challenge_id": "UUID-FROM-STEP-1",
  "solution": {
    "cycle": [1, 2, ...42],
    "y": "hex...",
    "pi": "hex..."
  }
}
```

**Response:**
```json
{
  "token": "UUID-TOKEN",
  "expires_at": 1234567890
}
```

### 3. `POST /api/verify`

Verifies if a token is valid. This is the endpoint your backend calls.

**Request:**
```json
{
  "site_key": "UUID-HERE",
  "token": "UUID-TOKEN",
  "single": false
}
```
*   `single` (optional): If `true`, the token will be deleted after verification (Burn on Verify).

**Response:**
```json
{
  "valid": true
}
```

### 4. `POST /api/delete`

Invalidates a session token manually (e.g. on user logout).

**Request:**
```json
{
    "site_key": "UUID-HERE",
    "token": "UUID-TOKEN"
}
```

**Response:**
```json
{
    "deleted": true
}
```

```

## 5. Client Widget & SDK

### Widget Attributes
The `<zeno-widget>` supports extensive customization via attributes:

| Attribute | Description | Default |
| :--- | :--- | :--- |
| `zeno-i18n-human-label` | Main checkbox label | "I am human" |
| `zeno-i18n-verifying-label` | Label during processing | "Verifying..." |
| `zeno-i18n-solved-label` | Label on success | "Success!" |
| `zeno-i18n-error-label` | Label on error | "Error" |
| `zeno-i18n-wasm-banner` | Text for the red banner shown in JS fallback mode | "Enable WASM for significantly faster solving" |
| `zeno-i18n-js-mode-label` | Sublabel shown in JS fallback mode | "Running in compatibility mode" |
| `zeno-floating` | Selector for the element that triggers the popover (e.g. `#my-button`) | `null` |

### Events
The widget emits standard CustomEvents:

| Event | Detail | Description |
| :--- | :--- | :--- |
| `solve` | `{ token: string }` | Emitted on successful verification. |
| `error` | `{ message: string }` | Emitted if verification fails. |
| `progress` | `{ percent: number }` | Emitted periodically (0-100) during JS solve or heavy WASM ops. |
| `modedetected` | `{ mode: 'wasm' \| 'js', wasmSupported: boolean }` | Emitted when solver initializes. |

### Configuration (Headless Mode)
When using `new Zeno(config)`, you can pass additional options:

```typescript
const zeno = new Zeno({
    apiEndpoint: '/api',
    siteKey: '...',
    forceJS: true // Optional: Force JS solver for testing (default: false)
});
```

## 6. Configuration Impact

The security and resource usage of Zeno are controlled by `graph_bits` (Space) and `vdf` (Time).

### Graph Bits (Memory Wall) — PRIMARY DEFENSE

Controls the size of the Cuckatoo Graph ($2^N$ nodes). Deters GPU/ASIC attacks.

| Graph Bits | Memory | Time | Security Level | Device Target |
| :--- | :--- | :--- | :--- | :--- |
| **13** | ~2 MB | ~0.3s | ⚠️ Low | Any device |
| **15** | ~5 MB | ~0.4s | ✅ Standard | All devices |
| **17** | ~16 MB | ~0.5s | 🔒 Strong | Modern devices |
| **18** | ~32 MB | ~0.9s | 🔒 **Default** | Modern devices |
| **19** | ~62 MB | ~2.1s | 💀 Maximum | Desktop recommended |
| **20** | ~123 MB | ~3.9s | 💀 Extreme | Desktop only |

> [!NOTE]
> **Why Memory Matters:** GPUs have limited per-core cache. A 24GB GPU can only run ~750 parallel instances at GB=18. ASICs cannot add RAM to silicon.

### VDF (Sequential Wall) — SECONDARY DEFENSE

Controls the number of VDF iterations. Prevents pre-computation attacks.

| VDF | Added Time | Total Time (GB=18) | Use Case |
| :--- | :--- | :--- | :--- |
| **100** | ~0.6s | ~0.9s | **Default** |
| **200** | ~1.2s | ~1.5s | Enhanced |
| **300** | ~1.8s | ~2.1s | High-value actions |
| **500** | ~3.0s | ~3.3s | Strong sequential |
| **800** | ~4.8s | ~5.1s | Maximum practical |

> [!NOTE]
> **VDF Rate:** ~6ms per iteration in WASM. Each +100 VDF adds ~600ms to solve time.

## 6. Protection Target Guide

### By Threat Model

| Target | Config | Time | Memory | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| Script Bots | GB=13, VDF=100 | ~0.9s | 2 MB | Stops automation |
| Bot Farms | GB=15, VDF=150 | ~1.3s | 5 MB | Exceeds cheap VPS |
| GPU Attacks | GB=17, VDF=100 | ~0.5s | 16 MB | Memory-bound |
| **ASIC/GPU** | **GB=18, VDF=100** | **~0.9s** | **32 MB** | **Default** |
| High-Value | GB=18, VDF=300 | ~2.7s | 32 MB | Login, payment |
| Maximum | GB=19, VDF=200 | ~2.6s | 62 MB | Critical systems |

### Increase Time Without Increasing Memory

| Base | +1s | +2s | +3s |
| :--- | :--- | :--- | :--- |
| GB=18, VDF=100 | VDF=270 | VDF=430 | VDF=600 |

### Increase Memory Without Increasing Time

| ~1s Solve | Memory |
| :--- | :--- |
| GB=15, VDF=100 | 5 MB |
| GB=17, VDF=80 | 16 MB |
| GB=18, VDF=30 | 32 MB |

## 7. Limits & Validation

Zeno uses **Clamping Policy** — values outside safe ranges are automatically adjusted.

| Parameter | Safe Range | Hard Limit | Notes |
| :--- | :--- | :--- | :--- |
| `graph_bits` | 13-19 | 10-20 | >19 risks timeout |
| `vdf` | 10-800 | 10-1,000,000 | >800 exceeds 5s |

> [!CAUTION]
> **Mobile Risk:** `graph_bits > 18` may cause OOM crashes on low-end mobile devices.

## 8. Empirical Formulas

**Memory:**
$$\text{Memory (MB)} \approx 1.2 \times 2^{(GB - 10)}$$

**Time:**
$$T_{\text{total}} \approx T_{\text{cycle}}(GB) + 6 \times VDF \text{ (ms)}$$

**T_cycle by Graph Bits:**
| GB | T_cycle |
| :--- | :--- |
| 10-17 | 300-500ms |
| 18 | ~860ms |
| 19 | ~2100ms |
| 20 | ~3900ms |

## 9. Hardware Variability

| Device Class | Speed vs M1 Max | GB=18 Time |
| :--- | :--- | :--- |
| M1/M2 Mac | 1× | 0.9s |
| Modern Desktop | 1.2× | 1.1s |
| iPhone 14+ | 1.5× | 1.4s |
| Mid-range Android | 2× | 1.8s |
| Low-end Mobile | 3-4× | 2.7-3.6s |