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
use num_bigint::{BigInt, BigUint, Sign};
use num_integer::Integer;
use num_traits::{One, Zero, ToPrimitive};
use sha2::{Sha256, Digest};

/// 3.1 HashToGroup (Mapping Cycle to Class Group)
/// cycle_bytes -> Form (a, b, c)
pub fn hash_to_group(cycle_bytes: &[u8], discriminant: &BigInt) -> Result<Form, String> {
    let mut hasher = Sha256::new();
    hasher.update(cycle_bytes);
    let hash = hasher.finalize();
    
    // 1. Seed = SHA-256(cycle_bytes)
    let mut seed = BigInt::from_bytes_be(Sign::Plus, &hash);
    
    // 2. Candidate Generation
    // Find smallest prime P >= Seed such that Kronecker(D, P) = 1
    loop {
        let p_uint = seed.to_biguint().ok_or("Failed to convert seed to BigUint")?;
        
        // Ensure odd
        if p_uint.is_even() {
            seed += 1;
            continue;
        }

        if miller_rabin(&p_uint, 40) {
            let p_minus_one_div_two = (&seed - 1) / 2;
            let legendre = mod_pow(discriminant, &p_minus_one_div_two, &seed);
            
            let one = BigInt::one();
            if legendre == one {
                break;
            }
        }
        
        seed += 1;
    }
    
    let p = seed;
    
    // 3. Solve for b: b^2 = D (mod p) -> Tonelli-Shanks
    let b_0 = tonelli_shanks(discriminant, &p);
    
    // Ensure b is odd (assuming D = 1 mod 4)
    let b = if b_0.is_even() {
        &p - &b_0
    } else {
        b_0
    };
    
    // 4. Compute c = (b^2 - D) / 4a
    let b_sq = &b * &b;
    let four_a = &p * BigInt::from(4);
    let num = b_sq - discriminant;
    
    if &num % &four_a != BigInt::zero() {
        return Err(format!("HashToGroup divisibility check failed! D={}, b={}, p={}", discriminant, b, p));
    }

    let c = num / four_a;
    
    let mut f = Form {
        a: p,
        b,
        c,
        discriminant: discriminant.clone(),
    };
    f.reduce();
    Ok(f)
}

/// 3.2 HashToPrime (Wesolowski Challenge)
pub fn hash_to_prime(x: &Form, y: &Form, discriminant: &BigInt) -> BigUint {
    // 1. Serialize: B = SerializeForm(x) || SerializeForm(y) || BigIntToBytes(D)
    let mut b = Vec::new();
    b.extend(x.serialize_strict());
    b.extend(y.serialize_strict());
    b.extend(discriminant.to_signed_bytes_be());
    
    // 2. Hash: seed = SHA-256(B)
    let mut hasher = Sha256::new();
    hasher.update(&b);
    let seed = hasher.finalize();
    
    let mut nonce: u64 = 0;
    
    loop {
        let mut h_ctx = Sha256::new();
        h_ctx.update(&seed);
        h_ctx.update(&nonce.to_be_bytes());
        let h = h_ctx.finalize();
        
        let mut candidate_bytes = [0u8; 16];
        candidate_bytes.copy_from_slice(&h[0..16]);
        
        let mut candidate = BigUint::from_bytes_be(&candidate_bytes);
        
        // Set lowest bit to 1
        candidate.set_bit(0, true);
        
        if miller_rabin(&candidate, 40) {
            return candidate;
        }
        
        nonce += 1;
    }
}

pub fn miller_rabin(n: &BigUint, rounds: usize) -> bool {
    if n.is_even() { return n == &BigUint::from(2u32); }
    if n <= &BigUint::from(3u32) { return true; }

    let one = BigUint::one();
    let n_minus_one = n - &one;
    let mut d = n_minus_one.clone();
    let mut s = 0;
    while d.is_even() {
        d >>= 1;
        s += 1;
    }

    use num_bigint::RandBigInt;
    let mut rng = rand::thread_rng();

    for _ in 0..rounds {
        let a = rng.gen_biguint_range(&BigUint::from(2u32), &n_minus_one);
        
        let mut x = a.modpow(&d, n);

        if x == one || x == n_minus_one {
            continue;
        }

        let mut composite = true;
        for _ in 0..(s - 1) {
            x = x.modpow(&BigUint::from(2u32), n);
            if x == n_minus_one {
                composite = false;
                break;
            }
        }
        
        if composite {
            return false;
        }
    }

    true
}

pub fn tonelli_shanks(n: &BigInt, p: &BigInt) -> BigInt {
    // 1. Check Legendre Symbol (n/p)
    if mod_pow(n, &((p - 1u32) / 2u32), p) != BigInt::one() {
        return BigInt::zero();
    }
    
    // 2. Simple cases
    let four = BigInt::from(4u32);
    if p % &four == BigInt::from(3u32) {
        return mod_pow(n, &((p + 1u32) / 4u32), p);
    }
    
    // 3. Full Tonelli-Shanks
    let one = BigInt::one();
    let mut s = BigInt::zero();
    let mut q = p - &one;
    while &q % 2u32 == BigInt::zero() {
        q /= 2u32;
        s += 1u32;
    }
    
    // Find generator z
    let mut z = BigInt::from(2u32);
    while mod_pow(&z, &((p - 1u32) / 2u32), p) == BigInt::one() {
        z += 1u32;
    }
    
    let mut c = mod_pow(&z, &q, p);
    let mut r = mod_pow(n, &((&q + 1u32) / 2u32), p);
    let mut t = mod_pow(n, &q, p);
    let mut m = s;
    
    while t != BigInt::one() {
        let mut tt = t.clone();
        let mut i = BigInt::zero();
        while tt != BigInt::one() {
            tt = (&tt * &tt) % p;
            i += 1u32;
            if i == m { return BigInt::zero(); }
        }
        
        let mut b = c.clone();
        let e = &m - &i - 1u32;
        let iter_count = e.to_u64().unwrap_or(0);
        for _ in 0..iter_count {
            b = (&b * &b) % p;
        }
        
        m = i;
        c = (&b * &b) % p;
        t = (&t * &c) % p;
        r = (&r * &b) % p;
    }
    r
}

fn mod_pow(base: &BigInt, exp: &BigInt, modulus: &BigInt) -> BigInt {
    base.modpow(exp, modulus)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_miller_rabin() {
        assert!(miller_rabin(&BigUint::from(2u32), 10));
        assert!(miller_rabin(&BigUint::from(3u32), 10));
        assert!(miller_rabin(&BigUint::from(17u32), 10));
        assert!(miller_rabin(&BigUint::from(19u32), 10));
        let m31 = BigUint::from(2u32).pow(31) - BigUint::one();
        assert!(miller_rabin(&m31, 10));

        assert!(!miller_rabin(&BigUint::from(15u32), 10));
        assert!(!miller_rabin(&BigUint::from(21u32), 10));
        assert!(!miller_rabin(&BigUint::from(100u32), 10));
    }

    #[test]
    fn test_tonelli_shanks() {
        let n = BigInt::from(2u32);
        let p = BigInt::from(7u32);
        let r = tonelli_shanks(&n, &p);
        let r_sq = (&r * &r) % &p;
        assert_eq!(r_sq, n, "Sqrt(2) mod 7 failed");

        let n = BigInt::from(5u32);
        let p = BigInt::from(11u32);
        let r = tonelli_shanks(&n, &p);
        let r_sq = (&r * &r) % &p;
        assert_eq!(r_sq, n, "Sqrt(5) mod 11 failed");
    }
}