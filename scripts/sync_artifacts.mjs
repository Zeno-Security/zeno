
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const benchmarkDir = path.join(rootDir, 'docs/benchmark');
const distClientDir = path.join(rootDir, 'dist/client');

console.log("Updating Benchmark Folder (docs/benchmark)...");

// 1. Create Folder
if (!fs.existsSync(benchmarkDir)) {
    fs.mkdirSync(benchmarkDir, { recursive: true });
}

// 2. Copy Artifacts from dist/client to docs/benchmark and test/e2e/client
if (fs.existsSync(distClientDir)) {
    const files = fs.readdirSync(distClientDir);
    for (const file of files) {
        if (!file.includes('.map') && file !== 'assets') { // Skip maps and assets folder
            const src = path.join(distClientDir, file);

            // Sync to docs/benchmark
            const destBenchmark = path.join(benchmarkDir, file);
            if (fs.statSync(src).isDirectory()) {
                fs.cpSync(src, destBenchmark, { recursive: true });
            } else {
                fs.copyFileSync(src, destBenchmark);
            }

            // Sync to test/e2e/client
            const testClientDir = path.join(rootDir, 'test/e2e/client');
            if (fs.existsSync(testClientDir)) {
                const destTest = path.join(testClientDir, file);
                if (fs.statSync(src).isDirectory()) {
                    fs.cpSync(src, destTest, { recursive: true });
                } else {
                    fs.copyFileSync(src, destTest);
                }
            }
            console.log(`Synced ${file}`);
        }
    }
} else {
    console.warn("Warning: dist/client does not exist. Run 'npm run build:client' first.");
}

console.log("Benchmark update complete.");
