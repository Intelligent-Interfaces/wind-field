import { type Complex, complex, complexMagnitudeSq } from "./complex";

/**
 * Quantum state vector holding 2^N complex amplitudes for an N-qubit system.
 * Initialized to the |00...0⟩ basis state by default.
 */
export class StateVector {
  readonly numQubits: number;
  amplitudes: Complex[];

  constructor(numQubits: number) {
    this.numQubits = numQubits;
    this.amplitudes = new Array<Complex>(1 << numQubits);
    this.init();
  }

  /** Reset to |00...0⟩: amplitude 1+0i at index 0, 0+0i elsewhere. */
  init(): void {
    const len = 1 << this.numQubits;
    for (let i = 0; i < len; i++) {
      this.amplitudes[i] = complex(0, 0);
    }
    this.amplitudes[0] = complex(1, 0);
  }

  /** Return the complex amplitude at the given basis state index. */
  get(index: number): Complex {
    return this.amplitudes[index];
  }

  /** Set the complex amplitude at the given basis state index. */
  set(index: number, value: Complex): void {
    this.amplitudes[index] = value;
  }

  /** Return |α_i|² for each basis state. */
  probabilities(): number[] {
    return this.amplitudes.map(complexMagnitudeSq);
  }

  /** Return the sum of all |α_i|² (≈ 1.0 for a normalized state). */
  norm(): number {
    let sum = 0;
    for (const a of this.amplitudes) {
      sum += complexMagnitudeSq(a);
    }
    return sum;
  }
}
