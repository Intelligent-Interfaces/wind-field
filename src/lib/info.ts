export interface ControlInfo {
  title: string;
  body: string;
}

type SynthMode = "quantum" | "chemistry" | "ecology";

const KNOB_INFO: Record<
  SynthMode,
  [ControlInfo, ControlInfo, ControlInfo, ControlInfo]
> = {
  quantum: [
    {
      title: "θ₁ — Rotation Gate",
      body: "Sets the rotation angle for qubit 0. Sweeping this changes the superposition probability of the first qubit, shifting which notes appear most often in the generated melody.",
    },
    {
      title: "θ₂ — Rotation Gate",
      body: "Controls qubit 1's rotation. Combined with θ₁ and the CNOT entanglement, this shapes the interference pattern across all quantum states.",
    },
    {
      title: "θ₃ — Rotation Gate",
      body: "Controls qubit 2's rotation. The three rotation knobs together define the full quantum circuit state — small changes can produce dramatically different probability distributions.",
    },
    {
      title: "Seq — Sequence Length",
      body: "Determines how many notes the quantum melody generator produces when you hit play. Higher values create longer phrases drawn from the circuit's probability distribution.",
    },
  ],
  chemistry: [
    {
      title: "Tempo",
      body: "Controls the playback speed of the amino acid melody. Higher values produce a faster, more energetic reading of the protein sequence.",
    },
    {
      title: "Scale",
      body: "Shifts the pitch mapping of amino acids. Adjusting this transposes the entire sequence, letting you explore different harmonic registers of the same molecular data.",
    },
    {
      title: "Octave",
      body: "Sets the base octave for the amino acid note mapping. Lower values give a deeper, more resonant tone; higher values produce a brighter, airier sound.",
    },
    {
      title: "Timbre",
      body: "Shapes the tonal character of the synthesized sound. Sweep from pure sine-like tones toward richer, more complex timbres.",
    },
  ],
  ecology: [
    {
      title: "Low",
      body: "Controls the low-frequency band of the ecological sonification. Represents slow, large-scale environmental cycles — think seasonal or tidal rhythms.",
    },
    {
      title: "Mid",
      body: "Controls the mid-frequency band. Maps to medium-timescale ecological patterns such as population fluctuations or weather cycles.",
    },
    {
      title: "High",
      body: "Controls the high-frequency band. Represents rapid, fine-grained environmental signals — individual organism activity or short-term climate variation.",
    },
    {
      title: "Gain",
      body: "Overall output level for the ecology mode. Balances the mix of all three frequency bands into the final audio signal.",
    },
  ],
};

export function getKnobInfo(
  index: 0 | 1 | 2 | 3,
  mode: SynthMode,
): ControlInfo {
  return KNOB_INFO[mode][index];
}

export const INFO: Record<string, ControlInfo> = {
  play: {
    title: "Play",
    body: "Runs the quantum circuit and generates a melody from the resulting probability distribution. Each note is sampled from the qubit measurement outcomes.",
  },
  record: {
    title: "Record",
    body: "Arms the recorder. In a future update this will capture your performance as a quantum state sequence.",
  },
  stop: {
    title: "Stop",
    body: "Halts playback of the current sequence.",
  },
  modeQuantum: {
    title: "Quantum Mode ⚛",
    body: "Uses a 3-qubit circuit with Hadamard gates and CNOT entanglement to generate music. The knobs control rotation angles (θ) that determine the probability of each quantum state.",
  },
  modeChemistry: {
    title: "Chemistry Mode ⬡",
    body: "Maps amino acid sequences to musical notes. Each letter in a protein sequence (e.g. ARNDCQ…) is translated to a pitch, turning molecular biology into melody.",
  },
  modeEcology: {
    title: "Ecology Mode ◉",
    body: "Sonifies ecological data patterns. The knobs control low, mid, and high frequency bands, letting you sculpt the timbral texture of the generated sound.",
  },
  octaveDown: {
    title: "Octave Down",
    body: "Shifts the keyboard and generated melodies down one octave. Range is 1–7.",
  },
  octaveUp: {
    title: "Octave Up",
    body: "Shifts the keyboard and generated melodies up one octave. Range is 1–7.",
  },
  pianoKeys: {
    title: "Piano Keys",
    body: "Play notes directly by clicking or using your keyboard (A–L for white keys, W/E/R/T/Y/U/I/O/P for black keys). Notes feed into the active synthesis mode.",
  },
  drumPads: {
    title: "Drum Pads",
    body: "The top row of the keyboard area. Each pad triggers a chromatic note (sharps/flats). Useful for percussive hits or chromatic passages.",
  },
  display: {
    title: "Quantum Display",
    body: "Shows the probability distribution of all 8 quantum states (|000⟩ to |111⟩). Taller bars mean that state — and its corresponding note — is more likely to be played.",
  },
  speaker: {
    title: "Speaker Grille",
    body: "Purely decorative — a faithful recreation of the OP-1 Field's elliptical speaker grille. The actual audio comes through your device's speakers.",
  },
  shift: {
    title: "Shift",
    body: "Modifier key for secondary functions. Currently reserved for future feature expansion.",
  },
  com: {
    title: "COM",
    body: "Communication port — reserved for future MIDI or OSC connectivity features.",
  },
  brandLabel: {
    title: "Q·SYNTH",
    body: "Click to open the frame theme picker and change the color of the OP-1 body, buttons, and keys.",
  },
  bgButton: {
    title: "Background",
    body: "Opens the background picker. Choose from 10 generative gradient scenes.",
  },
  btn1: {
    title: "1",
    body: "Pattern slot 1 — reserved for future step sequencer functionality.",
  },
  btn2: {
    title: "2",
    body: "Pattern slot 2 — reserved for future step sequencer functionality.",
  },
  btn3: {
    title: "3",
    body: "Pattern slot 3 — reserved for future step sequencer functionality.",
  },
  btn4: {
    title: "4",
    body: "Pattern slot 4 — reserved for future step sequencer functionality.",
  },
  btn5: {
    title: "5",
    body: "Pattern slot 5 — reserved for future step sequencer functionality.",
  },
  btn6: {
    title: "6",
    body: "Pattern slot 6 — reserved for future step sequencer functionality.",
  },
  btn7: {
    title: "7",
    body: "Pattern slot 7 — reserved for future step sequencer functionality.",
  },
  btn8: {
    title: "8",
    body: "Pattern slot 8 — reserved for future step sequencer functionality.",
  },
  btnIn: {
    title: "IN",
    body: "Audio/MIDI input routing — reserved for future connectivity.",
  },
  btnOut: {
    title: "OUT",
    body: "Audio/MIDI output routing — reserved for future connectivity.",
  },
  btnT1: {
    title: "T1 — Track 1",
    body: "Active track slot. In a future update, tracks will hold independent quantum circuit configurations you can switch between live.",
  },
  btnT2: {
    title: "T2 — Track 2",
    body: "Track slot 2 — reserved for future multi-track sequencing.",
  },
  btnT3: {
    title: "T3 — Track 3",
    body: "Track slot 3 — reserved for future multi-track sequencing.",
  },
  btnT4: {
    title: "T4 — Track 4",
    body: "Track slot 4 — reserved for future multi-track sequencing.",
  },
  btnNote: {
    title: "♩ — Note Length",
    body: "Reserved for future note duration control. Will let you set the default length of triggered notes.",
  },
};
