import * as THREE from 'three';

export interface SoundConfig {
  path: string;
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
}

export class SoundManager {
  private listener: any; // THREE.AudioListener
  private loader: any; // THREE.AudioLoader
  private sounds: Map<string, any> = new Map(); // Map<string, THREE.Audio>
  private originalVolumes: Map<string, number> = new Map(); // Store original volumes
  private muted = false;
  private masterVolume = 1.0;
  private audioContext: AudioContext | null = null;

  constructor(camera: any) {
    // Create listener and attach to camera
    this.listener = new (THREE as any).AudioListener();
    camera.add(this.listener);
    
    // Get the audio context from the listener
    this.audioContext = this.listener.context;
    
    // Create audio loader
    this.loader = new (THREE as any).AudioLoader();
  }

  /**
   * Load a sound with the given name and configuration
   */
  async loadSound(name: string, config: SoundConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        config.path,
        (buffer: AudioBuffer) => {
          const sound = new (THREE as any).Audio(this.listener);
          sound.setBuffer(buffer);
          const originalVolume = (config.volume || 1.0) * this.masterVolume;
          sound.setVolume(originalVolume);
          sound.setLoop(config.loop || false);
          
          this.sounds.set(name, sound);
          this.originalVolumes.set(name, originalVolume); // Store original volume
          
          // Extra debugging for ambient sound
          if (name === 'ambient') {
            console.log('🎵 AMBIENT SOUND LOADED:', {
              name: name,
              volume: sound.getVolume(),
              loop: sound.getLoop(),
              hasBuffer: !!sound.buffer,
              bufferDuration: sound.buffer ? sound.buffer.duration : 'no buffer'
            });
          }
          
          // Auto-play if specified
          if (config.autoplay && !this.muted) {
            sound.play();
          }
          
          resolve();
        },
        (progress: any) => {
          // Loading progress
          console.log(`🎵 Loading sound ${name}: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        },
        (error: any) => {
          console.error(`❌ Failed to load sound ${name}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Play a sound by name
   */
  async playSound(name: string): Promise<void> {
    // Try to resume audio context if it's suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('🎵 Audio context resumed');
      } catch (error) {
        console.warn('🎵 Failed to resume audio context:', error);
      }
    }

    const sound = this.sounds.get(name);
    if (sound && !this.muted) {
      // Stop the sound first if it's already playing
      if (sound.isPlaying) {
        sound.stop();
      }
      try {
        sound.play();
        console.log(`🎵 Playing sound: ${name}`);
      } catch (error) {
        console.warn(`🎵 Failed to play sound "${name}":`, error);
      }
    } else if (!sound) {
      console.warn(`🎵 Sound "${name}" not found`);
    }
  }

  /**
   * Stop a sound by name
   */
  stopSound(name: string): void {
    const sound = this.sounds.get(name);
    if (sound && sound.isPlaying) {
      sound.stop();
    }
  }

  /**
   * Pause a sound by name
   */
  pauseSound(name: string): void {
    const sound = this.sounds.get(name);
    if (sound && sound.isPlaying) {
      sound.pause();
    }
  }

  /**
   * Resume a paused sound by name
   */
  resumeSound(name: string): void {
    const sound = this.sounds.get(name);
    if (sound && !sound.isPlaying && !this.muted) {
      sound.play();
    }
  }

  /**
   * Set volume for a specific sound
   */
  setVolume(name: string, volume: number): void {
    const sound = this.sounds.get(name);
    if (sound) {
      const finalVolume = volume * this.masterVolume;
      sound.setVolume(finalVolume);
      this.originalVolumes.set(name, finalVolume); // Update stored original volume
    }
  }

  /**
   * Set master volume for all sounds
   */
  setMasterVolume(volume: number): void {
    const oldMasterVolume = this.masterVolume;
    this.masterVolume = volume;
    
    this.sounds.forEach((sound, name) => {
      // Get the base volume (without master volume applied)
      const originalVolume = this.originalVolumes.get(name) || 1.0;
      const baseVolume = originalVolume / (oldMasterVolume === 0 ? 1 : oldMasterVolume);
      
      // Apply new master volume
      const newVolume = baseVolume * this.masterVolume;
      sound.setVolume(newVolume);
      this.originalVolumes.set(name, newVolume); // Update stored volume
    });
  }

  /**
   * Mute or unmute all sounds
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    this.sounds.forEach((sound, name) => {
      if (muted) {
        sound.setVolume(0);
      } else {
        // Restore original volume
        const originalVolume = this.originalVolumes.get(name) || 1.0;
        sound.setVolume(originalVolume);
      }
    });

    // Handle ambient music specifically
    const ambientMusic = this.sounds.get('ambient');
    if (ambientMusic) {
      if (muted) {
        ambientMusic.pause();
      } else if (!ambientMusic.isPlaying) {
        ambientMusic.play();
      }
    }
  }

  /**
   * Check if sounds are muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Get all loaded sound names
   */
  getSoundNames(): string[] {
    return Array.from(this.sounds.keys());
  }

  /**
   * Check if a sound is playing
   */
  isPlaying(name: string): boolean {
    const sound = this.sounds.get(name);
    return sound ? sound.isPlaying : false;
  }

  /**
   * Unlock audio on user interaction (required for browser autoplay policies)
   */
  async unlockAudio(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('🔓 Audio unlocked after user interaction');
        return;
      } catch (error) {
        console.warn('🎵 Failed to unlock audio:', error);
      }
    }
  }

  /**
   * Force start ambient music with user interaction unlock - AGGRESSIVE APPROACH
   */
  async forceStartAmbient(): Promise<void> {
    console.log('🎵 FORCE STARTING AMBIENT MUSIC');
    
    // Multiple aggressive attempts to start audio
    try {
      // Method 1: Resume audio context first
      if (this.audioContext && this.audioContext.state !== 'running') {
        await this.audioContext.resume();
        console.log('🎵 Audio context resumed successfully');
      }

      // Method 2: Get the ambient sound and force play it
      const ambientSound = this.sounds.get('ambient');
      if (ambientSound) {
        // Stop if already playing
        if (ambientSound.isPlaying) {
          ambientSound.stop();
        }
        
        // Force play the sound
        ambientSound.play();
        console.log('🎵 AMBIENT MUSIC FORCED TO PLAY');
        
        // Verify it's actually playing
        setTimeout(() => {
          if (ambientSound.isPlaying) {
            console.log('🎵 ✅ AMBIENT MUSIC CONFIRMED PLAYING');
          } else {
            console.log('🎵 ❌ AMBIENT MUSIC STILL NOT PLAYING - RETRYING');
            this.retryAmbientStart(ambientSound);
          }
        }, 100);
        
      } else {
        console.error('🎵 ❌ Ambient sound not found in loaded sounds');
      }
      
    } catch (error) {
      console.error('🎵 ❌ Force start failed:', error);
      throw error;
    }
  }

  private retryAmbientStart(sound: any, attempts: number = 0): void {
    if (attempts > 5) {
      console.error('🎵 ❌ FAILED TO START AMBIENT AFTER 5 ATTEMPTS');
      return;
    }

    setTimeout(() => {
      try {
        if (!sound.isPlaying && !this.muted) {
          sound.play();
          console.log(`🎵 Retry attempt ${attempts + 1} - forcing play`);
          
          setTimeout(() => {
            if (!sound.isPlaying) {
              this.retryAmbientStart(sound, attempts + 1);
            } else {
              console.log('🎵 ✅ AMBIENT MUSIC STARTED ON RETRY');
            }
          }, 200);
        }
      } catch (error) {
        console.error(`🎵 Retry ${attempts + 1} failed:`, error);
        this.retryAmbientStart(sound, attempts + 1);
      }
    }, 500);
  }

  /**
   * Dispose of all audio resources
   */
  dispose(): void {
    this.sounds.forEach((sound) => {
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.disconnect();
    });
    this.sounds.clear();
    this.originalVolumes.clear();
  }
}
