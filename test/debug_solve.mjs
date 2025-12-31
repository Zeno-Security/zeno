
import * as zeno from '../src/core/pkg-node/zeno_core.js';

async function run() {
    console.log("Testing solve_wasm...");

    // Valid 2048-bit D (1 mod 4 => Ends in 11... wait hex)
    // -3 is valid D. (-3 = 1 mod 4).
    // Hex of magnitude 3: "03".
    // Wait, D is encoded as Hex in solve_wasm. 
    // solve_wasm expects "discriminant_hex". 
    // Is it Signed Hex? Or Magnitude?
    // In `solve_challenge`: `let d = BigInt::from_str_radix(discriminant_hex, 16)?`.
    // Rust `from_str_radix` handles `-` prefix.

    // Case 1: Small D
    const seed = "0000000000000000000000000000000000000000000000000000000000000001";
    const dHex = "03";
    const diff = 100n;
    const graph = 15;

    console.log(`Solving: D=${dHex}, Diff=${diff}`);
    const start = Date.now();
    try {
        const sol = zeno.solve_wasm(seed, dHex, diff, graph);
        console.log("Success!", JSON.stringify(sol, null, 2));
    } catch (e) {
        console.log("Error:", e);
    }
    console.log(`Time: ${Date.now() - start}ms`);

    // Case 2: Large D (Random 2048 bit, ending in 3 mod 4)
    // Hex "3".
    // Let's generate a hex string of length 512 (2048 bits / 4).
    let randomHex = Array(64).fill("ff").join(""); // 64*8 = 512 bits. 256 bytes.
    // Ensure Last byte is 03.
    randomHex = randomHex.slice(0, -2) + "03";
    const dHexLarge = randomHex;

    console.log(`Solving Large D...`);
    const start2 = Date.now();
    try {
        const sol2 = zeno.solve_wasm(seed, dHexLarge, diff, graph);
        console.log("Success Large!", JSON.stringify(sol2).substring(0, 100) + "...");
    } catch (e) {
        console.log("Error Large:", e);
    }
    console.log(`Time Large: ${Date.now() - start2}ms`);
}

run();
