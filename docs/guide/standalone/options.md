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
| `VDF` | Number | VDF iterations (~3.6ms/iter) | `300` (~1.6s) |
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

## Performance & Tuning

See [Benchmarks](../../guide/benchmark.md) for detailed performance data, tuning guides, empirical formulas, and hardware scaling info.