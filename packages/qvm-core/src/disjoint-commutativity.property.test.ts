import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { complex } from "./complex";
import { StateVector } from "./state-vector";
import { GATES, createRzGate, applyGate, type GateMatrix } from "./gates";

const TOLERANCE = 1e-10;

/**
 * Arbitrary: generate a number of qubits between 2 and 4.
 * Minimum 2 because we need at least 2 disjoint qubits.
 */
const arbNumQubits = fc.integer({ min: 2, max: 4 });

/**
 * Arbitrary: generate a normalized state vector with the given number of qubits.
 * Generates random complex amplitudes and normalizes them so norm ≈ 1.0.
 */
function arbNormalizedState(numQubits: number): fc.Arbitrary<StateVector> {
  const size = 1 << numQubits;
  return fc
    .array(
      fc.tuple(
        fc.double({ min: -10, max: 10, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -10, max: 10, noNaN: true, noDefaultInfinity: true }),
      ),
      { minLength: size, maxLength: size },
    )
    .filter((amps) => {
      const normSq = amps.reduce((s, [re, im]) => s + re * re + im * im, 0);
      return normSq > 1e-12;
    })
    .map((amps) => {
      const normSq = amps.reduce((s, [re, im]) => s + re * re + im * im, 0);
      const norm = Math.sqrt(normSq);
      const state = new StateVector(numQubits);
      for (let i = 0; i < size; i++) {
        state.set(i, complex(amps[i][0] / norm, amps[i][1] / norm));
      }
      return state;
    });
}

/**
 * A gate descriptor with its name, matrix, target qubit, and optional control qubit.
 */
interface GateDescriptor {
  name: string;
  gate: GateMatrix;
  targetQubit: number;
  controlQubit?: number;
}

/**
 * Returns the set of qubit indices used by a gate descriptor.
 * Single-qubit gates use {targetQubit}, CNOT uses {targetQubit, controlQubit}.
 */
function qubitSet(desc: GateDescriptor): number[] {
  if (desc.controlQubit !== undefined) {
    return [desc.targetQubit, desc.controlQubit];
  }
  return [desc.targetQubit];
}

/**
 * Checks whether two gate descriptors operate on disjoint qubits.
 */
function areDisjoint(a: GateDescriptor, b: GateDescriptor): boolean {
  const setA = qubitSet(a);
  const setB = qubitSet(b);
  return setA.every((q) => !setB.includes(q));
}

/**
 * Clone a StateVector by creating a new one and copying all amplitudes.
 */
function cloneState(state: StateVector): StateVector {
  const copy = new StateVector(state.numQubits);
  const size = 1 << state.numQubits;
  for (let i = 0; i < size; i++) {
    const a = state.get(i);
    copy.set(i, complex(a.re, a.im));
  }
  return copy;
}

/**
 * Arbitrary: generate a gate descriptor (single-qubit or CNOT) for a given number of qubits.
 */
function arbGateDescriptor(numQubits: number): fc.Arbitrary<GateDescriptor> {
  const arbTarget = fc.integer({ min: 0, max: numQubits - 1 });

  const arbSingleQubit: fc.Arbitrary<GateDescriptor> = fc.oneof(
    arbTarget.map((t) => ({ name: "H", gate: GATES.H, targetQubit: t })),
    arbTarget.map((t) => ({ name: "X", gate: GATES.X, targetQubit: t })),
    arbTarget.map((t) => ({ name: "Z", gate: GATES.Z, targetQubit: t })),
    fc
      .tuple(
        arbTarget,
        fc.double({
          min: -2 * Math.PI,
          max: 2 * Math.PI,
          noNaN: true,
          noDefaultInfinity: true,
        }),
      )
      .map(([t, theta]) => ({
        name: `Rz(${theta})`,
        gate: createRzGate(theta),
        targetQubit: t,
      })),
  );

  if (numQubits < 2) {
    return arbSingleQubit;
  }

  const arbCnot: fc.Arbitrary<GateDescriptor> = fc
    .tuple(arbTarget, arbTarget)
    .filter(([c, t]) => c !== t)
    .map(([control, target]) => ({
      name: "CNOT",
      gate: GATES.X,
      targetQubit: target,
      controlQubit: control,
    }));

  return fc.oneof(arbSingleQubit, arbCnot);
}

/**
 * Arbitrary: generate a pair of gate descriptors on disjoint qubits.
 */
function arbDisjointGatePair(
  numQubits: number,
): fc.Arbitrary<[GateDescriptor, GateDescriptor]> {
  return fc
    .tuple(arbGateDescriptor(numQubits), arbGateDescriptor(numQubits))
    .filter(([a, b]) => areDisjoint(a, b));
}

/**
 * **Validates: Requirements 1.6**
 *
 * Property 4: Disjoint Gate Commutativity
 * For any two gates on disjoint qubits, order of application does not affect final state.
 */
describe("Property 4: Disjoint Gate Commutativity", () => {
  it("applying two gates on disjoint qubits in either order produces the same final state", () => {
    fc.assert(
      fc.property(
        arbNumQubits.chain((n) =>
          fc.tuple(
            arbNormalizedState(n),
            arbDisjointGatePair(n),
            fc.constant(n),
          ),
        ),
        ([state, [gateA, gateB], _numQubits]) => {
          // Clone the state into two copies
          const stateAB = cloneState(state);
          const stateBA = cloneState(state);

          // Apply gate A then gate B to copy 1
          applyGate(stateAB, gateA.gate, gateA.targetQubit, gateA.controlQubit);
          applyGate(stateAB, gateB.gate, gateB.targetQubit, gateB.controlQubit);

          // Apply gate B then gate A to copy 2
          applyGate(stateBA, gateB.gate, gateB.targetQubit, gateB.controlQubit);
          applyGate(stateBA, gateA.gate, gateA.targetQubit, gateA.controlQubit);

          // Assert all amplitudes are equal within tolerance
          const size = 1 << state.numQubits;
          for (let i = 0; i < size; i++) {
            const ampAB = stateAB.get(i);
            const ampBA = stateBA.get(i);
            expect(Math.abs(ampAB.re - ampBA.re)).toBeLessThan(TOLERANCE);
            expect(Math.abs(ampAB.im - ampBA.im)).toBeLessThan(TOLERANCE);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
