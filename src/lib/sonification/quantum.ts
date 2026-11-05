/**
 * Quantum sonification: maps quantum state vectors to musical output.
 * Uses @qvm/core to run circuits and converts measurement probabilities to notes.
 */
import {
  StateVector,
  GATES,
  createRzGate,
  applyGate,
  complexMagnitudeSq,
} from "@qvm/core";

/** Musical note names for mapping quantum states */
const SCALE_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const CHROMATIC = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export interface QuantumNoteEvent {
  note: string;
  probability: number;
  basisState: number;
  duration: string;
}

export interface CircuitParams {
  numQubits: number;
  /** Rotation angles for Rz gates on each qubit (radians) */
  rotations: number[];
  /** Which qubits get a Hadamard */
  hadamards: boolean[];
  /** CNOT pairs: [control, target] */
  cnots: [number, number][];
}

/** Run a parameterized quantum circuit and return the probability distribution */
export function runCircuit(params: CircuitParams): number[] {
  const sv = new StateVector(params.numQubits);

  // Apply Hadamards
  for (let q = 0; q < params.numQubits; q++) {
    if (params.hadamards[q]) {
      applyGate(sv, GATES.H, q);
    }
  }

  // Apply Rz rotations
  for (let q = 0; q < params.numQubits; q++) {
    if (params.rotations[q] !== 0) {
      applyGate(sv, createRzGate(params.rotations[q]), q);
    }
  }

  // Apply CNOTs
  for (const [control, target] of params.cnots) {
    applyGate(sv, GATES.X, target, control);
  }

  return sv.probabilities();
}

/** Convert a probability distribution into note events */
export function probabilitiesToNotes(
  probs: number[],
  octave: number = 4,
  useChromatic: boolean = false,
): QuantumNoteEvent[] {
  const scale = useChromatic ? CHROMATIC : SCALE_NOTES;
  const events: QuantumNoteEvent[] = [];

  for (let i = 0; i < probs.length; i++) {
    if (probs[i] < 0.001) continue; // skip negligible probabilities
    const noteIndex = i % scale.length;
    const noteOctave = octave + Math.floor(i / scale.length);
    events.push({
      note: `${scale[noteIndex]}${noteOctave}`,
      probability: probs[i],
      basisState: i,
      duration: "8n",
    });
  }

  return events;
}

/** Measure the state vector — collapse to a single basis state using weighted random */
export function measure(probs: number[]): number {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r < cumulative) return i;
  }
  return probs.length - 1;
}

/**
 * Generate a melody by repeatedly running a circuit and measuring.
 * Each measurement collapses to a note. The sequence of measurements = a melody.
 */
export function generateMelody(
  params: CircuitParams,
  length: number = 8,
  octave: number = 4,
): QuantumNoteEvent[] {
  const scale = SCALE_NOTES;
  const melody: QuantumNoteEvent[] = [];

  for (let i = 0; i < length; i++) {
    // Vary the rotation slightly each step for evolving melody
    const stepParams = {
      ...params,
      rotations: params.rotations.map((r) => r + i * 0.1),
    };
    const probs = runCircuit(stepParams);
    const outcome = measure(probs);
    const noteIndex = outcome % scale.length;
    const noteOctave = octave + Math.floor(outcome / scale.length);

    melody.push({
      note: `${scale[noteIndex]}${noteOctave}`,
      probability: probs[outcome],
      basisState: outcome,
      duration: "8n",
    });
  }

  return melody;
}
