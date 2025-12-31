
// Minimal reproduction to check challenge config
async function checkConfig() {
    console.log("=== Checking Server Configuration ===");

    // Default Site Key (or any valid UUID)
    const SITE_KEY = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    try {
        const res = await fetch('http://127.0.0.1:8787/api/challenge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CF-Connecting-IP': '203.0.113.199' // Bypass Rate Limit
            },
            body: JSON.stringify({ site_key: SITE_KEY })
        });

        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            console.error(await res.text());
            return;
        }

        const data = await res.json();
        console.log("Server Response Config:");
        console.log(`  Difficulty: ${data.difficulty}`);
        console.log(`  Graph Bits: ${data.graph_bits}`);

        if (data.graph_bits > 22) {
            console.error("\u274C FAIL: Graph Bits too high (" + data.graph_bits + ")");
        } else if (data.graph_bits < 22) {
            // 15 is acceptable if config wasn't updated, but we target 22 now.
            console.error("\u26A0\uFE0F WARNING: Graph Bits lower than target 22 (" + data.graph_bits + ")");
        } else {
            console.log("\u2705 PASS: Graph Bits matches target (" + data.graph_bits + ")");
        }

    } catch (e) {
        console.error("Connection Failed:", e.message);
    }
}

checkConfig();
