<!--
  Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)

  This software is licensed under the PolyForm Strict License 1.0.0.
  You may obtain a copy of the License at:
  * https://polyformproject.org/licenses/strict/1.0.0/

  SPDX-License-Identifier: PolyForm-Strict-1.0.0
-->
# Standalone API Reference

Complete reference for the Zeno Server API.

## Endpoints

### `POST /api/challenge`
Request a new PoW challenge.
**Body**:
```json
{
  "site_key": "uuid" 
}
```
**Response**:
```json
{
  "challenge_id": "uuid",
  "seed": "hex...",
  "discriminant": "hex...",
  "difficulty": 2000000,
  "graph_bits": 28,
  "issued_at": 1709232000,
  "expires_at": 1709232060
}
```

### `POST /api/redeem`
Submits a solution for verification and token issuance.
**Body**:
```json
{
  "site_key": "uuid",
  "challenge_id": "uuid",
  "solution": {
      "cycle": [10, 500, ...],
      "y": { "a": "hex...", "b": "hex..." }, 
      "pi": { "a": "hex...", "b": "hex..." }
  }
}
```
**Response**:
```json
{
  "token": "uuid",
  "expires_at": 1709235600
}
```

### `POST /api/verify`
(Server-side) Verify if a token is valid.
**Body**:
```json
{
  "site_key": "uuid",
  "token": "uuid",
  "single": false // Optional: Force burn/single-use
}
```
**Response**:
```json
{
  "valid": true,
  "metadata": {} 
}
```

### `POST /api/delete`
Manually revoke a token (e.g., on logout).
**Body**:
```json
{
  "site_key": "uuid",
  "token": "uuid"
}
```
**Response**:
```json
{
  "deleted": true
}
```
