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
      padding: "8px",
      backgroundColor: "var(--vscode-editorWidget-background)",
      border: "1px solid var(--vscode-editorWidget-border)",
      borderRadius: "4px",
      fontSize: "10px",
      fontFamily: "monospace",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
    };

    switch (position) {
      case "top-left":
        return { ...baseStyles, top: "10px", left: "10px" };
      case "top-right":
        return { ...baseStyles, top: "10px", right: "10px" };
      case "bottom-left":
        return { ...baseStyles, bottom: "10px", left: "10px" };
      case "bottom-right":
        return { ...baseStyles, bottom: "10px", right: "10px" };
      default:
        return { ...baseStyles, top: "10px", left: "10px" };
    }
  };

  const renderKey = (
    key: string,
    arrow?: string,
    isPressed?: boolean,
    width = "24px",
    height = "24px"
  ) => {
    const pressed = isPressed || pressedKeys.has(key.toLowerCase());

    return (
      <div
        key={key}
        style={{
          width,
          height,
          border: pressed
            ? "2px solid var(--vscode-focusBorder)"
            : "1px solid var(--vscode-input-border)",
          borderRadius: "3px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed
            ? "var(--vscode-button-background)"
            : "var(--vscode-input-background)",
          color: pressed ? "var(--vscode-button-foreground)" : "var(--vscode-input-foreground)",
          fontSize: "8px",
          lineHeight: "1",
          transition: "all 0.08s ease",
          cursor: "default",
          userSelect: "none",
          transform: pressed ? "scale(1.1)" : "scale(1)",
          boxShadow: pressed
            ? "0 0 8px rgba(0, 122, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
            : "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ fontSize: "6px", opacity: 0.7 }}>{arrow}</div>
        <div style={{ fontWeight: "bold" }}>{key.toUpperCase()}</div>
      </div>
    );
  };

  const renderModifierKey = (name: string, isActive: boolean, width = "32px") => {
    return (
      <div
        key={name}
        style={{
          width,
          height: "20px",
          border: isActive
            ? "2px solid var(--vscode-focusBorder)"
            : "1px solid var(--vscode-input-border)",
          borderRadius: "3px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isActive
            ? "var(--vscode-button-background)"
            : "var(--vscode-input-background)",
          color: isActive ? "var(--vscode-button-foreground)" : "var(--vscode-input-foreground)",
          fontSize: "7px",
          fontWeight: "bold",
          transition: "all 0.08s ease",
          cursor: "default",
          userSelect: "none",
          transform: isActive ? "scale(1.05)" : "scale(1)",
          boxShadow: isActive
            ? "0 0 6px rgba(0, 122, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
            : "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
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
          gap: "2px",
          marginBottom: "4px",
          justifyContent: "center",
        }}
      >
        {renderKey("o", "↑", undefined, "20px", "20px")}
        {renderKey("i", "↓", undefined, "20px", "20px")}
      </div>

      {/* Main navigation row: j, k, l, n */}
      <div
        style={{
          display: "flex",
          gap: "2px",
          marginBottom: "4px",
        }}
      >
        {renderKey("j", "←")}
        {renderKey("l", "↑")}
        {renderKey("k", "↓")}
        {renderKey("n", "→")}
      </div>

      {/* Modifier keys row */}
      <div
        style={{
          display: "flex",
          gap: "2px",
          justifyContent: "space-between",
        }}
      >
        {renderModifierKey("CTRL", modifiers.ctrl)}
        {renderModifierKey("ALT", modifiers.alt)}
        {renderModifierKey("SHIFT", modifiers.shift, "36px")}
      </div>
    </div>
  );
}
