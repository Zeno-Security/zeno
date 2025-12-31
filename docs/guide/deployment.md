<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Deployment Guide

## Cloudflare Worker Configuration

Zeno uses standard Environment Variables (Vars) configured in `wrangler.toml` or the Dashboard.

### 1. Storage (R2)

Zeno uses fast object storage associated with these bindings. **Required**.

| Binding Name | Purpose | Lifecycle Policy |
| :--- | :--- | :--- |
| `zeno_challenges` | Stores active PoW challenges | 1 Day (Auto-cleaned) |
| `zeno_tokens` | Stores verified tokens | 1 Day |
| `zeno_bans_day` | IP Ban list | 1 Day |

### 2. General Configuration

| Variable | Description | Default |
| :--- | :--- | :--- |
| `ALLOWED_ORIGINS` | Regex whitelist for `Origin` header | `null` (Open) |
| `ALLOWED_REFERERS` | Regex whitelist for `Referer` header | `null` (Open) |
| `VDF` | VDF Iterations (sequential time cost) | `100` (~0.6s) |
| `GRAPH_BITS` | Cuckatoo Graph Size ($2^N$ nodes) | `18` (~32MB RAM) |
| `CHALLENGE_TTL` | Time to solve (seconds) | `60` |
| `TOKEN_TTL` | Token validity (seconds) | `3600` |
| `TOKEN_REUSE` | Allow using token multiple times? | `true` |
| `dynamic_sites` | Enable non-configured site keys? | `true` |

### 3. Protection Target Presets

Choose based on your threat model:

| Preset | `GRAPH_BITS` | `VDF` | Time | Memory | Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Light | 13 | 100 | ~0.9s | 2 MB | Low-risk pages |
| Standard | 15 | 150 | ~1.3s | 5 MB | General protection |
| **Default** | **18** | **100** | **~0.9s** | **32 MB** | **ASIC/GPU resistant** |
| Strong | 18 | 300 | ~2.7s | 32 MB | Login, payment |
| Paranoid | 19 | 200 | ~2.6s | 62 MB | Critical actions |

### 4. Site-Specific (Dynamic) Configuration

You can override any variable for a specific `zeno-site-key` (UUID) by prefixing it.

**Pattern**: `{SITE_KEY}_{VARIABLE_NAME}`

**Examples**:

* `f47ac10b-58cc-4372-a567-0e02b2c3d479_VDF` = `300` (Stronger for this site)
* `f47ac10b-58cc-4372-a567-0e02b2c3d479_GRAPH_BITS` = `19` (More memory)
* `f47ac10b-58cc-4372-a567-0e02b2c3d479_ALLOWED_ORIGINS` = `^https://mysite\.com$`

### 5. Unknown Site Keys

* **Default (`dynamic_sites = true`)**: If a request comes with a Site Key that has no specific overrides, it falls back to the global default settings.
* **Strict Mode (`dynamic_sites = false`)**: Requests with unknown Site Keys will be rejected with `403 Forbidden`. Use this to lock down your worker to only known clients.

### 6. Tuning Guidelines

**To increase security without affecting solve time:**
- Increase `GRAPH_BITS` (memory wall)
- Each +1 GB doubles memory requirement
- Time impact is minimal for GB ≤ 18

**To increase security with longer solve time:**
- Increase `VDF` iterations
- Each +100 VDF adds ~600ms
- Memory unchanged

**For mobile-heavy traffic:**
- Use `GRAPH_BITS = 15-17`
- Low-end devices may struggle with GB > 18

### 7. Limits

| Parameter | Safe Range | Hard Limit | Notes |
| :--- | :--- | :--- | :--- |
| `GRAPH_BITS` | 13-19 | 20 | >20 causes OOM/timeout |
| `VDF` | 10-800 | 1,000,000 | >800 exceeds 5s solve |