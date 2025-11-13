import { useLineContext } from "../context/line/lineContext";

export default function KeyboardVisualization() {
  const { mode, keyboardState } = useLineContext();
  const { pressedKeys, modifiers } = keyboardState;

  // Fixed table structure with all key combinations
  const keyBindingsTable = [
    {
      key: "J/←",
      base: "Move to Parent",
      shift: null,
      alt: "Move to Parent's Prev Sibling",
      altShift: "Move to Parent's Next Sibling",
    },
    {
      key: "L/↑",
      base: "Move to Prev Sibling",
      shift: "Previous Field",
      alt: "Move Node Up",
      altShift: "Move Into Prev Sibling",
    },
    {
      key: "K/↓",
      base: "Move to Next Sibling",
      shift: "Next Field",
      alt: "Move Node Down",
      altShift: "Move Into Next Sibling",
    },
    {
      key: "Ñ/→",
      base: "Move to First Child",
      shift: "Move to Last Child",
      alt: "Move Into Next Sibling",
      altShift: "Move Into Prev Sibling",
    },
    {
      key: "I",
      base: "Next Field",
      shift: null,
      alt: null,
      altShift: null,
    },
    {
      key: "O",
      base: "Previous Field",
      shift: null,
      alt: null,
      altShift: null,
    },
    {
      key: "Enter",
      base: "Insert Sibling After",
      shift: "Insert Sibling Before",
      alt: null,
      altShift: null,
    },
    {
      key: "Del",
      base: "Delete Node",
      shift: null,
      alt: null,
      altShift: null,
    },
  ];

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

  // Helper to get the active column based on modifiers
  const getActiveColumn = () => {
    const { shift, alt } = modifiers;
    if (alt && shift) return "altShift";
    if (alt) return "alt";
    if (shift) return "shift";
    return "base";
  };

  const activeColumn = getActiveColumn();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "1rem",
        zIndex: 999,
        display: "flex",
        gap: "1rem",
        alignItems: "flex-end",
      }}
    >
      {/* Keyboard visualization */}
      <div
        style={{
          padding: "0.8rem",
          backgroundColor: "var(--vscode-editorWidget-background)",
          border: "1px solid var(--vscode-editorWidget-border)",
          borderRadius: "0.4rem",
          fontSize: "1rem",
          fontFamily: "monospace",
          boxShadow: "0 0.2rem 0.8rem rgba(0, 0, 0, 0.15)",
        }}
      >
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

      {/* Key descriptions table */}
      <div
        style={{
          padding: "0.6rem",
          backgroundColor: "var(--vscode-editorWidget-background)",
          border: "1px solid var(--vscode-editorWidget-border)",
          borderRadius: "0.4rem",
          boxShadow: "0 0.2rem 0.8rem rgba(0, 0, 0, 0.15)",
          fontSize: "0.75rem",
          fontFamily: "monospace",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "3.5rem 1fr 1fr 1fr",
            gap: "0.5rem",
            paddingBottom: "0.4rem",
            borderBottom: "1px solid var(--vscode-editorWidget-border)",
            marginBottom: "0.4rem",
          }}
        >
          <div style={{ fontWeight: "bold", opacity: 0.8 }}>Key</div>
          <div
            style={{
              fontWeight: "bold",
              opacity: activeColumn === "base" ? 1 : 0.5,
              color:
                activeColumn === "base"
                  ? "var(--vscode-textLink-foreground)"
                  : "var(--vscode-editorWidget-foreground)",
            }}
          >
            Base
          </div>
          <div
            style={{
              fontWeight: "bold",
              opacity: activeColumn === "shift" ? 1 : 0.5,
              color:
                activeColumn === "shift"
                  ? "var(--vscode-textLink-foreground)"
                  : "var(--vscode-editorWidget-foreground)",
            }}
          >
            Shift
          </div>
          <div
            style={{
              fontWeight: "bold",
              opacity: activeColumn === "alt" || activeColumn === "altShift" ? 1 : 0.5,
              color:
                activeColumn === "alt" || activeColumn === "altShift"
                  ? "var(--vscode-textLink-foreground)"
                  : "var(--vscode-editorWidget-foreground)",
            }}
          >
            Alt{activeColumn === "altShift" && "+Shift"}
          </div>
        </div>

        {/* Table rows */}
        {keyBindingsTable.map((row, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "3.5rem 1fr 1fr 1fr",
              gap: "0.5rem",
              padding: "0.3rem 0",
              borderBottom:
                index < keyBindingsTable.length - 1
                  ? "1px solid var(--vscode-editorWidget-border)"
                  : "none",
            }}
          >
            <div style={{ fontWeight: "bold", opacity: 0.9 }}>{row.key}</div>
            <div
              style={{
                opacity: activeColumn === "base" ? 0.9 : 0.4,
                color:
                  activeColumn === "base"
                    ? "var(--vscode-editorWidget-foreground)"
                    : "var(--vscode-descriptionForeground)",
              }}
            >
              {row.base || "—"}
            </div>
            <div
              style={{
                opacity: activeColumn === "shift" ? 0.9 : 0.4,
                color:
                  activeColumn === "shift"
                    ? "var(--vscode-editorWidget-foreground)"
                    : "var(--vscode-descriptionForeground)",
              }}
            >
              {row.shift || "—"}
            </div>
            <div
              style={{
                opacity: activeColumn === "alt" || activeColumn === "altShift" ? 0.9 : 0.4,
                color:
                  activeColumn === "alt" || activeColumn === "altShift"
                    ? "var(--vscode-editorWidget-foreground)"
                    : "var(--vscode-descriptionForeground)",
              }}
            >
              {(activeColumn === "altShift" ? row.altShift : row.alt) || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
