<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# The Zeno Effect

**Zeno** takes its name from the **Quantum Zeno Effect**, a phenomenon in quantum physics where frequent measurements of a system prevent it from evolving.

> "A watched pot never boils."

In the quantum world, repeated observations (interactions) collapse the wave function, resetting the system's "clock" and inhibiting decay or transition.

## Application to Bot Mitigation

Zeno applies this principle to automated threats. By forcing bots to continuously "measure" (solve cryptographic proof-of-work challenges), we effectively freeze their evolution and throughput.

1.  **Continuous Measurement**: Every request is a "measurement" requiring computational effort.
2.  **State Freeze**: The bot cannot transition to its malicious state (spamming, credential stuffing) because it is stuck in the "observed" state of solving challenges.
3.  **Collapse**: The economic viability of the attack collapses under the weight of the required compute.

Unlike visual CAPTCHAs that rely on human cognition (which AI can mimic), Zeno relies on the immutable laws of physics and computation. A CPU cycle is a CPU cycle, whether human or machine. We shift the burden from **cognition** (annoying to humans) to **computation** (trivial for humans, costly for bots at scale).