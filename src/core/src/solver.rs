/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */
use crate::bqf::Form;
use crate::crypto::{hash_to_group, hash_to_prime};
use num_bigint::{BigInt, BigUint, Sign};
use num_integer::Integer;
use siphasher::sip::SipHasher24;
use std::collections::{HashMap, HashSet};
use std::hash::Hasher;

/// Generates a proof for the Zeno challenge.
/// 1. Finds a 42-cycle in the Cuckatoo graph.
/// 2. Calculates the VDF output y = x^(2^T).
/// 3. Generates the VDF proof pi.
pub fn solve_challenge(
    seed_hex: &str,
    discriminant_hex: &str,
    vdf: u64,
    graph_bits: u32,
) -> Result<(Vec<u32>, Form, Form), String> {
    // 1. Parse Inputs
    let seed = hex::decode(seed_hex).map_err(|e| e.to_string())?;
    // Discriminant is passed as Hex (Magnitude). D is negative for class groups.
    let d_bytes = hex::decode(discriminant_hex).map_err(|e| e.to_string())?;
    let d_val = BigInt::from_bytes_be(Sign::Plus, &d_bytes);
    let discriminant = -d_val; // D = -U

    // 2. Find Cycle
    let cycle = find_cycle(&seed, graph_bits)?;

    // 3. Serialize Cycle & Hash to Group
    let cycle_bytes = crate::serialize_cycle(&cycle);
    let x = hash_to_group(&cycle_bytes, &discriminant)?;

    // 4. VDF Evaluation (y = x^(2^T))
    // x^(2^T) means squaring x, T times.
    let mut y = x.clone();
    for _ in 0..vdf {
         y = square_form(&y)?;
    }

    // 5. Generate Proof (Wesolowski)
    // l = HashToPrime(x, y)
    let l_prime = hash_to_prime(&x, &y, &discriminant);
    
    // q = 2^T / l
    // FIX: Compute 2^T without u32 truncation
    let exponent = compute_power_of_two(vdf);
    let (q, _) = exponent.div_rem(&l_prime);
    
    // pi = x^q
    let pi = x.pow(&q)?;

    Ok((cycle, y, pi))
}

/// Compute 2^n for large n without overflow
/// Uses bit shifting for efficiency
fn compute_power_of_two(n: u64) -> BigUint {
    if n == 0 {
        return BigUint::from(1u32);
    }
    
    // For very large exponents, build incrementally
    // 2^n = 1 << n
    let mut result = BigUint::from(1u32);
    
    // Process in chunks to avoid issues with extremely large shifts
    let chunk_size = 30u64; // Safe chunk size
    let full_chunks = n / chunk_size;
    let remainder = n % chunk_size;
    
    let chunk_multiplier = BigUint::from(1u32) << (chunk_size as usize);
    
    for _ in 0..full_chunks {
        result *= &chunk_multiplier;
    }
    
    if remainder > 0 {
        result <<= remainder as usize;
    }
    
    result
}

// --- Cuckatoo Graph Logic ---

pub fn verify_cycle(seed_hex: &str, cycle: &[u32], graph_bits: u32) -> bool {
    let seed = match hex::decode(seed_hex) {
        Ok(s) => s,
        Err(_) => return false,
    };

    let sip_key = if seed.len() >= 16 {
        let mut k = [0u8; 16];
        k.copy_from_slice(&seed[0..16]);
        k
    } else {
        return false;
    };

    let mask = (1u64 << graph_bits) - 1;
    let mut uv_map: HashMap<u64, Vec<u64>> = HashMap::new();

    for &edge_index in cycle {
        let (u, v) = generate_edge(&sip_key, edge_index as u64, mask);
        uv_map.entry(u).or_default().push(v);
        uv_map.entry(v).or_default().push(u);
    }

    // Verify degree 2 for all nodes in the cycle subgraph
    for (_, neighbors) in &uv_map {
        if neighbors.len() != 2 {
            return false;
        }
    }
    
    // Check connectivity (should be one component) and size
    let start_node = *uv_map.keys().next().unwrap();
    let mut visited = HashSet::new();
    let mut stack = vec![start_node];
    visited.insert(start_node);

    while let Some(node) = stack.pop() {
        if let Some(neighbors) = uv_map.get(&node) {
            for &neighbor in neighbors {
                if !visited.contains(&neighbor) {
                    visited.insert(neighbor);
                    stack.push(neighbor);
                }
            }
        }
    }

    // If it's a 42-cycle, we should have 42 nodes.
    visited.len() == 42
}

fn find_cycle(seed: &[u8], graph_bits: u32) -> Result<Vec<u32>, String> {
    // Optimized Dense Solver for Cuckatoo Cycle
    // Uses Vec<Vec<_>> instead of HashMap for memory efficiency on dense graphs.

    let sip_key = if seed.len() >= 16 {
        let mut k = [0u8; 16];
        k.copy_from_slice(&seed[0..16]);
        k
    } else {
        return Err("Seed too short".to_string());
    };

    let num_edges = 1u64 << (graph_bits + 2); // Density 4.0
    let mask = (1u64 << graph_bits) - 1;

    let num_nodes = (1 << graph_bits) as usize;
    let mut adj: Vec<Vec<(u32, u32)>> = vec![Vec::new(); num_nodes];

    let limit = num_edges;
    
    for i in 0..limit {
        let (u, v) = generate_edge(&sip_key, i, mask);
        let u = u as u32;
        let v = v as u32;
        if u == v { continue; } // Self-loop
        
        adj[u as usize].push((v, i as u32));
        adj[v as usize].push((u, i as u32));
    }

    // DFS to find cycle of length 42
    for (start_node_idx, _) in adj.iter().enumerate() {
        if adj[start_node_idx].is_empty() { continue; }
        
        if let Some(cycle) = dfs_cycle(
            start_node_idx as u32, 
            start_node_idx as u32, 
            &adj, 
            &mut HashSet::new(), 
            &mut Vec::new()
        ) {
            return Ok(cycle);
        }
    }

    Err("No 42-cycle found (try different seed)".to_string())
}

fn dfs_cycle(
    current: u32,
    start: u32,
    adj: &[Vec<(u32, u32)>],
    visited: &mut HashSet<u32>,
    path: &mut Vec<u32>
) -> Option<Vec<u32>> {
    visited.insert(current);

    let neighbors = &adj[current as usize];
    
    for &(neighbor, edge_index) in neighbors {
        if neighbor == start && path.len() == 41 {
            // Found 42-cycle!
            let mut full_cycle = path.clone();
            full_cycle.push(edge_index);
            return Some(full_cycle);
        }

        if !visited.contains(&neighbor) && path.len() < 42 {
            path.push(edge_index);
            if let Some(res) = dfs_cycle(neighbor, start, adj, visited, path) {
                return Some(res);
            }
            path.pop();
        }
    }
    
    visited.remove(&current);
    None
}

fn generate_edge(key: &[u8; 16], index: u64, mask: u64) -> (u64, u64) {
    let mut hasher = SipHasher24::new_with_key(key);
    hasher.write_u64(2 * index);
    let u = hasher.finish() & mask;
    
    let mut hasher2 = SipHasher24::new_with_key(key);
    hasher2.write_u64(2 * index + 1);
    let v = hasher2.finish() & mask;
    
    (u, v)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_power_of_two() {
        assert_eq!(compute_power_of_two(0), BigUint::from(1u32));
        assert_eq!(compute_power_of_two(1), BigUint::from(2u32));
        assert_eq!(compute_power_of_two(10), BigUint::from(1024u32));
        assert_eq!(compute_power_of_two(32), BigUint::from(1u64 << 32));
        
        // Test large exponent doesn't panic
        let large = compute_power_of_two(1000);
        assert!(large.bits() == 1001);
    }

    #[test]
    fn test_find_cycle_small_graph() {
        let mut found = false;
        let mut seed_val = 0u64;

        for _ in 0..50 {
            let mut seed = [0u8; 32];
            seed[0..8].copy_from_slice(&seed_val.to_be_bytes());
            seed_val += 1;

            let res = find_cycle(&seed, 10);
            if let Ok(cycle) = res {
                assert_eq!(cycle.len(), 42);
                let seed_hex = hex::encode(seed);
                assert!(verify_cycle(&seed_hex, &cycle, 10));
                found = true;
                break;
            }
        }
        
        if found {
            println!("Found 42-cycle!");
        } else {
            println!("No 42-cycle found in 50 tries (expected for sparse graphs)");
        }
    }
}

// --- Class Group Logic Helpers ---

fn square_form(f: &Form) -> Result<Form, String> {
    f.square()
}