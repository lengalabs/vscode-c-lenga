import React from "react";

export interface AutocompleteOption<T> {
  value: T;
  label: string;
  key: string;
  description?: React.ReactNode;
  onSelect: (value: T) => void;
}
interface AutocompleteFieldProps<T> {
  // Current value display
  currentValue: string;
  // In case current value is empty
  placeholder: string;

  // Available options
  options: AutocompleteOption<T>[];

  // Callbacks
  onFocus?: () => void;
  onNoMatch?: (inputText: string) => void; // Called when no valid option matches

  // Focus management
  focusRequest: { nodeId: string; fieldKey: string } | null;
  nodeId: string;
  fieldKey: string;
  clearFocusRequest: () => void;

  // Styling
  className?: string;
  isSelected?: boolean;

  // Mode
  readOnly?: boolean;
}
export function AutocompleteField<T>({
  currentValue,
  placeholder,
  options,
  onFocus,
  onNoMatch,
  focusRequest,
  nodeId,
  fieldKey,
  clearFocusRequest,
  className,
  isSelected = false,
  readOnly = false,
}: AutocompleteFieldProps<T>) {
  const [inputValue, setInputValue] = React.useState(currentValue);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hasFocusedRef = React.useRef(false);

  // Filter options based on input
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Find best match (exact prefix match, then contains match)
  const getBestMatch = (): AutocompleteOption<T> | null => {
    const exact = filteredOptions.find((option) =>
      option.label.toLowerCase().startsWith(inputValue.toLowerCase())
    );
    return exact || filteredOptions[0] || null;
  };

  // Update input value when current value changes
  React.useEffect(() => {
    setInputValue(currentValue);
  }, [currentValue]);

  // Handle focus requests
  React.useEffect(() => {
    if (
      focusRequest &&
      focusRequest.nodeId === nodeId &&
      focusRequest.fieldKey === fieldKey &&
      !hasFocusedRef.current
    ) {
      console.log("Focusing autocomplete field for node:", nodeId, " field:", fieldKey);
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
        hasFocusedRef.current = true;
        clearFocusRequest();
      }
    }
    if (!focusRequest) {
      hasFocusedRef.current = false;
    }
  }, [focusRequest, nodeId, fieldKey, clearFocusRequest]);

  const commitValue = (option: AutocompleteOption<T> | null) => {
    if (option) {
      // Call the option's onSelect callback
      option.onSelect(option.value);
      setInputValue(option.label);
    } else {
      // No match found - call onNoMatch if provided, otherwise revert
      if (onNoMatch) {
        onNoMatch(inputValue);
      }
      setInputValue(currentValue);
    }
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showDropdown) {
        e.stopPropagation();
        if (selectedIndex >= 0) {
          commitValue(filteredOptions[selectedIndex]);
        } else {
          const bestMatch = getBestMatch();
          commitValue(bestMatch);
        }
      }
    } else if (e.key === "Escape") {
      if (showDropdown) {
        e.stopPropagation();
      }
      setShowDropdown(false);
      setSelectedIndex(-1);
      setInputValue(currentValue);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showDropdown) {
        setShowDropdown(true);
        setSelectedIndex(0);
      } else {
        setSelectedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showDropdown) {
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      }
    }

    // if key is letter/number and dropdown not shown, show it
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setShowDropdown(true);
    }
  };

  const handleFocus = () => {
    if (onFocus) {
      onFocus();
    }
  };

  const handleBlur = () => {
    const bestMatch = getBestMatch();
    commitValue(bestMatch);
  };
  const placeholderText = currentValue.length === 0 ? placeholder : currentValue;
  const width = `${inputValue.length === 0 ? placeholderText.length : inputValue.length}ch`;

  // Display description of first or selected option
  const selectedOption: AutocompleteOption<T> | undefined =
    (selectedIndex >= 0 ? filteredOptions[selectedIndex] : filteredOptions[0]) ?? undefined;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <input
        ref={inputRef}
        className={`inline-editor ${className ?? ""}`}
        style={{
          ...(isSelected
            ? {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                boxShadow: "inset 0 -1px 0 0 rgba(163, 209, 252, 0.5)",
              }
            : {}),
          width,
        }}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowDropdown(true);
          setSelectedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholderText}
        readOnly={readOnly}
      />
      {showDropdown && filteredOptions.length > 0 && !readOnly && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "-2px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-3px",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <ScrollableBox>
              {filteredOptions.map((option, index) =>
                ((option: AutocompleteOption<T>, selected: boolean, index: number) => (
                  <div
                    key={option.key}
                    style={{
                      cursor: "pointer",
                      backgroundColor: selected
                        ? "var(--vscode-list-activeSelectionBackground)"
                        : "transparent",
                      color: selected ? "var(--vscode-list-activeSelectionForeground)" : "inherit",
                      padding: "0px 2px",
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commitValue(option);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {option.label}
                  </div>
                ))(option, index === selectedIndex, index)
              )}
            </ScrollableBox>
            {selectedOption.description && (
              <ScrollableBox>{selectedOption.description}</ScrollableBox>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export function ScrollableBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--vscode-dropdown-background)",
        boxShadow: "inset 0 0 0 1px var(--vscode-dropdown-border)",
        borderRadius: "2px",
        padding: "1px",
      }}
    >
      <div
        style={{
          maxHeight: "10rem",
          minWidth: "10rem",
          maxWidth: "20rem",
          overflowY: "auto",
          scrollbarGutter: "stable",
        }}
      >
        {children}
      </div>
    </div>
  );
}
