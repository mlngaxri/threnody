"use client";

import { useEffect, useRef, useState } from "react";
import type { SoundSignature } from "@/lib/types";
import { describeSignature } from "@/lib/signature";

/**
 * The reconstruction player.
 *
 * The archive stores no audio files. It stores the synthesis recipe, and the
 * sound is rebuilt in the browser with WebAudio at the moment you ask for it.
 * That is a deliberate editorial position as much as a technical one: there is
 * no master tape to mistake for evidence, only a model you are invited to
 * inspect. It also means nothing can 404 and no media has to be shipped.
 *
 * Accessibility, in the order it matters:
 *  - The written description is always present and is not gated behind audio.
 *  - Audio never autoplays. The context is created on the first activation.
 *  - The control is a real button, keyboard operable, with state announced.
 *  - prefers-reduced-motion suppresses the animated meter, not the sound.
 *  - If WebAudio is unavailable the control is replaced by an explanation,
 *    not a dead button.
 */

interface Props {
  signature: SoundSignature;
  title: string;
}

type Status = "idle" | "playing" | "unsupported";

export function ReconstructionPlayer({ signature, title }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener("change", onChange);

    const Ctx =
      typeof window !== "undefined"
        ? (window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined;
    if (!Ctx) setStatus("unsupported");

    return () => {
      query.removeEventListener("change", onChange);
      stopRef.current?.();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      void ctxRef.current?.close().catch(() => undefined);
    };
  }, []);

  function stop() {
    stopRef.current?.();
    stopRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setStatus("idle");
    setProgress(0);
  }

  function play() {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      setStatus("unsupported");
      return;
    }

    // Created lazily on a real user gesture, which is both the correct
    // autoplay-policy behaviour and the correct politeness behaviour.
    const ctx = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;
    void ctx.resume().catch(() => undefined);

    const now = ctx.currentTime;
    const { attack, decay, sustain, release } = signature.envelope;
    const duration = signature.durationSec;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.28, now + Math.max(attack, 0.01));
    master.gain.exponentialRampToValueAtTime(
      Math.max(0.28 * sustain, 0.0001),
      now + Math.max(attack + decay, 0.02),
    );
    master.gain.setValueAtTime(Math.max(0.28 * sustain, 0.0001), now + Math.max(duration - release, 0.03));
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    master.connect(ctx.destination);

    const nodes: Array<AudioScheduledSourceNode> = [];

    // Harmonic partials. Amplitude falls as 1/n, which is the sensible default
    // for a struck or blown body and matches the modelling in signature.ts.
    signature.partials.forEach((partial, index) => {
      const osc = ctx.createOscillator();
      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(signature.baseHz * partial, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime((1 / (index + 1)) * (1 - signature.noise), now);
      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + duration);
      nodes.push(osc);
    });

    // Broadband component, band-limited so it reads as breath or hiss rather
    // than as white noise laid on top.
    if (signature.noise > 0.01) {
      const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(Math.max(signature.baseHz * 1.5, 120), now);
      filter.Q.setValueAtTime(0.8, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(signature.noise * 0.5, now);
      noise.connect(filter).connect(noiseGain).connect(master);
      noise.start(now);
      noise.stop(now + duration);
      nodes.push(noise);
    }

    setStatus("playing");
    setProgress(0);

    const startedAt = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const pct = Math.min(1, elapsed / duration);
      setProgress(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setStatus("idle");
        setProgress(0);
        rafRef.current = null;
      }
    };
    // The meter is a progress readout, not decoration, so it still updates
    // under reduced motion. What reduced motion removes is the moving bar's
    // transition, handled in CSS.
    rafRef.current = requestAnimationFrame(tick);

    stopRef.current = () => {
      for (const node of nodes) {
        try {
          node.stop();
        } catch {
          // Already stopped. Nothing to do.
        }
      }
      try {
        master.disconnect();
      } catch {
        // Context may already be closing.
      }
    };

    window.setTimeout(() => {
      if (stopRef.current) stopRef.current = null;
    }, duration * 1000 + 60);
  }

  const description = describeSignature(signature);

  return (
    <section
      aria-labelledby="reconstruction-heading"
      style={{
        border: "1px solid var(--line-strong)",
        borderLeft: "3px solid var(--grade, var(--accent))",
        background: "var(--bg-raised)",
        padding: "var(--sp-5)",
      }}
    >
      <h2 id="reconstruction-heading" style={{ fontSize: "var(--step-1)" }}>
        Hear the reconstruction
      </h2>

      {status === "unsupported" ? (
        <p style={{ marginBlockStart: "var(--sp-3)", color: "var(--text-muted)" }}>
          This browser does not provide the Web Audio API, so the reconstruction cannot be
          synthesised here. The full written description below carries the same information, and the
          synthesis parameters are published in the entry so the sound can be rebuilt elsewhere.
        </p>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-4)",
              marginBlockStart: "var(--sp-4)",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn btn--primary"
              onClick={status === "playing" ? stop : play}
            >
              {status === "playing" ? "Stop" : "Play reconstruction"}
            </button>

            <span
              aria-hidden="true"
              style={{
                flex: "1 1 12rem",
                height: "0.5rem",
                background: "var(--bg-inset)",
                border: "1px solid var(--line)",
                display: "block",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: "100%",
                  width: `${Math.round(progress * 100)}%`,
                  background: "var(--grade, var(--signal))",
                  transition: reducedMotion ? "none" : "width 80ms linear",
                }}
              />
            </span>

            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--step--2)",
                color: "var(--text-faint)",
              }}
            >
              {signature.durationSec.toFixed(1)}s
            </span>
          </div>

          <p role="status" aria-live="polite" className="visually-hidden">
            {status === "playing"
              ? `Playing the reconstruction of ${title}.`
              : "Reconstruction stopped."}
          </p>

          <p
            style={{
              marginBlockStart: "var(--sp-4)",
              fontSize: "var(--step--1)",
              color: "var(--text-faint)",
            }}
          >
            Synthesised in your browser from the published parameters. Nothing is streamed and no
            audio file exists.
          </p>
        </>
      )}

      <details style={{ marginBlockStart: "var(--sp-4)" }}>
        <summary style={{ cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "var(--step--1)" }}>
          Read the sound instead
        </summary>
        <p style={{ marginBlockStart: "var(--sp-3)", color: "var(--text-muted)" }}>{description}</p>
        <dl
          style={{
            marginBlockStart: "var(--sp-4)",
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "var(--sp-2) var(--sp-4)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--step--2)",
          }}
        >
          <dt style={{ color: "var(--text-faint)" }}>Base frequency</dt>
          <dd>{signature.baseHz} Hz</dd>
          <dt style={{ color: "var(--text-faint)" }}>Partials</dt>
          <dd>{signature.partials.join(", ")}</dd>
          <dt style={{ color: "var(--text-faint)" }}>Envelope</dt>
          <dd>
            attack {signature.envelope.attack}s, decay {signature.envelope.decay}s, sustain{" "}
            {signature.envelope.sustain}, release {signature.envelope.release}s
          </dd>
          <dt style={{ color: "var(--text-faint)" }}>Noise</dt>
          <dd>{Math.round(signature.noise * 100)} percent</dd>
        </dl>
      </details>
    </section>
  );
}
