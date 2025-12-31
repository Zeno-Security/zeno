/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */
import init, { solve_wasm } from 'zeno-core';

let isInitialized = false;

self.onmessage = async (event) => {
    const { type, challenge, wasm_url } = event.data;

    if (type === 'SOLVE') {
        try {
            if (!isInitialized) {
                // Dynamic WASM loading from main thread guidance
                await init(wasm_url || "zeno.wasm");
                isInitialized = true;
            }

            console.log("Starting Zeno Solver...");
            // Call WASM - result includes memory_bytes from Rust
            const result = solve_wasm(
                challenge.seed,
                challenge.discriminant,
                BigInt(challenge.vdf), // WASM expects u64
                challenge.graph_bits
            );

            // Memory is now included in result.memory_bytes from Rust SolveResult
            // No need to access wasmExports.memory (which isn't exported by default)
            const memoryUsage = result.memory_bytes || 0;

            self.postMessage({ type: 'SOLVED', payload: result, memory: memoryUsage });

        } catch (e: any) {
            console.error("Solver Error:", e);
            self.postMessage({ type: 'ERROR', error: e.toString() });
        }
    }
};