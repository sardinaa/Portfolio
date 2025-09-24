export class ControlPanel {
  private element!: HTMLElement;

  constructor() {
    this.createElement();
    this.setupEventListeners();
  }

  private createElement(): void {
    this.element = document.createElement('div');
    this.element.className = 'control-panel';
    this.element.innerHTML = `
      <div id="css3d-root"></div>
    `;
  }

  private setupEventListeners(): void {
    // Listen for monitor activation events
    document.addEventListener('monitor-activated', () => {
      this.enablePointerEvents();
    });

    document.addEventListener('monitor-deactivated', () => {
      this.disablePointerEvents();
    });
  }

  private enablePointerEvents(): void {
    const css3dRoot = this.element.querySelector('#css3d-root') as HTMLElement;
    if (css3dRoot) {
      css3dRoot.style.pointerEvents = 'auto';
    }
  }

  private disablePointerEvents(): void {
    const css3dRoot = this.element.querySelector('#css3d-root') as HTMLElement;
    if (css3dRoot) {
      css3dRoot.style.pointerEvents = 'none';
    }
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public unmount(): void {
    this.element.remove();
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getCss3dRoot(): HTMLElement | null {
    return this.element.querySelector('#css3d-root');
  }
}
