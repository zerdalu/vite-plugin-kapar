export interface KaparCanvas extends HTMLCanvasElement {
  onpaint: ((this: GlobalEventHandlers, ev: Event) => any) | null;
  requestPaint(): void;
}

export interface KaparCanvasRenderingContext2D extends CanvasRenderingContext2D {
  drawElementImage(
    element: Element,
    x: number,
    y: number,
    w?: number,
    h?: number,
  ): DOMMatrix;
  reset(): void;
}
