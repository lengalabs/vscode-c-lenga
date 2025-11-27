import { useEffect, useState } from "react";
import { useLineContext } from "../context/line/lineContext";

type ColumnKey = "base" | "shift" | "ctrl" | "ctrlShift" | "alt" | "altShift";
type ActiveTab = "navigate" | "move";

type KeyBindingRow = {
  key: string;
  equivalents: string[];
  columns: Record<ColumnKey, string | null>;
};

export default function KeyboardVisualization() {
  const { mode, keyboardState } = useLineContext();
  const { pressedKeys, modifiers } = keyboardState;
  const { shift, alt, ctrl } = modifiers;
  const [previousAlt, setPreviousAlt] = useState(alt);

  // Fixed table structure with all key combinations
  const keyBindingsTable: KeyBindingRow[] = [
    {
      key: "J/←",
      equivalents: ["arrowleft"],
      columns: {
        base: "Previous Field",
        shift: null,
        ctrl: "Navigate to Parent",
        ctrlShift: null,
        alt: "Move Node to Parent's Prev Sibling",
        altShift: "Move Node to Parent's Next Sibling",
      },
    },
    {
      key: "L/↑",
      equivalents: ["arrowup"],
      columns: {
        base: "Previous Sibling",
        shift: null,
        ctrl: null,
        ctrlShift: null,
        alt: "Move Node Up",
        altShift: "Move Node Into Prev Sibling",
      },
    },
    {
      key: "K/↓",
      equivalents: ["arrowdown"],
      columns: {
        base: "Next Sibling",
        shift: null,
        ctrl: null,
        ctrlShift: null,
        alt: "Move Node Down",
        altShift: "Move Node Into Next Sibling",
      },
    },
    {
      key: "Ñ/→",
      equivalents: ["arrowright", "n"],
      columns: {
        base: "Next Field",
        shift: null,
        ctrl: "Navigate to First Child",
        ctrlShift: "Navigate to Last Child",
        alt: "Move Node Into Next Sibling",
        altShift: "Move Node Into Prev Sibling",
      },
    },
    {
      key: "Enter",
      equivalents: [],
      columns: {
        base: "Insert Sibling After",
        shift: "Insert Sibling Before",
        ctrl: "Insert Child at Start",
        ctrlShift: "Insert Child at End",
        alt: null,
        altShift: null,
      },
    },
    {
      key: "Del/Backspace",
      equivalents: ["delete", "backspace"],
      columns: {
        base: "Delete Node",
        shift: null,
        ctrl: null,
        ctrlShift: null,
        alt: null,
        altShift: null,
      },
    },
  ];

  const [tab, setTab] = useState<ActiveTab>("navigate");
  const tabDefinitions: Array<{ key: ActiveTab; label: string }> = [
    { key: "navigate", label: "Navigate" },
    { key: "move", label: "Move (Alt)" },
  ];

  const columnsByTab: Record<ActiveTab, Array<{ key: ColumnKey; label: string }>> = {
    navigate: [
      { key: "base", label: "Base" },
      { key: "shift", label: "Shift" },
      { key: "ctrl", label: "Ctrl" },
      { key: "ctrlShift", label: "Ctrl+Shift" },
    ],
    move: [
      { key: "alt", label: "Alt" },
      { key: "altShift", label: "Alt+Shift" },
    ],
  };

  useEffect(() => {
    if (alt === previousAlt) {
      return;
    }
    setPreviousAlt(alt);
    const newMode: ActiveTab = alt ? "move" : "navigate";
    if (tab !== newMode) {
      setTab(newMode);
    }
    return;
  }, [alt, tab, previousAlt, setPreviousAlt]);

  const handleTabSelect = (nextTab: ActiveTab) => {
    setTab(nextTab);
  };

  const tableColumns = columnsByTab[tab];

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
    if (alt && shift && !ctrl) {
      return "altShift";
    }
    if (alt && !shift && !ctrl) {
      return "alt";
    }
    if (ctrl && shift && !alt) {
      return "ctrlShift";
    }
    if (ctrl && !shift && !alt) {
      return "ctrl";
    }
    if (shift && !alt && !ctrl) {
      return "shift";
    }
    if (!alt && !shift && !ctrl) {
      return "base";
    }

    return null;
  };

  const activeColumn = getActiveColumn();

  // Check if a row's key is currently pressed
  const isRowKeyPressed = (row: KeyBindingRow) => {
    const labelKeys = row.key
      .toLowerCase()
      .split("/")
      .map((k) => {
        if (k === "←") return "arrowleft";
        if (k === "↑") return "arrowup";
        if (k === "↓") return "arrowdown";
        if (k === "→") return "arrowright";
        if (k === "del") return "delete";
        return k;
      });

    const allKeys = new Set(
      [...labelKeys, ...(row.equivalents || [])].map((key) => key.toLowerCase())
    );
    return [...allKeys].some((key) => pressedKeys.has(key));
  };

  const columnTemplate = `3.8rem repeat(${tableColumns.length}, 1fr)`;

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
          {renderModifierKey("CTRL", ctrl)}
          {renderModifierKey("ALT", alt)}
          {renderModifierKey("SHIFT", shift, "3.6rem")}
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
        <div
          style={{
            display: "flex",
            gap: "0.4rem",
            marginBottom: "0.5rem",
          }}
        >
          {tabDefinitions.map((tabDefinition) => {
            const isActiveTab = tab === tabDefinition.key;
            return (
              <button
                key={tabDefinition.key}
                type="button"
                onClick={() => handleTabSelect(tabDefinition.key)}
                style={{
                  border: `1px solid var(--vscode-input-border)`,
                  borderRadius: "0.3rem",
                  padding: "0.25rem 0.6rem",
                  backgroundColor: isActiveTab
                    ? "var(--vscode-button-background)"
                    : "var(--vscode-editorWidget-background)",
                  color: isActiveTab
                    ? "var(--vscode-button-foreground)"
                    : "var(--vscode-editorWidget-foreground)",
                  cursor: "pointer",
                  transition: "all 0.1s ease",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                }}
              >
                {tabDefinition.label}
              </button>
            );
          })}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: columnTemplate,
            gap: "0.5rem",
            paddingBottom: "0.4rem",
            borderBottom: "1px solid var(--vscode-editorWidget-border)",
            marginBottom: "0.4rem",
          }}
        >
          <div style={{ fontWeight: "bold", opacity: 0.8 }}>Key</div>
          {tableColumns.map((column) => {
            const isActive = activeColumn === column.key;
            return (
              <div
                key={column.key}
                style={{
                  fontWeight: "bold",
                  opacity: isActive ? 1 : 0.5,
                  color: isActive
                    ? "var(--vscode-textLink-foreground)"
                    : "var(--vscode-editorWidget-foreground)",
                }}
              >
                {column.label}
              </div>
            );
          })}
        </div>

        {keyBindingsTable.map((row, index) => {
          const isPressed = isRowKeyPressed(row);
          return (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: columnTemplate,
                gap: "0.5rem",
                padding: "0.3rem",
                margin: "0 -0.3rem",
                paddingLeft: "0.3rem",
                paddingRight: "0.3rem",
                borderBottom:
                  index < keyBindingsTable.length - 1
                    ? "1px solid var(--vscode-editorWidget-border)"
                    : "none",
                backgroundColor: isPressed ? "rgba(255, 140, 50, 0.1)" : "transparent",
                borderRadius: "0.2rem",
                transition: "all 0.03s ease",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  opacity: isPressed ? 1 : 0.9,
                  color: isPressed
                    ? "rgba(255, 140, 50, 1)"
                    : "var(--vscode-editorWidget-foreground)",
                  transition: "all 0.03s ease",
                }}
              >
                {row.key}
              </div>
              {tableColumns.map((column) => {
                const isActive = activeColumn === column.key;
                const description = row.columns[column.key] || "—";
                const highlight = isPressed && isActive && description !== "—";
                return (
                  <div
                    key={column.key}
                    style={{
                      opacity: isActive ? 0.9 : 0.4,
                      color: isActive
                        ? "var(--vscode-editorWidget-foreground)"
                        : "var(--vscode-descriptionForeground)",
                      backgroundColor: highlight ? "rgba(255, 140, 50, 0.2)" : "transparent",
                      padding: "0.2rem 0.3rem",
                      margin: "-0.2rem -0.3rem",
                      borderRadius: "0.2rem",
                      transition: "all 0.03s ease",
                    }}
                  >
                    {description}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
