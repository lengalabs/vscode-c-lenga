import { useLineContext } from "../context/line/lineContext";

interface KeyboardVisualizationProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export default function KeyboardVisualization({
  position = "top-left",
}: KeyboardVisualizationProps) {
  const { mode, keyboardState } = useLineContext();
  const { pressedKeys, modifiers } = keyboardState;

  const getPositionStyles = () => {
    const baseStyles = {
      position: "fixed" as const,
      zIndex: 999,
      padding: "0.8rem",
      backgroundColor: "var(--vscode-editorWidget-background)",
      border: "1px solid var(--vscode-editorWidget-border)",
      borderRadius: "0.4rem",
      fontSize: "1rem",
      fontFamily: "monospace",
      boxShadow: "0 0.2rem 0.8rem rgba(0, 0, 0, 0.15)",
    };

    switch (position) {
      case "top-left":
        return { ...baseStyles, top: "1rem", left: "1rem" };
      case "top-right":
        return { ...baseStyles, top: "1rem", right: "1rem" };
      case "bottom-left":
        return { ...baseStyles, bottom: "1rem", left: "1rem" };
      case "bottom-right":
        return { ...baseStyles, bottom: "1rem", right: "1rem" };
      default:
        return { ...baseStyles, top: "1rem", left: "1rem" };
    }
  };

  const commonKeyStyles = (pressed: boolean) => ({
    border: pressed ? "1px solid rgba(255, 140, 50, 0.4)" : "1px solid var(--vscode-input-border)",
    borderRadius: "0.3rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: pressed ? "var(--vscode-button-background)" : "var(--vscode-input-background)",
    color: pressed ? "var(--vscode-button-foreground)" : "var(--vscode-input-foreground)",
    fontSize: "0.9rem",
    lineHeight: "1",
    transition: "all 0.03s ease",
    cursor: "default",
    transform: pressed ? "translateY(0.15rem) scale(0.98)" : "translateY(0)",
    boxShadow: pressed
      ? "0 0.05rem 0.2rem rgba(255, 140, 50, 0.15), inset 0 0.15rem 0.25rem rgba(0, 0, 0, 0.2)"
      : "0 0.2rem 0.4rem rgba(0, 0, 0, 0.1), inset 0 0.1rem 0 rgba(255, 255, 255, 0.15), inset 0 -0.1rem 0.15rem rgba(0, 0, 0, 0.1)",
  });

  const renderKey = (
    key: string,
    arrow?: string,
    equivalentKeys?: string[],
    width = "2.8rem",
    height = "2.8rem"
  ) => {
    // Check if any equivalent key is pressed
    const keysToCheck = [key, ...(equivalentKeys || [])].map((k) => k.toLowerCase());
    const pressed = keysToCheck.some((k) => pressedKeys.has(k));

    return (
      <div
        key={key}
        style={{
          width,
          height,
          ...commonKeyStyles(pressed),
        }}
      >
        <div style={{ fontSize: "0.6rem", opacity: 0.7 }}>{arrow}</div>
        <div style={{ fontWeight: "bold" }}>{key.toUpperCase()}</div>
      </div>
    );
  };

  const renderModifierKey = (name: string, isActive: boolean, width = "3.2rem") => {
    return (
      <div
        key={name}
        style={{
          width,
          height: "2rem",
          ...commonKeyStyles(isActive),
        }}
      >
        {name}
      </div>
    );
  };

  if (mode !== "view") {
    return null; // Only show in view mode where navigation keys are active
  }

  return (
    <div style={getPositionStyles()}>
      {/* Field navigation row: i, o */}
      <div
        style={{
          display: "flex",
          gap: "0.3rem",
          marginBottom: "0.4rem",
          justifyContent: "center",
        }}
      >
        {renderKey("i", "↓", [], "2.4rem", "2.4rem")}
        {renderKey("o", "↑", [], "2.4rem", "2.4rem")}
      </div>

      {/* Main navigation row: j, k, l, ñ */}
      <div
        style={{
          display: "flex",
          gap: "0.3rem",
          marginBottom: "0.4rem",
        }}
      >
        {renderKey("j", "←", ["arrowleft"])}
        {renderKey("k", "↓", ["arrowdown"])}
        {renderKey("l", "↑", ["arrowup"])}
        {renderKey("ñ", "→", ["arrowright", "n"])}
      </div>

      {/* Modifier keys row */}
      <div
        style={{
          display: "flex",
          gap: "0.3rem",
          justifyContent: "space-between",
        }}
      >
        {renderModifierKey("CTRL", modifiers.ctrl)}
        {renderModifierKey("ALT", modifiers.alt)}
        {renderModifierKey("SHIFT", modifiers.shift, "3.6rem")}
      </div>
    </div>
  );
}
