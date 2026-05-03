import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  private audioCtx: AudioContext | null = null;
  private crackleNode: AudioBufferSourceNode | null = null;
  private crackleGain: GainNode | null = null;

  // Ambient nodes
  private ambientMaster: GainNode | null = null;
  private ambientNodes: AudioNode[] = [];

  constructor() { }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioCtx;
  }

  playAudio(base64Audio: string): void {
    if (!base64Audio) return;
    try {
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;
      const audio = new Audio(audioUrl);
      audio.play().catch(err => console.error('Audio playback failed:', err));
    } catch (error) {
      console.error('Error creating audio from base64:', error);
    }
  }

  playClink(): void {
    this.playBadgeDrop();
  }

  /** Dramatik rozet düşüş sesi: metalik çarpma + radyo paraziti */
  playBadgeDrop(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // 1) Metalik çarpma — yüksek frekanslı decay
    const clang = ctx.createOscillator();
    const clangGain = ctx.createGain();
    clang.type = 'triangle';
    clang.frequency.setValueAtTime(900, now);
    clang.frequency.exponentialRampToValueAtTime(180, now + 0.6);
    clangGain.gain.setValueAtTime(0.7, now);
    clangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    clang.connect(clangGain);
    clangGain.connect(ctx.destination);
    clang.start(now);
    clang.stop(now + 0.7);

    // 2) Alt uğultu — derin vurgu
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(120, now);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    thudGain.gain.setValueAtTime(0.5, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.35);

    // 3) Radyo geribildirim paraziti (200ms sonra)
    setTimeout(() => {
      const staticBurst = ctx.createBufferSource();
      const bufSize = ctx.sampleRate * 0.25;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
      staticBurst.buffer = buf;

      const burstFilter = ctx.createBiquadFilter();
      burstFilter.type = 'bandpass';
      burstFilter.frequency.value = 1200;
      burstFilter.Q.value = 1.5;

      const burstGain = ctx.createGain();
      burstGain.gain.setValueAtTime(0.3, ctx.currentTime);
      burstGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      staticBurst.connect(burstFilter);
      burstFilter.connect(burstGain);
      burstGain.connect(ctx.destination);
      staticBurst.start();
    }, 200);
  }

  playTypewriterClick(): void {
    const ctx = this.getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100 + Math.random() * 50, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  startCrackle(): void {
    const ctx = this.getAudioContext();
    if (this.crackleNode) return;
    
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    
    this.crackleNode = ctx.createBufferSource();
    this.crackleNode.buffer = buffer;
    this.crackleNode.loop = true;
    
    this.crackleGain = ctx.createGain();
    this.crackleGain.gain.value = 0.05;
    
    // lowpass filter for vinyl warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    this.crackleNode.connect(filter);
    filter.connect(this.crackleGain);
    this.crackleGain.connect(ctx.destination);
    this.crackleNode.start();
  }

  stopCrackle(): void {
    if (this.crackleNode && this.crackleGain) {
      this.crackleGain.gain.exponentialRampToValueAtTime(0.01, this.getAudioContext().currentTime + 0.5);
      setTimeout(() => {
        this.crackleNode?.stop();
        this.crackleNode = null;
      }, 500);
    }
  }

  // ─── Duyguya Göre Ambiyans Sesi ─────────────────────────────────────────────

  playAmbient(sentiment: string): void {
    this.stopAmbient();
    const ctx = this.getAudioContext();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 3);
    master.connect(ctx.destination);
    this.ambientMaster = master;

    if (sentiment === 'NEGATIVE') {
      this._buildNegativeAmbient(ctx, master);
    } else if (sentiment === 'POSITIVE') {
      this._buildPositiveAmbient(ctx, master);
    } else {
      this._buildNeutralAmbient(ctx, master);
    }
  }

  stopAmbient(): void {
    if (!this.ambientMaster || !this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    this.ambientMaster.gain.cancelScheduledValues(now);
    this.ambientMaster.gain.setValueAtTime(this.ambientMaster.gain.value, now);
    this.ambientMaster.gain.linearRampToValueAtTime(0, now + 2);
    setTimeout(() => {
      this.ambientNodes.forEach(n => {
        try { (n as OscillatorNode | AudioBufferSourceNode).stop?.(); } catch {}
      });
      this.ambientNodes = [];
      this.ambientMaster = null;
    }, 2200);
  }

  // NEGATIVE: muffled rumble + filtered wind noise
  private _buildNegativeAmbient(ctx: AudioContext, master: GainNode): void {
    // Dark rumble — very low frequency
    const rumble = ctx.createOscillator();
    rumble.type = 'sawtooth';
    rumble.frequency.value = 38;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.3;
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 120;
    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(master);
    rumble.start();
    this.ambientNodes.push(rumble);

    // Rüzgar — filtrelenmiş beyaz gürültü
    const bufSize = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const wind = ctx.createBufferSource();
    wind.buffer = buf;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 300;
    windFilter.Q.value = 0.8;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.15;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);
    wind.start();
    this.ambientNodes.push(wind);
  }

  // POSITIVE: warm harmonic tones + light shimmer
  private _buildPositiveAmbient(ctx: AudioContext, master: GainNode): void {
    // warm base tone
    const base = ctx.createOscillator();
    base.type = 'sine';
    base.frequency.value = 220; // A3
    const baseGain = ctx.createGain();
    baseGain.gain.value = 0.18;
    base.connect(baseGain);
    baseGain.connect(master);
    base.start();
    this.ambientNodes.push(base);

    // Hafif üst harmonik (5. tam) — sıcak bir akor hissi
    const fifth = ctx.createOscillator();
    fifth.type = 'sine';
    fifth.frequency.value = 330; // E4
    const fifthGain = ctx.createGain();
    fifthGain.gain.value = 0.10;
    fifth.connect(fifthGain);
    fifthGain.connect(master);
    fifth.start();
    this.ambientNodes.push(fifth);

    // Slow breathing LFO tremolo effect
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.25;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain);
    lfoGain.connect(baseGain.gain);
    lfo.start();
    this.ambientNodes.push(lfo);
  }

  // NEUTRAL: existing amber static ambience (very light)
  private _buildNeutralAmbient(ctx: AudioContext, master: GainNode): void {
    const bufSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start();
    this.ambientNodes.push(src);
  }
}
