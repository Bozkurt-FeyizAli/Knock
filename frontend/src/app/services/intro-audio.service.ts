import { Injectable, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IntroAudioService implements OnDestroy {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Static noise nodes
  private staticGain: GainNode | null = null;
  private staticSource: AudioBufferSourceNode | null = null;
  private staticFilter: BiquadFilterNode | null = null;

  // Helicopter drone nodes
  private heliGain: GainNode | null = null;
  private heliOsc: OscillatorNode | null = null;
  private heliLfo: OscillatorNode | null = null;
  private heliLfoGain: GainNode | null = null;

  // Mains hum nodes
  private humGain: GainNode | null = null;
  private humOsc: OscillatorNode | null = null;

  private initContext(): AudioContext {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      this.audioContext = ctx;

      const master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);
      this.masterGain = master;
    }
    return this.audioContext;
  }

  private async resumeContext(): Promise<AudioContext> {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx;
  }

  private createStaticNoise(ctx: AudioContext, master: GainNode) {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();

    this.staticSource = source;
    this.staticFilter = filter;
    this.staticGain = gain;
  }

  private createHelicopter(ctx: AudioContext, master: GainNode) {
    // Main rotor tone
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 45;

    // LFO for thumping amplitude modulation
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 8;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 500; // Frequency deviation amount

    // Main gain that the LFO modulates
    const gain = ctx.createGain();
    gain.gain.value = 0;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(master);

    osc.start();
    lfo.start();

    this.heliOsc = osc;
    this.heliLfo = lfo;
    this.heliLfoGain = lfoGain;
    this.heliGain = gain;
  }

  private createHum(ctx: AudioContext, master: GainNode) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 50;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(master);
    osc.start();

    this.humOsc = osc;
    this.humGain = gain;
  }

  async start() {
    const ctx = await this.resumeContext();
    const master = this.masterGain!;

    if (!this.staticGain) this.createStaticNoise(ctx, master);
    if (!this.heliGain) this.createHelicopter(ctx, master);
    if (!this.humGain) this.createHum(ctx, master);

    const now = ctx.currentTime;

    // Ramp up gains over 3 seconds
    this.staticGain!.gain.setValueAtTime(0, now);
    this.staticGain!.gain.linearRampToValueAtTime(0.6, now + 3);

    this.heliGain!.gain.setValueAtTime(0, now);
    this.heliGain!.gain.linearRampToValueAtTime(0.35, now + 3);

    this.humGain!.gain.setValueAtTime(0, now);
    this.humGain!.gain.linearRampToValueAtTime(0.08, now + 3);
  }

  stop() {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    if (this.staticGain) {
      this.staticGain.gain.cancelScheduledValues(now);
      this.staticGain.gain.setValueAtTime(this.staticGain.gain.value, now);
      this.staticGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    }
    if (this.heliGain) {
      this.heliGain.gain.cancelScheduledValues(now);
      this.heliGain.gain.setValueAtTime(this.heliGain.gain.value, now);
      this.heliGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    }
    if (this.humGain) {
      this.humGain.gain.cancelScheduledValues(now);
      this.humGain.gain.setValueAtTime(this.humGain.gain.value, now);
      this.humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    }
  }

  ngOnDestroy() {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
