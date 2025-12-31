/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
    base: './',
    plugins: [
        wasm(),
        topLevelAwait()
    ],
    worker: {
        plugins: [
            wasm()
        ],
        rollupOptions: {
            output: {
                entryFileNames: 'zeno_worker.js',
                assetFileNames: 'zeno.[ext]'
            }
        }
    },
    build: {
        outDir: '../../dist/client',
        emptyOutDir: true,
        // minify: true, // Removed: Letting jsdelivr handle minification
        assetsInlineLimit: 0, // Disable inlining
        lib: {
            entry: 'src/zeno.ts',
            name: 'Zeno',
            fileName: () => 'zeno.min.js',
            formats: ['es']
        },
        rollupOptions: {
            output: {
                // Ensure assets (like WASM) are flat
                assetFileNames: '[name].[ext]',
                banner: `/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */`
            }
        }
    }
});
