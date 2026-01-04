<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Architecture

Zeno operates on a **Proof-of-Work (PoW)** model to verify human presence without intrusive challenges.

## Workflow

1.  **Challenge Request**:
    *   Client requests a challenge from `/api/challenge`.
    *   Server generates a random seed + **Discriminant** (2048-bit Class Group).
    *   Server stores the challenge hash in R2 (`zeno-challenges`).

2.  **Solving (Client-Side)**:
    *   Client receives the seed, discriminant, and difficulty parameters.
    *   **Phase 1 (Memory)**: Finds a 42-cycle in a Cuckatoo graph ($2^{18}$ nodes by default, ~32MB RAM).
    *   **Phase 2 (Time)**: Computes a VDF (Verifiable Delay Function) in the Class Group. This enforces a sequential time delay (~0.6s at VDF=100).
    *   Results are sent to the server.

3.  **Redemption**:
    *   Client submits the `solution` to `/api/redeem`.
    *   Server verifies the graph cycle and VDF proof ($O(1)$ fast).
    *   Server issues a stateful Token (UUID) and stores it in R2 (`zeno-tokens`).
    *   Challenge is **deleted** immediately to prevent replay.

4.  **Verification**:
    *   Your backend sends the token to `/api/verify`.
    *   **Payload**:
        ```json
        POST /api/verify
        {
          "site_key": "YOUR_SITE_KEY",
          "token": "TOKEN_FROM_CLIENT",
          "single": true
        }
        ```
        *   `single: true`: **Burn** token (Strict Single-Use).
        *   `single: false`: **Keep** token (Multi-use if `token_reuse=true`).
    *   Zeno Server checks R2 for the token's existence and expiry.

5.  **Deletion (Optional)**:
    *   Your backend can call `/api/delete` to revoke a token early (e.g. user logout).

## Components

*   **Rust Core (WASM)**: Handles the Cuckatoo cycle finding and VDF (Class Groups) computation.
*   **Worker**: Cloudflare Worker managing the API, CORS, and R2.
*   **Storage**: Cloudflare R2 for transient state (Challenges, Tokens, Bans).

## Default Parameters

| Parameter | Value | Effect |
| :--- | :--- | :--- |
| `graph_bits` | 18 | ~32 MB RAM, ~0.9s cycle time |
| `vdf` | 100 | ~0.6s sequential delay |
| **Total** | — | **~0.9s solve, ~32MB RAM** |

## Security Model

### Memory Wall (Primary)
- Default: 32MB per solve instance
- Stops GPU farms: 24GB VRAM = only 750 parallel instances
- Stops ASICs: Cannot add RAM to custom silicon
- Stops bot farms: 1000 threads = 32GB RAM required

### Time Wall (Secondary)
- VDF is inherently sequential
- Cannot be parallelized regardless of hardware
- Prevents pre-computation attacks

### Verification Asymmetry
| Operation | Time | RAM |
| :--- | :--- | :--- |
| Solve | ~0.9s | ~32MB |
| Verify | ~1ms | ~1KB |

This 1000× asymmetry makes DoS attacks impractical.