import { describe, it, expect } from "vitest";
import { StateVector } from "./state-vector";
import { complex } from "./complex";

describe("StateVector", () => {
  describe("constructor and init", () => {
    it("initializes a 1-qubit state to |0⟩", () => {
      const sv = new StateVector(1);
      expect(sv.numQubits).toBe(1);
      expect(sv.amplitudes).toHaveLength(2);
      expect(sv.get(0)).toEqual(complex(1, 0));
      expect(sv.get(1)).toEqual(complex(0, 0));
    });

    it("initializes a 2-qubit state to |00⟩", () => {
      const sv = new StateVector(2);
      expect(sv.amplitudes).toHaveLength(4);
      expect(sv.get(0)).toEqual(complex(1, 0));
      for (let i = 1; i < 4; i++) {
        expect(sv.get(i)).toEqual(complex(0, 0));
      }
    });

    it("initializes a 3-qubit state with 8 amplitudes", () => {
      const sv = new StateVector(3);
      expect(sv.amplitudes).toHaveLength(8);
      expect(sv.get(0)).toEqual(complex(1, 0));
    });
  });

  describe("get and set", () => {
    it("sets and retrieves amplitudes correctly", () => {
      const sv = new StateVector(1);
      const val = complex(0.6, 0.8);
      sv.set(1, val);
      expect(sv.get(1)).toEqual(val);
    });
  });

  describe("init resets state", () => {
    it("resets a modified state back to |00...0⟩", () => {
      const sv = new StateVector(2);
      sv.set(0, complex(0, 0));
      sv.set(3, complex(1, 0));
      sv.init();
      expect(sv.get(0)).toEqual(complex(1, 0));
      expect(sv.get(3)).toEqual(complex(0, 0));
    });
  });

  describe("probabilities", () => {
    it("returns [1, 0] for |0⟩ state", () => {
      const sv = new StateVector(1);
      expect(sv.probabilities()).toEqual([1, 0]);
    });

    it("returns correct probabilities for a superposition", () => {
      const sv = new StateVector(1);
      const inv = 1 / Math.sqrt(2);
      sv.set(0, complex(inv, 0));
      sv.set(1, complex(inv, 0));
      const probs = sv.probabilities();
      expect(probs[0]).toBeCloseTo(0.5);
      expect(probs[1]).toBeCloseTo(0.5);
    });
  });

  describe("norm", () => {
    it("returns 1.0 for the initial |0⟩ state", () => {
      const sv = new StateVector(1);
      expect(sv.norm()).toBeCloseTo(1.0);
    });

    it("returns 1.0 for a normalized superposition", () => {
      const sv = new StateVector(1);
      const inv = 1 / Math.sqrt(2);
      sv.set(0, complex(inv, 0));
      sv.set(1, complex(0, inv));
      expect(sv.norm()).toBeCloseTo(1.0);
    });

    it("returns != 1.0 for an unnormalized state", () => {
      const sv = new StateVector(1);
      sv.set(0, complex(1, 0));
      sv.set(1, complex(1, 0));
      expect(sv.norm()).toBeCloseTo(2.0);
    });
  });
});
