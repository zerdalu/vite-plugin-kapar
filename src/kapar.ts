import { KaparCanvas, KaparCanvasRenderingContext2D } from "./types/kapar";

export interface KaparOptions {
  width?: number;
  height?: number;
  fps?: number;
  videoMimeType?: string;
  penColor?: string;
  penWidth?: number;
  scaleFactor?: number;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  color: string;
  width: number;
  points: Point[];
}

export class Kapar {
  private target: HTMLElement;
  private canvas!: KaparCanvas;
  private ctx!: KaparCanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private options: Required<KaparOptions>;

  // --- Pen Feature State ---
  private penCanvas!: HTMLCanvasElement;
  private penCtx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private penEnabled = false;
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;

  private scaleFactor: number;
  private updateScaleFn: (() => void) | null = null;

  // --- Activation / Deactivation State ---
  private originalParent: HTMLElement | null = null;
  private originalNextSibling: Node | null = null;
  private originalStyleAttr: string | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private paintLoopId: number | null = null;
  private isActive = false;
  private wrapper: HTMLDivElement | null = null;
  private scaleContainer: HTMLDivElement | null = null;

  // --- Bound Event Listeners ---
  private boundPointerDown: ((e: PointerEvent) => void) | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;
  private boundPointerUp: (() => void) | null = null;

  constructor(targetElement: HTMLElement, options: KaparOptions = {}) {
    this.target = targetElement;
    this.scaleFactor = options.scaleFactor || 1;
    this.options = {
      width: options.width || 1200,
      height: options.height || 800,
      fps: options.fps || 60,
      videoMimeType: options.videoMimeType || "video/webm",
      penColor: options.penColor || "#4ade80", // Defaulting to light green
      penWidth: options.penWidth || 4,
      scaleFactor: this.scaleFactor,
    };
  }

  public activate() {
    if (this.isActive) return;

    // Check if the HTML-in-Canvas API is supported by the browser
    const isSupported =
      typeof window !== "undefined" &&
      typeof CanvasRenderingContext2D !== "undefined" &&
      "drawElementImage" in CanvasRenderingContext2D.prototype;

    if (!isSupported) {
      console.warn(
        "[Kapar] HTML-in-Canvas API is not supported in this browser. Fallback mode enabled to prevent breaking layout.",
      );
      return;
    }

    this.isActive = true;

    // 1. Store original DOM parent, sibling, and style configuration
    this.originalParent = this.target.parentElement;
    this.originalNextSibling = this.target.nextSibling;
    this.originalStyleAttr = this.target.getAttribute("style");

    // 2. Inject Viewport Overrides Style Tag
    if (!document.getElementById("kapar-overrides")) {
      const style = document.createElement("style");
      style.id = "kapar-overrides";
      style.innerHTML = `
        #kapar-canvas-wrapper .w-screen, #kapar-canvas-wrapper .w-svw, #kapar-canvas-wrapper .w-dvw, #kapar-canvas-wrapper .w-lvw { width: 100% !important; }
        #kapar-canvas-wrapper .h-screen, #kapar-canvas-wrapper .h-svh, #kapar-canvas-wrapper .h-dvh, #kapar-canvas-wrapper .h-lvh { height: 100% !important; }
      `;
      document.head.appendChild(style);
    }

    // 3. Enforce strict dimensions on the target
    this.target.style.setProperty(
      "width",
      `${this.options.width}px`,
      "important",
    );
    this.target.style.setProperty(
      "height",
      `${this.options.height}px`,
      "important",
    );
    this.target.style.setProperty(
      "min-width",
      `${this.options.width}px`,
      "important",
    );
    this.target.style.setProperty(
      "min-height",
      `${this.options.height}px`,
      "important",
    );
    this.target.style.setProperty(
      "max-width",
      `${this.options.width}px`,
      "important",
    );
    this.target.style.setProperty(
      "max-height",
      `${this.options.height}px`,
      "important",
    );
    this.target.style.setProperty("box-sizing", "border-box", "important");
    this.target.style.setProperty("position", "relative", "important");
    this.target.style.setProperty("overflow-y", "auto", "important");
    this.target.style.setProperty("overflow-x", "hidden", "important");
    this.target.style.setProperty("margin", "0", "important");

    // 4. Setup Outer Presentation Wrapper (Circuit Board - Dark Pattern Background)
    if (!this.wrapper) {
      this.wrapper = document.createElement("div");
      this.wrapper.id = "kapar-canvas-wrapper";
      this.wrapper.style.setProperty("width", "100%", "important");
      this.wrapper.style.setProperty("height", "100dvh", "important");
      this.wrapper.style.setProperty("position", "fixed", "important");
      this.wrapper.style.setProperty("top", "0", "important");
      this.wrapper.style.setProperty("left", "0", "important");
      this.wrapper.style.setProperty("z-index", "999998", "important");
      this.wrapper.style.setProperty(
        "background-color",
        "#0f0f0f",
        "important",
      );
      this.wrapper.style.setProperty(
        "background-image",
        `repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(34, 197, 94, 0.15) 19px, rgba(34, 197, 94, 0.15) 20px, transparent 20px, transparent 39px, rgba(34, 197, 94, 0.15) 39px, rgba(34, 197, 94, 0.15) 40px),
         repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(34, 197, 94, 0.15) 19px, rgba(34, 197, 94, 0.15) 20px, transparent 20px, transparent 39px, rgba(34, 197, 94, 0.15) 39px, rgba(34, 197, 94, 0.15) 40px),
         radial-gradient(circle at 20px 20px, rgba(16, 185, 129, 0.18) 2px, transparent 2px),
         radial-gradient(circle at 40px 40px, rgba(16, 185, 129, 0.18) 2px, transparent 2px)`,
        "important",
      );
      this.wrapper.style.setProperty(
        "background-size",
        "40px 40px, 40px 40px, 40px 40px, 40px 40px",
        "important",
      );
      this.wrapper.style.setProperty("overflow", "hidden", "important");
      this.wrapper.style.setProperty("margin", "0", "important");
    }

    // 5. Setup Scale Container (Groups capture canvas & pen overlay)
    if (!this.scaleContainer) {
      this.scaleContainer = document.createElement("div");
      this.scaleContainer.style.setProperty(
        "position",
        "absolute",
        "important",
      );
      this.scaleContainer.style.setProperty(
        "transform-origin",
        "top left",
        "important",
      );
    }
    this.scaleContainer.style.setProperty(
      "width",
      `${this.options.width}px`,
      "important",
    );
    this.scaleContainer.style.setProperty(
      "height",
      `${this.options.height}px`,
      "important",
    );

    // 6. Setup Capture Canvas
    if (!this.canvas) {
      this.canvas = document.createElement("canvas") as KaparCanvas;
      this.canvas.setAttribute("layoutsubtree", "");
      this.canvas.style.setProperty("width", "100%", "important");
      this.canvas.style.setProperty("height", "100%", "important");
      this.canvas.style.setProperty("position", "absolute", "important");
      this.canvas.style.setProperty("left", "0", "important");
      this.canvas.style.setProperty("top", "0", "important");
      this.canvas.style.setProperty(
        "background-color",
        "transparent",
        "important",
      );
    }
    this.canvas.width = this.options.width * this.scaleFactor;
    this.canvas.height = this.options.height * this.scaleFactor;

    // 7. Setup Pen Overlay
    if (!this.penCanvas) {
      this.penCanvas = document.createElement("canvas");
      Object.assign(this.penCanvas.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: "999999",
        pointerEvents: "none",
        touchAction: "none",
      });
    }
    this.penCanvas.width = this.options.width * this.scaleFactor;
    this.penCanvas.height = this.options.height * this.scaleFactor;

    // 8. Scale computation function
    this.updateScaleFn = () => {
      if (!this.wrapper || !this.scaleContainer) return;
      const rect = this.wrapper.getBoundingClientRect();
      const scale = Math.min(
        1,
        rect.width / this.options.width,
        rect.height / this.options.height,
      );
      const tx = (rect.width - this.options.width * scale) / 2;
      const ty = (rect.height - this.options.height * scale) / 2;

      this.scaleContainer.style.setProperty(
        "transform",
        `translate(${tx}px, ${ty}px) scale(${scale})`,
        "important",
      );
    };

    this.resizeObserver = new ResizeObserver(this.updateScaleFn);
    this.resizeObserver.observe(this.wrapper);

    // 9. Re-parent and insert DOM
    if (this.originalParent) {
      this.originalParent.insertBefore(this.wrapper, this.originalNextSibling);
      this.scaleContainer.appendChild(this.canvas);
      this.scaleContainer.appendChild(this.penCanvas);
      this.wrapper.appendChild(this.scaleContainer);
      this.canvas.appendChild(this.target);
    } else {
      throw new Error("Target element must be in the DOM before activating.");
    }

    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context not supported");
    this.ctx = context as KaparCanvasRenderingContext2D;
    this.penCtx = this.penCanvas.getContext("2d")!;

    this.setupPenEvents();
    this.setupPaintLoop();

    // Trigger initial scale
    this.updateScaleFn();
  }

  public deactivate() {
    if (!this.isActive) return;

    this.isActive = false;

    // 1. Cancel requestAnimationFrame
    if (this.paintLoopId !== null) {
      cancelAnimationFrame(this.paintLoopId);
      this.paintLoopId = null;
    }

    // 2. Clear canvas onpaint
    if (this.canvas) {
      this.canvas.onpaint = null;
    }

    // 3. Disconnect ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // 4. Remove pen drawing event listeners
    this.removePenEvents();

    // 5. Restore target DOM location and original styles
    if (this.target && this.originalParent) {
      this.originalParent.insertBefore(this.target, this.originalNextSibling);

      if (this.originalStyleAttr !== null) {
        this.target.setAttribute("style", this.originalStyleAttr);
      } else {
        this.target.removeAttribute("style");
      }
    }

    // 6. Remove wrapper and layout from DOM
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }

    const overrides = document.getElementById("kapar-overrides");
    if (overrides && overrides.parentNode) {
      overrides.parentNode.removeChild(overrides);
    }

    // Reset drawing state
    this.isDrawing = false;
    this.penEnabled = false;
    this.strokes = [];
    this.currentStroke = null;
  }

  private setupPaintLoop() {
    this.canvas.onpaint = () => {
      if (!this.isActive) return;

      // Redraw drawings according to the current scroll offset
      this.redrawStrokes();

      this.ctx.reset();

      // Scale context coordinate system to match high-resolution backing store layout.
      this.ctx.scale(this.scaleFactor, this.scaleFactor);

      const transformMatrix = this.ctx.drawElementImage(this.target, 0, 0);

      // Normalize the returned matrix to ensure the DOM elements align perfectly with the viewport size
      const correctedMatrix = new DOMMatrix([
        transformMatrix.a / this.scaleFactor,
        transformMatrix.b / this.scaleFactor,
        transformMatrix.c / this.scaleFactor,
        transformMatrix.d / this.scaleFactor,
        transformMatrix.e / this.scaleFactor,
        transformMatrix.f / this.scaleFactor,
      ]);

      const newTransform = correctedMatrix.toString();
      if (this.target.style.transform !== newTransform) {
        this.target.style.transform = newTransform;
        this.target.style.transformOrigin = "top left";
      }

      // Reset transform matrix to identity before performing 1:1 backing store copy of penCanvas
      this.ctx.resetTransform();
      this.ctx.drawImage(this.penCanvas, 0, 0);
    };

    // Continuous requestPaint loop to capture animations and rendering changes smoothly
    const renderLoop = () => {
      if (!this.isActive) return;
      this.canvas.requestPaint();
      this.paintLoopId = requestAnimationFrame(renderLoop);
    };
    this.paintLoopId = requestAnimationFrame(renderLoop);
  }

  // ==========================================
  // CAPTURE & RECORDING IMPLEMENTATION
  // ==========================================

  public async takeScreenshot(
    filename: string = "screenshot.png",
  ): Promise<void> {
    if (!this.isActive) {
      return Promise.reject(
        new Error("Cannot take screenshot: Kapar is inactive."),
      );
    }
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (!blob) {
          return reject(new Error("Failed to take screenshot"));
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve();
        }, 100);
      }, "image/png");
    });
  }

  public startRecording() {
    if (!this.isActive) {
      console.warn("Cannot start recording: Kapar is inactive.");
      return;
    }
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      console.warn("Recording is already in progress.");
      return;
    }

    this.recordedChunks = [];

    const stream = (this.canvas as any).captureStream(this.options.fps);

    try {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.options.videoMimeType,
      });
    } catch (e) {
      console.error("Failed to create MediaRecorder:", e);
      return;
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
  }

  public stopRecording(filename: string = "video.webm"): Promise<Blob> {
    if (!this.isActive) {
      return Promise.reject(
        new Error("Cannot stop recording: Kapar is inactive."),
      );
    }
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        return reject(new Error("No active recording found."));
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.options.videoMimeType,
        });

        if (filename) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = filename;

          document.body.appendChild(a);
          a.click();

          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        }

        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  // ==========================================
  // PEN FEATURE IMPLEMENTATION
  // ==========================================

  private setupPenEvents() {
    this.boundPointerDown = (e: PointerEvent) => {
      if (!this.penEnabled) return;
      this.isDrawing = true;

      const { x, y } = this.getPointerCSSCoords(e);
      this.currentStroke = {
        color: this.options.penColor,
        width: this.options.penWidth,
        points: [{ x, y }],
      };
      this.strokes.push(this.currentStroke);
    };

    this.boundPointerMove = (e: PointerEvent) => {
      if (!this.isDrawing || !this.penEnabled || !this.currentStroke) return;

      const { x, y } = this.getPointerCSSCoords(e);
      this.currentStroke.points.push({ x, y });
    };

    this.boundPointerUp = () => {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.currentStroke = null;
      }
    };

    if (this.penCanvas) {
      this.penCanvas.addEventListener("pointerdown", this.boundPointerDown);
      this.penCanvas.addEventListener("pointermove", this.boundPointerMove);
    }
    window.addEventListener("pointerup", this.boundPointerUp);
  }

  private removePenEvents() {
    if (this.penCanvas) {
      if (this.boundPointerDown) {
        this.penCanvas.removeEventListener(
          "pointerdown",
          this.boundPointerDown,
        );
      }
      if (this.boundPointerMove) {
        this.penCanvas.removeEventListener(
          "pointermove",
          this.boundPointerMove,
        );
      }
    }
    if (this.boundPointerUp) {
      window.removeEventListener("pointerup", this.boundPointerUp);
    }
    this.boundPointerDown = null;
    this.boundPointerMove = null;
    this.boundPointerUp = null;
  }

  private getPointerCSSCoords(e: PointerEvent) {
    if (!this.penCanvas) return { x: 0, y: 0 };
    const rect = this.penCanvas.getBoundingClientRect();

    const rectWidth = rect.width || 1;
    const rectHeight = rect.height || 1;

    // Coordinate inside the target layout bounding box in CSS pixels
    const relativeX =
      (e.clientX - rect.left) * (this.options.width / rectWidth);
    const relativeY =
      (e.clientY - rect.top) * (this.options.height / rectHeight);

    // Factor in internal scrolling of the target layout container
    return {
      x: relativeX + this.target.scrollLeft,
      y: relativeY + this.target.scrollTop,
    };
  }

  private redrawStrokes() {
    if (!this.penCtx || !this.penCanvas) return;

    // Clear previous frame
    this.penCtx.clearRect(0, 0, this.penCanvas.width, this.penCanvas.height);

    const scrollLeft = this.target.scrollLeft;
    const scrollTop = this.target.scrollTop;

    for (const stroke of this.strokes) {
      if (stroke.points.length === 0) continue;

      this.penCtx.beginPath();
      this.penCtx.strokeStyle = stroke.color;
      this.penCtx.lineWidth = stroke.width * this.scaleFactor;
      this.penCtx.lineCap = "round";
      this.penCtx.lineJoin = "round";

      const startPoint = stroke.points[0];
      const startX = (startPoint.x - scrollLeft) * this.scaleFactor;
      const startY = (startPoint.y - scrollTop) * this.scaleFactor;
      this.penCtx.moveTo(startX, startY);

      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        const x = (p.x - scrollLeft) * this.scaleFactor;
        const y = (p.y - scrollTop) * this.scaleFactor;
        this.penCtx.lineTo(x, y);
      }

      this.penCtx.stroke();
      this.penCtx.closePath();
    }
  }

  public togglePen(enable: boolean) {
    this.penEnabled = enable;
    if (this.penCanvas) {
      this.penCanvas.style.pointerEvents = enable ? "auto" : "none";
      this.penCanvas.style.cursor = enable ? "crosshair" : "default";
    }
  }

  public clearPen() {
    this.strokes = [];
    this.currentStroke = null;
    if (this.penCtx && this.penCanvas) {
      this.penCtx.clearRect(0, 0, this.penCanvas.width, this.penCanvas.height);
    }
  }

  // ==========================================
  // CONFIGURATION UPDATE & GETTERS
  // ==========================================

  public updateDimensions(
    width: number,
    height: number,
    scaleFactor: number = 1,
  ) {
    this.options.width = width;
    this.options.height = height;
    this.scaleFactor = scaleFactor;

    if (!this.isActive) {
      return;
    }

    // Enforce strict dimensions on the target
    this.target.style.setProperty("width", `${width}px`, "important");
    this.target.style.setProperty("height", `${height}px`, "important");
    this.target.style.setProperty("min-width", `${width}px`, "important");
    this.target.style.setProperty("min-height", `${height}px`, "important");
    this.target.style.setProperty("max-width", `${width}px`, "important");
    this.target.style.setProperty("max-height", `${height}px`, "important");

    // Update scaleContainer dimensions
    const scaleContainer = this.canvas.parentElement;
    if (scaleContainer) {
      scaleContainer.style.setProperty("width", `${width}px`, "important");
      scaleContainer.style.setProperty("height", `${height}px`, "important");
    }

    // Capture old pen drawing content to avoid losing it on resize/scaling change
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.penCanvas.width;
    tempCanvas.height = this.penCanvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.drawImage(this.penCanvas, 0, 0);
    }

    // Resize backing store sizes of both canvases
    this.canvas.width = width * scaleFactor;
    this.canvas.height = height * scaleFactor;
    this.penCanvas.width = width * scaleFactor;
    this.penCanvas.height = height * scaleFactor;

    // Restore old pen drawing
    if (tempCtx) {
      this.penCtx.drawImage(
        tempCanvas,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height,
        0,
        0,
        this.penCanvas.width,
        this.penCanvas.height,
      );
    }

    // Force recalculation of CSS scale
    if (this.updateScaleFn) {
      this.updateScaleFn();
    }

    // Force immediate redraw loop execution
    this.canvas.requestPaint();
  }

  public updateFps(fps: number) {
    this.options.fps = fps;
  }

  public updatePenColor(color: string) {
    this.options.penColor = color;
  }

  public updatePenWidth(width: number) {
    this.options.penWidth = width;
  }

  public getWidth(): number {
    return this.options.width;
  }

  public getHeight(): number {
    return this.options.height;
  }

  public getScaleFactor(): number {
    return this.scaleFactor;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }
}
