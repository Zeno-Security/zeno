import fs from 'fs';
import path from 'path';

// Config
const ROOT_WRANGLER = 'wrangler.toml';
const ROOT_PKG = 'package.json';
const DIST_SERVER = 'dist/server';
const CLOUDFLARE = 'cloudflare';

// Header
const HEADER = `# Required Notice: © Copyright 2025 KSEC - Erez Kalman
# This software is licensed under the PolyForm Strict License 1.0.0.
# SPDX-License-Identifier: PolyForm-Strict-1.0.0
`;

// 1. Read Resources
const wranglerContent = fs.readFileSync(ROOT_WRANGLER, 'utf-8');
const pkgContent = JSON.parse(fs.readFileSync(ROOT_PKG, 'utf-8'));

// 2. Prepare Minimal Package.json
const deployPkg = {
    name: "zeno-worker",
    version: pkgContent.version,
    description: "Zeno Cloudflare Worker Deployment",
    main: "worker.js",
    author: pkgContent.author,
    license: pkgContent.license,
    private: true,
    dependencies: {},
    scripts: {
        "deploy": "wrangler deploy"
    },
    devDependencies: {
        "wrangler": pkgContent.devDependencies.wrangler
    }
};

const deployPkgStr = JSON.stringify(deployPkg, null, 4);

// 3. Prepare Cloudflare Wrangler.toml
let cfWrangler;
const cfWranglerPath = path.join(CLOUDFLARE, 'wrangler.toml');

if (fs.existsSync(cfWranglerPath)) {
    console.log(`Preserving existing ${cfWranglerPath} (ensuring main="worker.js")...`);
    const existingContent = fs.readFileSync(cfWranglerPath, 'utf-8');
    // Ensure main points to worker.js
    // Regex matches main = "..." or main="..."
    if (/^main\s*=\s*".*"/m.test(existingContent)) {
        cfWrangler = existingContent.replace(/^main\s*=\s*".*"/m, 'main = "worker.js"');
    } else {
        // Prepare to append or insert? If missing, safe to just prepend or fallback?
        // Assuming TOML valid structure, typically at top.
        cfWrangler = 'main = "worker.js"\n' + existingContent;
    }
} else {
    console.log("Generating new cloudflare/wrangler.toml from root...");
    // Change 'main = "dist/server/worker.js"' to 'main = "worker.js"'
    cfWrangler = wranglerContent.replace('dist/server/worker.js', 'worker.js');
}

// 4. Prepare Dist Clean Wrangler.toml (No Vars, No Observability + Correct Path)
let cleanWrangler = wranglerContent.replace('dist/server/worker.js', 'worker.js');

// Remove [vars] section
const varsIndex = cleanWrangler.indexOf('[vars]');
if (varsIndex !== -1) {
    cleanWrangler = cleanWrangler.substring(0, varsIndex);
}

// Remove [observability] sections (Regex replace)
// Matches [observability], [observability.logs], etc. and their content until next section or EOF
// Simplest way for TOML without parser: Split by \n, remove blocks starting with [observability...
const lines = cleanWrangler.split('\n');
const cleanLines = [];
let skipSection = false;

for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[observability')) {
        skipSection = true;
    } else if (trimmed.startsWith('[') && skipSection) {
        skipSection = false; // New section starts
    }

    if (!skipSection) {
        cleanLines.push(line);
    }
}
cleanWrangler = cleanLines.join('\n');

// 5. Write Artifacts

// A. Cloudflare Folder
console.log("Writing Cloudflare artifacts...");
fs.writeFileSync(path.join(CLOUDFLARE, 'package.json'), deployPkgStr);
fs.writeFileSync(path.join(CLOUDFLARE, 'wrangler.toml'), cfWrangler);
// worker.js and zeno.wasm are copied by parent script

// B. Dist/Server Folder
console.log("Writing Dist/Server artifacts...");
fs.writeFileSync(path.join(DIST_SERVER, 'package.json'), deployPkgStr);
fs.writeFileSync(path.join(DIST_SERVER, 'wrangler.toml'), cleanWrangler);

console.log("Deployment artifacts prepared.");
