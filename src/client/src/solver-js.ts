/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */

// ============================================================================
// Pure JavaScript Zeno Solver - WASM Fallback
// Implements bit-identical algorithms to Rust/WASM for environments without
// WebAssembly support.
// ============================================================================

export interface JSSolveResult {
    cycle: number[];
    y: string;
    pi: string;
    memory_bytes: number;
}

export type ProgressCallback = (percent: number) => void;

// ============================================================================
// SipHash-2-4 Implementation (Matches siphasher crate)
// ============================================================================

class SipHasher24 {
    private v0: bigint;
    private v1: bigint;
    private v2: bigint;
    private v3: bigint;
    private buf: bigint = 0n;
    private bufLen: number = 0;
    private totalLen: number = 0;

    constructor(key: Uint8Array) {
        const k0 = this.readU64LE(key, 0);
        const k1 = this.readU64LE(key, 8);

        this.v0 = k0 ^ 0x736f6d6570736575n;
        this.v1 = k1 ^ 0x646f72616e646f6dn;
        this.v2 = k0 ^ 0x6c7967656e657261n;
        this.v3 = k1 ^ 0x7465646279746573n;
    }

    private readU64LE(arr: Uint8Array, offset: number): bigint {
        let val = 0n;
        for (let i = 0; i < 8; i++) {
            val |= BigInt(arr[offset + i]) << BigInt(i * 8);
        }
        return val;
    }

    private rotl(x: bigint, b: number): bigint {
        const mask = 0xFFFFFFFFFFFFFFFFn;
        return ((x << BigInt(b)) | (x >> BigInt(64 - b))) & mask;
    }

    private sipRound(): void {
        const mask = 0xFFFFFFFFFFFFFFFFn;
        this.v0 = (this.v0 + this.v1) & mask;
        this.v1 = this.rotl(this.v1, 13);
        this.v1 ^= this.v0;
        this.v0 = this.rotl(this.v0, 32);

        this.v2 = (this.v2 + this.v3) & mask;
        this.v3 = this.rotl(this.v3, 16);
        this.v3 ^= this.v2;

        this.v0 = (this.v0 + this.v3) & mask;
        this.v3 = this.rotl(this.v3, 21);
        this.v3 ^= this.v0;

        this.v2 = (this.v2 + this.v1) & mask;
        this.v1 = this.rotl(this.v1, 17);
        this.v1 ^= this.v2;
        this.v2 = this.rotl(this.v2, 32);
    }

    private processBlock(m: bigint): void {
        this.v3 ^= m;
        this.sipRound();
        this.sipRound();
        this.v0 ^= m;
    }

    writeU64(val: bigint): void {
        // Direct 8-byte write path (optimized for our use case)
        this.processBlock(val & 0xFFFFFFFFFFFFFFFFn);
        this.totalLen += 8;
    }

    finish(): bigint {
        // Finalization with length byte
        const b = (BigInt(this.totalLen) & 0xFFn) << 56n;
        this.v3 ^= b;
        this.sipRound();
        this.sipRound();
        this.v0 ^= b;

        this.v2 ^= 0xFFn;
        this.sipRound();
        this.sipRound();
        this.sipRound();
        this.sipRound();

        return this.v0 ^ this.v1 ^ this.v2 ^ this.v3;
    }
}

function generateEdge(key: Uint8Array, index: bigint, mask: bigint): [bigint, bigint] {
    const hasher1 = new SipHasher24(key);
    hasher1.writeU64(2n * index);
    const u = hasher1.finish() & mask;

    const hasher2 = new SipHasher24(key);
    hasher2.writeU64(2n * index + 1n);
    const v = hasher2.finish() & mask;

    return [u, v];
}

// ============================================================================
// SHA-256 Implementation (Pure JS, no dependencies)
// ============================================================================

const SHA256_K: Uint32Array = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function sha256(data: Uint8Array): Uint8Array {
    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;

    // Pre-processing: adding padding bits
    const bitLen = BigInt(data.length * 8);
    const totalLen = data.length + 1 + 8;
    const padLen = (64 - (totalLen % 64)) % 64;

    const padded = new Uint8Array(data.length + 1 + padLen + 8);
    padded.set(data);
    padded[data.length] = 0x80;
    // Length in bits as big-endian 64-bit
    for (let i = 0; i < 8; i++) {
        padded[padded.length - 1 - i] = Number((bitLen >> BigInt(i * 8)) & 0xFFn);
    }

    const w = new Uint32Array(64);

    for (let chunk = 0; chunk < padded.length; chunk += 64) {
        // Break chunk into sixteen 32-bit big-endian words
        for (let i = 0; i < 16; i++) {
            w[i] = (padded[chunk + i * 4] << 24) |
                (padded[chunk + i * 4 + 1] << 16) |
                (padded[chunk + i * 4 + 2] << 8) |
                (padded[chunk + i * 4 + 3]);
        }

        // Extend the sixteen 32-bit words into sixty-four 32-bit words
        for (let i = 16; i < 64; i++) {
            const s0 = (rotr32(w[i - 15], 7) ^ rotr32(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
            const s1 = (rotr32(w[i - 2], 17) ^ rotr32(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }

        let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

        for (let i = 0; i < 64; i++) {
            const S1 = (rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25)) >>> 0;
            const ch = ((e & f) ^ (~e & g)) >>> 0;
            const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
            const S0 = (rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22)) >>> 0;
            const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
            const temp2 = (S0 + maj) >>> 0;

            h = g;
            g = f;
            f = e;
            e = (d + temp1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) >>> 0;
        }

        h0 = (h0 + a) >>> 0;
        h1 = (h1 + b) >>> 0;
        h2 = (h2 + c) >>> 0;
        h3 = (h3 + d) >>> 0;
        h4 = (h4 + e) >>> 0;
        h5 = (h5 + f) >>> 0;
        h6 = (h6 + g) >>> 0;
        h7 = (h7 + h) >>> 0;
    }

    const result = new Uint8Array(32);
    const view = new DataView(result.buffer);
    view.setUint32(0, h0, false);
    view.setUint32(4, h1, false);
    view.setUint32(8, h2, false);
    view.setUint32(12, h3, false);
    view.setUint32(16, h4, false);
    view.setUint32(20, h5, false);
    view.setUint32(24, h6, false);
    view.setUint32(28, h7, false);
    return result;
}

function rotr32(x: number, n: number): number {
    return ((x >>> n) | (x << (32 - n))) >>> 0;
}

// ============================================================================
// BigInt Utilities (Matching Rust's num-bigint)
// ============================================================================

function bigintToSignedBytesBE(n: bigint): Uint8Array {
    if (n === 0n) return new Uint8Array([0]);

    const negative = n < 0n;
    let abs = negative ? -n : n;

    const bytes: number[] = [];
    while (abs > 0n) {
        bytes.unshift(Number(abs & 0xFFn));
        abs >>= 8n;
    }

    // Two's complement for negative numbers
    if (negative) {
        // Invert all bits and add 1
        let carry = 1;
        for (let i = bytes.length - 1; i >= 0; i--) {
            const val = (~bytes[i] & 0xFF) + carry;
            bytes[i] = val & 0xFF;
            carry = val >> 8;
        }
        // Ensure high bit is set (negative)
        if ((bytes[0] & 0x80) === 0) {
            bytes.unshift(0xFF);
        }
    } else {
        // Ensure high bit is clear (positive)
        if ((bytes[0] & 0x80) !== 0) {
            bytes.unshift(0x00);
        }
    }

    return new Uint8Array(bytes);
}

function bigintFromSignedBytesBE(bytes: Uint8Array): bigint {
    if (bytes.length === 0) return 0n;

    const negative = (bytes[0] & 0x80) !== 0;

    let result = 0n;
    if (negative) {
        // Two's complement: invert and add 1
        const inverted = new Uint8Array(bytes.length);
        let carry = 1;
        for (let i = bytes.length - 1; i >= 0; i--) {
            const val = (~bytes[i] & 0xFF) + carry;
            inverted[i] = val & 0xFF;
            carry = val >> 8;
        }
        for (const b of inverted) {
            result = (result << 8n) | BigInt(b);
        }
        result = -result;
    } else {
        for (const b of bytes) {
            result = (result << 8n) | BigInt(b);
        }
    }

    return result;
}

function bigintToBytesBE(n: bigint): Uint8Array {
    if (n === 0n) return new Uint8Array([0]);
    const bytes: number[] = [];
    let val = n < 0n ? -n : n;
    while (val > 0n) {
        bytes.unshift(Number(val & 0xFFn));
        val >>= 8n;
    }
    return new Uint8Array(bytes);
}

function bigintFromBytesBE(bytes: Uint8Array): bigint {
    let result = 0n;
    for (const b of bytes) {
        result = (result << 8n) | BigInt(b);
    }
    return result;
}

// ============================================================================
// Binary Quadratic Form (BQF) - Class Group Arithmetic
// ============================================================================

interface Form {
    a: bigint;
    b: bigint;
    c: bigint;
    discriminant: bigint;
}

function formSerializeStrict(f: Form): Uint8Array {
    const aBytes = bigintToSignedBytesBE(f.a);
    const bBytes = bigintToSignedBytesBE(f.b);

    const result = new Uint8Array(2 + aBytes.length + 2 + bBytes.length);
    const view = new DataView(result.buffer);

    view.setUint16(0, aBytes.length, false);
    result.set(aBytes, 2);
    view.setUint16(2 + aBytes.length, bBytes.length, false);
    result.set(bBytes, 4 + aBytes.length);

    return result;
}

function formFromStrictBytes(bytes: Uint8Array, discriminant: bigint): Form {
    const view = new DataView(bytes.buffer, bytes.byteOffset);

    let cursor = 0;
    const aLen = view.getUint16(cursor, false);
    cursor += 2;
    const a = bigintFromSignedBytesBE(bytes.slice(cursor, cursor + aLen));
    cursor += aLen;

    const bLen = view.getUint16(cursor, false);
    cursor += 2;
    const b = bigintFromSignedBytesBE(bytes.slice(cursor, cursor + bLen));

    // Derive c: 4ac = b² - D → c = (b² - D) / 4a
    const bSq = b * b;
    const num = bSq - discriminant;
    const fourA = 4n * a;
    const c = num / fourA;

    return { a, b, c, discriminant };
}

function formNormalize(f: Form): Form {
    const twoA = 2n * f.a;
    let b = ((f.b % twoA) + twoA) % twoA; // Positive modulo

    if (b > f.a) {
        b -= twoA;
    } else if (b <= -f.a) {
        b += twoA;
    }

    const bSq = b * b;
    const num = bSq - f.discriminant;
    const fourA = 4n * f.a;
    const c = num / fourA;

    return { a: f.a, b, c, discriminant: f.discriminant };
}

function formReduce(f: Form): Form {
    let form = formNormalize(f);

    while (true) {
        if (form.a > form.c) {
            const oldA = form.a;
            form = {
                a: form.c,
                b: -form.b,
                c: oldA,
                discriminant: form.discriminant
            };
            form = formNormalize(form);
        } else {
            if (form.a === form.c && form.b < 0n) {
                form = { ...form, b: -form.b };
            }
            break;
        }
    }

    return form;
}

function formIdentity(discriminant: bigint): Form {
    const one = 1n;
    const c = (one - discriminant) / 4n;
    return { a: one, b: one, c, discriminant };
}

function extendedGcd(a: bigint, b: bigint): { gcd: bigint; x: bigint; y: bigint } {
    if (b === 0n) {
        return { gcd: a, x: 1n, y: 0n };
    }
    const { gcd, x: x1, y: y1 } = extendedGcd(b, a % b);
    return { gcd, x: y1, y: x1 - (a / b) * y1 };
}

function formCompose(f1: Form, f2: Form): Form {
    const a1 = f1.a;
    const a2 = f2.a;
    const b1 = f1.b;
    const b2 = f2.b;
    const c2 = f2.c;

    const s = (b1 + b2) / 2n;

    const egcd1 = extendedGcd(a1, a2);
    const d1 = egcd1.gcd;
    const v1 = egcd1.y;

    const egcd2 = extendedGcd(d1, s);
    const n = egcd2.gcd;
    const u2 = egcd2.x;
    const v2 = egcd2.y;

    const vCoeff = u2 * v1;
    const wCoeff = v2;

    const term1 = vCoeff * (b1 - b2);
    const term2 = wCoeff * c2;
    const kVal = term1 - term2;

    const modVal = (2n * a1) / n;

    let kRem = kVal % modVal;
    if (kRem < 0n) kRem += modVal;
    const baseK = kRem;

    const nSq = n * n;
    const newA = (a1 * a2) / nSq;
    const a2DivN = a2 / n;

    const term = a2DivN * baseK;
    const newB = b2 + term;

    const val = newB * newB - f1.discriminant;
    const fourA = newA * 4n;
    const newC = val / fourA;

    return formReduce({ a: newA, b: newB, c: newC, discriminant: f1.discriminant });
}

function formSquare(f: Form): Form {
    return formCompose(f, f);
}

function formPow(f: Form, exponent: bigint): Form {
    let result = formIdentity(f.discriminant);
    let base = f;
    let exp = exponent;

    while (exp > 0n) {
        if (exp & 1n) {
            result = formCompose(result, base);
        }
        base = formSquare(base);
        exp >>= 1n;
    }

    return result;
}

// ============================================================================
// Miller-Rabin Primality Test
// ============================================================================

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n;
    base = ((base % mod) + mod) % mod;
    while (exp > 0n) {
        if (exp & 1n) {
            result = (result * base) % mod;
        }
        exp >>= 1n;
        base = (base * base) % mod;
    }
    return result;
}

function millerRabin(n: bigint, rounds: number): boolean {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n) return false;

    // Write n-1 as 2^s * d
    let s = 0n;
    let d = n - 1n;
    while (d % 2n === 0n) {
        d /= 2n;
        s++;
    }

    // Deterministic witnesses for numbers < 3,317,044,064,679,887,385,961,981
    const witnesses = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

    for (let i = 0; i < Math.min(rounds, witnesses.length); i++) {
        const a = witnesses[i];
        if (a >= n) continue;

        let x = modPow(a, d, n);

        if (x === 1n || x === n - 1n) continue;

        let composite = true;
        for (let j = 0n; j < s - 1n; j++) {
            x = modPow(x, 2n, n);
            if (x === n - 1n) {
                composite = false;
                break;
            }
        }

        if (composite) return false;
    }

    return true;
}

// ============================================================================
// Tonelli-Shanks Square Root
// ============================================================================

function tonelliShanks(n: bigint, p: bigint): bigint {
    // Check Legendre symbol
    if (modPow(n, (p - 1n) / 2n, p) !== 1n) {
        return 0n;
    }

    // Simple case: p ≡ 3 (mod 4)
    if (p % 4n === 3n) {
        return modPow(n, (p + 1n) / 4n, p);
    }

    // Full Tonelli-Shanks
    let s = 0n;
    let q = p - 1n;
    while (q % 2n === 0n) {
        q /= 2n;
        s++;
    }

    // Find quadratic non-residue z
    let z = 2n;
    while (modPow(z, (p - 1n) / 2n, p) === 1n) {
        z++;
    }

    let c = modPow(z, q, p);
    let r = modPow(n, (q + 1n) / 2n, p);
    let t = modPow(n, q, p);
    let m = s;

    while (t !== 1n) {
        let tt = t;
        let i = 0n;
        while (tt !== 1n) {
            tt = (tt * tt) % p;
            i++;
            if (i === m) return 0n;
        }

        let b = c;
        for (let j = 0n; j < m - i - 1n; j++) {
            b = (b * b) % p;
        }

        m = i;
        c = (b * b) % p;
        t = (t * c) % p;
        r = (r * b) % p;
    }

    return r;
}

// ============================================================================
// HashToGroup & HashToPrime (Spec 3.1, 3.2)
// ============================================================================

function hashToGroup(cycleBytes: Uint8Array, discriminant: bigint): Form {
    const hash = sha256(cycleBytes);
    let seed = bigintFromBytesBE(hash);

    // Find smallest prime P >= seed with Kronecker(D, P) = 1
    while (true) {
        if (seed % 2n === 0n) {
            seed++;
            continue;
        }

        if (millerRabin(seed, 40)) {
            const legendre = modPow(discriminant, (seed - 1n) / 2n, seed);
            const positiveOne = ((1n % seed) + seed) % seed;
            if (legendre === positiveOne || legendre === 1n) {
                break;
            }
        }
        seed++;
    }

    const p = seed;

    // Solve b² ≡ D (mod p) using Tonelli-Shanks
    // Need to handle negative discriminant
    const dMod = ((discriminant % p) + p) % p;
    let b0 = tonelliShanks(dMod, p);

    // Ensure b is odd
    const b = (b0 % 2n === 0n) ? p - b0 : b0;

    // Compute c = (b² - D) / 4a
    const bSq = b * b;
    const fourA = p * 4n;
    const num = bSq - discriminant;
    const c = num / fourA;

    return formReduce({ a: p, b, c, discriminant });
}

function hashToPrime(x: Form, y: Form, discriminant: bigint): bigint {
    // Serialize: B = SerializeForm(x) || SerializeForm(y) || BigIntToBytes(D)
    const xBytes = formSerializeStrict(x);
    const yBytes = formSerializeStrict(y);
    const dBytes = bigintToSignedBytesBE(discriminant);

    const combined = new Uint8Array(xBytes.length + yBytes.length + dBytes.length);
    combined.set(xBytes, 0);
    combined.set(yBytes, xBytes.length);
    combined.set(dBytes, xBytes.length + yBytes.length);

    const seed = sha256(combined);

    let nonce = 0n;
    while (true) {
        // Hash(seed || nonce)
        const nonceBytes = new Uint8Array(8);
        const view = new DataView(nonceBytes.buffer);
        view.setBigUint64(0, nonce, false);

        const toHash = new Uint8Array(seed.length + 8);
        toHash.set(seed, 0);
        toHash.set(nonceBytes, seed.length);

        const h = sha256(toHash);

        // Take first 16 bytes
        let candidate = bigintFromBytesBE(h.slice(0, 16));

        // Set lowest bit to 1 (ensure odd)
        candidate |= 1n;

        if (millerRabin(candidate, 40)) {
            return candidate;
        }

        nonce++;
    }
}

// ============================================================================
// Cuckatoo Cycle Finder
// ============================================================================

function serializeCycle(indices: number[]): Uint8Array {
    const sorted = [...indices].sort((a, b) => a - b);
    const buffer = new Uint8Array(sorted.length * 4);
    const view = new DataView(buffer.buffer);

    for (let i = 0; i < sorted.length; i++) {
        view.setUint32(i * 4, sorted[i], true); // Little-endian
    }

    return buffer;
}

function findCycle(seed: Uint8Array, graphBits: number, onProgress?: ProgressCallback): number[] | null {
    if (seed.length < 16) {
        throw new Error("Seed too short");
    }

    const sipKey = seed.slice(0, 16);
    const numEdges = 1n << BigInt(graphBits + 2); // Density 4.0
    const mask = (1n << BigInt(graphBits)) - 1n;
    const numNodes = 1 << graphBits;

    // Build adjacency list
    const adj: Array<Array<[number, number]>> = new Array(numNodes);
    for (let i = 0; i < numNodes; i++) {
        adj[i] = [];
    }

    const limit = Number(numEdges);
    const progressInterval = Math.floor(limit / 100);

    for (let i = 0; i < limit; i++) {
        const [uBig, vBig] = generateEdge(sipKey, BigInt(i), mask);
        const u = Number(uBig);
        const v = Number(vBig);

        if (u === v) continue; // Skip self-loops

        adj[u].push([v, i]);
        adj[v].push([u, i]);

        // Progress reporting during graph building (first 50%)
        if (onProgress && i % progressInterval === 0) {
            onProgress(Math.floor((i / limit) * 50));
        }
    }

    // DFS to find 42-cycle
    const visited = new Set<number>();
    const path: number[] = [];

    function dfs(current: number, start: number, depth: number): number[] | null {
        visited.add(current);

        for (const [neighbor, edgeIndex] of adj[current]) {
            if (neighbor === start && depth === 41) {
                // Found 42-cycle!
                return [...path, edgeIndex];
            }

            if (!visited.has(neighbor) && depth < 42) {
                path.push(edgeIndex);
                const result = dfs(neighbor, start, depth + 1);
                if (result) return result;
                path.pop();
            }
        }

        visited.delete(current);
        return null;
    }

    // Try starting from each node
    for (let startNode = 0; startNode < numNodes; startNode++) {
        if (adj[startNode].length === 0) continue;

        // Progress reporting during DFS (remaining 50%)
        if (onProgress && startNode % 1000 === 0) {
            onProgress(50 + Math.floor((startNode / numNodes) * 50));
        }

        visited.clear();
        path.length = 0;

        const cycle = dfs(startNode, startNode, 0);
        if (cycle) {
            if (onProgress) onProgress(100);
            return cycle;
        }
    }

    return null;
}

// ============================================================================
// Main Solver Entry Point
// ============================================================================

export function solveJS(
    seedHex: string,
    discriminantHex: string,
    vdf: number,
    graphBits: number,
    onProgress?: ProgressCallback
): JSSolveResult {
    // 1. Parse inputs
    const seed = hexToBytes(seedHex);
    const dBytes = hexToBytes(discriminantHex);
    const dVal = bigintFromBytesBE(dBytes);
    const discriminant = -dVal; // D = -U (negative for class groups)

    // 2. Find cycle (0-60% progress)
    const wrappedProgress = onProgress
        ? (p: number) => onProgress(Math.floor(p * 0.6))
        : undefined;

    const cycle = findCycle(seed, graphBits, wrappedProgress);
    if (!cycle) {
        throw new Error("No 42-cycle found (try different seed)");
    }

    if (onProgress) onProgress(60);

    // 3. Serialize cycle & hash to group
    const cycleBytes = serializeCycle(cycle);
    const x = hashToGroup(cycleBytes, discriminant);

    if (onProgress) onProgress(65);

    // 4. VDF evaluation: y = x^(2^T) via repeated squaring
    let y = x;
    const vdfProgressStart = 65;
    const vdfProgressEnd = 90;
    const vdfProgressRange = vdfProgressEnd - vdfProgressStart;

    for (let i = 0; i < vdf; i++) {
        y = formSquare(y);

        if (onProgress && i % 100 === 0) {
            const vdfProgress = (i / vdf) * vdfProgressRange;
            onProgress(Math.floor(vdfProgressStart + vdfProgress));
        }
    }

    if (onProgress) onProgress(90);

    // 5. Generate Wesolowski proof
    // l = HashToPrime(x, y, D)
    const lPrime = hashToPrime(x, y, discriminant);

    // q = 2^T / l
    const twoToT = computePowerOfTwo(vdf);
    const q = twoToT / lPrime;

    // pi = x^q
    const pi = formPow(x, q);

    if (onProgress) onProgress(100);

    // 6. Serialize outputs
    const yBytes = formSerializeStrict(y);
    const piBytes = formSerializeStrict(pi);

    return {
        cycle,
        y: bytesToHex(yBytes),
        pi: bytesToHex(piBytes),
        memory_bytes: (1 << graphBits) * 1200 // Fallback estimate: ~1.2KB per node overhead for JS objects
    };
}

function computePowerOfTwo(n: number): bigint {
    return 1n << BigInt(n);
}

// ============================================================================
// Hex Utilities
// ============================================================================

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ============================================================================
// WASM Compatibility Check
// ============================================================================

export function isWasmSupported(): boolean {
    try {
        // Explicitly check type before access to prevent ReferenceError in strict environments
        if (typeof WebAssembly === 'undefined') return false;

        if (typeof WebAssembly === 'object' &&
            typeof WebAssembly.instantiate === 'function') {
            // Test with minimal valid WASM module
            const module = new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, // Magic number
                0x01, 0x00, 0x00, 0x00  // Version
            ]);
            return WebAssembly.validate(module);
        }
    } catch (e) {
        // WASM not available
        return false;
    }
    return false;
}