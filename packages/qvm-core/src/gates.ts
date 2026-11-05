import { type Complex, complex, complexAdd, complexMul } from "./complex";
import { StateVector } from "./state-vector";

/**
 * A 2×2 complex matrix representing a single-qubit quantum gate.
 * Matrix layout: [[g00, g01], [g10, g11]]
 */
export interface GateMatrix {
  g00: Complex;
  g01: Complex;
  g10: Complex;
  g11: Complex;
}

const SQRT2_INV = 1 / Math.sqrt(2);

/** Standard gate matrices matching the SystemVerilog qgate.sv definitions. */
export const GATES = {
  /** Hadamard gate: 1/√2 * [[1, 1], [1, -1]] */
  H: {
    g00: complex(SQRT2_INV, 0),
    g01: complex(SQRT2_INV, 0),
    g10: complex(SQRT2_INV, 0),
    g11: complex(-SQRT2_INV, 0),
  } as GateMatrix,

  /** Pauli-X (NOT) gate: [[0, 1], [1, 0]] */
  X: {
    g00: complex(0, 0),
    g01: complex(1, 0),
    g10: complex(1, 0),
    g11: complex(0, 0),
  } as GateMatrix,

  /** Pauli-Z gate: [[1, 0], [0, -1]] */
  Z: {
    g00: complex(1, 0),
    g01: complex(0, 0),
    g10: complex(0, 0),
    g11: complex(-1, 0),
  } as GateMatrix,
} as const;

/** Create an Rz rotation gate: [[e^(-iθ/2), 0], [0, e^(iθ/2)]] */
export function createRzGate(theta: number): GateMatrix {
  const halfTheta = theta / 2;
  return {
    g00: complex(Math.cos(-halfTheta), Math.sin(-halfTheta)),
    g01: complex(0, 0),
    g10: complex(0, 0),
    g11: complex(Math.cos(halfTheta), Math.sin(halfTheta)),
  };
}

/**
 * Apply a 2×2 unitary gate to the state vector. Direct port of qgate.sv.
 *
 * For single-qubit gates, updates all amplitude pairs differing in the target bit.
 * For CNOT (when controlQubit is provided), applies X only when the control bit is 1.
 */
export function applyGate(
  state: StateVector,
  gate: GateMatrix,
  targetQubit: number,
  controlQubit?: number,
): void {
  const n = state.numQubits;
  const numStates = 1 << n;

  for (let i = 0; i < numStates; i++) {
    // Only process pairs where bit `target` = 0 (to avoid double-processing)
    if ((i >> targetQubit) & 1) continue;

    const j = i | (1 << targetQubit); // j = i with bit `target` flipped to 1

    // For CNOT: skip pairs where control bit = 0
    if (controlQubit !== undefined && !((i >> controlQubit) & 1)) continue;

    const a = state.get(i); // amplitude where target bit = 0
    const b = state.get(j); // amplitude where target bit = 1

    // Complex matrix-vector multiply: [new_a, new_b] = Gate × [a, b]
    const newA = complexAdd(complexMul(gate.g00, a), complexMul(gate.g01, b));
    const newB = complexAdd(complexMul(gate.g10, a), complexMul(gate.g11, b));

    state.set(i, newA);
    state.set(j, newB);
  }
}
