import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { complex } from "./complex";
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
 * Arbitrary: generate a single-qubit gate choice (H, X, Z, or Rz) with a valid target qubit.
 */
function arbSingleGateChoice(
  numQubits: number,
): fc.Arbitrary<{ name: string; gate: GateMatrix; targetQubit: number }> {
  const arbTarget = fc.integer({ min: 0, max: numQubits - 1 });
  return fc.oneof(
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
}

/**
 * **Validates: Requirements 1.3, 1.4**
 *
 * Property 2: Gate Locality
 * For any single-qubit gate, amplitudes not differing in target bit remain unchanged;
 * for CNOT, only pairs with control=1 are modified.
 */
describe("Property 2: Gate Locality", () => {
  it("2a: single-qubit gate only modifies amplitude pairs differing in target bit", () => {
    fc.assert(
      fc.property(
        arbNumQubits.chain((n) =>
          fc.tuple(
            arbNormalizedState(n),
            arbSingleGateChoice(n),
            fc.constant(n),
          ),
        ),
        ([state, gateChoice, numQubits]) => {
          const size = 1 << numQubits;
          const target = gateChoice.targetQubit;
          const gate = gateChoice.gate;

          // Clone amplitudes before gate application
          const before = state.amplitudes.map((a) => ({ re: a.re, im: a.im }));

          applyGate(state, gate, target);

          // For each index, verify the new amplitude is computed from ONLY
          // the old pair (i, i ^ (1 << target)) using the gate matrix.
          // This proves the gate doesn't depend on any other qubit's value.
          for (let i = 0; i < size; i++) {
            const partner = i ^ (1 << target);
            const bitVal = (i >> target) & 1;

            // Determine which is the "0" and "1" member of the pair
            const idx0 = bitVal === 0 ? i : partner;
            const idx1 = bitVal === 0 ? partner : i;
            const a0 = before[idx0]; // old amplitude where target bit = 0
            const a1 = before[idx1]; // old amplitude where target bit = 1

            let expectedRe: number;
            let expectedIm: number;
            if (bitVal === 0) {
              // new[i] = g00 * a0 + g01 * a1
              expectedRe =
                gate.g00.re * a0.re -
                gate.g00.im * a0.im +
                gate.g01.re * a1.re -
                gate.g01.im * a1.im;
              expectedIm =
                gate.g00.re * a0.im +
                gate.g00.im * a0.re +
                gate.g01.re * a1.im +
                gate.g01.im * a1.re;
            } else {
              // new[i] = g10 * a0 + g11 * a1
              expectedRe =
                gate.g10.re * a0.re -
                gate.g10.im * a0.im +
                gate.g11.re * a1.re -
                gate.g11.im * a1.im;
              expectedIm =
                gate.g10.re * a0.im +
                gate.g10.im * a0.re +
                gate.g11.re * a1.im +
                gate.g11.im * a1.re;
            }

            const actual = state.get(i);
            expect(Math.abs(actual.re - expectedRe)).toBeLessThan(TOLERANCE);
            expect(Math.abs(actual.im - expectedIm)).toBeLessThan(TOLERANCE);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it("2b: CNOT only modifies amplitude pairs where control bit is 1", () => {
    fc.assert(
      fc.property(
        fc
          .integer({ min: 2, max: 4 })
          .chain((n) =>
            fc
              .tuple(
                arbNormalizedState(n),
                fc.integer({ min: 0, max: n - 1 }),
                fc.integer({ min: 0, max: n - 1 }),
                fc.constant(n),
              )
              .filter(([_s, control, target]) => control !== target),
          ),
        ([state, control, target, numQubits]) => {
          const size = 1 << numQubits;

          // Clone amplitudes before CNOT
          const before = state.amplitudes.map((a) => ({ re: a.re, im: a.im }));

          applyGate(state, GATES.X, target, control);

          for (let i = 0; i < size; i++) {
            const controlBit = (i >> control) & 1;
            const actual = state.get(i);

            if (controlBit === 0) {
              // Control bit is 0: amplitude must be unchanged
              expect(Math.abs(actual.re - before[i].re)).toBeLessThan(
                TOLERANCE,
              );
              expect(Math.abs(actual.im - before[i].im)).toBeLessThan(
                TOLERANCE,
              );
            } else {
              // Control bit is 1: X gate applied to target, so amplitudes swap
              const swapped = i ^ (1 << target);
              expect(Math.abs(actual.re - before[swapped].re)).toBeLessThan(
                TOLERANCE,
              );
              expect(Math.abs(actual.im - before[swapped].im)).toBeLessThan(
                TOLERANCE,
              );
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
