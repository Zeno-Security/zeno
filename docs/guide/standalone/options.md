<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Configuration Options

Configuration for the Zeno Server (Standalone or Cloudflare).

## Core Parameters

| Option | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `VDF` | Number | VDF iterations (~6ms/iter) | `100` (~0.6s) |
| `GRAPH_BITS` | Number | Cuckatoo Graph Size ($2^N$ nodes) | `18` (~32MB RAM) |
| `CHALLENGE_TTL` | Seconds | Time allowed to solve | `60` |
| `TOKEN_TTL` | Seconds | Token validity duration | `3600` (1hr) |
| `TOKEN_REUSE` | Boolean | Allow token reuse? | `true` |

## Security Parameters

| Option | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `ALLOWED_ORIGINS` | Regex | Whitelist of allowed Origins | `null` (Open) |
| `ALLOWED_REFERERS` | Regex | Whitelist of allowed Referers | `null` (Open) |
| `RATE_LIMIT_IP_MIN` | Number | Requests per minute per IP | `60` |
| `RATE_LIMIT_IP_HOUR` | Number | Requests per hour per IP | `1000` |
| `RATE_LIMIT_IP_DAY` | Number | Requests per day per IP | `5000` |

## Protection Target Presets

### By Threat Model

| Threat | `GRAPH_BITS` | `VDF` | Time | Memory |
| :--- | :--- | :--- | :--- | :--- |
| Script Bots | 13 | 100 | ~0.9s | 2 MB |
| Bot Farms | 15 | 150 | ~1.3s | 5 MB |
| GPU Attacks | 17 | 100 | ~0.5s | 16 MB |
| **ASIC/GPU (Default)** | **18** | **100** | **~0.9s** | **32 MB** |
| High-Value | 18 | 300 | ~2.7s | 32 MB |
| Maximum | 19 | 200 | ~2.6s | 62 MB |

### Tuning for Time Budget

| Time Budget | Config | Memory |
| :--- | :--- | :--- |
| < 1 second | GB=18, VDF=100 | 32 MB |
| 1-2 seconds | GB=18, VDF=200 | 32 MB |
| 2-3 seconds | GB=18, VDF=350 | 32 MB |
| 3-5 seconds | GB=19, VDF=200 | 62 MB |

### Tuning for Memory Budget

| Memory Target | Config | Time |
| :--- | :--- | :--- |
| ~2 MB | GB=13, VDF=100 | ~0.9s |
| ~5 MB | GB=15, VDF=100 | ~1.0s |
| ~16 MB | GB=17, VDF=100 | ~0.5s |
| ~32 MB (Default) | GB=18, VDF=100 | ~0.9s |
| ~62 MB | GB=19, VDF=100 | ~2.1s |

## Limits & Validation

| Parameter | Safe Range | Hard Limit | Behavior |
| :--- | :--- | :--- | :--- |
| `GRAPH_BITS` | 13-19 | 10-20 | Clamped to range |
| `VDF` | 10-800 | 10-1,000,000 | Clamped to range |

> [!WARNING]
> **Mobile Compatibility:** `GRAPH_BITS > 18` may cause OOM on low-end mobile devices.

> [!WARNING]  
> **Timeout Risk:** `GRAPH_BITS > 19` or `VDF > 800` may exceed reasonable solve times (>5s).

## Empirical Formulas

**Memory:**
$$\text{Memory (MB)} \approx 1.2 \times 2^{(GB - 10)}$$

**Time:**
$$T_{\text{total}} \approx T_{\text{cycle}}(GB) + 6 \times VDF \text{ (ms)}$$

Where T_cycle:
- GB 10-17: 300-500ms
- GB 18: ~860ms
- GB 19: ~2100ms
- GB 20: ~3900ms