import { portfolioConfig } from '../config';
import { ANIMATION_CONFIG } from '../constants';

export class TopLeftInfo {
  private element!: HTMLElement;
  private timeElement!: HTMLElement;
  private muteButton!: HTMLButtonElement;
  private camButton!: HTMLButtonElement;
  private bulbButton!: HTMLButtonElement;
  private muteIcon!: HTMLImageElement;
  private camIcon!: HTMLImageElement;
  private timeInterval?: number;
  private isVisible: boolean = true;
  private isBlinkInProgress: boolean = false;

  constructor() {
    this.createElement();
    this.setupEventListeners();
    this.startClock();
  }

  private createElement(): void {
    this.element = document.createElement('div');
    this.element.className = 'top-left-info';
    
    const baseUrl = import.meta.env.BASE_URL || '/';
    const profile = portfolioConfig.getProfile();
    this.element.innerHTML = `
      <div class="name">${profile.name}</div>
      <div class="title">${profile.title}</div>
      <div class="time-row">
        <div class="time" id="current-time">10:13:08 PM</div>
        <button class="icon-btn" id="mute-btn" title="Toggle sound" aria-label="Toggle sound">
          <img id="mute-icon" src="${baseUrl}icons/volume.png" alt="Volume" width="14" height="14">
        </button>
        <button class="icon-btn" id="cam-btn" title="Toggle Free Cam" aria-label="Toggle Free Cam">
          <img id="cam-icon" src="${baseUrl}icons/cursor.png" alt="Cursor" width="14" height="14">
        </button>
        <button class="icon-btn bulb-btn" id="bulb-btn" title="Show Interactive Objects" aria-label="Highlight interactive objects">
          💡
        </button>
      </div>
    `;

    // Get references to important elements
    this.timeElement = this.element.querySelector('#current-time') as HTMLElement;
    this.muteButton = this.element.querySelector('#mute-btn') as HTMLButtonElement;
    this.camButton = this.element.querySelector('#cam-btn') as HTMLButtonElement;
    this.bulbButton = this.element.querySelector('#bulb-btn') as HTMLButtonElement;
    this.muteIcon = this.element.querySelector('#mute-icon') as HTMLImageElement;
    this.camIcon = this.element.querySelector('#cam-icon') as HTMLImageElement;
  }

  private setupEventListeners(): void {
    this.muteButton.addEventListener('click', this.toggleMute.bind(this));
    this.camButton.addEventListener('click', this.toggleCamera.bind(this));
    this.bulbButton.addEventListener('click', this.triggerBlink.bind(this));
  }

  private toggleMute(): void {
    // Toggle mute functionality - emit custom event for other components to listen
    const baseUrl = import.meta.env.BASE_URL || '/';
    const isMuted = this.muteIcon.src.includes('volume-mute.png');
    this.muteIcon.src = isMuted ? `${baseUrl}icons/volume.png` : `${baseUrl}icons/volume-mute.png`;
    
    const event = new CustomEvent('audio-toggle', { 
      detail: { muted: !isMuted }
    });
    document.dispatchEvent(event);
  }

  private toggleCamera(): void {
    // Toggle camera functionality - emit custom event
    const baseUrl = import.meta.env.BASE_URL || '/';
    const isActive = this.camButton.classList.contains('active');
    this.camButton.classList.toggle('active');
    
    // Toggle the camera icon
    this.camIcon.src = isActive ? `${baseUrl}icons/cursor.png` : `${baseUrl}icons/video-camera.png`;
    
    const event = new CustomEvent('camera-toggle', {
      detail: { freeCam: !isActive }
    });
    document.dispatchEvent(event);
  }

  private triggerBlink(): void {
    // Prevent multiple clicks while animation is in progress
    if (this.isBlinkInProgress) {
      console.log('💡 Blink animation already in progress, ignoring click');
      return;
    }

    // Set flag to prevent multiple triggers
    this.isBlinkInProgress = true;
    
    // Trigger the blink animation - emit custom event
    console.log('💡 Bulb button clicked - triggering blink animation');
    
    // Add visual feedback to show button is disabled
    this.bulbButton.style.opacity = '0.5';
    this.bulbButton.style.cursor = 'not-allowed';
    this.bulbButton.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      this.bulbButton.style.transform = 'scale(1)';
    }, 100);
    
    const event = new CustomEvent('blink-trigger');
    document.dispatchEvent(event);
    
    // Re-enable the button after the blink animation duration
    const blinkDuration = ANIMATION_CONFIG.BLINK_DURATION;
    setTimeout(() => {
      this.isBlinkInProgress = false;
      this.bulbButton.style.opacity = '1';
      this.bulbButton.style.cursor = 'pointer';
      console.log('💡 Blink animation completed, button re-enabled');
    }, blinkDuration + 500); // Add 500ms buffer to ensure animation is fully complete
  }

  private startClock(): void {
    this.updateTime();
    this.timeInterval = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  private updateTime(): void {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
    this.timeElement.textContent = timeString;
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public unmount(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    this.element.remove();
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public show(): void {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.element.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    this.element.style.opacity = '1';
    this.element.style.transform = 'translateX(0)';
    this.element.style.pointerEvents = 'auto';
  }

  public hide(): void {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    this.element.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    this.element.style.opacity = '0';
    this.element.style.transform = 'translateX(-20px)';
    this.element.style.pointerEvents = 'none';
  }

  public isCurrentlyVisible(): boolean {
    return this.isVisible;
  }
}
