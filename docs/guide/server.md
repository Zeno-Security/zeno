<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Server Implementation

The Zeno Server (Backend) is the authority that issues challenges and verifies proofs.

## Cloudflare Worker

We use Cloudflare Workers for their global distribution and low latency. The server:
1.  **Generates Challenges**: Generates a random **Discriminant** (for VDF) and Seed (for Graph).
2.  **Stores State**: Uses **R2** to store active challenge metadata with a short TTL.
3.  **Verifies**: Checks the Cuckatoo Cycle and VDF Proof.
4.  **Prevents Replay**: Deletes the challenge from storage **immediately** upon redemption attempt.

## Security Features

* **Origin Check**: Validates the `Origin` and `Referer` headers match allowed domains.
* **IP Bans**: Automatically bans IPs exceeding rate limits for 24 hours via R2.
* **Time-Boxing**: Challenges expire after a set time (default 60 seconds) to prevent hoarding.

## API Specification

See [Architecture](./architecture.md) for endpoint details.
