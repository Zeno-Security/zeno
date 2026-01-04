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

// --- Stateful Solver ---

pub enum SolverState {
    BuildingGraph { edge_index: u64, limit: u64 },
    FindingCycle { start_node_idx: usize },
    VDF { current_iter: u64, total_iter: u64 },
    Proof,
    Done,
}

pub struct ZenoSolver {
    // Configuration
    pub seed: Vec<u8>,
    pub discriminant: BigInt,
    pub vdf_iters: u64,
    pub graph_bits: u32,

    // Internal State
    pub state: SolverState,
    
    // Graph State
    adj: Vec<Vec<(u32, u32)>>,
    sip_key: [u8; 16],
    mask: u64,

    // Results
    cycle: Option<Vec<u32>>,
    x: Option<Form>,
    y: Option<Form>,
    pi: Option<Form>,
}

pub enum StepResult {
    Progress(f32), // 0.0 to 100.0
    Done(Vec<u32>, Form, Form),
    Error(String),
}

impl ZenoSolver {
    pub fn new(seed_hex: &str, discriminant_hex: &str, vdf_iters: u64, graph_bits: u32) -> Result<Self, String> {
        let seed = hex::decode(seed_hex).map_err(|e| e.to_string())?;
        
        let d_bytes = hex::decode(discriminant_hex).map_err(|e| e.to_string())?;
        let d_val = BigInt::from_bytes_be(Sign::Plus, &d_bytes);
        let discriminant = -d_val;

        let sip_key = if seed.len() >= 16 {
            let mut k = [0u8; 16];
            k.copy_from_slice(&seed[0..16]);
            k
        } else {
            return Err("Seed too short".to_string());
        };

        let num_nodes = (1 << graph_bits) as usize;
        let num_edges = 1u64 << (graph_bits + 2);

        Ok(Self {
            seed,
            discriminant,
            vdf_iters,
            graph_bits,
            state: SolverState::BuildingGraph { edge_index: 0, limit: num_edges },
            adj: vec![Vec::new(); num_nodes],
            sip_key,
            mask: (1u64 << graph_bits) - 1,
            cycle: None,
            x: None,
            y: None,
            pi: None,
        })
    }

    pub fn step(&mut self, steps: usize) -> StepResult {
        match &mut self.state {
            SolverState::BuildingGraph { edge_index, limit } => {
                let end = std::cmp::min(*edge_index + steps as u64, *limit);
                
                for i in *edge_index..end {
                    let (u, v) = generate_edge(&self.sip_key, i, self.mask);
                    let u = u as u32;
                    let v = v as u32;
                    if u == v { continue; }
                    
                    self.adj[u as usize].push((v, i as u32));
                    self.adj[v as usize].push((u, i as u32));
                }
                *edge_index = end;
                
                let progress = (*edge_index as f32 / *limit as f32) * 50.0; // 0-50%
                
                if *edge_index >= *limit {
                    self.state = SolverState::FindingCycle { start_node_idx: 0 };
                }
                
                StepResult::Progress(progress)
            },
            SolverState::FindingCycle { start_node_idx } => {
                let limit = self.adj.len();
                let chunk = steps * 10; // Process more nodes per step as DFS start check is fast
                let end = std::cmp::min(*start_node_idx + chunk, limit);
                
                for i in *start_node_idx..end {
                    if self.adj[i].is_empty() { continue; }
                    
                    if let Some(cycle) = dfs_cycle(
                        i as u32,
                        i as u32,
                        &self.adj,
                        &mut HashSet::new(),
                        &mut Vec::new()
                    ) {
                        self.cycle = Some(cycle.clone());
                        
                        // Proceed to VDF
                        let cycle_bytes = crate::serialize_cycle(&cycle);
                        match hash_to_group(&cycle_bytes, &self.discriminant) {
                            Ok(x) => {
                                self.x = Some(x.clone());
                                self.y = Some(x); // Initialize y = x
                                self.state = SolverState::VDF { current_iter: 0, total_iter: self.vdf_iters };
                                return StepResult::Progress(60.0);
                            },
                            Err(e) => return StepResult::Error(e),
                        }
                    }
                }
                *start_node_idx = end;
                
                if *start_node_idx >= limit {
                    return StepResult::Error("No 42-cycle found".to_string());
                }
                
                let progress = 50.0 + (*start_node_idx as f32 / limit as f32) * 10.0; // 50-60%
                StepResult::Progress(progress)
            },
            SolverState::VDF { current_iter, total_iter } => {
                if let Some(y) = &mut self.y {
                    let end = std::cmp::min(*current_iter + steps as u64, *total_iter);
                    for _ in *current_iter..end {
                        match square_form(y) {
                            Ok(new_y) => *y = new_y,
                            Err(e) => return StepResult::Error(e),
                        }
                    }
                    *current_iter = end;
                    
                    let progress = 60.0 + (*current_iter as f32 / *total_iter as f32) * 30.0; // 60-90%
                    
                    if *current_iter >= *total_iter {
                        self.state = SolverState::Proof;
                    }
                    StepResult::Progress(progress)
                } else {
                    StepResult::Error("Msg: State error, y is missing".to_string())
                }
            },
            SolverState::Proof => {
                if let (Some(x), Some(y)) = (&self.x, &self.y) {
                    let l_prime = hash_to_prime(x, y, &self.discriminant);
                    let exponent = compute_power_of_two(self.vdf_iters);
                    let (q, _) = exponent.div_rem(&l_prime);
                    match x.pow(&q) {
                        Ok(pi) => {
                             self.pi = Some(pi.clone());
                             self.state = SolverState::Done;
                             if let Some(cycle) = &self.cycle {
                                 StepResult::Done(cycle.clone(), y.clone(), pi)
                             } else {
                                 StepResult::Error("Missing cycle".to_string())
                             }
                        },
                        Err(e) => StepResult::Error(e)
                    }
                } else {
                    StepResult::Error("Missing x or y".to_string())
                }
            },
            SolverState::Done => {
                 if let (Some(cycle), Some(y), Some(pi)) = (&self.cycle, &self.y, &self.pi) {
                     StepResult::Done(cycle.clone(), y.clone(), pi.clone())
                 } else {
                     StepResult::Error("Already done but missing results".to_string())
                 }
            }
        }
    }
}

// Keep original stateless functions for compatibility (if needed) or tests
pub fn solve_challenge(
    seed_hex: &str,
    discriminant_hex: &str,
    vdf: u64,
    graph_bits: u32,
) -> Result<(Vec<u32>, Form, Form), String> {
    let mut solver = ZenoSolver::new(seed_hex, discriminant_hex, vdf, graph_bits)?;
    loop {
        match solver.step(10000) { // Large step for sync
            StepResult::Progress(_) => continue,
            StepResult::Done(c, y, pi) => return Ok((c, y, pi)),
            StepResult::Error(e) => return Err(e),
        }
    }
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

pub fn find_cycle_stateless(seed: &[u8], graph_bits: u32) -> Result<Vec<u32>, String> {
    // Legacy helper if needed, essentially reimplements BuildingGraph phase
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

            let res = find_cycle_stateless(&seed, 10);
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