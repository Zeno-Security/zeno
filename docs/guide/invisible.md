<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Invisible Mode

**Zeno Invisible Mode** validates the user in the background without any user interaction.

## How it works

1.  Provide the widget.
2.  Programmatically trigger the challenge using the API.
3.  The widget solves the PoW using the Web Worker (typically < 100ms for low difficulty).
4.  Returns the token silently.

## Usage

Do not emit the `<zeno-widget>` tag. Instead, import the class.

```javascript
import { Zeno } from 'https://cdn.jsdelivr.net/gh/zeno-security/zeno/dist/client/zeno.min.js';

async function protectAction() {
    const zeno = new Zeno({
        siteKey: 'YOUR_KEY',
        apiEndpoint: 'https://your-worker/api'
    });

    try {
        const token = await zeno.solve();
        // Submit token with your form data
    } catch (error) {
        console.error("Bot detected or timeout", error);
    }
}
```

## "Quantum" Verification

In this mode, the "observation" happens so quickly the user doesn't notice, but the computational cost remains real for any bot attempting to automate this at scale.