<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Express.js Integration

```javascript
const express = require('express');
const app = express();

const ZENO_VERIFY_URL = '[https://zeno.secops.workers.dev/api/verify](https://zeno.secops.workers.dev/api/verify)';

const zenoMiddleware = async (req, res, next) => {
    const token = req.body['zeno-token']; // Or header
    
    if (!token) return res.status(400).json({ error: 'Missing captcha token' });

    try {
        const response = await fetch(ZENO_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token,
                site_key: 'YOUR_SITE_KEY' // Ensure you pass your site key
            })
        });
        
        const data = await response.json();
        
        if (data.valid) {
            next();
        } else {
            res.status(403).json({ error: 'Captcha verification failed' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error during verification' });
    }
};

app.post('/login', zenoMiddleware, (req, res) => {
    res.json({ success: true });
});
```
