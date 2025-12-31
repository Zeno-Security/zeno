/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */
export interface ZenoChallenge {
    challenge_id: string;
    seed: string;
    discriminant: string;
    vdf: number;
    graph_bits: number;
    issued_at: number;
    expires_at: number;
    site_key: string;
}

export interface ZenoSolution {
    cycle: number[];
    y: object;
    pi: object;
}

export interface ZenoChallenge {
    challenge_id: string;
    seed: string;
    discriminant: string;
    vdf: number;
    graph_bits: number;
    issued_at: number;
    expires_at: number;
    site_key: string;
}

export interface ZenoSolution {
    cycle: number[];
    y: object;
    pi: object;
}

export interface ZenoConfig {
    apiEndpoint: string;
    siteKey: string;
}

// @ts-ignore
import workerUrl from './worker?worker&url';

export class Zeno extends EventTarget {
    private worker: Worker;
    private config: ZenoConfig;
    private _token: string | null = null;

    constructor(config: ZenoConfig) {
        super();
        this.config = config;
        // Keep workerUrl to force Vite build
        console.debug("Zeno Lib Initialized");

        // Initialize worker
        // Workaround for Cross-Origin Worker SecurityError in some envs

        // 1. Explicit Config Override (Best for Benchmark)
        // If config includes a workerPath (not in interface yet, but we can check args or infer)
        // ...

        // 2. Local Dev / Benchmark Inference
        // If we are running on localhost/127.0.0.1, prefer local scripts over CDN
        const isLocal = typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        let workerScriptUrl: string;

        if (workerUrl && (workerUrl.includes('worker') || workerUrl.endsWith('.ts'))) {
            // Vite Dev Mode
            workerScriptUrl = workerUrl;
        } else if (isLocal) {
            // Benchmark / Local Server Mode
            // Assume zeno_worker.js is in the same directory as zeno.min.js or root
            // For benchmark/benchmark.html running on :8001, zeno_worker.js is known to be synced there.
            workerScriptUrl = 'zeno_worker.js';
        } else {
            // Production / CDN Fallback
            const scriptUrl = import.meta.url;
            workerScriptUrl = scriptUrl.replace(/zeno(\.min)?\.js(\?.*)?$/, 'zeno_worker.js');
        }

        console.log("Zeno Worker Source:", workerScriptUrl);

        const blobContent = `import "${workerScriptUrl}";`;
        const blob = new Blob([blobContent], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);

        this.worker = new Worker(blobUrl, {
            type: 'module'
        });
    }

    public get token(): string | null {
        return this._token;
    }

    public async solve(): Promise<{ token: string }> {
        // 1. Fetch Challenge
        const challenge = await this.fetchChallenge();

        // 2. Solve in Worker
        const solution = await this.solveInWorker(challenge);

        // 3. Redeem for Token
        const token = await this.redeem(challenge.challenge_id, solution);
        this._token = token;

        // Emit event
        this.dispatchEvent(new CustomEvent('solve', { detail: { token } }));

        return { token };
    }

    public terminate() {
        if (this.worker) {
            this.worker.terminate();
        }
    }

    private async fetchChallenge(): Promise<ZenoChallenge> {
        const res = await this.customFetch(`${this.config.apiEndpoint}/challenge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                site_key: this.config.siteKey
            })
        });
        if (!res.ok) throw new Error(`Challenge fetch failed: ${res.statusText}`);
        return await res.json();
    }

    private async redeem(challengeId: string, solution: ZenoSolution): Promise<string> {
        const payload = {
            challenge_id: challengeId,
            solution,
            site_key: this.config.siteKey
        };
        const res = await this.customFetch(`${this.config.apiEndpoint}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`Redeem failed: ${res.statusText}`);
        const data = await res.json();
        return data.token; // Spec implies token is returned
    }

    private async solveInWorker(challenge: ZenoChallenge): Promise<ZenoSolution> {
        return new Promise((resolve, reject) => {
            const handleMessage = (event: MessageEvent) => {
                const { type, payload, error } = event.data;
                this.worker.removeEventListener('message', handleMessage);
                this.worker.removeEventListener('error', handleError);

                if (type === 'SOLVED') {
                    // Inject memory usage into the result payload (non-standard but useful for benchmarking)
                    (payload as any).memoryUsage = (event.data as any).memory;
                    resolve(payload);
                } else if (type === 'ERROR') {
                    reject(new Error(error));
                }
            };

            const handleError = (error: ErrorEvent) => {
                this.worker.removeEventListener('message', handleMessage);
                this.worker.removeEventListener('error', handleError);
                reject(new Error(`Worker Error: ${error.message}`));
            };

            this.worker.addEventListener('message', handleMessage);
            this.worker.addEventListener('error', handleError);
            // Determine WASM URL relative to this script (library logic)
            // Just like workerScriptUrl, but for .wasm
            let wasmUrl = "";

            // @ts-ignore
            if (window.ZENO_WASM_URL) {
                // @ts-ignore
                wasmUrl = window.ZENO_WASM_URL;
            } else if (import.meta.url) {
                // Production: Replace .js (or .min.js) with .wasm aggressively
                // If loaded as "zeno.js" or "zeno.min.js", this works.
                // If loaded with query params or other extensions, be careful.
                wasmUrl = import.meta.url.replace(/zeno(\.min)?\.js(\?.*)?$/, 'zeno.wasm');

                // If no replacement happened (e.g. main.js importing Zeno source?), fallback.
                if (wasmUrl === import.meta.url) {
                    // Start of improvement: Calculate base path and append zeno.wasm
                    // This handles zeno.js being renamed or embedded in a bundle with a different name
                    try {
                        wasmUrl = new URL('zeno.wasm', import.meta.url).href;
                    } catch (e) {
                        // Last resort: If import.meta.url is invalid (e.g. blob), use absolute path from root
                        // This is safer than relative path for Blob Workers which have blob: origins
                        try {
                            wasmUrl = new URL('/zeno.wasm', window.location.href).href;
                        } catch (e2) {
                            wasmUrl = "zeno.wasm";
                        }
                    }
                }
            } else {
                // No import.meta.url? Fallback to root absolute
                try {
                    wasmUrl = new URL('/zeno.wasm', window.location.href).href;
                } catch (e) {
                    wasmUrl = "zeno.wasm";
                }
            }

            this.worker.postMessage({ type: 'SOLVE', challenge, wasm_url: wasmUrl });
        });
    }

    private customFetch(url: string, options: RequestInit = {}): Promise<Response> {
        // @ts-ignore
        if (window.ZENO_CUSTOM_FETCH) {
            // @ts-ignore
            return window.ZENO_CUSTOM_FETCH(url, options);
        }
        return fetch(url, options);
    }
}

// --- Web Component ---

const TEMPLATE = `
<style>
:host {
    display: inline-block;
    --zeno-background: #fdfdfd;
    --zeno-border-color: #dddddd8f;
    --zeno-border-radius: 14px;
    --zeno-widget-height: 50px;
    --zeno-widget-width: 250px; /* Slightly larger default to fit content */
    --zeno-widget-padding: 10px;
    --zeno-color: #212121;
    --zeno-font: system-ui, -apple-system, sans-serif;
    --zeno-checkbox-size: 24px;
    --zeno-checkbox-border: 1px solid #aaaaaad1;
    --zeno-checkbox-border-radius: 6px;
    --zeno-checkbox-background: #fafafa91;
    --zeno-spinner-color: #000;
}

.container {
    background: var(--zeno-background);
    border: 1px solid var(--zeno-border-color);
    border-radius: var(--zeno-border-radius);
    width: var(--zeno-widget-width);
    height: var(--zeno-widget-height);
    padding: var(--zeno-widget-padding);
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--zeno-font);
    color: var(--zeno-color);
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: all 0.2s ease;
    cursor: pointer;
    user-select: none;
}

.checkbox {
    width: var(--zeno-checkbox-size);
    height: var(--zeno-checkbox-size);
    border: var(--zeno-checkbox-border);
    border-radius: var(--zeno-checkbox-border-radius);
    background: var(--zeno-checkbox-background);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.spinner {
    display: none;
    width: 60%;
    height: 60%;
    border: 2px solid #ccc;
    border-top-color: var(--zeno-spinner-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.checkmark {
    display: none;
    color: #4CAF50; /* Fallback green */
    font-size: 18px;
    font-weight: bold;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.label {
    font-size: 14px;
    font-weight: 500;
}

/* States */
.container.verifying .spinner { display: block; }
.container.verified .checkmark { display: block; }
.container.verified .checkbox { border-color: transparent; }

/* Accessible Hidden Input */
    display: none;
}

.footer {
    position: absolute;
    bottom: 2px;
    bottom: 2px;
    right: 12px; /* Sufficient padding from border */
    font-size: 10px;
    color: var(--zeno-color) !important;
    text-decoration: underline;
    opacity: 0.6;
    pointer-events: all;
    transform: scale(0.6);
    transform-origin: bottom right;
    transition: color 0.2s;
}
a.footer, a.footer:visited, a.footer:hover, a.footer:active {
    color: var(--zeno-color) !important;
}
.footer * {
    color: var(--zeno-color) !important;
}
.footer:hover {
    opacity: 1;
}
</style>
<div class="container" id="box" tabindex="0" role="checkbox" aria-checked="false" style="position: relative;">
    <div class="checkbox">
        <div class="spinner"></div>
        <div class="checkmark">✓</div>
    </div>
    <div class="label" id="text">I am human</div>
    <a href="https://github.com/zeno-security/zeno" target="_blank" class="footer" style="position: absolute; bottom: 2px; right: 12px; transform: scale(0.6); transform-origin: bottom right; color: var(--zeno-color) !important; text-decoration: underline;">Zeno</a>
</div>
`;

class ZenoWidget extends HTMLElement {
    private zeno: Zeno | null = null;
    private shadow: ShadowRoot;
    private container: HTMLElement | null = null;
    private label: HTMLElement | null = null;
    private isSolving = false;
    private isSolved = false;

    static get observedAttributes() {
        return ['zeno-api-endpoint', 'zeno-floating', 'zeno-site-key', 'zeno-i18n-human-label'];
    }

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.shadow.innerHTML = TEMPLATE;
    }

    connectedCallback() {
        this.container = this.shadow.getElementById('box');
        this.label = this.shadow.getElementById('text');

        this.container?.addEventListener('click', () => this.startVerification());
        this.container?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.startVerification();
            }
        });

        // Initialize Floating Logic if needed
        this.setupFloating();

        // Initialize footer color
        setTimeout(() => this.updateFooterContrast(), 0);

        // Initialize label text
        this.updateHumanLabel();

        // Observe style changes (best effort via polling or mutation if needed, but for now just initial)
        // For the demo explicitly calling setProperty, we might want a method to force update or just use a MutationObserver on style attribute
        const observer = new MutationObserver(() => this.updateFooterContrast());
        observer.observe(this, { attributes: true, attributeFilter: ['style'] });
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === 'zeno-i18n-human-label') {
            this.updateHumanLabel();
        }
    }

    private updateHumanLabel() {
        if (this.label && !this.isSolving && !this.isSolved) {
            this.label.innerText = this.getAttribute('zeno-i18n-human-label') || "I am human";
        }
    }

    private updateFooterContrast() {
        const bg = getComputedStyle(this).getPropertyValue('--zeno-background').trim();
        const contrastColor = this.getContrastColor(bg);
        const footer = this.shadow.querySelector('.footer') as HTMLElement;
        if (footer) {
            footer.style.setProperty('color', contrastColor, 'important');
            footer.style.setProperty('text-decoration-color', contrastColor, 'important');
        }
    }

    private getContrastColor(hexColor: string): string {
        // Default to black if invalid
        if (!hexColor || !hexColor.startsWith('#')) return '#000000';

        // Parse hex
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);

        // WCAG Relative Luminance Formula
        const getLuminance = (c: number) => {
            const v = c / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };

        const Lbg = 0.2126 * getLuminance(r) + 0.7152 * getLuminance(g) + 0.0722 * getLuminance(b);
        const Lwhite = 1;
        const Lblack = 0;

        // Contrast Ratio: (L1 + 0.05) / (L2 + 0.05)
        const contrastWhite = (Lwhite + 0.05) / (Lbg + 0.05);
        const contrastBlack = (Lbg + 0.05) / (Lblack + 0.05);

        // Prefer highest contrast, ensuring strictly > 4.5:1 if possible
        // If white satisfies, pick white (prefer light text on dark if both pass, or strict ratio check)
        // Standard logic: maximize contrast
        return (contrastWhite > contrastBlack) ? '#ffffff' : '#000000';
    }

    private setupFloating() {
        // Check if there is a trigger for this widget provided via external attribute logic
        // Though spec says button has `zeno-floating="#id"`. So we wait for that button to click us?
        // Or we handle positioning.
        // Spec 2.3: Button has `zeno-floating="#floating-captcha"`.
        // We need a global listener or observer? usage: <button zeno-floating="#id">
        // It's cleaner to handle this by querying triggers on document load or using a global handler.
        // Let's attach a global click listener for delegation to keep it simple.
    }

    private async startVerification() {
        // Force Footer Color (Runtime Update)
        this.updateFooterContrast();

        if (this.isSolving || this.isSolved) return;

        const endpoint = this.getAttribute('zeno-api-endpoint');
        const siteKey = this.getAttribute('zeno-site-key');

        if (!endpoint) {
            console.error("Zeno: Missing 'zeno-api-endpoint' attribute");
            this.setLabel("Config Error");
            return;
        }

        if (!siteKey) {
            console.error("Zeno: Missing 'zeno-site-key' attribute");
            this.setLabel("Config Error");
            return;
        }

        this.isSolving = true;
        this.container?.classList.add('verifying');
        this.setLabel(this.getAttribute('zeno-i18n-verifying-label') || "Verifying...");

        try {
            this.zeno = new Zeno({ apiEndpoint: endpoint, siteKey });
            const { token } = await this.zeno.solve();

            this.handleSuccess(token);
        } catch (e: any) {
            console.error("Zeno Error:", e);
            this.setLabel(this.getAttribute('zeno-i18n-error-label') || "Error");
            this.container?.classList.remove('verifying');
            this.isSolving = false;
            // Emit error event
            this.dispatchEvent(new CustomEvent('error', { detail: { message: e.toString() } }));
        }
    }

    private handleSuccess(token: string) {
        this.isSolved = true;
        this.isSolving = false;
        this.container?.classList.remove('verifying');
        this.container?.classList.add('verified');
        this.setLabel(this.getAttribute('zeno-i18n-solved-label') || "Success!");
        this.container?.setAttribute('aria-checked', 'true');

        // Create Hidden Input
        const formName = this.getAttribute('data-zeno-hidden-field-name') || 'zeno-token';
        let input = this.querySelector(`input[name="${formName}"]`) as HTMLInputElement;
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = formName;
            this.appendChild(input);
        }
        input.value = token;

        // Emit 'solve' event
        this.dispatchEvent(new CustomEvent('solve', {
            detail: { token },
            bubbles: true,
            composed: true
        }));

        // Execute inline handler
        const onSolve = this.getAttribute('onsolve');
        if (onSolve) {
            // Create a function context to execute string
            new Function('event', onSolve)(new CustomEvent('solve', { detail: { token } }));
        }
    }

    private setLabel(text: string) {
        if (this.label) this.label.innerText = text;
    }
}

// Register Component
customElements.define('zeno-widget', ZenoWidget);

// Floating Mode Global Handler
document.addEventListener('click', (e) => {
    const trigger = (e.target as Element).closest('[zeno-floating]');
    if (trigger) {
        const selector = trigger.getAttribute('zeno-floating');
        if (selector) {
            const widget = document.querySelector(selector) as HTMLElement;
            if (widget) {
                // Toggle visibility logic
                const isHidden = widget.style.display === 'none';
                widget.style.display = isHidden ? 'inline-block' : 'none';

                if (isHidden) {
                    // Positioning logic
                    // Simple PoC: Absolute positioning near trigger
                    const rect = trigger.getBoundingClientRect();
                    const position = trigger.getAttribute('zeno-floating-position') || 'bottom';
                    const offset = parseInt(trigger.getAttribute('zeno-floating-offset') || '10');

                    widget.style.position = 'absolute';
                    widget.style.zIndex = '9999';

                    if (position === 'bottom') {
                        widget.style.top = `${rect.bottom + window.scrollY + offset}px`;
                        widget.style.left = `${rect.left + window.scrollX}px`;
                    }
                    // Implement other positions as needed
                }
            }
        }
    }
});

