<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Hono Integration

```typescript
import { Hono } from 'hono';

const app = new Hono();
const ZENO_VERIFY_URL = '[https://zeno.secops.workers.dev/api/verify](https://zeno.secops.workers.dev/api/verify)';
const SITE_KEY = 'YOUR_SITE_KEY';

app.use('/protected/*', async (c, next) => {
    const { token } = await c.req.json();
    
    if (!token) return c.text('Missing token', 400);

    const res = await fetch(ZENO_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            token,
            site_key: SITE_KEY
        })
    });

    if ((await res.json()).valid) {
        await next();
    } else {
        return c.text('Invalid Captcha', 403);
    }
});
```
