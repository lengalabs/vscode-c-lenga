import React from "react";
import Fuse from "fuse.js";
import { EditorMode, useLineContext } from "../../context/line/lineContext";

export interface Option<T> {
  value: T;
  label: string;
  key: string;
  description?: React.ReactNode;
  onSelect: (value: T) => void;
}

interface OptionMatch<T> {
  option: Option<T>;
  matchIndices: number[]; // Indices of matched characters in the label
}

interface Props<T> {
  // Current value display
  currentValue: string;
  // In case current value is empty
  placeholder: string;

  // Available options
  options: Option<T>[];

  // Callbacks
  onFocus?: () => void;
  onNoMatch?: (inputText: string) => void; // Called when no valid option matches

  // Focus management
  nodeId: string;
  fieldKey: string;

  ref: React.RefObject<HTMLInputElement>;

  firstField?: boolean;
  // Styling
  className?: string;
}

export function Field<T>({
  currentValue,
  placeholder,
  options,
  onFocus,
  onNoMatch,
  nodeId,
  fieldKey,
  ref,
  firstField = false,
  className,
}: Props<T>) {
  const { mode, focusRequest, clearFocusRequest } = useLineContext();
  const readOnly = mode === EditorMode.View;

  const [inputValue, setInputValue] = React.useState(currentValue);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const hasFocusedRef = React.useRef(false);

  // Filter options based on input
  const filteredOptions = getMatchingOptions<T>(options, inputValue);

  // Find best match (exact prefix match, then contains match)
  const getBestMatch = (): OptionMatch<T> | null => {
    if (inputValue.length === 0) {
      return null;
    }
    return filteredOptions[0] || null;
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
      (firstField || focusRequest.fieldKey === fieldKey) &&
      !hasFocusedRef.current
    ) {
      console.log("Focusing autocomplete field for node:", nodeId, " field:", fieldKey);
      if (ref.current) {
        ref.current.focus();
        ref.current.select();
        hasFocusedRef.current = true;
        clearFocusRequest();
      }
    }
    if (!focusRequest) {
      hasFocusedRef.current = false;
    }
  }, [focusRequest, nodeId, fieldKey, clearFocusRequest, firstField, ref]);

  const commitValue = (matchedOption: OptionMatch<T> | null) => {
    if (matchedOption) {
      // Call the option's onSelect callback
      matchedOption.option.onSelect(matchedOption.option.value);
      setInputValue(matchedOption.option.label);
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
  const selectedMatchedOption: OptionMatch<T> | undefined =
    (selectedIndex >= 0 ? filteredOptions[selectedIndex] : filteredOptions[0]) ?? undefined;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <input
        ref={ref}
        className={`inline-editor ${className ?? ""}`}
        style={{
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
            <ScrollableBox style={{ maxHeight: "15rem", minWidth: "10ch", maxWidth: "40ch" }}>
              {filteredOptions.map((matchedOption, index) =>
                ((matchedOption: OptionMatch<T>, selected: boolean, index: number) => (
                  <div
                    key={matchedOption.option.key}
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
                      commitValue(matchedOption);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {renderHighlightedText(matchedOption.option.label, matchedOption.matchIndices)}
                  </div>
                ))(matchedOption, index === selectedIndex, index)
              )}
            </ScrollableBox>
            {selectedMatchedOption?.option.description && (
              <ScrollableBox style={{ maxHeight: "10rem", width: "60ch" }}>
                {selectedMatchedOption.option.description}
              </ScrollableBox>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function renderHighlightedText(label: string, matchIndices: number[]): React.ReactNode {
  if (matchIndices.length === 0) {
    return label;
  }

  const parts: React.ReactNode[] = [];
  const matchSet = new Set(matchIndices);

  for (let i = 0; i < label.length; i++) {
    const char = label[i];
    if (matchSet.has(i)) {
      parts.push(
        <span key={i} style={{ fontWeight: "bold", textDecoration: "underline" }}>
          {char}
        </span>
      );
    } else {
      // Combine consecutive non-matching characters
      if (parts.length > 0 && typeof parts[parts.length - 1] === "string") {
        parts[parts.length - 1] = (parts[parts.length - 1] as string) + char;
      } else {
        parts.push(char);
      }
    }
  }

  return <>{parts}</>;
}

function getMatchingOptions<T>(options: Option<T>[], inputValue: string): OptionMatch<T>[] {
  if (inputValue.length === 0) {
    return options.map((option) => ({ option, matchIndices: [] }));
  }

  const lowerInput = inputValue.toLowerCase();

  // Categorize options (case-sensitive first, then case-insensitive)
  const exactMatchesCS: OptionMatch<T>[] = [];
  const exactMatchesCI: OptionMatch<T>[] = [];
  const startsWithMatchesCS: OptionMatch<T>[] = [];
  const startsWithMatchesCI: OptionMatch<T>[] = [];
  const containsMatchesCS: OptionMatch<T>[] = [];
  const containsMatchesCI: OptionMatch<T>[] = [];
  const remainingOptions: Option<T>[] = [];

  for (const option of options) {
    const label = option.label;
    const lowerLabel = label.toLowerCase();

    // Exact matches
    if (label === inputValue) {
      const matchIndices = Array.from({ length: label.length }, (_, i) => i);
      exactMatchesCS.push({ option, matchIndices });
    } else if (lowerLabel === lowerInput) {
      const matchIndices = Array.from({ length: label.length }, (_, i) => i);
      exactMatchesCI.push({ option, matchIndices });
    }
    // Starts with
    else if (label.startsWith(inputValue)) {
      const matchIndices = Array.from({ length: inputValue.length }, (_, i) => i);
      startsWithMatchesCS.push({ option, matchIndices });
    } else if (lowerLabel.startsWith(lowerInput)) {
      const matchIndices = Array.from({ length: inputValue.length }, (_, i) => i);
      startsWithMatchesCI.push({ option, matchIndices });
    }
    // Contains
    else if (label.includes(inputValue)) {
      const startIndex = label.indexOf(inputValue);
      const matchIndices = Array.from({ length: inputValue.length }, (_, i) => startIndex + i);
      containsMatchesCS.push({ option, matchIndices });
    } else if (lowerLabel.includes(lowerInput)) {
      const startIndex = lowerLabel.indexOf(lowerInput);
      const matchIndices = Array.from({ length: inputValue.length }, (_, i) => startIndex + i);
      containsMatchesCI.push({ option, matchIndices });
    } else {
      remainingOptions.push(option);
    }
  }

  // Fuzzy search on remaining options
  let fuzzyMatches: OptionMatch<T>[] = [];
  if (remainingOptions.length > 0) {
    const fuse = new Fuse(remainingOptions, {
      keys: ["label"],
      threshold: 0.4, // Lower is more strict (0.0 = exact match, 1.0 = match anything)
      includeScore: true,
      includeMatches: true,
    });

    const results = fuse.search(inputValue);
    fuzzyMatches = results.map((result) => {
      const matchIndices: number[] = [];
      // Extract match indices from Fuse.js results
      if (result.matches && result.matches.length > 0) {
        for (const match of result.matches) {
          if (match.indices) {
            for (const [start, end] of match.indices) {
              for (let i = start; i <= end; i++) {
                matchIndices.push(i);
              }
            }
          }
        }
      }
      return { option: result.item, matchIndices };
    });
  }

  // Combine all matches in priority order
  return [
    ...exactMatchesCS,
    ...exactMatchesCI,
    ...startsWithMatchesCS,
    ...startsWithMatchesCI,
    ...containsMatchesCS,
    ...containsMatchesCI,
    ...fuzzyMatches,
  ];
}

export function ScrollableBox({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
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
          ...style,
          overflowY: "auto",
          scrollbarGutter: "stable",
        }}
      >
        {children}
      </div>
    </div>
  );
}
