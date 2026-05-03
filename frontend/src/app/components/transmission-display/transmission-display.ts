import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-transmission-display',
  imports: [],
  templateUrl: './transmission-display.html',
  styleUrl: './transmission-display.css'
})
export class TransmissionDisplay implements OnChanges {
  @Input() text: string = '';
  @Input() isLoading: boolean = false;
  @Input() error: string = '';
  @Input() imageBase64: string = '';
  @Input() detectedSentiment: string = '';
  
  displayedText: string = '';
  private typingInterval: any;

  constructor(private audioService: AudioService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['text'] && this.text) {
      this.typeWriterEffect(this.text);
    }
    if (changes['isLoading'] && this.isLoading) {
      this.displayedText = '';
      clearInterval(this.typingInterval);
    }
  }

  typeWriterEffect(fullText: string) {
    this.displayedText = '';
    clearInterval(this.typingInterval);
    
    let i = 0;
    this.typingInterval = setInterval(() => {
      if (i < fullText.length) {
        this.displayedText += fullText.charAt(i);
        i++;
      } else {
        clearInterval(this.typingInterval);
      }
    }, 50); // Speed of typing
  }
}
