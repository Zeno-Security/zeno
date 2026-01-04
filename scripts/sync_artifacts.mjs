
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const benchmarkDir = path.join(rootDir, 'benchmark');
const distClientDir = path.join(rootDir, 'dist/client');
const srcBenchmark = path.join(rootDir, 'src/client/benchmark.html');
const destBenchmark = path.join(benchmarkDir, 'index.html');

console.log("Updating Benchmark Folder...");

// 1. Create Folder
if (!fs.existsSync(benchmarkDir)) {
    fs.mkdirSync(benchmarkDir, { recursive: true });
}

// 2. Copy Artifacts from dist/client
if (fs.existsSync(distClientDir)) {
    const files = fs.readdirSync(distClientDir);
    for (const file of files) {
        const src = path.join(distClientDir, file);
        const destBenchmark = path.join(benchmarkDir, file);

        if (fs.statSync(src).isDirectory()) {
            fs.cpSync(src, destBenchmark, { recursive: true });
        } else {
            fs.copyFileSync(src, destBenchmark);
        }

        // Also sync to test/e2e/client
        const testClientDir = path.join(rootDir, 'test/e2e/client');
        if (fs.existsSync(testClientDir)) {
            const destTest = path.join(testClientDir, file);
            if (fs.statSync(src).isDirectory()) {
                fs.cpSync(src, destTest, { recursive: true });
            } else {
                fs.copyFileSync(src, destTest);
            }
        }
        console.log(`Synced ${file} to benchmark/ and test/e2e/client/`);
    }
} else {
    console.warn("Warning: dist/client does not exist. Run 'npm run build:client' first.");
}

// 3. Generate Docs Benchmark (Standalone with LOCAL assets for stability)
const docsDir = path.join(rootDir, 'docs');
const destDocsBenchmark = path.join(docsDir, 'benchmark-test.html');

console.log("Syncing assets to docs/ for live testing...");
if (fs.existsSync(distClientDir)) {
    const files = fs.readdirSync(distClientDir);
    for (const file of files) {
        if (!file.includes('.map')) { // Skip maps
            const src = path.join(distClientDir, file);
            const dest = path.join(docsDir, file);
            if (fs.statSync(src).isDirectory()) {
                fs.cpSync(src, dest, { recursive: true });
            } else {
                fs.copyFileSync(src, dest);
            }
        }
    }
}

const benchmarkFile = path.join(benchmarkDir, 'benchmark.html');
if (fs.existsSync(benchmarkFile)) {
    let content = fs.readFileSync(benchmarkFile, 'utf-8');
    // Ensure we use local import
    // (Content is likely already using ./zeno.min.js, so we just write it)
    fs.writeFileSync(destDocsBenchmark, content);
    console.log(`Generated ${destDocsBenchmark} with LOCAL links.`);
} else {
    console.error("Error: benchmark/benchmark.html source not found.");
}

console.log("Benchmark update complete.");
