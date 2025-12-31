<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# How Zeno Works

Zeno operates at the intersection of cryptography and distributed computing.

## The Challenge

When a client initiates a protected action, the Zeno Server issues a **Space-Time** challenge.

1.  **Space (Memory)**: Find a 42-cycle in a random bipartite graph determined by a seed.
2.  **Time (Latency)**: Compute a sequential VDF (Verifiable Delay Function) on the result.

## The Solver (Client)

The client (browser) uses WebAssembly to solve this challenge efficiently.

1.  **Web Worker**: The solver runs in a background thread to prevent UI blocking.
2.  **Allocation**: It allocates ~32MB of RAM (at default GB=18) to generate the Cuckatoo Graph.
3.  **Graph Search**: It identifies the required 42-edge cycle.
4.  **VDF Squaring**: It performs sequential squarings in a Class Group to generate the time-proof.
5.  **Submission**: The cycle indices and VDF proof are sent to the server.

## The Verification (Server)

Verification is instantaneous ($O(1)$ relative to the work).

1.  **Cycle Check**: The server verifies the 42 edges form a loop (~42 hashes).
2.  **VDF Check**: The server checks the Wesolowski proof equation (2 modular exponentiations).

## Why This Works

### Asymmetry
| Operation | Time | RAM |
| :--- | :--- | :--- |
| **Solve** | ~0.9s | ~32MB |
| **Verify** | ~1ms | ~1KB |

Creating a solution costs 1000× more than verifying it.

### Memory Wall (Primary Defense)

| Attacker | Hardware | Max Parallel (32MB each) |
| :--- | :--- | :--- |
| Bot Farm | 8GB VPS | 250 instances |
| GPU Farm | 24GB RTX 4090 | 750 instances |
| ASIC | Custom silicon | **Cannot add RAM** |

To send 1,000 requests/second, an attacker needs **32GB of RAM** dedicated to Zeno alone.

### Time Wall (Secondary Defense)

The VDF is inherently sequential:
- 1 CPU core at 3GHz ≈ same speed everywhere
- A GPU with 10,000 cores cannot parallelize this
- Prevents pre-computation (VDF depends on challenge discriminant)

### Scalability

The server is stateless during solving:
- Only validates the final result
- Does not track solving progress
- Can handle unlimited concurrent solvers

## Attack Economics

| Attack Type | vs SHA-256 PoW | vs Zeno |
| :--- | :--- | :--- |
| ASIC purchase | 1,000,000× speedup | **No speedup** (memory-bound) |
| GPU rental | 1,000× speedup | **Limited to VRAM ÷ 32MB** |
| VPS farm | Scales linearly | **32GB RAM per 1000 req/s** |

## The "Quantum Zeno Effect"

The system is named after the physics phenomenon where continuous observation freezes a quantum state.

Similarly, Zeno "freezes" bot throughput by forcing continuous resource expenditure:
- Each request costs real resources (RAM + time)
- Cannot batch or pre-compute
- Cannot parallelize beyond memory limits
- The attack is effectively frozen by physics