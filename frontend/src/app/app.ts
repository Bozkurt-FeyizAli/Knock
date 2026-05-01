import { Component, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RadioInterface } from './components/radio-interface/radio-interface';
import { IntroAudioService } from './services/intro-audio.service';

type Phase = 'idle' | 'holding' | 'flashing' | 'radio';

const HOLD_THRESHOLD_MS = 3000;
const FLASH_DURATION_MS = 1500;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RadioInterface],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  phase = signal<Phase>('idle');
  progress = signal<number>(0);
  intensity = signal<number>(0.05);

  @ViewChild('noiseCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private holdStart: number | null = null;
  private rafId: number = 0;
  private drawRafId: number = 0;
  private flashTimer: any = null;
  private imageData: ImageData | null = null;

  constructor(private introAudio: IntroAudioService) {}

  ngAfterViewInit() {
    this.startNoiseCanvas();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.rafId);
    cancelAnimationFrame(this.drawRafId);
    if (this.flashTimer) {
      clearTimeout(this.flashTimer);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' && this.phase() === 'idle') {
      e.preventDefault();
      this.handleStart();
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') {
      this.handleEnd();
    }
  }

  handleStart(e?: PointerEvent) {
    if (e && e.pointerType === 'touch') {
      e.preventDefault();
    }
    if (this.phase() === 'flashing' || this.phase() === 'radio') return;
    
    this.phase.set('holding');
    this.holdStart = Date.now();
    this.introAudio.start();
    this.tick();
  }

  handleEnd() {
    if (this.phase() !== 'holding') return;
    
    cancelAnimationFrame(this.rafId);
    this.holdStart = null;
    this.introAudio.stop();

    if (this.progress() < 1) {
      this.phase.set('idle');
      this.progress.set(0);
      this.intensity.set(0.05);
    }
  }

  resetExperience(e: Event) {
    e.stopPropagation();
    this.phase.set('idle');
    this.progress.set(0);
    this.intensity.set(0.05);
    this.holdStart = null;
    this.introAudio.stop();
    if (this.flashTimer) {
      clearTimeout(this.flashTimer);
      this.flashTimer = null;
    }
    cancelAnimationFrame(this.rafId);
  }

  getShakeClass() {
    const currentPhase = this.phase();
    const prog = this.progress();
    
    if (currentPhase !== 'holding') return '';
    if (prog < 0.33) return 'shake-light';
    if (prog < 0.66) return 'shake-medium';
    return 'shake-heavy';
  }

  private tick() {
    if (this.holdStart === null) return;

    const elapsed = Date.now() - this.holdStart;
    const prog = Math.min(elapsed / HOLD_THRESHOLD_MS, 1);
    
    this.progress.set(prog);
    this.intensity.set(0.05 + prog * 0.95);

    if (prog >= 1) {
      this.phase.set('flashing');
      this.introAudio.stop();
      this.holdStart = null;
      cancelAnimationFrame(this.rafId);

      this.flashTimer = setTimeout(() => {
        this.phase.set('radio');
      }, FLASH_DURATION_MS);
      return;
    }

    this.rafId = requestAnimationFrame(() => this.tick());
  }

  private startNoiseCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const w = Math.floor(window.innerWidth / 3);
    const h = Math.floor(window.innerHeight / 3);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    this.imageData = ctx.createImageData(w, h);

    const draw = () => {
      if (!ctx || !this.imageData) return;
      
      const data = this.imageData.data;
      const wData = w;
      const hData = h;
      
      const isActive = this.phase() !== 'radio';
      const int = isActive ? this.intensity() : 0.05;

      for (let y = 0; y < hData; y += 2) {
        for (let x = 0; x < wData; x += 2) {
          const v = Math.random() * 255;
          const a = Math.random() * int * 255;

          const idx = (y * wData + x) * 4;
          const idx2 = idx + wData * 4;

          data[idx] = v;
          data[idx + 1] = v;
          data[idx + 2] = v;
          data[idx + 3] = a;

          if (x + 1 < wData) {
            data[idx + 4] = v;
            data[idx + 5] = v;
            data[idx + 6] = v;
            data[idx + 7] = a;
          }

          if (y + 1 < hData) {
            if (idx2 < data.length) {
              data[idx2] = v;
              data[idx2 + 1] = v;
              data[idx2 + 2] = v;
              data[idx2 + 3] = a;
            }
            if (x + 1 < wData && idx2 + 4 < data.length) {
              data[idx2 + 4] = v;
              data[idx2 + 5] = v;
              data[idx2 + 6] = v;
              data[idx2 + 7] = a;
            }
          }
        }
      }

      ctx.putImageData(this.imageData, 0, 0);
      this.drawRafId = requestAnimationFrame(draw);
    };

    draw();
  }
}

