<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Installation

For standalone usage, you will need to compile the Rust core.

```bash
# Clone the repository
git clone https://github.com/zeno-security/zeno.git

# Build the WASM core
cd zeno/src/core
wasm-pack build --target nodejs
```

*Note: This is an advanced topic. We recommend the Cloudflare Worker deployment for most users.*
