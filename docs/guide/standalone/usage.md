<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Usage Guide (Standalone)

This guide covers how to act as a **Zeno Server** (generating challenges, validating tokens) in your own backend.

## 1. Installation

```bash
npm install zeno-server
# OR
yarn add zeno-server
```

## 2. Generate Challenge (`GET /api/challenge`)

The client requests a challenge (PoW parameters) from your server.

```javascript
import { ZenoServer } from 'zeno-server';

const zeno = new ZenoServer({
    secretKey: process.env.ZENO_SECRET_KEY
});

app.get('/api/challenge', async (req, res) => {
    // 1. Generate challenge
    const challenge = await zeno.createChallenge({
        siteKey: req.query.site_key,
        ip: req.ip
    });

    // 2. Return to client
    res.json(challenge);
});
```

**Response Format:**
```json
{
  "challenge_id": "UUID",
  "seed": "HEX",
  "discriminant": "HEX",
  "vdf": 300,
  "graph_bits": 18,
  "issued_at": 1234567890,
  "expires_at": 1234567950
}
```

### 2. `POST /api/redeem`

The client submits a solution. You verify it and issue a **Zeno Token**.

```javascript
app.post('/api/redeem', async (req, res) => {
    const { challenge_id, solution, site_key } = req.body;

    try {
        // 1. Verify Solution (Heavy CPU)
        const token = await zeno.redeemChallenge({
            challengeId: challenge_id,
            solution: solution,
            siteKey: site_key
        });

        // 2. Return signed token
        res.json({ token });

    } catch (err) {
        res.status(400).json({ error: "Invalid solution" });
    }
});
```

## 3. Protect Routes (`/api/protected`)

Your sensitive endpoints (e.g., login, signup) require a valid Zeno Token.

```javascript
app.post('/login', async (req, res) => {
    const token = req.headers['x-zeno-token'];

    // 1. Verify Token (Fast)
    const isValid = await zeno.verifyToken(token);

    if (!isValid) {
        return res.status(403).json({ error: "Access Denied" });
    }

    // 2. Proceed with login logic...
});
```

## 4. Middleware Integration

For Express, Hono, etc., consider using middleware to simplify route protection.

**Express Example:**
```javascript
import { zenoMiddleware } from 'zeno-server/express';

app.use('/api/protected', zenoMiddleware({
    secretKey: '...',
    onError: (res) => res.status(403).send('Bot detected')
}));
```

## 5. Client Integration

The client-side widget handles solving automatically.

```javascript
// Initialize
const zeno = new Zeno({
    apiEndpoint: '/api',
    siteKey: '...',
    forceJS: true // Optional: Force JS solver for testing (default: false)
});
```

## 6. Performance & Tuning

See [Benchmarks](../../guide/benchmark.md) for detailed performance analysis, tuning recommendations, and hardware benchmark data.