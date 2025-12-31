# Zeno E2E Test Environment

This folder contains a standalone test bench for Zeno, using the production `dist` artifacts.

## Setup

1.  **Server**: Run the Worker API from the project root.
    ```bash
    # From project root
    npm run dev
    # OR
    wrangler dev
    ```
    This starts the API at `http://127.0.0.1:8787`.

2.  **Client**: Serve this folder using a static HTTP server.
    ```bash
    # From test/e2e/
    npx http-server . --cors -c-1
    ```
    *   `--cors`: needed for module loading if complex.
    *   `-c-1`: disable caching.

3.  **Test**: Open the URL provided by `http-server` (e.g., `http://127.0.0.1:8080/index.html`).

## Components
*   `index.html`: Modified demo page pointing to localhost API.
*   `client/`: Contains `zeno.js` and `zeno.wasm` (from `dist/client`).
*   `server/`: Contains `worker.js` and `zeno.wasm` (from `dist/server`).
