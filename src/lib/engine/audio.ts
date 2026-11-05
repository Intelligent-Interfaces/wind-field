/**
 * Minimal audio engine wrapping Tone.js.
 * Provides a synth with ADSR control and a simple API for triggering notes.
 */
import * as Tone from "tone";

let synth: Tone.PolySynth | null = null;
let analyser: Tone.Analyser | null = null;
let limiter: Tone.Limiter | null = null;
let started = false;

// Sampler Mode State
let sampleBuffer: Tone.ToneAudioBuffer | null = null;
const activePlayers = new Map<string, Tone.Player>();
let isSamplerMode = false;
let sliceDuration = 0;

const KEY_NOTES = [
  "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
  "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4",
  "G4", "G#4", "A4", "A#4", "B4", "C5", "C#5",
  "D5", "D#5", "E5"
];

export async function ensureAudio(): Promise<void> {
  if (started) return;
  await Tone.start();
  started = true;
}

function getLimiter(): Tone.Limiter {
  if (!limiter) {
    limiter = new Tone.Limiter(-2); // limit at -2dB to prevent master clipping
    limiter.toDestination();
  }
  return limiter;
}

function getAnalyser(): Tone.Analyser {
  if (!analyser) {
    analyser = new Tone.Analyser("waveform", 256);
    analyser.connect(getLimiter());
  }
  return analyser;
}

function getSynth(): Tone.PolySynth {
  if (!synth) {
    synth = new Tone.PolySynth({
      maxPolyphony: 8,
      voice: Tone.Synth,
      options: {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.8 },
      },
    });
    synth.connect(getAnalyser());
  }
  return synth;
}

/** Returns the waveform analyser for visualisation. */
export function getWaveform(): Tone.Analyser {
  return getAnalyser();
}

/** Loads an audio file from ArrayBuffer, decodes it, and enables Sampler mode. */
export async function loadSample(arrayBuffer: ArrayBuffer): Promise<void> {
  await ensureAudio();
  const rawContext = Tone.getContext().rawContext;
  const decodedData = await rawContext.decodeAudioData(arrayBuffer);
  sampleBuffer = new Tone.ToneAudioBuffer(decodedData);
  isSamplerMode = true;
  sliceDuration = sampleBuffer.duration / 24; // 24 keys (F3 to E5)
}

export function playNote(note: string, duration: string = "8n"): void {
  if (isSamplerMode) return; // Ignore synth sequences in sampler mode
  getSynth().triggerAttackRelease(note, duration);
}

export function playNoteOn(note: string): void {
  if (isSamplerMode && sampleBuffer) {
    const sliceIndex = KEY_NOTES.indexOf(note);
    if (sliceIndex !== -1) {
      const player = new Tone.Player(sampleBuffer).connect(getAnalyser());

      // Prevent clipping and clicks
      player.volume.value = -6; // Headroom for polyphony
      player.fadeIn = 0.01;     // 10ms fade in
      player.fadeOut = 0.05;    // 50ms fade out

      const offset = sliceIndex * sliceDuration;
      player.start(undefined, offset, sliceDuration);
      activePlayers.set(note, player);
    }
    return;
  }
  getSynth().triggerAttack(note);
}

export function playNoteOff(note: string): void {
  if (isSamplerMode) {
    const player = activePlayers.get(note);
    if (player) {
      player.stop("+0.05"); // trigger the fadeout
      setTimeout(() => player.dispose(), 100); // safely clean up memory later
      activePlayers.delete(note);
    }
    return;
  }
  getSynth().triggerRelease(note);
}

export function setEnvelope(params: {
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
}): void {
  const s = getSynth();
  s.set({ envelope: params });
}

export function setOscillatorType(
  type: "sine" | "triangle" | "square" | "sawtooth",
): void {
  const s = getSynth();
  s.set({ oscillator: { type } });
}

/** Cancel all scheduled notes and release held voices. */
export function stopAll(): void {
  if (synth) synth.releaseAll();
  Tone.getTransport().stop();
  Tone.getTransport().cancel();

  if (isSamplerMode) {
    activePlayers.forEach((player) => {
      player.stop();
      player.dispose();
    });
    activePlayers.clear();
  }
}
export async function playSequence(
  notes: { note: string; duration: string }[],
  tempo: number = 120,
): Promise<void> {
  await ensureAudio();
  const s = getSynth();
  const interval = 60 / tempo;

  for (let i = 0; i < notes.length; i++) {
    const { note, duration } = notes[i];
    s.triggerAttackRelease(note, duration, Tone.now() + i * interval);
  }
}
