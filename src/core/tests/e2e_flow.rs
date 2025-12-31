/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */
use zeno_core::bqf::Form;
use zeno_core::solver::solve_challenge;
use zeno_core::verify_proof;
use zeno_core::serialize_cycle;

#[test]
fn test_e2e_flow() {
    // 1. [Server] Generate Challenge
    let seed_hex = "0102030405060708090a0b0c0d0e0f10"; // 16 bytes
    // Discriminant D = -3 (magnitude 3). 
    // In Hex (Magnitude): 0...03
    let discriminant_hex = "0000000000000000000000000000000000000000000000000000000000000003";
    let vdf = 10; // Low difficulty for test speed
    let graph_bits = 10; // Small graph for test speed

    println!("Step 1: Challenge Generated");
    println!("Seed: {}", seed_hex);
    println!("VDF: {}", vdf);

    // 2. [Client] Solve Challenge
    println!("Step 2: Client Solving...");
    // 1. Solver
    let result = solve_challenge(seed_hex, discriminant_hex, vdf, graph_bits);
    assert!(result.is_ok(), "Solver failed: {:?}", result.err());
    assert!(result.is_ok(), "Solver failed: {:?}", result.err());
    
    let (cycle, y, pi) = result.unwrap();
    println!("Step 2: Solved!");
    println!("Cycle Length: {}", cycle.len());
    
    // 3. [Server] Verify Proof
    
    // We need to serialize inputs as the WASM/API would receive them.
    // 2. Verifier
    // verify_proof takes: (cycle: &[u32], y_strict_bytes: &[u8], pi_strict_bytes: &[u8], discriminant_bytes: &[u8], vdf: u64, graph_bits: u32)
    // But exposed function takes hex strings/JS values? No, we are testing internal Rust flow or exposed?
    // Looking at file content from grep, it calls `verify_proof_internal`.
    
    // Need to serialize Y and Pi using bqf::serialize_strict (or similar if exposed).
    // Currently `serialize_strict` is in `bqf.rs`.
    // We need to ensure logic matches.
    // The `Form` struct has `serialize_strict`.
    
    let y_bytes = y.serialize_strict();
    let pi_bytes = pi.serialize_strict();
    let d_bytes = hex::decode(discriminant_hex).unwrap();
    
    println!("Step 3: Server Verifying...");
    let valid = zeno_core::verify_proof_internal(
        &seed_hex,
        &cycle,
        &y,
        &pi,
        &d_bytes,
        &d_bytes,
        vdf,
        graph_bits
    );
    
    assert!(valid, "Verification failed! The server rejected the client's valid proof.");
    println!("Step 3: Verified! System is consistent.");
}
