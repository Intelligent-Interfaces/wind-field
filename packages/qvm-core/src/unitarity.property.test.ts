import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { complex, type Complex } from "./complex";
import { StateVector } from "./state-vector";
import { GATES, createRzGate, applyGate, type GateMatrix } from "./gates";

const TOLERANCE = 1e-10;

/**
 * Arbitrary: generate a number of qubits between 1 and 4.
 */
const arbNumQubits = fc.integer({ min: 1, max: 4 });

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
      return normSq > 1e-12; // reject zero vectors
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
 * Gate descriptor: a gate matrix plus optional control qubit info.
 */
interface GateChoice {
  name: string;
  gate: GateMatrix;
  targetQubit: number;
  controlQubit?: number;
}

/**
 * Arbitrary: generate a gate choice (H, X, Z, Rz, or CNOT) with valid qubit indices.
 */
function arbGateChoice(numQubits: number): fc.Arbitrary<GateChoice> {
  const arbTarget = fc.integer({ min: 0, max: numQubits - 1 });

  const arbSingleQubitGate = fc.oneof(
    // H gate
    arbTarget.map((t) => ({ name: "H", gate: GATES.H, targetQubit: t })),
    // X gate
    arbTarget.map((t) => ({ name: "X", gate: GATES.X, targetQubit: t })),
    // Z gate
    arbTarget.map((t) => ({ name: "Z", gate: GATES.Z, targetQubit: t })),
    // Rz gate with arbitrary angle
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
    return arbSingleQubitGate;
  }

  // CNOT needs control ≠ target and at least 2 qubits
  const arbCnot = fc
    .tuple(arbTarget, arbTarget)
    .filter(([c, t]) => c !== t)
    .map(([control, target]) => ({
      name: "CNOT",
      gate: GATES.X,
      targetQubit: target,
      controlQubit: control,
    }));

  return fc.oneof(arbSingleQubitGate, arbCnot);
}

/**
 * **Validates: Requirements 1.2**
 *
 * Property 1: Unitarity Preservation
 * For any state vector and any gate applied to any valid target qubit,
 * norm(state) after ≈ norm(state) before (tolerance 1e-10).
 */
describe("Property 1: Unitarity Preservation", () => {
  it("norm is preserved after applying any gate to any valid qubit", () => {
    fc.assert(
      fc.property(
        arbNumQubits.chain((n) =>
          fc.tuple(arbNormalizedState(n), arbGateChoice(n), fc.constant(n)),
        ),
        ([state, gateChoice, _numQubits]) => {
          const normBefore = state.norm();

          applyGate(
            state,
            gateChoice.gate,
            gateChoice.targetQubit,
            gateChoice.controlQubit,
          );

          const normAfter = state.norm();

          expect(Math.abs(normAfter - normBefore)).toBeLessThan(TOLERANCE);
        },
      ),
      { numRuns: 200 },
    );
  });
});
