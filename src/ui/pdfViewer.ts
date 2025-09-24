import { portfolioConfig } from '../config';

export class PdfViewer {
  private overlay = document.getElementById('pdf-fullscreen') as HTMLDivElement;
  private container = document.getElementById('pdf-fullscreen-container') as HTMLDivElement;
  private closeBtn = document.querySelector('[data-close="pdf-fullscreen"]') as HTMLButtonElement;
  private downloadBtn = document.querySelector('[data-download="pdf"]') as HTMLButtonElement;
  private initialized = false;
  private currentUrl = '';
  
  onClose?: () => void;

  constructor() {
    this.close = this.close.bind(this);
    this.download = this.download.bind(this);
    this.onOverlayClick = this.onOverlayClick.bind(this);
    
    this.closeBtn.addEventListener('click', this.close);
    this.downloadBtn.addEventListener('click', this.download);
    
    // Close PDF when clicking outside the content area
    this.overlay.addEventListener('click', this.onOverlayClick);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  async open(url: string) {
    this.currentUrl = url;
    this.overlay.classList.add('visible');
    await this.ensurePdfjs();
    this.container.innerHTML = '';
    const pdfjsLib = (window as any)['pdfjsLib'];
    try {
      const loadingTask = pdfjsLib.getDocument(url);
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
      this.container.appendChild(viewer);

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
      this.container.appendChild(msg);
    }
  }

  close() {
    this.overlay.classList.remove('visible');
    this.container.innerHTML = '';
    
    // Trigger close callback to return to default view
    if (this.onClose) {
      this.onClose();
    }
  }

  private onOverlayClick(e: MouseEvent) {
    // Only close if clicking the overlay itself, not its children
    if (e.target === this.overlay) {
      this.close();
    }
  }

  private download() {
    if (!this.currentUrl) return;
    
    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.href = this.currentUrl;
    link.download = portfolioConfig.getCVDownloadName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private async ensurePdfjs() {
    if (this.initialized) return;
    // Lazy load PDF.js via ESM import from pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');
    const workerSrc = await import('pdfjs-dist/build/pdf.worker.mjs?url');
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc.default;
    ;(window as any).pdfjsLib = pdfjsLib;
    this.initialized = true;
  }
}
