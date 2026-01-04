declare const require: any;
declare const process: any;
declare const Buffer: any;
const fs = require('fs');
const nodeCrypto = require('crypto');

// --- Simplified Imports from source ---
// We will paste the relevant parts of solver-js.ts here to test them in isolation
// or we can import them if we export them.
// Since we removed exports, we will copy-paste the critical functions for this test.

// --- COPY OF solver-js.ts CRITICAL FUNCTIONS (Simulated) ---

// BigInt Utilities
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

function bigintToSignedBytesBE(n: bigint): Uint8Array {
    if (n === 0n) return new Uint8Array([0]);

    if (n > 0n) {
        let hex = n.toString(16);
        if (hex.length % 2 === 1) hex = '0' + hex;
        if (parseInt(hex.substring(0, 2), 16) & 0x80) {
            hex = '00' + hex;
        }
        return hexToBytes(hex);
    } else {
        let byteCount = 1;
        while (true) {
            const min = -(1n << (BigInt(byteCount * 8) - 1n));
            if (n >= min) break;
            byteCount++;
        }
        const width = 8n * BigInt(byteCount);
        const val = (1n << width) + n;
        let hex = val.toString(16);
        while (hex.length < byteCount * 2) hex = '0' + hex;
        return hexToBytes(hex);
    }
}

function bigintFromSignedBytesBE(bytes: Uint8Array): bigint {
    if (bytes.length === 0) return 0n;
    const negative = (bytes[0] & 0x80) !== 0;
    let result = 0n;
    if (negative) {
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

// TEST: Large Negative Number Round Trip
function testLargeNegativeRoundTrip() {
    console.log("Testing 2048-bit Negative Number Round Trip...");

    // Generate random 256 bytes
    const bytes = nodeCrypto.randomBytes(256);
    // Force it to be interpreted as negative (high bit set)
    bytes[0] |= 0x80;

    // Decode as signed
    const val = bigintFromSignedBytesBE(bytes);

    if (val >= 0n) {
        console.error("FAIL: Expected negative number");
        process.exit(1);
    }

    // Re-encode
    const encoded = bigintToSignedBytesBE(val);

    // Compare bytes
    if (Buffer.compare(bytes, encoded) !== 0) {
        console.error("FAIL: Byte Mismatch!");
        console.log("Original Len:", bytes.length);
        console.log("Encoded Len:", encoded.length);
        console.log("Original (first 10):", bytes.subarray(0, 10));
        console.log("Encoded (first 10):", encoded.subarray(0, 10));
        process.exit(1);
    }

    console.log("PASS: 2048-bit Round Trip");
}

function extendedGcd(a: bigint, b: bigint): { gcd: bigint; x: bigint; y: bigint } {
    let old_r = a, r = b;
    let old_s = 1n, s = 0n;
    let old_t = 0n, t = 1n;

    while (r !== 0n) {
        const quotient = old_r / r;

        let temp = old_r;
        old_r = r;
        r = temp - quotient * r;

        temp = old_s;
        old_s = s;
        s = temp - quotient * s;

        temp = old_t;
        old_t = t;
        t = temp - quotient * t;
    }

    // Normalize to positive GCD
    if (old_r < 0n) {
        old_r = -old_r;
        old_s = -old_s;
        old_t = -old_t;
    }

    return { gcd: old_r, x: old_s, y: old_t };
}

function testExtendedGcdLarge() {
    console.log("Testing 2048-bit Extended GCD Properties...");
    for (let i = 0; i < 20; i++) {
        const bytesA = nodeCrypto.randomBytes(256);
        const bytesB = nodeCrypto.randomBytes(256);

        // Random signs
        let a = bigintFromSignedBytesBE(bytesA);
        let b = bigintFromSignedBytesBE(bytesB);

        if (i % 4 === 1) a = -a;
        if (i % 4 === 2) b = -b;
        if (i % 4 === 3) { a = -a; b = -b; }

        const result = extendedGcd(a, b);
        const { gcd, x, y } = result;

        // Prop 1: Positive GCD
        if (gcd < 0n) {
            console.error("FAIL: GCD is negative", gcd);
            process.exit(1);
        }

        // Prop 2: Divisibility
        if (a % gcd !== 0n || b % gcd !== 0n) {
            console.error("FAIL: GCD does not divide inputs");
            process.exit(1);
        }

        // Prop 3: Bezout Identity
        const composed = a * x + b * y;
        if (composed !== gcd) {
            console.error("FAIL: Bezout Identity mismatch");
            console.log(`a*x + b*y = ${composed}, gcd = ${gcd}`);
            process.exit(1);
        }
    }
    console.log("PASS: 2048-bit Extended GCD");
}

// Run
testLargeNegativeRoundTrip();
testExtendedGcdLarge();
