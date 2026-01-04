/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */
pub mod bqf;
pub mod crypto;
pub mod solver;

use wasm_bindgen::prelude::*;
use crate::solver::solve_challenge;
use serde::Serialize;

#[derive(Serialize)]
pub struct SolveResult {
    pub cycle: Vec<u32>,
    pub y: String,
    pub pi: String,
    pub memory_bytes: u32,
    pub test_field: u32,
}

/// Returns current WASM memory usage in bytes
#[wasm_bindgen]
pub fn get_memory_bytes() -> u32 {
    #[cfg(target_arch = "wasm32")]
    {
        (core::arch::wasm32::memory_size(0) * 65536) as u32
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        0
    }
}

#[wasm_bindgen]
pub fn solve_wasm(
    seed_hex: &str,
    discriminant_hex: &str,
    vdf: u64,
    graph_bits: u32,
) -> Result<JsValue, JsValue> {
    let (cycle, y, pi) = solve_challenge(seed_hex, discriminant_hex, vdf, graph_bits)
        .map_err(|e| JsValue::from_str(&e))?;
    
    let y_bytes = y.serialize_strict();
    let pi_bytes = pi.serialize_strict();

    let memory_bytes = get_memory_bytes();

    let sol = SolveResult {
        cycle,
        y: hex::encode(y_bytes),
        pi: hex::encode(pi_bytes),
        memory_bytes,
        test_field: 99999,
    };
    
    Ok(serde_wasm_bindgen::to_value(&sol)?)
}

#[wasm_bindgen]
pub fn serialize_cycle(indices: &[u32]) -> Vec<u8> {
    let mut sorted = indices.to_vec();
    sorted.sort();
    
    let mut buffer = Vec::with_capacity(sorted.len() * 4);
    for index in sorted {
        buffer.extend_from_slice(&index.to_le_bytes());
    }
    buffer
}

#[wasm_bindgen]
pub fn verify_proof(
    seed_hex: &str,
    cycle: &[u32],
    y_hex: &str,
    pi_hex: &str,
    discriminant_bytes: &[u8],
    vdf: u64,
    graph_bits: u32,
) -> Result<bool, String> {
    use crate::bqf::Form;

    let y_bytes = hex::decode(y_hex)
        .map_err(|e| format!("Invalid hex for y: {}", e))?;
    let pi_bytes = hex::decode(pi_hex)
        .map_err(|e| format!("Invalid hex for pi: {}", e))?;

    use num_bigint::{BigInt, Sign};
    use num_traits::Zero;
    let d = BigInt::from_bytes_be(Sign::Minus, discriminant_bytes);
    if d.is_zero() { return Err("d is zero".to_string()); }

    let y = Form::from_strict_bytes(&y_bytes, d.clone())
        .map_err(|e| format!("Failed to deserialize y: {}", e))?;

    let pi = Form::from_strict_bytes(&pi_bytes, d.clone())
        .map_err(|e| format!("Failed to deserialize pi: {}", e))?;

    verify_proof_internal(seed_hex, cycle, &y, &pi, discriminant_bytes, vdf, graph_bits)
}

pub fn verify_proof_internal(
    seed_hex: &str,
    cycle: &[u32],
    y: &crate::bqf::Form,
    pi: &crate::bqf::Form,
    discriminant_bytes: &[u8],
    vdf: u64,
    graph_bits: u32,
) -> Result<bool, String> {
    use num_bigint::{BigInt, Sign};
    use num_traits::Zero;
    use crate::solver::verify_cycle;

    if cycle.len() != 42 {
        return Err(format!("Invalid cycle length: {}", cycle.len()));
    }
    
    let d = BigInt::from_bytes_be(Sign::Minus, discriminant_bytes);
    if d.is_zero() {
        return Err("Discriminant is zero".to_string());
    }

    if !verify_cycle(seed_hex, cycle, graph_bits) {
        return Err("Cycle validation failed (Cuckatoo)".to_string());
    }

    let cycle_bytes = serialize_cycle(cycle);
    let x = crate::crypto::hash_to_group(&cycle_bytes, &d)?;

    if &x.discriminant != &d { return Err("x.discriminant mismatch".to_string()); }
    if &y.discriminant != &d { return Err("y.discriminant mismatch".to_string()); }
    if &pi.discriminant != &d { return Err("pi.discriminant mismatch".to_string()); }

    use crate::crypto::hash_to_prime;
    use num_bigint::BigUint;
    let two = BigUint::from(2u32);
    let l = crate::crypto::hash_to_prime(&x, y, &d);
    let t_big = BigUint::from(vdf);
    let r = two.modpow(&t_big, &l);
    
    let rhs = pi.pow(&l)?
        .compose(&x.pow(&r)?)?;

    if y != &rhs {
        return Err(format!("VDF Equation failed: y != pi^l * x^r. \n x: {:?} \n l: {} \n r: {} \n y: {:?} \n rhs: {:?}", x, l, r, y, rhs));
    }

    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use num_bigint::BigInt;

    #[test]
    fn test_strict_validity_hash_to_group() {
        use crate::crypto::hash_to_group;
        use crate::bqf::Form;

        let d = BigInt::from(-3);
        let cycle = vec![1, 2, 3];
        let cycle_bytes = serialize_cycle(&cycle);
        let x = hash_to_group(&cycle_bytes, &d).unwrap();
        
        let bytes = x.serialize_strict();
        let res = Form::from_strict_bytes(&bytes, d.clone());
        assert!(res.is_ok(), "Strict deserialize failed for D=-3: {:?}", res.err());

        let d2 = BigInt::from(-15);
        let x2 = hash_to_group(&cycle_bytes, &d2).unwrap();
        let bytes2 = x2.serialize_strict();
        let res2 = Form::from_strict_bytes(&bytes2, d2.clone());
        assert!(res2.is_ok(), "Strict deserialize failed for D=-15: {:?}", res2.err());
    }

    #[test]
    fn test_strict_validity_pow() {
        use crate::crypto::hash_to_group;
        use crate::bqf::Form;
        use num_bigint::BigUint;

        let d = BigInt::from(-7);
        let cycle = vec![1u32];
        let cycle_bytes = serialize_cycle(&cycle);
        let x = hash_to_group(&cycle_bytes, &d).unwrap();
        
        let exp = BigUint::from(100u32);
        let pi = x.pow(&exp).unwrap();
        
        let bytes = pi.serialize_strict();
        let pi2 = Form::from_strict_bytes(&bytes, d.clone());
        assert!(pi2.is_ok(), "Strict deserialize failed for pi (pow): {:?}", pi2.err());
    }

    #[test]
    fn test_compose_correctness() {
        use crate::crypto::hash_to_group;
        use crate::bqf::Form;

        let d = BigInt::from(-7);
        let cycle = vec![1u32];
        let cycle_bytes = serialize_cycle(&cycle);
        let x = hash_to_group(&cycle_bytes, &d).unwrap();
        
        let inv = Form { a: x.a.clone(), b: -&x.b, c: x.c.clone(), discriminant: x.discriminant.clone() };
        let id = x.compose(&inv).unwrap();
        
        let expected_id = Form::identity(d.clone());
        assert_eq!(id, expected_id, "x * x^-1 != Identity. Got {:?}", id);
    }

    #[test]
    fn test_pow_3_consistency() {
        use crate::crypto::hash_to_group;
        use num_bigint::BigUint;

        let d = BigInt::from(-23); 
        let cycle = vec![1u32];
        let cycle_bytes = serialize_cycle(&cycle);
        let x = hash_to_group(&cycle_bytes, &d).unwrap();

        let pow3 = x.pow(&BigUint::from(3u32)).unwrap();
        let sq = x.square().unwrap();
        let manual = sq.compose(&x).unwrap();

        assert_eq!(pow3, manual, "pow(3) != square().compose(x)");
    }

    #[test]
    fn test_vdf_repro() {
        use crate::crypto::{hash_to_group, hash_to_prime};
        use num_bigint::BigUint;
        use num_integer::Integer; 

        let vdf = 100u32;
        let d = BigInt::from(-23);
        let cycle = vec![1u32];
        let cycle_bytes = serialize_cycle(&cycle);
        let x = hash_to_group(&cycle_bytes, &d).unwrap();

        let two = BigUint::from(2u32);
        let two_to_t = two.pow(vdf); 
        let y = x.pow(&two_to_t).unwrap();

        let l_prime = hash_to_prime(&x, &y, &d);
        
        let (q, r) = two_to_t.div_rem(&l_prime);
        
        let pi = x.pow(&q).unwrap();
        
        let l_pow = pi.pow(&l_prime).unwrap();
        let r_pow = x.pow(&r).unwrap();
        let rhs = l_pow.compose(&r_pow).unwrap();
        
        assert_eq!(y, rhs, "VDF verification failed");
    }

    #[test]
    fn test_square_direct() {
        use crate::crypto::hash_to_group;
        
        let d = BigInt::from(-23); 
        let cycle = vec![1u32];
        let cycle_bytes = serialize_cycle(&cycle);
        let x = hash_to_group(&cycle_bytes, &d).unwrap();
        
        let sq = x.square().unwrap();
        
        assert!(!sq.a.is_zero(), "Square result has zero A");
    }
}