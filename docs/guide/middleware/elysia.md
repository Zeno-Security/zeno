<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Elysia Integration

```typescript
import { Elysia } from 'elysia';

const ZENO_VERIFY_URL = '[https://zeno.secops.workers.dev/api/verify](https://zeno.secops.workers.dev/api/verify)';
const SITE_KEY = 'YOUR_SITE_KEY';

const zeno = (app: Elysia) => app.decorate('verifyZeno', async (token: string) => {
    const response = await fetch(ZENO_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            token,
            site_key: SITE_KEY 
        })
    });
    const data = await response.json();
    return data.valid;
});

new Elysia()
    .use(zeno)
    .post('/login', async ({ body, verifyZeno, error }) => {
        if (!await verifyZeno(body.token)) return error(403, 'Invalid Captcha');
        return { success: true };
    })
    .listen(3000);
```
