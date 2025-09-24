export class BootLoader {
  private container!: HTMLDivElement;
  private terminal!: HTMLDivElement;
  private cursor!: HTMLSpanElement;
  private processes: string[] = [
    'Initializing 3D Portfolio System...',
    'POST Memory Test.................................... OK',
    'Loading Three.js Engine v0.160.0................... OK',
    'Checking WebGL 2.0 Support......................... OK',
    'Detecting GPU: ' + (this.getGPUInfo() || 'Unknown Graphics Card'),
    'Setting up Camera System........................... OK',
    'Initializing WebGL Renderer........................ OK',
    'Allocating Frame Buffers........................... OK',
    'Loading HDR Environment Textures.....................',
    'Downloading 3D Model Assets.........................',
    'Processing GLTF Data................................',
    'Decompressing Mesh Geometry......................... OK',
    'Setting up Scene Objects............................ OK',
    'Configuring PBR Materials.......................... OK',
    'Initializing Lighting System....................... OK',
    'Setting up Shadow Maps.............................. OK',
    'Initializing UI Components.......................... OK',
    'Setting up CSS3D Renderer.......................... OK',
    'Configuring Touch Input System..................... OK',
    'Setting up Interaction Manager..................... OK',
    'Calibrating Camera Positions........................ OK',
    'Running System Diagnostics.......................... OK',
    'Portfolio System Ready - All tests passed!'
  ];
  
  private currentProcessIndex: number = 0;
  private isVisible: boolean = false;
  private processInterval: number | null = null;
  private cursorBlinkInterval: number | null = null;

  constructor() {
    this.createBootScreen();
  }

  private createBootScreen(): void {
    // Main container
    this.container = document.createElement('div');
    this.container.className = 'boot-loader';
    
    // Terminal screen
    this.terminal = document.createElement('div');
    this.terminal.className = 'boot-terminal';
    
    // Add boot header
    const header = document.createElement('div');
    header.className = 'boot-header';
    header.innerHTML = `
      <div class="boot-logo">
 ██████  ███████  ██████  ██████  ██████          ██████  ██████  ██       ██████  ███    ███  ██████ 
██    ██ ██      ██      ██   ██ ██   ██         ██   ██ ██   ██ ██      ██    ██ ████  ████ ██    ██
██    ██ ███████ ██      ███████ ██████          ██████  ███████ ██      ██    ██ ██ ████ ██ ██    ██
██    ██      ██ ██      ██   ██ ██   ██         ██      ██   ██ ██      ██    ██ ██  ██  ██ ██    ██
 ██████  ███████  ██████ ██   ██ ██   ██         ██      ██   ██ ███████  ██████  ██      ██  ██████ 
      </div>
      <div class="boot-version">3D Interactive Portfolio System v2.1.0 - Build 20250924</div>
      <div class="boot-copyright">Copyright (c) 2025 Portfolio Technologies Inc.</div>
      <div class="boot-info">Memory: ${navigator.hardwareConcurrency || 4} cores detected | WebGL 2.0 compatible</div>
      <div class="boot-separator">════════════════════════════════════════════════════════════════════════════════</div>
    `;
    
    // Process list container
    const processContainer = document.createElement('div');
    processContainer.className = 'boot-processes';
    
    // Cursor
    this.cursor = document.createElement('span');
    this.cursor.className = 'boot-cursor';
    this.cursor.textContent = '_';
    
    // Assemble the terminal
    this.terminal.appendChild(header);
    this.terminal.appendChild(processContainer);
    this.terminal.appendChild(this.cursor);
    this.container.appendChild(this.terminal);
    
    // Add to DOM but keep hidden initially
    this.container.style.display = 'none';
    document.body.appendChild(this.container);
  }

  show(): void {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.container.style.display = 'flex';
    this.currentProcessIndex = 0;
    
    // Clear any existing processes
    const processContainer = this.terminal.querySelector('.boot-processes')!;
    processContainer.innerHTML = '';
    
    // Start the boot sequence
    this.startBootSequence();
    this.startCursorBlink();
  }

  hide(): void {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    
    // Add final completion message
    this.addProcess('System initialization complete. Welcome!', 'success');
    
    // Wait a bit before hiding
    setTimeout(() => {
      this.container.style.display = 'none';
      this.stopBootSequence();
      this.stopCursorBlink();
    }, 1500);
  }

  private startBootSequence(): void {
    this.processInterval = window.setInterval(() => {
      if (this.currentProcessIndex < this.processes.length) {
        const process = this.processes[this.currentProcessIndex];
        
        // Add different delays for realism
        let delay = 200;
        if (process.includes('Loading')) delay = 600;
        if (process.includes('Downloading')) delay = 800;
        if (process.includes('Processing')) delay = 500;
        
        setTimeout(() => {
          this.addProcess(process);
        }, Math.random() * 200); // Small random delay for more realism
        
        this.currentProcessIndex++;
      }
    }, 400); // Faster boot sequence
  }

  private stopBootSequence(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  private startCursorBlink(): void {
    this.cursorBlinkInterval = window.setInterval(() => {
      this.cursor.style.opacity = this.cursor.style.opacity === '0' ? '1' : '0';
    }, 500);
  }

  private stopCursorBlink(): void {
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
      this.cursorBlinkInterval = null;
    }
  }

  private addProcess(text: string, status: 'loading' | 'success' | 'error' = 'loading'): void {
    const processContainer = this.terminal.querySelector('.boot-processes')!;
    const processLine = document.createElement('div');
    processLine.className = `boot-process ${status}`;
    
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    let statusIndicator = '';
    switch (status) {
      case 'success':
        statusIndicator = '[  OK  ]';
        break;
      case 'error':
        statusIndicator = '[ FAIL ]';
        break;
      default:
        statusIndicator = '[ ... ]';
    }
    
    processLine.innerHTML = `
      <span class="process-timestamp">[${timestamp}]</span>
      <span class="process-status">${statusIndicator}</span>
      <span class="process-text">${text}</span>
    `;
    
    processContainer.appendChild(processLine);
    
    // Auto-scroll to bottom
    processContainer.scrollTop = processContainer.scrollHeight;
    
    // Mark as OK after a delay for loading processes
    if (status === 'loading' && !text.includes('Downloading') && !text.includes('Processing')) {
      setTimeout(() => {
        const statusSpan = processLine.querySelector('.process-status') as HTMLSpanElement;
        if (statusSpan) {
          statusSpan.textContent = '[  OK  ]';
          processLine.classList.remove('loading');
          processLine.classList.add('success');
        }
      }, Math.random() * 1000 + 500);
    }
  }

  // Method to update progress for specific long-running processes
  updateProgress(processName: string, status: 'success' | 'error' = 'success'): void {
    const processes = this.terminal.querySelectorAll('.boot-process');
    processes.forEach(process => {
      const textSpan = process.querySelector('.process-text') as HTMLSpanElement;
      if (textSpan && textSpan.textContent?.includes(processName)) {
        const statusSpan = process.querySelector('.process-status') as HTMLSpanElement;
        if (statusSpan) {
          statusSpan.textContent = status === 'success' ? '[  OK  ]' : '[ FAIL ]';
          process.classList.remove('loading');
          process.classList.add(status);
        }
      }
    });
  }

  // Method to add a progress bar for downloads
  addProgressBar(processName: string, progress: number): void {
    const processes = this.terminal.querySelectorAll('.boot-process');
    processes.forEach(process => {
      const textSpan = process.querySelector('.process-text') as HTMLSpanElement;
      if (textSpan && textSpan.textContent?.includes(processName)) {
        const progressBar = this.createProgressBar(progress);
        if (!process.querySelector('.progress-bar')) {
          textSpan.innerHTML += `<br><div class="progress-bar">${progressBar}</div>`;
        } else {
          const existingBar = process.querySelector('.progress-bar') as HTMLDivElement;
          existingBar.innerHTML = progressBar;
        }
      }
    });
  }

  private createProgressBar(progress: number): string {
    const totalChars = 50;
    const filledChars = Math.floor((progress / 100) * totalChars);
    const emptyChars = totalChars - filledChars;
    const filled = '█'.repeat(filledChars);
    const empty = '░'.repeat(emptyChars);
    return `[${filled}${empty}] ${progress.toFixed(1)}%`;
  }

  private getGPUInfo(): string | null {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          return renderer ? renderer.substring(0, 40) : null;
        }
      }
    } catch (e) {
      // Silently fail
    }
    return null;
  }

  destroy(): void {
    this.stopBootSequence();
    this.stopCursorBlink();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
