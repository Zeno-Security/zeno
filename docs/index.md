<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Zeno Documentation

Welcome to the documentation for **Zeno**, the privacy-first, proof-of-work CAPTCHA system inspired by the Quantum Zeno Effect.

![Zeno Banner](./assets/banner.jpeg)

## Getting Started

*   **[The Zeno Effect](./guide/effectiveness.md)**: The philosophy and physics behind our security model.
*   **[How it Works](./guide/workings.md)**: Deep dive into the cryptographic mechanics (Cuckatoo + VDF).
*   **[Architecture](./guide/architecture.md)**: System design (Cloudflare Workers, WASM, R2).
*   **[Live Demo](./guide/demo.md)**: Try Zeno in action.

## Implementation Guide

*   **[Client Integration](./guide/client.md)**: Step-by-step guide to embedding the widget.
*   **[Widget Customization](./guide/widget.md)**: Styling and theming reference.
    *   **[Floating Mode](./guide/floating.md)**: Non-intrusive corner popup implementation.
    *   **[Invisible Mode](./guide/invisible.md)**: Background verification for seamless UX.

## Server Deployment

*   **[Cloudflare Deployment](./guide/deployment.md)**: Deploying the backend to your own Cloudflare account.
*   **[Server Configuration](./guide/server.md)**: Managing R2 buckets and environment variables.

## Middleware Integrations

*   **[ElysiaJS](./guide/middleware/elysia.md)**: Middleware for Elysia framework.
*   **[Hono](./guide/middleware/hono.md)**: Middleware for Hono framework.
*   **[Express.js](./guide/middleware/express.md)**: Integration with Express/Node.js.

## Standalone & Self-Hosting

*   **[Overview](./guide/standalone/index.md)**: Running Zeno without Cloudflare (Docker/Node).
*   **[Installation](./guide/standalone/installation.md)**: Setup guide for standalone server.
*   **[Usage](./guide/standalone/usage.md)**: API reference for standalone instance.
*   **[Options](./guide/standalone/options.md)**: Configuration reference.
*   **[Docker](./guide/standalone/docker.md)**: Container deployment guide.
*   **[API Reference](./guide/standalone/api.md)**: Direct API endpoints.

## Reference & Community

*   **[Benchmarks](./guide/benchmark.md)**: Performance metrics and resource usage.
*   **[Alternatives](./guide/alternatives.md)**: How Zeno compares to other CAPTCHA solutions.
*   **[Community](./guide/community.md)**: Contributing and support.