import { portfolioConfig } from '../config';

export class PDFOverlay {
  private overlayElement!: HTMLElement;
  private fullscreenElement!: HTMLElement;
  private initialized = false;
  private currentUrl = '';
  
  onClose?: () => void;

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
      // Close when clicking anywhere that isn't a canvas or control button
      const target = e.target as HTMLElement;
      const interactive = target.closest('canvas, .pdf-close-btn, .pdf-download-btn');
      if (!interactive) {
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

  public async showFullscreen(): Promise<void> {
    this.currentUrl = portfolioConfig.getCVPath();
    this.fullscreenElement.classList.add('visible');
    await this.ensurePdfjs();
    this.loadPDF('pdf-fullscreen-container');
  }

  public closeFullscreen(): void {
    this.fullscreenElement.classList.remove('visible');
    const container = document.getElementById('pdf-fullscreen-container');
    if (container) {
      container.innerHTML = '';
    }
    
    // Trigger close callback to return to default view
    if (this.onClose) {
      this.onClose();
    }
  }

  private async loadPDF(containerId: string): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const pdfjsLib = (window as any)['pdfjsLib'];
    
    try {
      const loadingTask = pdfjsLib.getDocument(this.currentUrl);
      const pdf = await loadingTask.promise;
      
      // Create viewer container
      const viewer = document.createElement('div');
      viewer.style.width = '100%';
      viewer.style.maxWidth = '900px';
      viewer.style.height = '100%';
      viewer.style.overflow = 'auto';
      viewer.style.display = 'flex';
      viewer.style.flexDirection = 'column';
      viewer.style.alignItems = 'center';
      viewer.style.backgroundColor = '#fff';
      viewer.style.borderRadius = '8px';
      viewer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
      
  // Allow clicks on the viewer background to bubble, but prevent clicks on canvases from closing
      
      container.appendChild(viewer);

      // Calculate scale based on container size
      const containerWidth = Math.min(900, window.innerWidth - 40);
      const scale = containerWidth / 595; // A4 width in points is ~595

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
  const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.margin = pageNum === 1 ? '0' : '20px 0 0 0';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
  // Prevent clicks on the actual PDF canvas from closing the overlay
  canvas.addEventListener('click', (ev) => ev.stopPropagation());
        const context = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        viewer.appendChild(canvas);
        await page.render({ canvasContext: context, viewport }).promise;
      }
    } catch (err) {
      const msg = document.createElement('div');
      msg.style.padding = '40px';
      msg.style.color = '#fff';
      msg.style.textAlign = 'center';
      msg.style.fontSize = '18px';
      msg.textContent = 'Unable to load CV. Please try again later.';
      container.appendChild(msg);
    }
  }

  private async ensurePdfjs(): Promise<void> {
    if (this.initialized) return;
    // Lazy load PDF.js via ESM import from pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');
    const workerSrc = await import('pdfjs-dist/build/pdf.worker.mjs?url');
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc.default;
    ;(window as any).pdfjsLib = pdfjsLib;
    this.initialized = true;
  }

  private downloadPDF(): void {
    if (!this.currentUrl) return;
    
    const link = document.createElement('a');
    link.href = this.currentUrl;
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
