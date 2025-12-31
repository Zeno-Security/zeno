<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Standalone / Self-Hosting

While Zeno is optimized for Cloudflare Workers (Edge), the core logic is universal.

## Docker / Node.js

You can run Zeno on any Node.js compatible runtime (including Docker).

1.  **Build**:
    ```bash
    npm run build:server
    ```
2.  **Run**:
    The adapter in `src/server` handles the fetch event. For Node.js, you would need a small wrapper (e.g., Fastify/Express) that proxies requests to the worker entry point or re-implements the `router.ts` logic.

## Storage Adapters

The current implementation uses **R2**. For standalone:
*   Replace `env.zeno_challenges` bindings with Redis or an in-memory Map (for single instance).
*   Replace `env.zeno_tokens` with Redis/Database.