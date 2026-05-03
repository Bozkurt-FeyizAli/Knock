import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-burden-input',
  imports: [FormsModule, CommonModule],
  templateUrl: './burden-input.html',
  styleUrl: './burden-input.css',
})
export class BurdenInput {
  userText: string = '';
  isDropping: boolean = false;
  signalSentFlash: boolean = false;
  
  @Output() transmit = new EventEmitter<string>();

  constructor(private audioService: AudioService) {}

  onSubmit() {
    if (this.userText.trim() && !this.isDropping) {
      this.isDropping = true;
      
      // Dramatic badge drop sound at impact moment
      setTimeout(() => {
        this.audioService.playBadgeDrop();
        // "Signal sent" flash
        this.signalSentFlash = true;
        setTimeout(() => this.signalSentFlash = false, 1200);
      }, 500);

      // Wait for animation to finish before transmitting and resetting
      setTimeout(() => {
        this.transmit.emit(this.userText);
        this.userText = '';
        this.isDropping = false;
      }, 1000);
    }
  }
}
