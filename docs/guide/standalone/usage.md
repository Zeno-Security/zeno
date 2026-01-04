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
  "vdf": 300,
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

### Internationalization (i18n)
You can customize the text labels using attributes or CSS variables (useful for styling/theming).

**Attributes (Standard):**
- `zeno-i18n-human-label`: Default "I am human"
- `zeno-i18n-verifying-label`: Default "Verifying..."
- `zeno-i18n-solved-label`: Default "Success!"
- `zeno-i18n-error-label`: Default "Error"

**CSS Variables (Styling/Content):**
- `--zeno-i18n-wasm-banner`: Text for the red banner in JS fallback mode.
  - *Example:* `--zeno-i18n-wasm-banner: "Please enable WASM"`
- `--zeno-i18n-js-mode-label`: Text for the compatibility mode sublabel.
  - *Example:* `--zeno-i18n-js-mode-label: "Slow Mode Active"`

> **Note:** CSS variable values must be quoted strings if passing text content via proper CSS syntax, though the widget creates robustness by stripping quotes if present.

| Attribute | Description | Default |
| :--- | :--- | :--- |
| `zeno-floating` | Selector for the element that triggers the popover (e.g. `#my-button`) | `null` |

### Events
The widget emits standard CustomEvents:

| Event | Detail | Description |
| :--- | :--- | :--- |
| `solve` | `{ token: string }` | Emitted on successful verification. |
| `error` | `{ message: string }` | Emitted if verification fails. |
| `progress` | `{ percent: number }` | Emitted periodically (0-100) during both WASM and JS execution. |
| `modedetected` | `{ mode: 'wasm' \| 'js', wasmSupported: boolean }` | Emitted when solver initializes. |

### Configuration (Headless Mode)
When using `new Zeno(config)`, you can pass additional options:

```typescript
import { Zeno } from './zeno.min.js'; // or from 'zeno' package

const zeno = new Zeno({
    apiEndpoint: '/api',
    siteKey: '...',
    forceJS: true // Optional: Force JS solver for testing (default: false)
});
```

## 6. Configuration Impact

See [Benchmarks](../../guide/benchmark.md) for detailed performance analysis, tuning recommendations, and hardware benchmark data.
| M1/M2 Mac | 1× | 0.9s |
| Modern Desktop | 1.2× | 1.1s |
| iPhone 14+ | 1.5× | 1.4s |
| Mid-range Android | 2× | 1.8s |
| Low-end Mobile | 3-4× | 2.7-3.6s |