import { portfolioConfig } from '../config';

export class HelperText {
  private element!: HTMLElement;

  constructor(text?: string) {
    const defaultText = text || portfolioConfig.getHelperText().defaultMessage;
    this.createElement(defaultText);
  }

  private createElement(text: string): void {
    this.element = document.createElement('div');
    this.element.className = 'helper';
    this.element.textContent = text;
  }

  public setText(text: string): void {
    this.element.textContent = text;
  }

  public show(): void {
    this.element.style.display = 'block';
  }

  public hide(): void {
    this.element.style.display = 'none';
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
}
