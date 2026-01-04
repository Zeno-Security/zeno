/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */

import { solveJS, isWasmSupported } from './solver-js';

let wasmModule: any = null;
let wasmInitialized = false;
let useWasm = true;

// Check WASM support on worker initialization
let wasmSupported = false;
try {
    wasmSupported = isWasmSupported();
} catch (e) {
    console.warn("Failed to check WASM support, defaulting to false:", e);
    wasmSupported = false;
}

async function initWasm(wasmUrl: string): Promise<boolean> {
    if (!wasmSupported) {
        console.warn("WebAssembly not supported in this environment. Using JS fallback.");
        return false;
    }

    try {
        const init = (await import('zeno-core')).default;
        await init(wasmUrl || "zeno.wasm");
        wasmModule = await import('zeno-core');
        wasmInitialized = true;
        console.log("WASM solver initialized successfully");
        return true;
    } catch (e) {
        console.warn("WASM initialization failed, falling back to JS solver:", e);
        return false;
    }
}

self.onmessage = async (event) => {
    const { type, challenge, wasm_url, force_js } = event.data;

    if (type === 'SOLVE') {
        try {
            // Determine which solver to use
            const shouldUseJs = force_js || !wasmSupported;

            if (!shouldUseJs && !wasmInitialized) {
                useWasm = await initWasm(wasm_url);
            }

            const actuallyUsingWasm = useWasm && wasmInitialized && !shouldUseJs;

            // Notify main thread which mode we're using
            self.postMessage({
                type: 'STATUS',
                mode: actuallyUsingWasm ? 'wasm' : 'js',
                wasmSupported
            });

            console.log(`Starting Zeno Solver (${actuallyUsingWasm ? 'WASM' : 'JS fallback'})...`);

            let result: any;
            let memoryUsage = 0;

            if (actuallyUsingWasm) {
                // WASM Path with Progress
                // Using new iterative WasmVdfSolver
                const solver = new wasmModule.WasmVdfSolver(
                    challenge.seed,
                    challenge.discriminant,
                    BigInt(challenge.vdf),
                    challenge.graph_bits
                );

                let done = false;
                while (!done) {
                    const stepRes = solver.step(10000); // 10k steps per tick

                    if (stepRes.status === 'progress') {
                        // Report progress
                        // Update memory usage peak
                        if ((self.performance as any)?.memory?.usedJSHeapSize) {
                            const currentMem = (self.performance as any).memory.usedJSHeapSize;
                            if (currentMem > memoryUsage) memoryUsage = currentMem;
                        }
                        self.postMessage({ type: 'PROGRESS', percent: stepRes.percent });

                        // Yield to event loop to allow message dispatch
                        await new Promise(r => setTimeout(r, 0));
                    } else if (stepRes.status === 'done') {
                        result = stepRes.output;
                        memoryUsage = result.memory_bytes || memoryUsage;
                        done = true;
                    }
                }

                // Explicitly free solver if necessary (wasm-bindgen classes usually have .free())
                if (solver.free) solver.free();
            } else {
                // JS Fallback Path with progress reporting
                const progressCallback = (percent: number) => {
                    // Start of measurement
                    if ((self.performance as any)?.memory?.usedJSHeapSize) {
                        const currentMem = (self.performance as any).memory.usedJSHeapSize;
                        if (currentMem > memoryUsage) {
                            memoryUsage = currentMem;
                        }
                    }
                    self.postMessage({ type: 'PROGRESS', percent });
                };

                result = solveJS(
                    challenge.seed,
                    challenge.discriminant,
                    challenge.vdf,
                    challenge.graph_bits,
                    progressCallback
                );

                // If we measured a peak, use it. Otherwise use the fallback calculation from result.
                if (memoryUsage === 0 && result.memory_bytes) {
                    memoryUsage = result.memory_bytes;
                }
            }

            self.postMessage({
                type: 'SOLVED',
                payload: result,
                memory: memoryUsage,
                mode: actuallyUsingWasm ? 'wasm' : 'js'
            });

        } catch (e: any) {
            console.error("Solver Error:", e);
            self.postMessage({ type: 'ERROR', error: e.toString() });
        }
    }

    if (type === 'CHECK_WASM') {
        self.postMessage({
            type: 'WASM_STATUS',
            supported: wasmSupported,
            initialized: wasmInitialized
        });
    }
};