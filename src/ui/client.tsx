import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import styles from "./styles.css?inline";
import { Kapar } from "../kapar";

export interface ClientOptions {
  targetSelector?: string;
}

interface WidgetProps {
  target: HTMLElement;
  options: ClientOptions;
}

const Widget: React.FC<WidgetProps> = ({ target }) => {
  const kaparRef = useRef<Kapar | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPenActive, setIsPenActive] = useState(false);

  // UI states:
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mode, setMode] = useState<"picture" | "camera">("picture");
  const [isSupported, setIsSupported] = useState(true);

  // Default Dimensions, Scale, FPS and Pen Configurations
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [fps, setFps] = useState(24);
  const [penColor, setPenColor] = useState("#4ade80"); // Light green by default
  const [penWidth, setPenWidth] = useState(4);

  // Check flag support on load
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      typeof CanvasRenderingContext2D !== "undefined" &&
      "drawElementImage" in CanvasRenderingContext2D.prototype;
    setIsSupported(supported);
  }, []);

  // Initialize Kapar Core once the wrapper mounts (if API is supported)
  // Initially, this instance is kept idle (not active)
  useEffect(() => {
    if (isSupported && !kaparRef.current) {
      kaparRef.current = new Kapar(target, {
        width,
        height,
        scaleFactor,
        fps,
        penColor,
        penWidth,
      });
    }
  }, [target, isSupported]);

  // Handle core activation and deactivation reactively
  useEffect(() => {
    if (!kaparRef.current) return;

    if (isPanelOpen) {
      kaparRef.current.activate();
      // Ensure dimensions are initialized correctly on active transition
      kaparRef.current.updateDimensions(width, height, scaleFactor);
    } else {
      kaparRef.current.deactivate();
    }

    return () => {
      kaparRef.current?.deactivate();
    };
  }, [isPanelOpen, isSupported]);

  const handleActionTrigger = async () => {
    if (!kaparRef.current || !kaparRef.current.getIsActive()) return;

    if (mode === "picture") {
      await kaparRef.current.takeScreenshot("screenshot.png");
    } else {
      if (!isRecording) {
        kaparRef.current.startRecording();
        setIsRecording(true);
      } else {
        await kaparRef.current.stopRecording("recording.webm");
        setIsRecording(false);
      }
    }
  };

  const togglePen = () => {
    if (!kaparRef.current || !kaparRef.current.getIsActive()) return;
    const nextState = !isPenActive;
    kaparRef.current.togglePen(nextState);
    setIsPenActive(nextState);
  };

  const handleClear = () => {
    if (!kaparRef.current || !kaparRef.current.getIsActive()) return;
    kaparRef.current.clearPen();
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setWidth(val);
      kaparRef.current?.updateDimensions(val, height, scaleFactor);
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setHeight(val);
      kaparRef.current?.updateDimensions(width, val, scaleFactor);
    }
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setScaleFactor(val);
      kaparRef.current?.updateDimensions(width, height, val);
    }
  };

  const handleFpsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setFps(val);
      kaparRef.current?.updateFps(val);
    }
  };

  const handlePenColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPenColor(val);
    kaparRef.current?.updatePenColor(val);
  };

  const handlePenColorTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPenColor(val);
    if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
      kaparRef.current?.updatePenColor(val);
    }
  };

  const handlePenWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setPenWidth(val);
      kaparRef.current?.updatePenWidth(val);
    }
  };

  return (
    <div id="kapar-root" className={isRecording ? "kapar-recording" : ""}>
      <div className="flex flex-col items-end gap-2" id="plugin-container">
        {/* Main Control Panel */}
        <div
          className={`bg-surface-container-highest border-outline-variant p-unit gap-unit mb-2 origin-bottom flex-col items-center rounded-xl border shadow-md transition-all duration-200 ${
            isPanelOpen ? "flex" : "hidden"
          }`}
          id="control-panel"
        >
          {isSupported ? (
            <>
              {/* Segmented Control: Picture vs Camera */}
              <div className="bg-surface-container-low border-outline-variant flex flex-col gap-1 rounded-lg border p-1">
                <button
                  className={
                    mode === "picture"
                      ? "bg-surface-variant text-primary border-outline-variant flex h-8 w-8 items-center justify-center rounded border transition-colors cursor-pointer"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-variant/50 flex h-8 w-8 items-center justify-center rounded border border-transparent transition-colors cursor-pointer"
                  }
                  id="mode-picture"
                  title="Screenshot Mode"
                  onClick={() => setMode("picture")}
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 256 256"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect fill="none" height="256" width="256"></rect>
                    <path
                      d="M208,64H176L160,40H96L80,64H48A16,16,0,0,0,32,80V192a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V80A16,16,0,0,0,208,64ZM128,168a36,36,0,1,1,36-36A36,36,0,0,1,128,168Z"
                      opacity="0.2"
                    ></path>
                    <path
                      d="M208,208H48a16,16,0,0,1-16-16V80A16,16,0,0,1,48,64H80L96,40h64l16,24h32a16,16,0,0,1,16,16V192A16,16,0,0,1,208,208Z"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="16"
                    ></path>
                    <circle
                      cx="128"
                      cy="132"
                      fill="none"
                      r="36"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="16"
                    ></circle>
                  </svg>
                </button>
                <button
                  className={
                    mode === "camera"
                      ? "bg-surface-variant text-primary border-outline-variant flex h-8 w-8 items-center justify-center rounded border transition-colors cursor-pointer"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-variant/50 flex h-8 w-8 items-center justify-center rounded border border-transparent transition-colors cursor-pointer"
                  }
                  id="mode-camera"
                  title="Record Mode"
                  onClick={() => setMode("camera")}
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 256 256"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect fill="none" height="256" width="256"></rect>
                    <rect
                      height="128"
                      opacity="0.2"
                      rx="8"
                      width="176"
                      x="24"
                      y="64"
                    ></rect>
                    <rect
                      fill="none"
                      height="128"
                      rx="8"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="16"
                      width="176"
                      x="24"
                      y="64"
                    ></rect>
                    <polyline
                      fill="none"
                      points="200 112 248 80 248 176 200 144"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="16"
                    ></polyline>
                  </svg>
                </button>
              </div>

              {/* Separator */}
              <div className="bg-outline-variant my-1 h-px w-full"></div>

              {/* Main Action: Record/Capture */}
              <button
                className="bg-primary text-on-primary group flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                id="action-trigger"
                title={
                  mode === "picture"
                    ? "Capture Screenshot"
                    : isRecording
                      ? "Stop Recording"
                      : "Start Recording"
                }
                onClick={handleActionTrigger}
              >
                <svg
                  className="size-8 transition-transform group-active:scale-90"
                  viewBox="0 0 256 256"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect fill="none" height="256" width="256"></rect>
                  <circle
                    cx="128"
                    cy="128"
                    opacity="0.2"
                    r="64"
                    id="kapar-action-inner-path"
                  ></circle>
                  <circle
                    cx="128"
                    cy="128"
                    fill="none"
                    r="96"
                    stroke="currentColor"
                    strokeMiterlimit="10"
                    strokeWidth="16"
                  ></circle>
                  <circle
                    cx="128"
                    cy="128"
                    fill="none"
                    r="64"
                    stroke="currentColor"
                    strokeMiterlimit="10"
                    strokeWidth="16"
                  ></circle>
                </svg>
              </button>

              {/* Separator */}
              <div className="bg-outline-variant my-1 h-px w-full"></div>

              {/* Pen Button */}
              <button
                className={
                  isPenActive
                    ? "bg-surface-variant text-primary border-outline-variant flex h-8 w-8 items-center justify-center rounded border transition-colors cursor-pointer"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-variant flex h-8 w-8 items-center justify-center rounded transition-colors cursor-pointer"
                }
                id="pen-btn"
                title="Toggle Pen"
                onClick={togglePen}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 256 256"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect fill="none" height="256" width="256"></rect>
                  <path
                    d="M92.7,216H48a8,8,0,0,1-8-8V163.3a7.9,7.9,0,0,1,2.3-5.6l120-120a8,8,0,0,1,11.4,0l44.6,44.6a8,8,0,0,1,0,11.4l-120,120A7.9,7.9,0,0,1,92.7,216Z"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="16"
                  ></path>
                  <line
                    x1="136"
                    y1="64"
                    x2="192"
                    y2="120"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="16"
                  ></line>
                </svg>
              </button>

              {/* Clear Button */}
              <button
                className="text-on-surface-variant hover:text-primary hover:bg-surface-variant flex h-8 w-8 items-center justify-center rounded transition-colors cursor-pointer"
                id="clear-btn"
                title="Clear Drawings"
                onClick={handleClear}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 256 256"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect fill="none" height="256" width="256"></rect>
                  <path
                    d="M216,216H40"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="16"
                  ></path>
                  <path
                    d="M117.7,42.3a8,8,0,0,1,11.3,0l84.7,84.7a8,8,0,0,1,0,11.3L132.3,219.7a8,8,0,0,1-11.3,0l-84.7-84.7a8,8,0,0,1,0-11.3Z"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="16"
                  ></path>
                  <line
                    x1="78.1"
                    y1="178.1"
                    x2="162"
                    y2="94"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="16"
                  ></line>
                </svg>
              </button>

              {/* Separator */}
              <div className="bg-outline-variant my-1 h-px w-full"></div>

              {/* Settings Button with Popover */}
              <div className="relative">
                <button
                  className={
                    isSettingsOpen
                      ? "bg-surface-variant text-primary border-outline-variant flex h-8 w-8 items-center justify-center rounded border transition-colors cursor-pointer"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-variant flex h-8 w-8 items-center justify-center rounded transition-colors cursor-pointer"
                  }
                  id="settings-btn"
                  title="Settings"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 256 256"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect fill="none" height="256" width="256"></rect>
                    <path
                      d="M230.1,108.76,198.25,90.62c-.64-1.16-1.31-2.29-2-3.41l-.12-36A104.61,104.61,0,0,0,162,32L130,49.89c-1.34,0-2.69,0-4,0L94,32A104.58,104.58,0,0,0,59.89,51.25l-.16,36c-.7,1.12-1.37,2.26-2,3.41l-31.84,18.1a99.15,99.15,0,0,0,0,38.46l31.85,18.14c.64,1.16,1.31,2.29,2,3.41l.12,36A104.61,104.61,0,0,0,94,224l32-17.87c1.34,0,2.69,0,4,0L162,224a104.58,104.58,0,0,0,34.08-19.25l.16-36c.7-1.12,1.37-2.26,2-3.41l31.84-18.1A99.15,99.15,0,0,0,230.1,108.76ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z"
                      opacity="0.2"
                    ></path>
                    <circle
                      cx="128"
                      cy="128"
                      fill="none"
                      r="40"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="16"
                    ></circle>
                    <path
                      d="M130.05,206.11c-1.34,0-2.69,0-4,0L94,224a104.61,104.61,0,0,1-34.11-19.2l-.12-36c-.71-1.12-1.38-2.25-2-3.41L25.9,147.24a99.15,99.15,0,0,1,0-38.46l31.84-18.1c.65-1.15,1.32-2.29,2-3.41l.16-36A104.58,104.58,0,0,1,94,32l32,17.89c1.34,0,2.69,0,4,0L162,32a104.61,104.61,0,0,1,34.11,19.2l.12,36c.71,1.12,1.38,2.25,2,3.41l31.85,18.14a99.15,99.15,0,0,1,0,38.46l-31.84,18.1c-.65,1.15-1.32,2.29-2,3.41l-.16,36A104.58,104.58,0,0,1,162,224Z"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="16"
                    ></path>
                  </svg>
                </button>

                {/* Settings Popover */}
                <div
                  className={`p-standard-padding absolute right-full -bottom-1.5 mr-4 w-[220px] flex-col gap-3 rounded-lg border border-[#3F3F46] bg-[#27272A] shadow-lg backdrop-blur-sm ${
                    isSettingsOpen ? "flex" : "hidden"
                  }`}
                  id="settings-popover"
                >
                  <div className="flex flex-col gap-1">
                    <div className="text-primary font-semibold text-xs tracking-wide mb-1.5 border-b border-[#3F3F46] pb-1">
                      Canvas Settings
                    </div>
                    <div className="flex gap-2">
                      <div className="flex flex-1 flex-col gap-1">
                        <label className="font-label-caps text-label-caps text-on-surface-variant">
                          WIDTH
                        </label>
                        <input
                          className="focus:border-primary font-code-base text-code-base text-primary w-full rounded border border-[#3F3F46] bg-[#18181B] px-2 py-1 transition-colors outline-none"
                          type="number"
                          id="input-width"
                          min="200"
                          max="3840"
                          value={width}
                          onChange={handleWidthChange}
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <label className="font-label-caps text-label-caps text-on-surface-variant">
                          HEIGHT
                        </label>
                        <input
                          className="focus:border-primary font-code-base text-code-base text-primary w-full rounded border border-[#3F3F46] bg-[#18181B] px-2 py-1 transition-colors outline-none"
                          type="number"
                          id="input-height"
                          min="200"
                          max="2160"
                          value={height}
                          onChange={handleHeightChange}
                        />
                      </div>
                    </div>

                    <div
                      className="flex flex-col gap-1 mt-2"
                      id="scale-factor-setting"
                    >
                      <label className="font-label-caps text-label-caps text-on-surface-variant">
                        SCALE FACTOR
                      </label>
                      <div className="relative w-full">
                        <select
                          className="focus:border-primary font-code-base text-code-base text-primary w-full appearance-none rounded border border-[#3F3F46] bg-[#18181B] px-2 py-1 pr-6 transition-colors outline-none cursor-pointer"
                          id="select-scale"
                          value={scaleFactor}
                          onChange={handleScaleChange}
                        >
                          <option value="1">1x</option>
                          <option value="2">2x</option>
                          <option value="3">3x</option>
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant text-[9px]">
                          ▼
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-2" id="fps-setting">
                      <label className="font-label-caps text-label-caps text-on-surface-variant">
                        FPS
                      </label>
                      <div className="relative w-full">
                        <select
                          className="focus:border-primary font-code-base text-code-base text-primary w-full appearance-none rounded border border-[#3F3F46] bg-[#18181B] px-2 py-1 pr-6 transition-colors outline-none cursor-pointer"
                          id="select-fps"
                          value={fps}
                          onChange={handleFpsChange}
                        >
                          <option value="24">24 fps</option>
                          <option value="30">30 fps</option>
                          <option value="60">60 fps</option>
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant text-[9px]">
                          ▼
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mt-2">
                    <div className="text-primary font-semibold text-xs tracking-wide mb-1.5 border-b border-[#3F3F46] pb-1">
                      Pen Settings
                    </div>

                    <div className="flex gap-2">
                      <div className="flex flex-1 flex-col gap-1">
                        <label className="font-label-caps text-label-caps text-on-surface-variant">
                          COLOR
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            className="focus:border-primary font-code-base text-code-base text-primary w-full min-w-0 rounded border border-[#3F3F46] bg-[#18181B] px-2 py-1 transition-colors outline-none text-xs"
                            type="text"
                            id="input-pen-color-text"
                            value={penColor}
                            onChange={handlePenColorTextChange}
                          />
                          <div className="relative w-7 h-7 rounded border border-[#3F3F46] overflow-hidden shrink-0 flex items-center justify-center bg-[#18181B]">
                            <input
                              className="absolute cursor-pointer p-0 border-0 outline-none"
                              style={{
                                width: "150%",
                                height: "150%",
                                transform: "scale(1.5)",
                              }}
                              type="color"
                              id="input-pen-color"
                              value={penColor}
                              onChange={handlePenColorChange}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex w-[65px] flex-col gap-1">
                        <label className="font-label-caps text-label-caps text-on-surface-variant">
                          WIDTH
                        </label>
                        <input
                          className="focus:border-primary font-code-base text-code-base text-primary w-full rounded border border-[#3F3F46] bg-[#18181B] px-2 py-1 transition-colors outline-none"
                          type="number"
                          id="input-pen-width"
                          min="1"
                          max="20"
                          value={penWidth}
                          onChange={handlePenWidthChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 flex flex-col items-center gap-2 text-center w-[184px]">
              <span className="text-red-400 font-bold text-sm flex items-center gap-1.5">
                ⚠️ Unsupported
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Enable experimental flag to use kapar:
              </p>
              <div className="text-[10px] text-on-surface-variant text-center bg-surface-container-low border border-outline-variant p-2 rounded w-full font-mono break-all select-all">
                chrome://flags/#canvas-draw-element
              </div>
            </div>
          )}
        </div>

        {/* Master Toggle Button (FAB) */}
        <button
          className="bg-surface-container-highest border-outline-variant text-on-surface hover:text-primary hover:bg-surface-variant relative flex h-12 w-12 items-center justify-center rounded-lg border shadow-md transition-all duration-200 hover:border-[#3F3F46] cursor-pointer"
          id="master-toggle"
          title="Toggle Tool Panel"
          onClick={() => {
            const nextVal = !isPanelOpen;
            setIsPanelOpen(nextVal);
            if (!nextVal) {
              setIsSettingsOpen(false);
              setIsPenActive(false);
              if (isRecording) {
                kaparRef.current
                  ?.stopRecording("recording.webm")
                  .catch(console.error);
                setIsRecording(false);
              }
            }
          }}
        >
          {/* Frame Icon (Inactive State) */}
          <svg
            className={`absolute h-6 w-6 transition-all duration-200 ${
              isPanelOpen ? "opacity-0 scale-50" : "opacity-100"
            }`}
            id="icon-frame"
            viewBox="0 0 256 256"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect fill="none" height="256" width="256"></rect>
            <polyline
              fill="none"
              points="160 80 192 80 192 112"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="16"
            ></polyline>
            <polyline
              fill="none"
              points="96 176 64 176 64 144"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="16"
            ></polyline>
            <rect
              fill="none"
              height="160"
              rx="8"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="16"
              width="192"
              x="32"
              y="48"
            ></rect>
          </svg>
          {/* X Icon (Active State) */}
          <svg
            className={`absolute h-6 w-6 transition-all duration-200 ${
              isPanelOpen ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
            id="icon-close"
            viewBox="0 0 256 256"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect fill="none" height="256" width="256"></rect>
            <line
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="16"
              x1="200"
              x2="56"
              y1="56"
              y2="200"
            ></line>
            <line
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="16"
              x1="200"
              x2="56"
              y1="200"
              y2="56"
            ></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export function initKapar(options: ClientOptions = {}) {
  const run = () => {
    const selector =
      options.targetSelector ||
      (document.querySelector("#app")
        ? "#app"
        : document.querySelector("#root")
          ? "#root"
          : "body");
    const target = document.querySelector(selector) as HTMLElement;

    if (!target) {
      setTimeout(run, 100);
      return;
    }

    if (document.getElementById("kapar-overlay-root")) return;

    // Create the overlay container element
    const container = document.createElement("div");
    container.id = "kapar-overlay-root";

    // Style light DOM container to stay above the canvas presentation wrapper
    container.style.setProperty("position", "fixed", "important");
    container.style.setProperty("bottom", "0", "important");
    container.style.setProperty("right", "0", "important");
    container.style.setProperty("width", "0", "important");
    container.style.setProperty("height", "0", "important");
    container.style.setProperty("z-index", "999999", "important");
    container.style.setProperty("pointer-events", "none", "important");

    // Attach Shadow Root for style isolation
    const shadow = container.attachShadow({ mode: "open" });

    // Append our Tailwind CSS and custom tokens into the shadow root
    const styleTag = document.createElement("style");
    styleTag.textContent = styles;
    shadow.appendChild(styleTag);

    // Create a container inside the shadow root to mount our React app
    const reactMountPoint = document.createElement("div");
    shadow.appendChild(reactMountPoint);

    // Render the React application inside the Shadow DOM
    const root = createRoot(reactMountPoint);
    root.render(<Widget target={target} options={options} />);

    document.body.appendChild(container);
  };

  const delayRun = () => setTimeout(run, 500);

  if (document.readyState === "complete") {
    delayRun();
  } else {
    window.addEventListener("load", delayRun);
  }
}

(window as any).initKapar = initKapar;
