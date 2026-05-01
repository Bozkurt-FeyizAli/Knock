import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-burden-input',
  imports: [FormsModule],
  templateUrl: './burden-input.html',
  styleUrl: './burden-input.css',
})
export class BurdenInput {
  userText: string = '';
  isDropping: boolean = false;
  
  @Output() transmit = new EventEmitter<string>();

  constructor(private audioService: AudioService) {}

  onSubmit() {
    if (this.userText.trim() && !this.isDropping) {
      this.isDropping = true;
      
      // Play clink sound roughly when the badge hits the "bottom"
      setTimeout(() => {
        this.audioService.playClink();
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
