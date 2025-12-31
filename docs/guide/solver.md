<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Solver Mechanics

Zeno replaces legacy "Cost" (SHA-256) and "Surveillance" (Google Cookies) with "Physics" (Space & Time).

## 1. Space: The Memory Wall (Cuckatoo Cycle)

The solver must find a cycle of length 42 in a Cuckoo Graph.

**Mechanism:**
- Graph is defined by `GRAPH_BITS` parameter
- `GRAPH_BITS = 18` implies $2^{18}$ = 262,144 edges
- Finding this cycle requires random access to the graph structure

**Memory Requirements (Default GB=18):**
- ~32MB of RAM allocated per solve
- Memory scales exponentially: each +1 GB doubles RAM

**Why This Stops Attacks:**

| Attacker | Problem |
| :--- | :--- |
| **Bot Farms** | Cheap VPS (128MB-512MB RAM) can only run 4-16 parallel instances |
| **GPUs** | Limited per-core memory; 24GB VRAM = only 750 parallel instances |
| **ASICs** | Cannot add RAM to custom silicon; memory is irreducible cost |

## 2. Time: The Sequential Wall (VDF)

After finding the cycle, the solver performs a Verifiable Delay Function (VDF).

**Mechanism:**
- Wesolowski VDF over Class Groups of Imaginary Quadratic Fields
- Repeated squaring: $x^{2^T} \pmod N$
- Operation is inherently sequential

**Time Cost (Default VDF=100):**
- ~600ms sequential computation
- Each VDF iteration adds ~6ms
- Rate: ~170 iterations/second in WASM

**Why This Stops Attacks:**

| Attacker | Problem |
| :--- | :--- |
| **GPU Farm** | 10,000 cores cannot speed up a single sequential thread |
| **Pre-computation** | VDF depends on challenge-specific discriminant; cannot pre-solve |
| **Time-sharing** | Cannot amortize sequential work across requests |

## 3. The Hybrid Defense

Memory and Time are **independent knobs**:

| Goal | Adjust | Effect |
| :--- | :--- | :--- |
| More GPU/ASIC resistance | ↑ `GRAPH_BITS` | Memory doubles per +1 |
| More sequential guarantee | ↑ `VDF` | +600ms per +100 VDF |
| Faster UX | ↓ `VDF` | Time decreases linearly |
| Mobile-friendly | ↓ `GRAPH_BITS` | Memory halves per -1 |

**Default Strategy (GB=18, VDF=100):**
- Memory wall is **primary defense** (32MB per instance)
- VDF is **secondary defense** (prevents pre-computation)
- Total time: ~0.9 seconds

## 4. Verification

Verification is instant ($O(1)$ relative to solving):

**Cycle Verification:**
- Check 42 edges exist in the graph
- 42 SipHash evaluations
- Time: microseconds

**VDF Verification:**
- Wesolowski proof allows instant verification
- Server checks: $y = \pi^l \cdot x^r$
- 2 modular exponentiations
- Time: milliseconds

**Asymmetry:**
| Operation | Time | RAM |
| :--- | :--- | :--- |
| **Solve** | ~0.9s | ~32MB |
| **Verify** | ~1ms | ~1KB |

This 1000× asymmetry is the foundation of Zeno's security.

## 5. Why Memory > Time for Security

Traditional PoW (SHA-256) is compute-bound:
- ASICs achieve 1,000,000× speedup over CPUs
- GPUs achieve 1,000× speedup
- Attackers buy hardware once, attack forever

Zeno is memory-bound:
- RAM cannot be parallelized away
- Each instance needs dedicated memory
- Memory is recurring cost, not one-time

**Economic Analysis:**

| Resource | Cost to Attacker | Zeno's Defense |
| :--- | :--- | :--- |
| CPU cycles | $0.00001 per billion | VDF makes cycles sequential |
| GPU cores | $0.50/hour for 10,000 | Memory limits parallelism to ~750 |
| RAM | $5/GB/month | **32MB × 1000 = 32GB required** |
| ASIC | $10,000 one-time | **Cannot add RAM to silicon** |