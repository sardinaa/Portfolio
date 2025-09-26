import { MiniSite } from '../../ui/miniSite';
import { SceneObjects } from '../../types';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { TopLeftInfo, PDFOverlay, HelperText, ControlPanel } from '../../components';
import { SoundManager } from '../../systems/SoundManager';

export class UIManager {
  private miniSite: MiniSite;
  private topLeftInfo: TopLeftInfo;
  private pdfOverlay: PDFOverlay;
  private helperText: HelperText;
  private controlPanel: ControlPanel;
  private appContainer: HTMLElement;
  private soundManager?: SoundManager;

  constructor(appContainer: HTMLElement, soundManager?: SoundManager) {
    this.appContainer = appContainer;
    this.soundManager = soundManager;
    
    // Initialize existing components
    this.miniSite = new MiniSite(soundManager);
    
    // Initialize new modular components (PDFOverlay replaces PdfViewer)
    this.topLeftInfo = new TopLeftInfo();
    this.pdfOverlay = new PDFOverlay();
    this.helperText = new HelperText();
    this.controlPanel = new ControlPanel();
    
    this.setupCallbacks();
    this.mountComponents();
    
    // Expose font testing for debugging
    (window as any).testFonts = () => this.miniSite.testFontSizes();
    (window as any).forceMobileFonts = () => this.miniSite.forceMobileFonts();
  }

  private setupCallbacks(): void {
    this.miniSite.onClose = () => {
      this.onUIClose?.();
    };

    this.pdfOverlay.onClose = () => {
      this.onUIClose?.();
    };

    // Listen to component events
    document.addEventListener('audio-toggle', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.onAudioToggle?.(customEvent.detail.muted);
    });

    document.addEventListener('camera-toggle', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.onCameraToggle?.(customEvent.detail.freeCam);
    });

    document.addEventListener('blink-trigger', (e: Event) => {
      this.onBlinkTrigger?.();
    });
  }

  private mountComponents(): void {
    this.topLeftInfo.mount(this.appContainer);
    this.pdfOverlay.mount(this.appContainer);
    this.helperText.mount(this.appContainer);
    this.controlPanel.mount(this.appContainer);
  }

  onUIClose?: () => void;
  onAudioToggle?: (muted: boolean) => void;
  onCameraToggle?: (freeCam: boolean) => void;
  onBlinkTrigger?: () => void;

  attachMiniSiteToScreen(objects: SceneObjects, css3d: CSS3DRenderer, camera: any): void {
    console.log(`🎮 UIManager: attachMiniSiteToScreen called. screenMesh:`, !!objects.screenMesh, `monitorMesh:`, !!objects.monitorMesh);
    if (objects.screenMesh || objects.monitorMesh) {
      const targetMesh = objects.screenMesh || objects.monitorMesh;
      console.log(`🎮 UIManager: attaching to mesh:`, targetMesh.name || 'unnamed');
      this.miniSite.attachTo(targetMesh, css3d, camera);
    } else {
      console.warn(`🎮 UIManager: No screen or monitor mesh found to attach mini site`);
    }
  }

  openMiniSite(): void {
    console.log(`🎮 UIManager: opening mini site`);
    this.miniSite.setVisible(true);
  }

  closeMiniSite(): void {
    this.miniSite.setVisible(false);
  }

  isMiniSiteVisible(): boolean {
    return this.miniSite.isVisible();
  }

  async navigateToSection(section: string): Promise<void> {
    await this.miniSite.navigate(section);
  }

  async openPDF(url: string): Promise<void> {
    // Use the new PDFOverlay component for fullscreen PDF viewing
    await this.pdfOverlay.showFullscreen();
  }

  closePDF(): void {
    this.pdfOverlay.closeFullscreen();
  }

  isPDFVisible(): boolean {
    // Check if PDF overlay has visible class
    const overlay = document.getElementById('pdf-fullscreen');
    return overlay?.classList.contains('visible') || false;
  }

  closeAllOverlays(): void {
    this.closeMiniSite();
    this.closePDF();
    this.pdfOverlay.closeModal(); // Also close modal version if open
  }

  getMiniSite(): MiniSite {
    return this.miniSite;
  }

  getPDFOverlay(): PDFOverlay {
    return this.pdfOverlay;
  }

  // New methods for modular components
  showPDFModal(): void {
    this.pdfOverlay.showModal();
  }

  async showPDFFullscreen(): Promise<void> {
    await this.pdfOverlay.showFullscreen();
  }

  setHelperText(text: string): void {
    this.helperText.setText(text);
  }

  showHelperText(): void {
    this.helperText.show();
  }

  hideHelperText(): void {
    this.helperText.hide();
  }

  getCSS3DRoot(): HTMLElement | null {
    return this.controlPanel.getCss3dRoot();
  }

  showTopLeftInfo(): void {
    this.topLeftInfo.show();
  }

  hideTopLeftInfo(): void {
    this.topLeftInfo.hide();
  }

  destroy(): void {
    this.topLeftInfo.unmount();
    this.pdfOverlay.unmount();
    this.helperText.unmount();
    this.controlPanel.unmount();
    // Note: MiniSite cleanup should be added here if it has a destroy method
  }
}
