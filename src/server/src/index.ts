/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */
import { loadWasm } from './wasm-loader';
import { z } from 'zod';

export interface Env {
    zeno_challenges: R2Bucket;
    zeno_tokens: R2Bucket;
    zeno_bans_day: R2Bucket;
    [key: string]: any; // Allow dynamic env access
}

// --- Configuration & Types ---

interface SiteConfig {
    allowed_origins: RegExp | null;
    allowed_referers: RegExp | null;
    vdf: number;
    graph_bits: number;
    challenge_ttl: number; // Seconds
    token_ttl: number;     // Seconds
    token_reuse: boolean;
    rate_limit_ip_min: number;
    rate_limit_ip_hour: number;
    rate_limit_ip_day: number;
}

const DEFAULT_CONFIG: SiteConfig = {
    allowed_origins: null, // Open by default if null? No, Spec says universal validation. But if not set in config?
    // Spec 2.3: "Features: Origin/Referer regex enforcement."
    allowed_referers: null,
    vdf: 300, // Updated Default (~1.6s)
    graph_bits: 18, // Primary Defense: 18 bits
    challenge_ttl: 180,
    token_ttl: 3600,
    token_reuse: true,
    rate_limit_ip_min: 60,
    rate_limit_ip_hour: 1000,
    rate_limit_ip_day: 5000
};

// --- Config Resolution ---

function getConfig(siteKey: string, env: Env): SiteConfig {
    // Helper to get var with fallback
    const getVar = (key: string, defaultVal: any, type: 'string' | 'number' | 'bool' | 'regex') => {
        // Tier 1: {SITE_KEY}_{KEY}
        const tier1Key = `${siteKey}_${key}`;
        let val = env[tier1Key];

        // Tier 2: {KEY}
        if (val === undefined || val === null) {
            val = env[key];
        }

        // Tier 3: Default
        if (val === undefined || val === null) {
            return defaultVal;
        }

        if (type === 'number') return parseInt(val as string, 10);
        if (type === 'bool') return val === 'true' || val === true;
        if (type === 'regex') return new RegExp(val as string);
        return val;
    };

    return {
        allowed_origins: getVar('allowed_origins', null, 'regex'),
        allowed_referers: getVar('allowed_referers', null, 'regex'),
        vdf: Math.min(getVar('vdf', DEFAULT_CONFIG.vdf, 'number'), 1000000), // Clamp: 1M
        graph_bits: Math.min(getVar('graph_bits', DEFAULT_CONFIG.graph_bits, 'number'), 23), // Clamp: 23 (~8M nodes)
        challenge_ttl: getVar('challenge_ttl', DEFAULT_CONFIG.challenge_ttl, 'number'),
        token_ttl: getVar('token_ttl', DEFAULT_CONFIG.token_ttl, 'number'),
        token_reuse: getVar('token_reuse', DEFAULT_CONFIG.token_reuse, 'bool'),
        rate_limit_ip_min: getVar('rate_limit_ip_min', DEFAULT_CONFIG.rate_limit_ip_min, 'number'),
        rate_limit_ip_hour: getVar('rate_limit_ip_hour', DEFAULT_CONFIG.rate_limit_ip_hour, 'number'),
        rate_limit_ip_day: getVar('rate_limit_ip_day', DEFAULT_CONFIG.rate_limit_ip_day, 'number'),
    };
}

// --- Validation Schemas ---

const ChallengeRequestSchema = z.object({
    site_key: z.string().uuid(),
});

const SolutionSchema = z.object({
    cycle: z.any(),
    y: z.any(),
    pi: z.any(),
});

const RedeemRequestSchema = z.object({
    site_key: z.string().uuid(),
    challenge_id: z.string().uuid(),
    solution: z.union([SolutionSchema, z.string()]),
});

const VerifyRequestSchema = z.object({
    site_key: z.string().uuid(),
    token: z.string().uuid(),
    single: z.boolean().optional(),
});

const DeleteRequestSchema = z.object({
    site_key: z.string().uuid(),
    token: z.string().uuid(),
});

// --- CORS & Responses ---

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Dynamic check performed in code
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function error(msg: string, status: number = 400): Response {
    return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}

function success(data: any): Response {
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}

// --- Main Handler ---

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // OPTIONS
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // STRICT VALIDATION: Origin & Referer
            // We need site_key to load config. 
            // API endpoints usually send site_key in body.
            // We must clone request to read body for validation without consuming it? 
            // Or we validate inside the specific handler after parsing body.
            // The requirement says "For EVERY endpoint... 1. Load Config... 2. Validate Context".
            // Since we need to read body to get site_key, we will do it inside helper wrapper.

            // Normalize path: replace double slashes and strip trailing slash
            let pathname = url.pathname.replace(/\/+/g, '/');
            if (pathname.endsWith('/') && pathname.length > 1) {
                pathname = pathname.substring(0, pathname.length - 1);
            }

            if (request.method === 'GET') {
                if (pathname === '/api/health') return success({ status: 'ok' });
                if (pathname === '/') {
                    return success({
                        status: 'ok',
                        service: 'Zeno CAPTCHA API',
                        endpoints: [
                            '/api/challenge',
                            '/api/redeem',
                            '/api/verify',
                            '/api/delete'
                        ]
                    });
                }
            }

            if (request.method === 'POST') {
                if (pathname === '/api/challenge') return await handleChallenge(request, env, ctx);
                if (pathname === '/api/redeem') return await handleRedeem(request, env);
                if (pathname === '/api/verify') return await handleVerify(request, env);
                if (pathname === '/api/delete') return await handleDelete(request, env);
            }

            return error('Not Found', 404);
        } catch (e: any) {
            return error(e.message, 500);
        }
    },
};

// --- Strict Helpers ---

async function validateContext(req: Request, siteKey: string, env: Env): Promise<SiteConfig | Response> {
    const config = getConfig(siteKey, env);

    const origin = req.headers.get('Origin');
    const referer = req.headers.get('Referer');

    const originForbidden = config.allowed_origins && origin && !config.allowed_origins.test(origin);
    const refererForbidden = config.allowed_referers && referer && !config.allowed_referers.test(referer);

    if (originForbidden && refererForbidden) return error('Forbidden (Origin & Referer)', 403);

    if (originForbidden) {
        // Must be saved by TRUSTED Referer
        const refererTrusted = config.allowed_referers && referer && config.allowed_referers.test(referer);
        if (!refererTrusted) return error('Forbidden Origin', 403);
    }

    if (refererForbidden) {
        // Must be saved by TRUSTED Origin
        const originTrusted = config.allowed_origins && origin && config.allowed_origins.test(origin);
        if (!originTrusted) return error('Forbidden Referer', 403);
    }

    // Checking "Unknown" Site Key Policy
    // Requirement 2: Unknown site keys fall back to defaults IF dynamic_sites is true (or missing).
    // If dynamic_sites is explicitly false (Strict Mode), we must check if ANY Tier 1 var exists.
    const dynamicSites = env['dynamic_sites'] !== 'false';
    if (!dynamicSites) {
        // Strict Mode: Inspect all possible config keys for this siteKey
        const knownKeys = [
            'vdf', 'allowed_origins', 'allowed_referers',
            'graph_bits', 'challenge_ttl', 'token_ttl', 'token_reuse',
            'rate_limit_ip_min', 'rate_limit_ip_hour', 'rate_limit_ip_day'
        ];

        let found = false;
        for (const k of knownKeys) {
            if (env[`${siteKey}_${k}`] !== undefined) {
                found = true;
                break;
            }
        }

        if (!found) {
            return error('Unknown Site Key (Strict Mode)', 403);
        }
    }

    return config;
}

// --- Endpoint Implementations ---

async function handleChallenge(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const body = await req.json();
    const parsed = ChallengeRequestSchema.safeParse(body);
    if (!parsed.success) return error('Invalid inputs');
    const { site_key } = parsed.data;

    const configOrErr = await validateContext(req, site_key, env);
    if (configOrErr instanceof Response) return configOrErr;
    const config = configOrErr as SiteConfig;

    // 1. IP Ban & Rate Limit
    const ip = req.headers.get('CF-Connecting-IP') || '127.0.0.1';

    // A. Check Ban
    const banKey = `ip:${ip}`;
    const bannedObj = await env.zeno_bans_day.get(banKey);
    if (bannedObj) {
        const banData = await bannedObj.json() as any;
        if (Date.now() < banData.expires_at) {
            return error(`IP Banned: ${banData.reason}`, 403);
        } else {
            // Ban expired, clean up (fire and forget)
            ctx.waitUntil(env.zeno_bans_day.delete(banKey));
        }
    }

    // B. Check & Update Rate Limit
    const limitExceeded = await checkAndRateLimit(ip, config, env);
    if (limitExceeded) {
        return error('Rate Limit Exceeded', 429);
    }

    // 2. Generate Challenge
    const challengeId = crypto.randomUUID();
    const discBytes = new Uint8Array(256);
    crypto.getRandomValues(discBytes);
    discBytes[255] |= 3;
    const discriminantHex = toHex(discBytes);
    const seed = toHex(crypto.getRandomValues(new Uint8Array(32)));
    const now = Date.now();
    const expiresAt = now + (config.challenge_ttl * 1000);

    const challenge = {
        site_key,
        seed,
        discriminant: discriminantHex,
        vdf: config.vdf,
        graph_bits: config.graph_bits,
        issued_at: now,
        expires_at: expiresAt
    };

    // 3. Store (Bucket: zeno_challenges)
    await env.zeno_challenges.put(challengeId, JSON.stringify(challenge), {
        httpMetadata: { contentType: 'application/json' },
        customMetadata: { expires: expiresAt.toString() }
    });

    return success({
        challenge_id: challengeId,
        seed,
        discriminant: discriminantHex,
        vdf: config.vdf,
        graph_bits: config.graph_bits,
        issued_at: now,
        expires_at: expiresAt
    });
}

// --- Rate Limit Helper ---

async function checkAndRateLimit(ip: string, config: SiteConfig, env: Env): Promise<boolean> {
    const NOW = Date.now();
    const KEY = `cnt:${ip}`;

    // 1. Read Counters
    let counters: any = {
        min: { start: NOW, count: 0 },
        hour: { start: NOW, count: 0 },
        day: { start: NOW, count: 0 }
    };

    const obj = await env.zeno_bans_day.get(KEY);
    if (obj) {
        try {
            const stored = await obj.json() as any;
            if (stored.min) counters.min = stored.min;
            if (stored.hour) counters.hour = stored.hour;
            if (stored.day) counters.day = stored.day;
        } catch (e) {
            // Corrupt data, reset
        }
    }

    // 2. Refresh Windows
    if (NOW - counters.min.start > 60000) counters.min = { start: NOW, count: 0 };
    if (NOW - counters.hour.start > 3600000) counters.hour = { start: NOW, count: 0 };
    if (NOW - counters.day.start > 86400000) counters.day = { start: NOW, count: 0 };

    // 3. Increment
    counters.min.count++;
    counters.hour.count++;
    counters.day.count++;

    // 4. Check Limits
    let limited = false;
    let reason = "";

    if (counters.min.count > config.rate_limit_ip_min) { limited = true; reason = "Rate Limit (Min)"; }
    else if (counters.hour.count > config.rate_limit_ip_hour) { limited = true; reason = "Rate Limit (Hour)"; }
    else if (counters.day.count > config.rate_limit_ip_day) { limited = true; reason = "Rate Limit (Day)"; }

    // 5. Update Counters
    await env.zeno_bans_day.put(KEY, JSON.stringify(counters), {
        httpMetadata: { contentType: 'application/json' }
    });

    // 6. Ban if necessary
    if (limited) {
        const banTTL = 86400 * 1000; // 24 Hours Ban
        await env.zeno_bans_day.put(`ip:${ip}`, JSON.stringify({
            ip,
            reason,
            banned_at: NOW,
            expires_at: NOW + banTTL
        }));
        return true;
    }

    return false;
}

async function handleRedeem(req: Request, env: Env): Promise<Response> {
    const body = await req.json();
    const parsed = RedeemRequestSchema.safeParse(body);
    if (!parsed.success) return error(`Invalid inputs: ${parsed.error.toString()}`);
    let { site_key, challenge_id, solution } = parsed.data;

    // Handle stringified solution
    if (typeof solution === 'string') {
        try {
            solution = JSON.parse(solution);
        } catch (e) {
            return error('Invalid solution format');
        }
    }

    const sol = solution as any; // Cast for access to properties
    // Validate again if needed, or rely on it being an object now.
    // SolutionSchema.parse(sol); // Optional stricter double-check

    // Validate Context
    const configOrErr = await validateContext(req, site_key, env);
    if (configOrErr instanceof Response) return configOrErr;
    const config = configOrErr as SiteConfig;

    // 1. Retrieve Challenge
    const obj = await env.zeno_challenges.get(challenge_id);
    if (!obj) return error('Challenge not found', 404);

    // 2. IMMEDIATE DELETE (Replay Protection)
    // We must read first, then delete. 
    // Note: If we delete now, and subsequent checks fail, user has to restart. This is intended "Strict Single Use".
    await env.zeno_challenges.delete(challenge_id);

    const challenge = await obj.json() as any;

    // 3. Logic Validation
    if (challenge.site_key !== site_key) return error('Site key mismatch', 403);
    if (Date.now() > challenge.expires_at) return error('Challenge expired', 410);

    // 4. Verify Math
    const wasm = await loadWasm();

    // Ensure numeric arrays
    const cycle = new Uint32Array(sol.cycle);
    const discriminantBytes = fromHex(challenge.discriminant);
    const vdf = BigInt(challenge.vdf);

    // Note: Core `verify_proof` now accepts JsValue (objects) for Y and Pi.
    // We pass the objects directly from the solution, validated by Zod schema    // Verify (WASM)
    try {
        const configBits = challenge.graph_bits; // Use graph_bits from the challenge
        const seed_hex = challenge.seed;

        // Spec 3.3. Verify Proof takes seed and proper graph bits
        const isValid = wasm.verify_proof(seed_hex, cycle, sol.y, sol.pi, discriminantBytes, vdf, configBits);

        if (!isValid) {
            console.log("INVALID PROOF details:");
            console.log("  seed_hex:", seed_hex);
            console.log("  cycle len:", cycle.length);
            console.log("  y:", JSON.stringify(sol.y));
            console.log("  pi:", JSON.stringify(sol.pi));
            console.log("  discriminantBytes len:", discriminantBytes.length);
            console.log("  vdf:", vdf.toString());
            console.log("  configBits:", configBits);
            return error('Invalid proof', 400);
        }
    } catch (e: any) {
        console.error("Verification Error:", e);
        return error('Verification failed: ' + (e.message || e), 500);
    }
    // 5. Issue Token
    const tokenId = crypto.randomUUID();
    const issuedAt = Date.now();
    const token = {
        site_key,
        issued_at: issuedAt
    };
    // const token = {
    //     site_key,
    //     issued_at: issuedAt
    // };

    // Store in zeno_tokens
    await env.zeno_tokens.put(tokenId, JSON.stringify(token));

    return success({
        token: tokenId,
        expires_at: issuedAt + (config.token_ttl * 1000)
    });
}

async function handleVerify(req: Request, env: Env): Promise<Response> {
    const body = await req.json();
    const parsed = VerifyRequestSchema.safeParse(body);
    if (!parsed.success) return error('Invalid inputs');
    const { site_key, token, single } = parsed.data;

    const configOrErr = await validateContext(req, site_key, env);
    if (configOrErr instanceof Response) return configOrErr;
    const config = configOrErr as SiteConfig;

    const obj = await env.zeno_tokens.get(token);
    if (!obj) return success({ valid: false }); // Silent failure preferred for verify? Spec says {valid: false}

    const stored = await obj.json() as any;

    // Ownership
    if (stored.site_key !== site_key) return success({ valid: false });

    // Expiry Check (Logic)
    const expiresAt = stored.issued_at + (config.token_ttl * 1000);
    if (Date.now() > expiresAt) {
        // Expired
        return success({ valid: false });
    }

    // Burn Policy
    const burn = single || !config.token_reuse;
    if (burn) {
        await env.zeno_tokens.delete(token);
    }

    return success({ valid: true });
}

async function handleDelete(req: Request, env: Env): Promise<Response> {
    const body = await req.json();
    const parsed = DeleteRequestSchema.safeParse(body);
    if (!parsed.success) return error('Invalid inputs');
    const { site_key, token } = parsed.data;

    const configOrErr = await validateContext(req, site_key, env);
    if (configOrErr instanceof Response) return configOrErr;

    const obj = await env.zeno_tokens.get(token);
    if (obj) {
        const stored = await obj.json() as any;
        if (stored.site_key === site_key) {
            await env.zeno_tokens.delete(token);
        }
    }

    return success({ deleted: true });
}

function toHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hexString: string): Uint8Array {
    if (hexString.length % 2 !== 0) throw new Error('Invalid hex string');
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
}

