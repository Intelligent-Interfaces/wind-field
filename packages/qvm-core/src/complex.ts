/**
 * Complex number type and arithmetic utilities for quantum state vector operations.
 * Used by the gate application algorithm and measurement engine throughout QVM core.
 */

/** A complex number with real and imaginary parts. */
export interface Complex {
  re: number;
  im: number;
}

/** Create a complex number. */
export function complex(re: number, im: number): Complex {
  return { re, im };
}

/** Add two complex numbers: (a + b). */
export function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

/** Multiply two complex numbers: (a.re*b.re - a.im*b.im) + (a.re*b.im + a.im*b.re)i */
export function complexMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

/** Return the squared magnitude |a|² = a.re² + a.im². */
export function complexMagnitudeSq(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}
