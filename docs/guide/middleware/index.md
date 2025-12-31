<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Zeno Middleware

Integrate Zeno directly into your backend framework of choice.

While Zeno validates tokens on the Cloudflare Worker, your backend needs to send the token for verification or verify the JWT signature locally.

## Supported Frameworks

*   **[Express](./express.md)** (Node.js)
*   **[Elysia](./elysia.md)** (Bun)
*   **[Hono](./hono.md)** (Edge/Node)
