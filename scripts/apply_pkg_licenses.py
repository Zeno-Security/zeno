import os

HEADER = """/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */

"""

# Targets relative to project root
TARGETS = [
    "src/core/pkg/zeno_core.d.ts",
    "src/core/pkg/zeno_core.js",
    "src/core/pkg/zeno_core_bg.wasm.d.ts",
    "src/core/pkg-node/zeno_core.d.ts",
    "src/core/pkg-node/zeno_core.js",
    "src/core/pkg-node/zeno_core_bg.wasm.d.ts",
    "dist/server/worker.js",
    "dist/client/zeno.js",
    "dist/client/zeno_worker.js",
    "dist/client/zeno_core.js"
]

def apply_header(path):
    if not os.path.exists(path):
        print(f"Skipping {path} (not found)")
        return
    
    with open(path, 'r') as f:
        content = f.read()
    
    # Check if header already exists (lenient check)
    if "PolyForm Strict License" not in content[:500]:
        with open(path, 'w') as f:
            f.write(HEADER + content)
        print(f"Applied license to {path}")
    else:
        print(f"License already present in {path}")

if __name__ == "__main__":
    print("Running license header application...")
    for t in TARGETS:
        apply_header(t)
