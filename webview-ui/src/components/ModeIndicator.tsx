import { useState, KeyboardEvent } from "react";
import { EditorMode, useLineContext } from "../context/line/lineContext";

export default function ModeIndicator() {
  const { mode, setMode } = useLineContext();
  const [isHovered, setIsHovered] = useState(false);
  const toggleMode = () => {
    setMode(mode === EditorMode.View ? EditorMode.Edit : EditorMode.View);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMode();
    }
  };
  const keyHintId = "mode-indicator-keybind";
  const keyHint =
    mode === EditorMode.View
      ? "Press I to switch to edit mode"
      : "Press Esc to return to view mode";

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "6px",
      }}
    >
      <div
        onClick={toggleMode}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onKeyDown={handleKeyDown}
        role="button"
        aria-describedby={isHovered ? keyHintId : undefined}
        style={{
          padding: "5px 10px",
          backgroundColor:
            mode === EditorMode.View
              ? "var(--vscode-editorInfo-background)"
              : "var(--vscode-editorWarning-background)",
          color:
            mode === EditorMode.View
              ? "var(--vscode-editorInfo-foreground)"
              : "var(--vscode-editorWarning-foreground)",
          border:
            "1px solid " +
            (mode === EditorMode.View
              ? "var(--vscode-editorInfo-border)"
              : "var(--vscode-editorWarning-border)"),
          borderRadius: "3px",
          fontSize: "12px",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "box-shadow 0.15s ease, transform 0.15s ease, filter 0.15s ease",
          boxShadow: isHovered
            ? `0 0 0 2px ${
                mode === EditorMode.View
                  ? "var(--vscode-editorInfo-border)"
                  : "var(--vscode-editorWarning-border)"
              }`
            : undefined,
          transform: isHovered ? "translateY(-1px)" : undefined,
          filter: isHovered ? "brightness(1.05)" : undefined,
        }}
      >
        MODE: {mode.toUpperCase()}
      </div>
      {isHovered && (
        <div
          id={keyHintId}
          style={{
            padding: "6px 8px",
            backgroundColor: "var(--vscode-editorWidget-background)",
            color: "var(--vscode-editorWidget-foreground)",
            border: "1px solid var(--vscode-editorWidget-border)",
            borderRadius: "3px",
            fontSize: "11px",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
            pointerEvents: "none",
          }}
        >
          {keyHint}
        </div>
      )}
    </div>
  );
}
