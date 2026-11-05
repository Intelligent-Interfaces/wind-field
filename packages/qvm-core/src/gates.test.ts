import { describe, it, expect } from "vitest";
import { complex } from "./complex";
import { StateVector } from "./state-vector";
import { GATES, createRzGate, applyGate } from "./gates";

const TOLERANCE = 1e-10;

function expectClose(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThan(TOLERANCE);
}

describe("GATES", () => {
  describe("H gate — Hadamard", () => {
    it("creates equal superposition from |0⟩", () => {
      const state = new StateVector(1);
      applyGate(state, GATES.H, 0);

      const probs = state.probabilities();
      expectClose(probs[0], 0.5);
      expectClose(probs[1], 0.5);
    });
  });

  describe("X gate — Pauli-X / NOT", () => {
    it("flips |0⟩ to |1⟩", () => {
      const state = new StateVector(1);
      applyGate(state, GATES.X, 0);

      expectClose(state.get(0).re, 0);
      expectClose(state.get(0).im, 0);
      expectClose(state.get(1).re, 1);
      expectClose(state.get(1).im, 0);
    });
  });

  describe("Z gate — Pauli-Z", () => {
    it("adds phase to |1⟩", () => {
      // Put qubit in |1⟩ first
      const state = new StateVector(1);
      applyGate(state, GATES.X, 0); // now |1⟩
      applyGate(state, GATES.Z, 0); // Z|1⟩ = -|1⟩

      expectClose(state.get(0).re, 0);
      expectClose(state.get(0).im, 0);
      expectClose(state.get(1).re, -1);
      expectClose(state.get(1).im, 0);
    });
  });
});

describe("CNOT gate", () => {
  it("entangles two qubits — Bell state creation (H on q0, CNOT q0→q1)", () => {
    const state = new StateVector(2);
    // H on qubit 0: creates (|00⟩ + |10⟩)/√2
    applyGate(state, GATES.H, 0);
    // CNOT with control=0, target=1: creates (|00⟩ + |11⟩)/√2
    applyGate(state, GATES.X, 1, 0);

    const probs = state.probabilities();
    // |00⟩ and |11⟩ each have probability 0.5
    expectClose(probs[0], 0.5); // |00⟩
    expectClose(probs[1], 0); // |01⟩
    expectClose(probs[2], 0); // |10⟩
    expectClose(probs[3], 0.5); // |11⟩
  });
});

describe("Rz gate", () => {
  it("applies correct rotation", () => {
    const state = new StateVector(1);
    // Put in |+⟩ state first
    applyGate(state, GATES.H, 0);

    const theta = Math.PI / 4;
    const rz = createRzGate(theta);
    applyGate(state, rz, 0);

    // Rz preserves probabilities (diagonal gate)
    const probs = state.probabilities();
    expectClose(probs[0], 0.5);
    expectClose(probs[1], 0.5);

    // Verify the phase is applied correctly
    // After H: (|0⟩ + |1⟩)/√2
    // After Rz(π/4): e^(-iπ/8)|0⟩/√2 + e^(iπ/8)|1⟩/√2
    const halfTheta = theta / 2;
    const inv = 1 / Math.sqrt(2);
    expectClose(state.get(0).re, inv * Math.cos(-halfTheta));
    expectClose(state.get(0).im, inv * Math.sin(-halfTheta));
    expectClose(state.get(1).re, inv * Math.cos(halfTheta));
    expectClose(state.get(1).im, inv * Math.sin(halfTheta));
  });
});

describe("norm preservation", () => {
  it("preserves norm after H gate", () => {
    const state = new StateVector(2);
    applyGate(state, GATES.H, 0);
    expectClose(state.norm(), 1.0);
  });

  it("preserves norm after X gate", () => {
    const state = new StateVector(2);
    applyGate(state, GATES.X, 1);
    expectClose(state.norm(), 1.0);
  });

  it("preserves norm after CNOT", () => {
    const state = new StateVector(2);
    applyGate(state, GATES.H, 0);
    applyGate(state, GATES.X, 1, 0);
    expectClose(state.norm(), 1.0);
  });

  it("preserves norm after Rz gate", () => {
    const state = new StateVector(2);
    applyGate(state, GATES.H, 0);
    applyGate(state, createRzGate(Math.PI / 3), 0);
    expectClose(state.norm(), 1.0);
  });
});

describe("Hadamard involution", () => {
  it("H applied twice returns to original state", () => {
    const state = new StateVector(2);
    // Set up a non-trivial state first
    applyGate(state, GATES.H, 0);
    applyGate(state, GATES.X, 1, 0);

    // Save state
    const before = state.amplitudes.map((a) => ({ re: a.re, im: a.im }));

    // Apply H twice on qubit 0
    applyGate(state, GATES.H, 0);
    applyGate(state, GATES.H, 0);

    // Should be back to original
    for (let i = 0; i < before.length; i++) {
      expectClose(state.get(i).re, before[i].re);
      expectClose(state.get(i).im, before[i].im);
    }
  });
});

describe("disjoint gate commutativity", () => {
  it("gates on disjoint qubits commute", () => {
    // Apply H on q0 then X on q1
    const state1 = new StateVector(2);
    applyGate(state1, GATES.H, 0);
    applyGate(state1, GATES.X, 1);

    // Apply X on q1 then H on q0
    const state2 = new StateVector(2);
    applyGate(state2, GATES.X, 1);
    applyGate(state2, GATES.H, 0);

    for (let i = 0; i < state1.amplitudes.length; i++) {
      expectClose(state1.get(i).re, state2.get(i).re);
      expectClose(state1.get(i).im, state2.get(i).im);
    }
  });

  it("Z on q0 and H on q1 commute", () => {
    const state1 = new StateVector(3);
    applyGate(state1, GATES.H, 0);
    applyGate(state1, GATES.Z, 0);
    applyGate(state1, GATES.H, 2);

    const state2 = new StateVector(3);
    applyGate(state2, GATES.H, 0);
    applyGate(state2, GATES.H, 2);
    applyGate(state2, GATES.Z, 0);

    for (let i = 0; i < state1.amplitudes.length; i++) {
      expectClose(state1.get(i).re, state2.get(i).re);
      expectClose(state1.get(i).im, state2.get(i).im);
    }
  });
});
