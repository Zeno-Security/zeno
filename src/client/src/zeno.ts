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

export interface ZenoConfig {
    apiEndpoint: string;
    siteKey: string;
    forceJS?: boolean;
}

// @ts-ignore
import workerUrl from './worker?worker&url';

export class Zeno extends EventTarget {
    private worker: Worker;
    private config: ZenoConfig;
    private _token: string | null = null;
    private _onProgress: ((percent: number) => void) | null = null;
    private _onModeDetected: ((mode: 'wasm' | 'js', wasmSupported: boolean) => void) | null = null;

    constructor(config: ZenoConfig) {
        super();
        this.config = config;
        console.debug("Zeno Lib Initialized");

        const isLocal = typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        let workerScriptUrl: string;

        if (workerUrl && (workerUrl.includes('worker') || workerUrl.endsWith('.ts'))) {
            workerScriptUrl = workerUrl;
        } else if (isLocal) {
            workerScriptUrl = 'zeno_worker.js';
        } else {
            const scriptUrl = import.meta.url;
            workerScriptUrl = scriptUrl.replace(/zeno(\.min)?\.js(\?.*)?$/, 'zeno_worker.js');
        }

        // Apply cache busting
        if (!isLocal && !workerScriptUrl.startsWith('blob:') && !workerScriptUrl.startsWith('data:')) {
            workerScriptUrl += (workerScriptUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
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

    public set onProgress(callback: ((percent: number) => void) | null) {
        this._onProgress = callback;
    }

    public set onModeDetected(callback: ((mode: 'wasm' | 'js', wasmSupported: boolean) => void) | null) {
        this._onModeDetected = callback;
    }

    public async solve(): Promise<{ token: string }> {
        const challenge = await this.fetchChallenge();
        const solution = await this.solveInWorker(challenge);
        const token = await this.redeem(challenge.challenge_id, solution);
        this._token = token;
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
        if (!res.ok) {
            let details = res.statusText;
            try {
                const errBody = await res.json();
                if (errBody.error) details += ` (${errBody.error})`;
                else if (errBody.message) details += ` (${errBody.message})`;
                else details += ` (${JSON.stringify(errBody)})`;
            } catch (e) {
                // ignore
            }
            throw new Error(`Redeem failed: ${details}`);
        }
        const data = await res.json();
        return data.token;
    }

    private async solveInWorker(challenge: ZenoChallenge): Promise<ZenoSolution> {
        return new Promise((resolve, reject) => {
            const handleMessage = (event: MessageEvent) => {
                const { type, payload, error, percent, mode, wasmSupported } = event.data;

                if (type === 'PROGRESS') {
                    if (this._onProgress) {
                        this._onProgress(percent);
                    }
                    this.dispatchEvent(new CustomEvent('progress', { detail: { percent } }));
                    return; // Don't remove listener, keep receiving progress
                }

                if (type === 'STATUS') {
                    if (this._onModeDetected) {
                        this._onModeDetected(mode, wasmSupported);
                    }
                    this.dispatchEvent(new CustomEvent('modedetected', { detail: { mode, wasmSupported } }));
                    return; // Don't remove listener
                }

                if (type === 'SOLVED') {
                    this.worker.removeEventListener('message', handleMessage);
                    this.worker.removeEventListener('error', handleError);
                    (payload as any).memoryUsage = (event.data as any).memory;
                    resolve(payload);
                } else if (type === 'ERROR') {
                    this.worker.removeEventListener('message', handleMessage);
                    this.worker.removeEventListener('error', handleError);
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

            let wasmUrl = "";

            // @ts-ignore
            if (window.ZENO_WASM_URL) {
                // @ts-ignore
                wasmUrl = window.ZENO_WASM_URL;
            } else if (import.meta.url) {
                wasmUrl = import.meta.url.replace(/zeno(\.min)?\.js(\?.*)?$/, 'zeno.wasm');
                if (wasmUrl === import.meta.url) {
                    try {
                        wasmUrl = new URL('zeno.wasm', import.meta.url).href;
                    } catch (e) {
                        try {
                            wasmUrl = new URL('/zeno.wasm', window.location.href).href;
                        } catch (e2) {
                            wasmUrl = "zeno.wasm";
                        }
                    }
                }
            } else {
                try {
                    wasmUrl = new URL('/zeno.wasm', window.location.href).href;
                } catch (e) {
                    wasmUrl = "zeno.wasm";
                }
            }

            this.worker.postMessage({
                type: 'SOLVE',
                challenge,
                wasm_url: wasmUrl,
                force_js: this.config.forceJS
            });
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
    --zeno-widget-width: 320px;
    --zeno-widget-padding: 10px;
    --zeno-color: #212121;
    --zeno-font: system-ui, -apple-system, sans-serif;
    --zeno-checkbox-size: 24px;
    --zeno-checkbox-border: 1px solid #aaaaaad1;
    --zeno-checkbox-border-radius: 6px;
    --zeno-checkbox-background: #fafafa91;
    --zeno-spinner-color: #000;
    --zeno-banner-background: #dc3545;
    --zeno-banner-color: #ffffff;
}

.wrapper {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.wasm-banner {
    display: none;
    background: var(--zeno-banner-background);
    color: var(--zeno-banner-color);
    font-family: var(--zeno-font);
    font-size: 12px;
    font-weight: 500;
    padding: 8px 12px;
    text-align: center;
    border-radius: var(--zeno-border-radius) var(--zeno-border-radius) 0 0;
    margin-bottom: -1px;
    /* Match container width: 250 + 20(padding) + 2(border) */
    width: calc(var(--zeno-widget-width) + (var(--zeno-widget-padding) * 2) + 2px);
    box-sizing: border-box;
}

.wasm-banner.visible {
    display: block;
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

.container.has-banner {
    border-radius: 0 0 var(--zeno-border-radius) var(--zeno-border-radius);
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
    flex-shrink: 0;
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
    color: #4CAF50;
    font-size: 18px;
    font-weight: bold;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.label-container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-width: 0;
}

.label {
    font-size: 14px;
    font-weight: 500;
}

.sublabel {
    font-size: 11px;
    color: #666;
    display: none;
}

.sublabel.visible {
    display: block;
}

/* States */
.container.verifying .spinner { display: block; }
.container.verified .checkmark { display: block; }
.container.verified .checkbox { border-color: transparent; }

.footer {
    position: absolute;
    bottom: 2px;
    right: 12px;
    font-size: 11px;
    color: var(--zeno-color) !important;
    text-decoration: underline;
    opacity: 0.6;
    pointer-events: all;
    transform: none;
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
<div class="wrapper">
    <div class="wasm-banner" id="wasmBanner">Enable WASM for significantly faster solving</div>
    <div class="container" id="box" tabindex="0" role="checkbox" aria-checked="false" style="position: relative;">
        <div class="checkbox">
            <div class="spinner"></div>
            <div class="checkmark">✓</div>
        </div>
        <div class="label-container">
            <div class="label" id="text">I am human</div>
            <div class="sublabel" id="sublabel"></div>
        </div>
        <a href="https://github.com/zeno-security/zeno" target="_blank" class="footer" style="position: absolute; bottom: 2px; right: 12px; color: var(--zeno-color) !important; text-decoration: underline;">Zeno</a>
    </div>
</div>
`;

class ZenoWidget extends HTMLElement {
    private zeno: Zeno | null = null;
    private shadow: ShadowRoot;
    private container: HTMLElement | null = null;
    private label: HTMLElement | null = null;
    private sublabel: HTMLElement | null = null;
    private wasmBanner: HTMLElement | null = null;
    private isSolving = false;
    private isSolved = false;
    private isUsingWasm = true;

    static get observedAttributes() {
        return ['zeno-api-endpoint', 'zeno-floating', 'zeno-site-key', 'zeno-i18n-human-label', 'zeno-i18n-wasm-banner', 'zeno-force-js'];
    }

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.shadow.innerHTML = TEMPLATE;
    }

    connectedCallback() {
        this.container = this.shadow.getElementById('box');
        this.label = this.shadow.getElementById('text');
        this.sublabel = this.shadow.getElementById('sublabel');
        this.wasmBanner = this.shadow.getElementById('wasmBanner');

        this.container?.addEventListener('click', () => this.startVerification());
        this.container?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.startVerification();
            }
        });

        this.setupFloating();
        setTimeout(() => this.updateFooterContrast(), 0);
        this.updateHumanLabel();

        const observer = new MutationObserver(() => this.updateFooterContrast());
        observer.observe(this, { attributes: true, attributeFilter: ['style'] });
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === 'zeno-i18n-human-label') {
            this.updateHumanLabel();
        }
        if (name === 'zeno-i18n-wasm-banner' && this.wasmBanner) {
            this.wasmBanner.innerText = newValue || "Enable WASM for significantly faster solving";
        }
    }

    private updateHumanLabel() {
        if (this.label && !this.isSolving && !this.isSolved) {
            this.label.innerText = this.getAttribute('zeno-i18n-human-label') || "I am human";
        }
    }

    private showWasmBanner() {
        if (this.wasmBanner) {
            this.wasmBanner.classList.add('visible');
            const cssVal = this.readCssVar('--zeno-i18n-wasm-banner');
            this.wasmBanner.innerText = cssVal || this.getAttribute('zeno-i18n-wasm-banner') || "Enable WASM for significantly faster solving";
            this.container?.classList.add('has-banner');
        }
    }

    private hideWasmBanner() {
        if (this.wasmBanner) {
            this.wasmBanner.classList.remove('visible');
            this.container?.classList.remove('has-banner');
        }
    }

    private updateProgress(percent: number) {
        if (this.label && this.isSolving) {
            const verifyingLabel = this.getAttribute('zeno-i18n-verifying-label') || "Verifying";
            this.label.innerText = `${verifyingLabel}... ${percent}%`;
        }
    }

    private updateFooterContrast() {
        // Also update dynamic texts if they are visible
        if (this.wasmBanner && this.wasmBanner.classList.contains('visible')) {
            const cssVal = this.readCssVar('--zeno-i18n-wasm-banner');
            const fallback = this.getAttribute('zeno-i18n-wasm-banner') || "Enable WASM for significantly faster solving";
            this.wasmBanner.innerText = cssVal || fallback;
        }

        if (this.sublabel && this.sublabel.classList.contains('visible')) {
            const cssVal = this.readCssVar('--zeno-i18n-js-mode-label');
            const fallback = this.getAttribute('zeno-i18n-js-mode-label') || "Running in compatibility mode";
            this.sublabel.innerText = cssVal || fallback;
        }

        const bg = getComputedStyle(this).getPropertyValue('--zeno-background').trim();
        const contrastColor = this.getContrastColor(bg);
        const footer = this.shadow.querySelector('.footer') as HTMLElement;
        if (footer) {
            footer.style.setProperty('color', contrastColor, 'important');
            footer.style.setProperty('text-decoration-color', contrastColor, 'important');
        }
    }

    private readCssVar(varName: string): string | null {
        const val = getComputedStyle(this).getPropertyValue(varName).trim();
        if (!val || val === 'none') return null;
        // Strip quotes if present (CSS content often has them)
        return val.replace(/^['"](.*)['"]$/, '$1');
    }

    private getContrastColor(hexColor: string): string {
        if (!hexColor || !hexColor.startsWith('#')) return '#000000';

        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);

        const getLuminance = (c: number) => {
            const v = c / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };

        const Lbg = 0.2126 * getLuminance(r) + 0.7152 * getLuminance(g) + 0.0722 * getLuminance(b);
        const Lwhite = 1;
        const Lblack = 0;

        const contrastWhite = (Lwhite + 0.05) / (Lbg + 0.05);
        const contrastBlack = (Lbg + 0.05) / (Lblack + 0.05);

        return (contrastWhite > contrastBlack) ? '#ffffff' : '#000000';
    }

    private setupFloating() {
        // Floating logic handled by global click listener
    }

    private async startVerification() {
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

        const forceJS = this.hasAttribute('zeno-force-js');

        try {
            this.zeno = new Zeno({ apiEndpoint: endpoint, siteKey, forceJS });

            // Set up progress callback
            this.zeno.onProgress = (percent: number) => {
                this.updateProgress(percent);
            };

            // Set up mode detection callback
            this.zeno.onModeDetected = (mode: 'wasm' | 'js', wasmSupported: boolean) => {
                this.isUsingWasm = mode === 'wasm';
                if (!wasmSupported || mode === 'js') {
                    this.showWasmBanner();
                    // Show sublabel indicating JS mode
                    if (this.sublabel) {
                        const cssVal = this.readCssVar('--zeno-i18n-js-mode-label');
                        this.sublabel.innerText = cssVal || this.getAttribute('zeno-i18n-js-mode-label') || "Running in compatibility mode";
                        this.sublabel.classList.add('visible');
                    }
                }
            };

            const { token } = await this.zeno.solve();
            this.handleSuccess(token);
        } catch (e: any) {
            console.error("Zeno Error:", e);
            this.setLabel(this.getAttribute('zeno-i18n-error-label') || "Error");
            this.container?.classList.remove('verifying');
            this.isSolving = false;
            this.hideWasmBanner();
            if (this.sublabel) {
                this.sublabel.classList.remove('visible');
            }
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

        // Hide banner and sublabel on success
        this.hideWasmBanner();
        if (this.sublabel) {
            this.sublabel.classList.remove('visible');
        }

        const formName = this.getAttribute('data-zeno-hidden-field-name') || 'zeno-token';
        let input = this.querySelector(`input[name="${formName}"]`) as HTMLInputElement;
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = formName;
            this.appendChild(input);
        }
        input.value = token;

        this.dispatchEvent(new CustomEvent('solve', {
            detail: { token },
            bubbles: true,
            composed: true
        }));

        const onSolve = this.getAttribute('onsolve');
        if (onSolve) {
            new Function('event', onSolve)(new CustomEvent('solve', { detail: { token } }));
        }
    }

    private setLabel(text: string) {
        if (this.label) this.label.innerText = text;
    }
}

// Register Component
if (!customElements.get('zeno-widget')) {
    customElements.define('zeno-widget', ZenoWidget);
}

// Floating Mode Global Handler
document.addEventListener('click', (e) => {
    const trigger = (e.target as Element).closest('[zeno-floating]');
    if (trigger) {
        const selector = trigger.getAttribute('zeno-floating');
        if (selector) {
            const widget = document.querySelector(selector) as HTMLElement;
            if (widget) {
                const isHidden = widget.style.display === 'none';
                widget.style.display = isHidden ? 'inline-block' : 'none';

                if (isHidden) {
                    const rect = trigger.getBoundingClientRect();
                    const position = trigger.getAttribute('zeno-floating-position') || 'bottom';
                    const offset = parseInt(trigger.getAttribute('zeno-floating-offset') || '10');

                    widget.style.position = 'absolute';
                    widget.style.zIndex = '9999';

                    if (position === 'bottom') {
                        widget.style.top = `${rect.bottom + window.scrollY + offset}px`;
                        widget.style.left = `${rect.left + window.scrollX}px`;
                    }
                }
            }
        }
    }
});

// Expose Zeno to window for non-module usage (e.g. Demo inline scripts)
(window as any).Zeno = Zeno;