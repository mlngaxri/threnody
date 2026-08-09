/**
 * Deterministic visual synthesis from a SoundSignature.
 *
 * Every entry in the archive carries a synthesis recipe rather than an audio
 * file. That recipe is enough to draw the sound as well as play it, which means
 * the archive can render a truthful, entry-specific waveform and spectrogram
 * with no image assets, no network requests and no placeholder graphics.
 *
 * The functions here are pure and deterministic: the same signature always
 * yields the same geometry, so server and client render identically and there
 * is no hydration mismatch. No framework imports, so this stays unit-testable
 * under plain Node.
 */

import type { SoundSignature } from "./types.ts";

/** Amplitude of the ADSR envelope at normalised time t within 0..1. */
export function envelopeAt(sig: SoundSignature, t: number): number {
  const { attack, decay, sustain, release } = sig.envelope;
  const total = Math.max(attack + decay + release, 0.0001);
  // Scale the envelope's absolute seconds onto the 0..1 axis, giving the
  // sustain whatever room is left over.
  const span = Math.max(sig.durationSec, total);
  const a = attack / span;
  const d = decay / span;
  const r = release / span;
  const sustainEnd = Math.max(a + d, 1 - r);

  if (t <= 0) return 0;
  if (t < a) return t / Math.max(a, 1e-6);
  if (t < a + d) {
    const k = (t - a) / Math.max(d, 1e-6);
    return 1 - k * (1 - sustain);
  }
  if (t < sustainEnd) return sustain;
  if (t < 1) {
    const k = (t - sustainEnd) / Math.max(1 - sustainEnd, 1e-6);
    return sustain * (1 - k);
  }
  return 0;
}

/**
 * A small deterministic PRNG. Math.random cannot be used: the server and the
 * client must produce byte-identical markup.
 */
function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable integer seed derived from a string, so each entry looks like itself. */
export function seedFrom(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Instantaneous sample of the modelled waveform at normalised time t. */
export function sampleAt(sig: SoundSignature, t: number, rnd: () => number): number {
  let value = 0;
  let weight = 0;
  for (let i = 0; i < sig.partials.length; i += 1) {
    const partial = sig.partials[i] ?? 1;
    const amp = 1 / (i + 1);
    value += Math.sin(2 * Math.PI * partial * t * 8) * amp;
    weight += amp;
  }
  const tone = weight > 0 ? value / weight : 0;
  const noise = (rnd() * 2 - 1) * sig.noise;
  return (tone * (1 - sig.noise) + noise) * envelopeAt(sig, t);
}

/**
 * SVG path data for the waveform, mirrored about the centre line so it reads
 * as an oscillogram rather than a line chart.
 */
export function waveformPath(
  sig: SoundSignature,
  seed: string,
  width = 1000,
  height = 200,
  samples = 260,
): string {
  const rnd = mulberry(seedFrom(seed));
  const mid = height / 2;
  const top: string[] = [];
  const bottom: string[] = [];

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const v = sampleAt(sig, t, rnd);
    const x = (t * width).toFixed(2);
    const yTop = (mid - v * mid * 0.94).toFixed(2);
    const yBottom = (mid + v * mid * 0.94).toFixed(2);
    top.push(`${i === 0 ? "M" : "L"}${x} ${yTop}`);
    bottom.push(`L${x} ${yBottom}`);
  }

  return `${top.join(" ")} ${bottom.reverse().join(" ")} Z`;
}

export interface SpectrogramCell {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Normalised intensity 0..1, mapped to opacity by the renderer. */
  v: number;
}

/**
 * A coarse spectrogram: time on x, partial index on y, energy as opacity.
 * Resolution is kept deliberately low so the whole thing is a few hundred
 * rects rather than a canvas, which keeps it in the DOM, zoomable, printable
 * and inspectable, and costs nothing on a mid-range phone.
 */
export function spectrogram(
  sig: SoundSignature,
  seed: string,
  cols = 48,
  rows = 14,
): SpectrogramCell[] {
  const rnd = mulberry(seedFrom(`${seed}:spec`));
  const cells: SpectrogramCell[] = [];
  const w = 100 / cols;
  const h = 100 / rows;

  for (let c = 0; c < cols; c += 1) {
    const t = c / (cols - 1);
    const env = envelopeAt(sig, t);
    for (let r = 0; r < rows; r += 1) {
      // Row 0 is the top of the image, which is the highest partial.
      const partialIndex = rows - 1 - r;
      const partial = sig.partials[partialIndex % sig.partials.length] ?? 1;
      const rolloff = 1 / (1 + partialIndex * 0.55);
      const noiseFloor = sig.noise * rnd() * 0.7;
      const harmonic = rolloff * (0.65 + 0.35 * Math.sin(partial * (t * 6 + partialIndex)));
      const v = Math.max(0, Math.min(1, env * (harmonic * (1 - sig.noise) + noiseFloor)));
      if (v > 0.03) {
        cells.push({
          x: Number((c * w).toFixed(3)),
          y: Number((r * h).toFixed(3)),
          w: Number(w.toFixed(3)),
          h: Number(h.toFixed(3)),
          v: Number(v.toFixed(3)),
        });
      }
    }
  }

  return cells;
}

/**
 * A plain-language description of the signature for screen readers and for
 * anyone who cannot or does not want to play audio. This is the accessible
 * alternative to the sound itself, not a caption on a picture.
 */
export function describeSignature(sig: SoundSignature): string {
  const partials = sig.partials.length;
  const noisePct = Math.round(sig.noise * 100);
  const shape =
    sig.envelope.attack < 0.05
      ? "an abrupt onset"
      : sig.envelope.attack < 0.3
        ? "a quick onset"
        : "a slow swell";
  return `${sig.description} Modelled at ${sig.baseHz} hertz with ${partials} partials, ${noisePct} percent broadband noise, ${shape}, lasting ${sig.durationSec} seconds.`;
}
