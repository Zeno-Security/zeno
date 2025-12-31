<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Alternatives

Why choose Zeno over other CAPTCHA systems?

| Feature | **Zeno** | **Altcha** | ReCAPTCHA | Turnstile |
| :--- | :--- | :--- | :--- | :--- |
| **Method** | **Memory + Time (Physics)** | CPU Hashing (SHA-256) | Behavioral | Behavioral / PoW |
| **ASIC Resistance** | **High** (32MB RAM default) | **Low** (Hashable by ASIC) | N/A | Low |
| **GPU Resistance** | **High** (Memory-bound) | **None** (Compute-bound) | N/A | Low |
| **Bot Farm Defense** | **High** (32GB for 1k threads) | **Low** (Cheap cores scale) | Variable | Variable |
| **Privacy** | **100% Zero-Knowledge** | 100% Zero-Knowledge | Tracking | Limited Tracking |
| **Cost to Bot** | **High RAM + Forced Wait** | Low CPU | Risk of detection | Low CPU |

## Deep Dive: Zeno vs Standard PoW (Altcha/Cap)

Most PoW CAPTCHAs rely on a simple hash puzzle (like SHA-256).

**The Flaw**: Hashing is "Compute-Bound". Attackers can use:
- **ASICs**: Chips specialized for hashing are 1,000,000× faster than phones
- **GPUs**: Thousands of parallel cores crush hash puzzles

**The Zeno Fix**: Zeno is **"Memory-Bound"**.

1. **Space (Memory Wall)**:
   - Default config requires ~32MB RAM per solve
   - GPUs have limited per-core memory (~3KB L1 cache)
   - ASICs cannot magically manufacture cheap RAM
   - 1,000 parallel attacks = 32GB RAM required

2. **Time (Sequential Wall)**:
   - VDF (Verifiable Delay Function) cannot be parallelized
   - 1 core at 3GHz ≈ same speed everywhere
   - A GPU with 10,000 cores cannot speed up this single thread

## Deep Dive: Zeno vs Behavioral (Google/Cloudflare)

Behavioral systems rely on "Trust Scores" based on:
- Mouse movements
- Typing patterns
- Browser fingerprints
- Historical behavior

**The Flaw**:
- Modern AI agents can mimic human behavior perfectly
- Privacy users (VPNs, Tor) are flagged as false positives
- Requires invasive tracking

**The Zeno Fix**: Zeno is **Blind**.
- Doesn't care who you are
- Only asks: "Did you spend the resources?"
- Pure physics, un-spoofable by AI
- Zero tracking, zero cookies

## Attack Economics Comparison

| Attack Method | vs SHA-256 PoW | vs Behavioral | vs **Zeno** |
| :--- | :--- | :--- | :--- |
| **Rent 1000 VPS** | ✅ Effective | ⚠️ Detected | ❌ Need 32GB RAM each |
| **Buy ASIC** | ✅ 1M× speedup | N/A | ❌ Can't add RAM to ASIC |
| **Rent GPU Farm** | ✅ 1000× speedup | N/A | ❌ Memory-bound, not compute |
| **AI Mouse Faker** | N/A | ✅ Effective | ❌ Irrelevant (no behavior check) |
| **Headless Browser** | ⚠️ Slow but works | ⚠️ Sometimes detected | ❌ Must still solve physics |

## Bottom Line

| If your threat is... | Best Solution |
| :--- | :--- |
| Script kiddies | Any PoW works |
| Professional bot farms | **Zeno** (memory wall) |
| State-level attackers with ASICs | **Zeno** (memory wall) |
| AI-powered automation | **Zeno** (physics > behavior) |
| Privacy-conscious users | **Zeno** (no tracking) |