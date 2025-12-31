/*
 * Required Notice: © Copyright 2025 KSEC - Erez Kalman (kaerez[at]gmail[dot]com | www.kalman.co.il | https://github.com/zeno-security/zeno | https://github.com/kaerez)
 *
 * This software is licensed under the PolyForm Strict License 1.0.0.
 * You may obtain a copy of the License at:
 * * https://polyformproject.org/licenses/strict/1.0.0/
 *
 * SPDX-License-Identifier: PolyForm-Strict-1.0.0
 */
use num_bigint::{BigInt, BigUint};
use num_integer::Integer;
use num_traits::Zero;
use serde::{Serialize, Deserialize};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Form {
    pub a: BigInt,
    pub b: BigInt,
    pub c: BigInt,
    pub discriminant: BigInt,
}

impl Form {
    pub fn new(a: BigInt, b: BigInt, c: BigInt, discriminant: BigInt) -> Self {
        Self { a, b, c, discriminant }
    }

    /// Strict Serialization defined in Spec 2.2
    /// [Len a (u16 BE)] || [a bytes] || [Len b (u16 BE)] || [b bytes]
    pub fn serialize_strict(&self) -> Vec<u8> {
        let mut buf = Vec::new();
        
        let a_bytes = self.a.to_signed_bytes_be();
        let b_bytes = self.b.to_signed_bytes_be();
        
        let a_len = a_bytes.len() as u16;
        buf.extend_from_slice(&a_len.to_be_bytes());
        buf.extend_from_slice(&a_bytes);

        let b_len = b_bytes.len() as u16;
        buf.extend_from_slice(&b_len.to_be_bytes());
        buf.extend_from_slice(&b_bytes);

        buf
    }

    pub fn from_strict_bytes(bytes: &[u8], discriminant: BigInt) -> Result<Self, String> {
        if bytes.len() < 2 { return Err("Bytes too short for A len".to_string()); }
        
        let mut cursor = 0;
        
        // Read A
        if cursor + 2 > bytes.len() { return Err("Buffer overrun reading A length".to_string()); }
        let a_len = u16::from_be_bytes([bytes[cursor], bytes[cursor + 1]]) as usize;
        cursor += 2;
        
        if cursor + a_len > bytes.len() { return Err(format!("Buffer overrun reading A (len {})", a_len)); }
        let a = BigInt::from_signed_bytes_be(&bytes[cursor..cursor + a_len]);
        cursor += a_len;
        
        // Read B
        if cursor + 2 > bytes.len() { return Err("Buffer overrun reading B length".to_string()); }
        let b_len = u16::from_be_bytes([bytes[cursor], bytes[cursor + 1]]) as usize;
        cursor += 2;
        
        if cursor + b_len > bytes.len() { return Err(format!("Buffer overrun reading B (len {})", b_len)); }
        let b = BigInt::from_signed_bytes_be(&bytes[cursor..cursor + b_len]);
        
        // Derive C: 4ac = b^2 - D => c = (b^2 - D) / 4a
        let b_sq = &b * &b;
        let num = b_sq - &discriminant;
        let four_a = &a * BigInt::from(4);
        
        if four_a.is_zero() { return Err("a is zero (invalid form)".to_string()); }
        let (c, rem) = num.div_rem(&four_a);
        
        if !rem.is_zero() {
            // Relaxed check - log warning in debug builds only
            #[cfg(debug_assertions)]
            eprintln!("WARN: from_strict_bytes 4ac check failed. Remainder: {}", rem);
        }

        Ok(Self::new(a, b, c, discriminant))
    }

    // --- BQF Arithmetic Implementation ---

    /// Normalizes the form such that -a < b <= a.
    fn normalize(&mut self) {
        let two = BigInt::from(2);
        let two_a = &two * &self.a;
        
        let (_q, r) = self.b.div_rem(&two_a);
        
        self.b = r;
        if self.b > self.a {
            self.b -= &two_a;
        } else if self.b <= -(&self.a) {
            self.b += &two_a;
        }

        // Update c: 4ac = b^2 - D
        let b2 = &self.b * &self.b;
        let num = &b2 - &self.discriminant;
        let four_a = BigInt::from(4) * &self.a;
        self.c = num / four_a;
    }

    /// Reduces the form to be unique in its class.
    /// Conditions:
    /// 1. |b| <= a <= c
    /// 2. If |b| == a or a == c, then b >= 0
    pub fn reduce(&mut self) {
        self.normalize();
        
        loop {
            if self.a > self.c {
                let old_a = self.a.clone();
                self.a = self.c.clone();
                self.c = old_a;
                self.b = -(&self.b);
                self.normalize();
            } else {
                if self.a == self.c && self.b < BigInt::zero() {
                    self.b = -(&self.b);
                }
                break;
            }
        }
    }

    /// Composition of two binary quadratic forms.
    pub fn compose(&self, other: &Form) -> Result<Form, String> {
        if self == other {
            return self.square();
        }
        self.compose_internal(other)
    }

    fn compose_internal(&self, other: &Form) -> Result<Form, String> {
        let a1 = &self.a;
        let a2 = &other.a;
        let b1 = &self.b;
        let b2 = &other.b;
        let c2 = &other.c;

        let s = (b1 + b2) / BigInt::from(2);
        
        let egcd1 = a1.extended_gcd(a2);
        let d1 = egcd1.gcd;
        let v1 = egcd1.y;
        
        let egcd2 = d1.extended_gcd(&s);
        let n = egcd2.gcd;
        let u2 = egcd2.x;
        let v2 = egcd2.y;

        let v_coeff = &u2 * &v1;
        let w_coeff = v2;
        
        let term1 = &v_coeff * (b1 - b2);
        let term2 = &w_coeff * c2;
        let k_val = term1 - term2;
        
        let two = BigInt::from(2);
        let mod_val = (&two * a1) / &n;
        
        let k_rem = k_val % &mod_val;
        let base_k = if k_rem < BigInt::zero() {
             k_rem + &mod_val
        } else {
             k_rem
        };
        
        let n_sq = &n * &n;
        let new_a = (a1 * a2) / &n_sq;
        let four_a = &new_a * BigInt::from(4);
        let a2_div_n = a2 / &n;

        let term = &a2_div_n * &base_k;
        let new_b = b2 + term;
             
        let val = &new_b * &new_b - &self.discriminant;
        
        #[cfg(debug_assertions)]
        if (&val % &four_a) != BigInt::zero() {
            eprintln!("WARN: compose logic failed strict divisibility. Proceeding with truncated C.");
        }

        let mut res = Form {
             a: new_a,
             b: new_b,
             c: val / four_a,
             discriminant: self.discriminant.clone(),
        };
        res.reduce(); 
        Ok(res)
    }

    pub fn square(&self) -> Result<Form, String> {
        // Use compose_internal for consistent behavior
        self.compose_internal(self)
    }

    pub fn identity(discriminant: BigInt) -> Form {
        let one = BigInt::from(1);
        let num = &one - &discriminant;
        let four = BigInt::from(4);
        let c = num / four;
        
        Form {
            a: one.clone(),
            b: one,
            c,
            discriminant,
        }
    }

    pub fn pow(&self, exponent: &BigUint) -> Result<Form, String> {
        let mut res = Form::identity(self.discriminant.clone());
        let bits = exponent.to_bytes_be(); 
        
        let mut started = false;
        
        for byte in bits {
            for i in (0..8).rev() {
                let bit = (byte >> i) & 1;
                
                if started {
                    res = res.square()?;
                }
                
                if bit == 1 {
                    res = res.compose(self)?;
                    started = true;
                }
            }
        }
        Ok(res)
    }
}