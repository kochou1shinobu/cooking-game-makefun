// Sounds, synthesized with WebAudio at run time: no sound files, nothing to download.
// A short blip when an ingredient lands, a bell when a dish is served, a buzz for a
// mistake, and a soft tick when a ticket is about to walk out.

/** Build the sound player; it stays silent until the player first interacts. */
export function createSound() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
      } catch {
        context = null;
      }
    }
    if (context && context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function tone(frequency, duration, type, gainValue, when = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const start = ctx.currentTime + when;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  function noise(duration, gainValue, cutoff) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const start = ctx.currentTime;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.value = gainValue;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(start);
  }

  return {
    /** The player has sound at all (some browsers block audio before a gesture). */
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    /** An ingredient drops into the bowl. */
    add() { tone(520, 0.09, 'sine', 0.12); tone(780, 0.08, 'sine', 0.08, 0.05); },
    /** The bell: a dish is served. */
    serve() { tone(880, 0.35, 'sine', 0.16); tone(1318, 0.4, 'sine', 0.08, 0.02); },
    /** A wrong ingredient, or a serve that does not match. */
    mistake() { tone(140, 0.18, 'square', 0.07); },
    /** A ticket is nearly out of patience. */
    tick() { tone(1046, 0.06, 'sine', 0.06); },
    /** The shift ends. */
    close() { tone(392, 0.3, 'triangle', 0.12); tone(523, 0.35, 'triangle', 0.12, 0.15); },
    /** Steam and sizzle, for the rush. */
    sizzle() { noise(0.4, 0.05, 4000); },
  };
}
