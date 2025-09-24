import { portfolioConfig } from '../config';

export class PDFOverlay {
  private overlayElement!: HTMLElement;
  private fullscreenElement!: HTMLElement;

  constructor() {
    this.createElements();
    this.setupEventListeners();
  }

  private createElements(): void {
    // Regular modal overlay
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'overlay';
    this.overlayElement.id = 'pdf-overlay';
    this.overlayElement.setAttribute('role', 'dialog');
    this.overlayElement.setAttribute('aria-modal', 'true');
    this.overlayElement.setAttribute('aria-label', 'Résumé Viewer');

    this.overlayElement.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <strong>Résumé</strong>
          <button class="close-btn" data-close="pdf">Esc / Close</button>
        </div>
        <div class="modal-body" id="pdf-container"></div>
      </div>
    `;

    // Fullscreen overlay
    this.fullscreenElement = document.createElement('div');
    this.fullscreenElement.className = 'pdf-overlay';
    this.fullscreenElement.id = 'pdf-fullscreen';
    this.fullscreenElement.setAttribute('role', 'dialog');
    this.fullscreenElement.setAttribute('aria-modal', 'true');
    this.fullscreenElement.setAttribute('aria-label', 'CV Viewer');

    this.fullscreenElement.innerHTML = `
      <button class="pdf-close-btn" data-close="pdf-fullscreen" aria-label="Close PDF">×</button>
      <button class="pdf-download-btn" data-download="pdf" aria-label="Download CV">
        📄 Download CV
      </button>
      <div class="pdf-container" id="pdf-fullscreen-container"></div>
    `;
  }

  private setupEventListeners(): void {
    // Close button for modal
    const modalCloseBtn = this.overlayElement.querySelector('[data-close="pdf"]') as HTMLButtonElement;
    modalCloseBtn?.addEventListener('click', () => this.closeModal());

    // Close button for fullscreen
    const fullscreenCloseBtn = this.fullscreenElement.querySelector('[data-close="pdf-fullscreen"]') as HTMLButtonElement;
    fullscreenCloseBtn?.addEventListener('click', () => this.closeFullscreen());

    // Download button
    const downloadBtn = this.fullscreenElement.querySelector('[data-download="pdf"]') as HTMLButtonElement;
    downloadBtn?.addEventListener('click', () => this.downloadPDF());

    // Close on overlay click (but not on modal content)
    this.overlayElement.addEventListener('click', (e) => {
      if (e.target === this.overlayElement) {
        this.closeModal();
      }
    });

    this.fullscreenElement.addEventListener('click', (e) => {
      if (e.target === this.fullscreenElement) {
        this.closeFullscreen();
      }
    });

    // ESC key handling
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeFullscreen();
      }
    });
  }

  public showModal(): void {
    this.overlayElement.classList.add('visible');
    // Load PDF in modal container
    this.loadPDF('pdf-container');
  }

  public closeModal(): void {
    this.overlayElement.classList.remove('visible');
  }

  public showFullscreen(): void {
    this.fullscreenElement.classList.add('visible');
    // Load PDF in fullscreen container
    this.loadPDF('pdf-fullscreen-container');
  }

  public closeFullscreen(): void {
    this.fullscreenElement.classList.remove('visible');
  }

  private loadPDF(containerId: string): void {
    const container = document.getElementById(containerId);
    if (container) {
      // Clear existing content
      container.innerHTML = '';
      
      // Create iframe for PDF
      const iframe = document.createElement('iframe');
      iframe.src = portfolioConfig.getCVPath();
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      
      container.appendChild(iframe);
    }
  }

  private downloadPDF(): void {
    const link = document.createElement('a');
    link.href = portfolioConfig.getCVPath();
    link.download = portfolioConfig.getCVDownloadName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.overlayElement);
    parent.appendChild(this.fullscreenElement);
  }

  public unmount(): void {
    this.overlayElement.remove();
    this.fullscreenElement.remove();
  }

  public getModalElement(): HTMLElement {
    return this.overlayElement;
  }

  public getFullscreenElement(): HTMLElement {
    return this.fullscreenElement;
  }
}
