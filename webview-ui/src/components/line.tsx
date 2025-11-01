import React from "react";
import { useLineContext, ParentInfo, NodeCallbacks } from "./context";
import * as objects from "../../../src/language_objects/cNodes";
import "./index.css";
import { childInfo } from "./childInfo";
import { createKeyDownHandler } from "../lib/keyBinds";
import {
  createArrayFieldCallbacks,
  createOptionalFieldCallbacks,
  insertUnknownIntoField,
  createRequiredFieldCallbacks,
  createParameter,
  appendToArray,
  createUnknown,
  prependToArray,
} from "../lib/editionHelpers";

// Valid C types for the type selector
const C_TYPES = [
  "void",
  "int",
  // "char",
  // "float",
  // "double",
  // "short",
  // "long",
  // "unsigned char",
  // "unsigned int",
  // "unsigned short",
  // "unsigned long",
  // "signed char",
  // "signed int",
  // "signed short",
  // "signed long",
  // "long long",
  // "unsigned long long",
  // "size_t",
  // "ptrdiff_t",
];

// Interface for available declarations that can be referenced
interface AvailableDeclaration {
  id: string;
  identifier: string;
  type: "variable" | "parameter" | "function";
}

/**
 * Find all declarations that are in scope at the given reference position.
 * In C, a variable can only be referenced if:
 * 1. It's declared before the current position in the same scope or parent scope
 * 2. It's a function parameter (available throughout the function body)
 * 3. It's a function declaration/definition (available globally)
 */
function findDeclarationsInScope(
  referenceNodeId: string,
  nodeMap: Map<string, objects.LanguageObject>,
  parentMap: Map<string, ParentInfo>
): AvailableDeclaration[] {
  const declarations: AvailableDeclaration[] = [];
  const referenceParentInfo = parentMap.get(referenceNodeId);

  if (!referenceParentInfo) {
    return declarations;
  }

  // Helper to check if a node comes before another in the same array
  const comesBefore = (nodeId: string, currentParentInfo: ParentInfo): boolean => {
    const nodeInfo = parentMap.get(nodeId);
    if (!nodeInfo) return false;

    // Must be in the same parent array
    if (
      nodeInfo.parent.id !== currentParentInfo.parent.id ||
      nodeInfo.key !== currentParentInfo.key
    ) {
      return false;
    }

    // Check index
    return nodeInfo.index < currentParentInfo.index;
  };

  // Helper to get all ancestors of a node (for scope chain)
  const getAncestors = (nodeId: string): objects.LanguageObject[] => {
    const ancestors: objects.LanguageObject[] = [];
    let currentId = nodeId;

    while (true) {
      const parentInfo = parentMap.get(currentId);
      if (!parentInfo) break;
      ancestors.push(parentInfo.parent);
      currentId = parentInfo.parent.id;
    }

    return ancestors;
  };

  // Get the scope chain (ancestors) of the reference
  const scopeChain = getAncestors(referenceNodeId);

  // 1. Find function declarations and definitions (globally available)
  nodeMap.forEach((node) => {
    if (node.type === "functionDeclaration" || node.type === "functionDefinition") {
      const funcNode = node as objects.FunctionDeclaration | objects.FunctionDefinition;
      declarations.push({
        id: node.id,
        identifier: funcNode.identifier,
        type: "function",
      });
    }
  });

  // 2. Find function parameters if we're inside a function
  const enclosingFunction = scopeChain.find(
    (ancestor) => ancestor.type === "functionDefinition"
  ) as objects.FunctionDefinition | undefined;

  if (enclosingFunction) {
    enclosingFunction.parameterList.forEach((param) => {
      declarations.push({
        id: param.id,
        identifier: param.identifier,
        type: "parameter",
      });
    });
  }

  // 3. Find variable declarations in the current scope and parent scopes
  // We need to traverse each scope in the chain and find declarations that come before our position
  for (const scopeNode of scopeChain) {
    if (scopeNode.type === "compoundStatement") {
      const compStmt = scopeNode as objects.CompoundStatement;

      // Find declarations in this scope that come before the reference
      compStmt.codeBlock.forEach((stmt) => {
        if (stmt.type === "declaration") {
          const decl = stmt as objects.Declaration;

          // Check if this declaration comes before our reference
          // We need to traverse up from the reference to see if we're in this scope
          let currentNode = nodeMap.get(referenceNodeId);
          let currentParentInfo = referenceParentInfo;

          // Walk up until we find the scope or reach root
          while (currentNode && currentParentInfo) {
            if (currentParentInfo.parent.id === scopeNode.id) {
              // We're in this scope - check if declaration comes before
              if (comesBefore(stmt.id, currentParentInfo)) {
                declarations.push({
                  id: decl.id,
                  identifier: decl.identifier,
                  type: "variable",
                });
              }
              break;
            }
            // Move up one level
            currentNode = currentParentInfo.parent;
            const nextParentInfo = parentMap.get(currentNode.id);
            if (!nextParentInfo) break;
            currentParentInfo = nextParentInfo;
          }
        }
      });
    } else if (scopeNode.type === "sourceFile") {
      // Global scope - find all declarations that come before
      const sourceFile = scopeNode as objects.SourceFile;

      sourceFile.code.forEach((stmt) => {
        if (stmt.type === "declaration") {
          const decl = stmt as objects.Declaration;

          // For global scope, check if it comes before the reference
          // Find where in the tree our reference appears
          let currentNode = nodeMap.get(referenceNodeId);
          let currentParentInfo = referenceParentInfo;

          while (currentNode && currentParentInfo) {
            if (currentParentInfo.parent.id === sourceFile.id) {
              if (comesBefore(stmt.id, currentParentInfo)) {
                declarations.push({
                  id: decl.id,
                  identifier: decl.identifier,
                  type: "variable",
                });
              }
              break;
            }
            currentNode = currentParentInfo.parent;
            const nextParentInfo = parentMap.get(currentNode.id);
            if (!nextParentInfo) break;
            currentParentInfo = nextParentInfo;
          }
        }
      });
    }
  }

  // Remove duplicates (in case a declaration is found multiple times)
  const seen = new Set<string>();
  return declarations.filter((decl) => {
    if (seen.has(decl.id)) return false;
    seen.add(decl.id);
    return true;
  });
}

// ============================================================================
// Generic Autocomplete Field Component
// ============================================================================

interface AutocompleteOption<T> {
  value: T;
  label: string;
  key: string;
  onSelect: (value: T) => void;
}

interface AutocompleteFieldProps<T> {
  // Current value display
  currentValue: string;

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

  // Custom option renderer (optional)
  // Receives: option, isSelected flag, index, and setSelectedIndex callback
  renderOption?: (
    option: AutocompleteOption<T>,
    isSelected: boolean,
    index: number,
    setSelectedIndex: (index: number) => void
  ) => React.ReactNode;
}

function AutocompleteField<T>({
  currentValue,
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
  renderOption,
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
      if (showDropdown && selectedIndex >= 0) {
        e.stopPropagation();
        commitValue(filteredOptions[selectedIndex]);
      } else {
        const bestMatch = getBestMatch();
        commitValue(bestMatch);
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
  };

  const handleFocus = () => {
    if (onFocus) {
      onFocus();
    }
    setShowDropdown(true);
  };

  const handleBlur = () => {
    // Delay to allow dropdown clicks
    setTimeout(() => {
      const bestMatch = getBestMatch();
      commitValue(bestMatch);
    }, 150);
  };

  const width = `${inputValue.length === 0 ? currentValue.length : inputValue.length}ch`;

  // Default option renderer
  const defaultRenderOption = (option: AutocompleteOption<T>, selected: boolean, index: number) => (
    <div
      key={option.key}
      style={{
        padding: "4px 8px",
        cursor: "pointer",
        backgroundColor: selected ? "var(--vscode-list-activeSelectionBackground)" : "transparent",
        color: selected ? "var(--vscode-list-activeSelectionForeground)" : "inherit",
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        commitValue(option);
      }}
      onMouseEnter={() => setSelectedIndex(index)}
    >
      {option.label}
    </div>
  );

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
        placeholder={currentValue}
        readOnly={readOnly}
      />
      {showDropdown && filteredOptions.length > 0 && !readOnly && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            background: "var(--vscode-dropdown-background)",
            border: "1px solid var(--vscode-dropdown-border)",
            borderRadius: "3px",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1000,
            minWidth: "100%",
          }}
        >
          {filteredOptions.map((option, index) =>
            renderOption
              ? renderOption(option, index === selectedIndex, index, setSelectedIndex)
              : defaultRenderOption(option, index === selectedIndex, index)
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Type Selector (uses AutocompleteField)
// ============================================================================

interface TypeSelectorProps<T extends objects.LanguageObject, K extends string & keyof T> {
  node: T;
  key: K;
  parentInfo: ParentInfo;
  className?: string;
}

function TypeSelector<T extends objects.LanguageObject, K extends string & keyof T>({
  node,
  key,
  parentInfo,
  className,
}: TypeSelectorProps<T, K>) {
  const {
    selectedNodeId,
    selectedKey,
    onEdit,
    setSelectedNodeId,
    setSelectedKey,
    setParentNodeInfo,
    focusRequest,
    clearFocusRequest,
    mode,
  } = useLineContext();

  const isSelected = selectedNodeId === node.id && selectedKey && selectedKey === key;
  const currentValue = String(node[key] ?? "");

  // Convert C_TYPES to AutocompleteOption format
  const options: AutocompleteOption<string>[] = C_TYPES.map((type) => ({
    value: type,
    label: type,
    key: type,
    onSelect: (selectedType: string) => {
      node[key] = selectedType as T[K];
      onEdit(node, key);
    },
  }));

  const handleNoMatch = (inputText: string) => {
    // Check if input is a valid type despite not being in filtered options
    const isValidType = C_TYPES.includes(inputText);
    if (isValidType) {
      node[key] = inputText as T[K];
      onEdit(node, key);
    } else if (inputText.trim() === "") {
      // Empty input - revert to current value (do nothing)
    } else {
      // Invalid type - revert to current value (do nothing)
    }
  };

  const handleFocus = () => {
    setSelectedKey(key);
    setSelectedNodeId(node.id);
    setParentNodeInfo(parentInfo);
  };

  return (
    <AutocompleteField
      currentValue={currentValue}
      options={options}
      onNoMatch={handleNoMatch}
      onFocus={handleFocus}
      focusRequest={focusRequest}
      nodeId={node.id}
      fieldKey={key}
      clearFocusRequest={clearFocusRequest}
      className={className}
      isSelected={!!isSelected}
      readOnly={mode === "view"}
    />
  );
}

// ============================================================================
// Reference Selector (uses AutocompleteField)
// ============================================================================

interface ReferenceSelectorProps {
  node: objects.Reference;
  parentInfo: ParentInfo;
  callbacks?: NodeCallbacks;
  className?: string;
}

function ReferenceSelector({ node, parentInfo, className, callbacks }: ReferenceSelectorProps) {
  const {
    onEdit,
    setSelectedNodeId,
    setSelectedKey,
    setParentNodeInfo,
    focusRequest,
    clearFocusRequest,
    mode,
    nodeMap,
    parentMap,
  } = useLineContext();

  const [availableDeclarations, setAvailableDeclarations] = React.useState<AvailableDeclaration[]>(
    []
  );

  // Get the current identifier from the target declaration
  const targetDecl = nodeMap.get(node.declarationId);
  const currentIdentifier =
    targetDecl && "identifier" in targetDecl ? String(targetDecl.identifier) : "";

  // Convert AvailableDeclaration to AutocompleteOption format
  const options: AutocompleteOption<AvailableDeclaration>[] = availableDeclarations.map((decl) => ({
    value: decl,
    label: decl.identifier,
    key: decl.id,
    onSelect: (selectedDecl: AvailableDeclaration) => {
      switch (selectedDecl.type) {
        case "function": {
          // Replace Reference with CallExpression
          console.log(
            "Converting Reference to CallExpression for function:",
            selectedDecl.identifier
          );

          const newCallExpression: objects.CallExpression = {
            id: crypto.randomUUID(),
            type: "callExpression",
            idDeclaration: selectedDecl.id,
            identifier: selectedDecl.identifier,
            argumentList: [],
          };

          nodeMap.set(newCallExpression.id, newCallExpression);
          nodeMap.delete(node.id);

          // Replace in parent
          if (callbacks?.onReplace) {
            callbacks.onReplace(node, newCallExpression);
          }
          break;
        }
        case "variable":
        case "parameter":
          // Update reference to point to variable/parameter
          node.declarationId = selectedDecl.id;
          onEdit(node, "declarationId");
      }
    },
  }));

  const handleFocus = () => {
    setSelectedKey("declarationId");
    setSelectedNodeId(node.id);
    setParentNodeInfo(parentInfo);

    // Find available declarations when focused
    const declarations = findDeclarationsInScope(node.id, nodeMap, parentMap);
    setAvailableDeclarations(declarations);
  };

  const isSelected = focusRequest?.nodeId === node.id && focusRequest?.fieldKey === "declarationId";

  return (
    <AutocompleteField
      currentValue={currentIdentifier}
      options={options}
      onFocus={handleFocus}
      focusRequest={focusRequest}
      nodeId={node.id}
      fieldKey="declarationId"
      clearFocusRequest={clearFocusRequest}
      className={className}
      isSelected={!!isSelected}
      readOnly={mode === "view"}
      renderOption={(option, isSelected, index, setSelectedIndex) => (
        <div
          key={option.key}
          style={{
            padding: "4px 8px",
            cursor: "pointer",
            backgroundColor: isSelected
              ? "var(--vscode-list-activeSelectionBackground)"
              : "transparent",
            color: isSelected
              ? "var(--vscode-list-activeSelectionForeground)"
              : "var(--vscode-dropdown-foreground)",
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            option.onSelect(option.value);
          }}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span style={{ fontWeight: "bold" }}>{option.value.identifier}</span>
          <span
            style={{
              marginLeft: "8px",
              fontSize: "0.9em",
              opacity: 0.7,
            }}
          >
            ({option.value.type})
          </span>
        </div>
      )}
    />
  );
}

// Hook to handle focus requests for structural nodes (nodes with tabIndex={0})
function useFocusStructuralNode(nodeId: string) {
  const { focusRequest, clearFocusRequest } = useLineContext();
  const nodeRef = React.useRef<HTMLElement>(null);
  const hasFocusedRef = React.useRef(false);

  React.useEffect(() => {
    if (
      focusRequest &&
      focusRequest.nodeId === nodeId &&
      focusRequest.fieldKey === "" && // Empty string means focus the node itself
      !hasFocusedRef.current
    ) {
      console.log("Focusing structural node:", nodeId);
      if (nodeRef.current) {
        nodeRef.current.focus();
        hasFocusedRef.current = true;
        clearFocusRequest();
      }
    }
    // Reset the flag when focus request changes
    if (!focusRequest) {
      hasFocusedRef.current = false;
    }
  }, [focusRequest, nodeId, clearFocusRequest]);

  return nodeRef;
}

interface EditableFieldProps<T extends objects.LanguageObject, K extends string & keyof T> {
  node: T;
  key: K;
  parentInfo: ParentInfo;
  className?: string;
  placeholder: string;
}

function EditableField<T extends objects.LanguageObject, K extends string & keyof T>({
  node,
  key,
  parentInfo,
  className,
  placeholder,
}: EditableFieldProps<T, K>) {
  const {
    selectedNodeId,
    selectedKey,
    onEdit,
    setSelectedNodeId,
    setSelectedKey,
    setParentNodeInfo,
    focusRequest,
    clearFocusRequest,
    mode,
  } = useLineContext();
  const isSelected = selectedNodeId === node.id && selectedKey && selectedKey === key;
  const [inputValue, setInputValue] = React.useState(String(node[key] ?? ""));
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hasFocusedRef = React.useRef(false);

  React.useEffect(() => {
    setInputValue(String(node[key] ?? ""));
  }, [node, key]);

  // React to focus requests - only focus once per request
  React.useEffect(() => {
    if (
      focusRequest &&
      focusRequest.nodeId === node.id &&
      focusRequest.fieldKey === key &&
      !hasFocusedRef.current
    ) {
      console.log("Focusing input for node:", node.id, " key:", key);
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
        hasFocusedRef.current = true;
        // Clear the focus request after handling it
        clearFocusRequest();
      }
    }
    // Reset the flag when focus request changes
    if (!focusRequest) {
      hasFocusedRef.current = false;
    }
  }, [focusRequest, node.id, key, clearFocusRequest]);

  // width in ch units, at least 1ch
  const width =
    (inputValue.length === 0 ? placeholder.length : Math.max(1, inputValue.length)) + "ch";

  return (
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
        width, // dynamically set width in ch
      }}
      value={inputValue}
      placeholder={placeholder}
      onChange={(e) => setInputValue(e.target.value)}
      onFocus={() => {
        setSelectedKey(key);
        setSelectedNodeId(node.id);
        setParentNodeInfo(parentInfo);
      }}
      onBlur={() => {
        node[key] = inputValue as T[K];
        onEdit(node, key);
      }}
      readOnly={mode === "view"}
    />
  );
}

interface ObjectProps {
  node: objects.LanguageObject;
  parentInfo: ParentInfo;
  children: React.ReactNode;
  display?: "inline" | "block";
  callbacks?: NodeCallbacks;
}

export function Object({ node, parentInfo, children, display = "block", callbacks }: ObjectProps) {
  const { selectedNodeId, setSelectedNodeId, setParentNodeInfo, setSelectedKey, mode } =
    useLineContext();
  const isSelected = selectedNodeId === node.id;

  const handleKeyDown = createKeyDownHandler(mode, {
    view: {
      insertSibling: () => {
        if (isSelected && callbacks?.onInsertSibling) {
          console.log("Object: Inserting sibling for", node.type);
          callbacks.onInsertSibling(node);
        }
      },
      insertSiblingBefore: () => {
        if (isSelected && callbacks?.onInsertSiblingBefore) {
          console.log("Object: Inserting sibling before", node.type);
          callbacks.onInsertSiblingBefore(node);
        }
      },
      delete: () => {
        if (isSelected && callbacks?.onDelete) {
          console.log("Object: Deleting", node.type);
          callbacks.onDelete(node);
        }
      },
    },
    edit: {
      insertFirst: () => {
        if (isSelected && callbacks?.onInsertFirst) {
          console.log("Object: Inserting at beginning for", node.type);
          callbacks.onInsertFirst();
        }
      },
      insertLast: () => {
        if (isSelected && callbacks?.onInsertLast) {
          console.log("Object: Inserting at end for", node.type);
          callbacks.onInsertLast();
        }
      },
    },
  });

  const Element = display === "inline" ? "span" : "div";

  return (
    <Element
      onKeyDown={handleKeyDown}
      className={`object-container object-container-${display} ${
        isSelected ? "object-selected" : ""
      }`}
      onFocus={(e) => {
        e.stopPropagation();
        setSelectedNodeId(node.id);
        setSelectedKey(parentInfo.key);
        setParentNodeInfo(parentInfo);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNodeId(node.id);
      }}
    >
      {children}
    </Element>
  );
}

interface NodeRenderProps {
  node: objects.LanguageObject;
  parentInfo: ParentInfo;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}

interface XRenderProps<T extends objects.LanguageObject> extends NodeRenderProps {
  node: T;
}

export function NodeRender(props: NodeRenderProps): React.ReactNode {
  switch (props.node.type) {
    case "preprocInclude":
      return <PreprocIncludeRender {...(props as XRenderProps<objects.PreprocInclude>)} />;
    case "functionParameter":
      return <FunctionParameterRender {...(props as XRenderProps<objects.FunctionParameter>)} />;
    case "functionDeclaration":
      return (
        <FunctionDeclarationRender {...(props as XRenderProps<objects.FunctionDeclaration>)} />
      );
    case "functionDefinition":
      return <FunctionDefinitionRender {...(props as XRenderProps<objects.FunctionDefinition>)} />;
    case "declaration":
      return <DeclarationRender {...(props as XRenderProps<objects.Declaration>)} />;
    case "returnStatement":
      return <ReturnStatementRender {...(props as XRenderProps<objects.ReturnStatement>)} />;
    case "compoundStatement":
      return <CompoundStatementRender {...(props as XRenderProps<objects.CompoundStatement>)} />;
    case "callExpression":
      return <CallExpressionRender {...(props as XRenderProps<objects.CallExpression>)} />;
    case "reference":
      return <ReferenceRender {...(props as XRenderProps<objects.Reference>)} />;
    case "assignmentExpression":
      return (
        <AssignmentExpressionRender {...(props as XRenderProps<objects.AssignmentExpression>)} />
      );
    case "numberLiteral":
      return <NumberLiteralRender {...(props as XRenderProps<objects.NumberLiteral>)} />;
    case "stringLiteral":
      return <StringLiteralRender {...(props as XRenderProps<objects.StringLiteral>)} />;
    case "binaryExpression":
      return <BinaryExpressionRender {...(props as XRenderProps<objects.BinaryExpression>)} />;
    case "ifStatement":
      return <IfStatementRender {...(props as XRenderProps<objects.IfStatement>)} />;
    case "elseClause":
      return <ElseClauseRender {...(props as XRenderProps<objects.ElseClause>)} />;
    case "unknown":
      return <UnknownRender {...(props as XRenderProps<objects.Unknown>)} />;
    case "comment":
      return <CommentRender {...(props as XRenderProps<objects.Comment>)} />;
    default:
      return "WIP";
  }
}

function UnknownRender(props: XRenderProps<objects.Unknown>): React.ReactNode {
  const { mode, onRequestAvailableInserts, availableInserts } = useLineContext();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLSelectElement>(null);

  // When in edit mode and Enter is pressed, request available inserts
  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insertFirst: () => {
        console.log("UnknownRender: Requesting available inserts");
        // Get parent info from the map
        const parent = props.parentInfo.parent;
        const key = props.parentInfo.key;
        onRequestAvailableInserts(parent.id, key);
        setShowDropdown(true);
      },
    },
  });

  // Focus the dropdown when it appears and options are loaded
  React.useEffect(() => {
    if (showDropdown && availableInserts && availableInserts.length > 0 && dropdownRef.current) {
      dropdownRef.current.focus();
    }
  }, [showDropdown, availableInserts]);

  const commitSelection = () => {
    if (!dropdownRef.current) {
      console.log("Dropdown ref not set");
      return;
    }

    const selectedIndex = parseInt(dropdownRef.current.value);
    if (availableInserts && selectedIndex >= 0) {
      const selectedOption = availableInserts[selectedIndex];
      console.log("Selected option to insert:", selectedOption);

      // Use the replace callback if provided
      if (props.callbacks?.onReplace) {
        props.callbacks.onReplace(props.node, selectedOption);
      } else {
        console.warn("No onReplace callback provided for UnknownRender");
      }

      setShowDropdown(false);
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      commitSelection();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      e.preventDefault();
      setShowDropdown(false);
    }
  };

  const handleDropdownClick = () => {
    // Commit the selection when user clicks on an option
    commitSelection();
  };

  const content = (
    <span onKeyDown={handleKeyDown}>
      {EditableField({
        node: props.node,
        key: "content",
        parentInfo: props.parentInfo,
        placeholder: "value",
      })}
      {showDropdown && availableInserts && availableInserts.length > 0 && (
        <select
          ref={dropdownRef}
          onKeyDown={handleDropdownKeyDown}
          onClick={handleDropdownClick}
          onBlur={() => setShowDropdown(false)}
          size={Math.min(10, availableInserts.length)}
          style={{
            position: "absolute",
            zIndex: 1000,
            backgroundColor: "var(--vscode-dropdown-background)",
            color: "var(--vscode-dropdown-foreground)",
            border: "1px solid var(--vscode-dropdown-border)",
          }}
        >
          <option value="-1">-- Select an option --</option>
          {availableInserts.map((option, idx) => (
            <option key={idx} value={idx}>
              {option.type}
            </option>
          ))}
        </select>
      )}
    </span>
  );

  return <Object {...props}>{content}</Object>;
}

function PreprocIncludeRender({
  node,
  parentInfo,
  callbacks,
  display = "block",
}: XRenderProps<objects.PreprocInclude>): React.ReactNode {
  const content = (
    <>
      <span className="token-keyword">#include</span>{" "}
      {EditableField({
        node,
        key: "content",
        parentInfo,
        className: "token-string",
        placeholder: "file.h",
      })}
    </>
  );

  return (
    <Object node={node} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function FunctionDeclarationRender(
  props: XRenderProps<objects.FunctionDeclaration>
): React.ReactNode {
  const { nodeMap, onEdit, requestFocus, mode } = useLineContext();
  nodeMap.set(props.node.id, props.node);

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insertFirst: () => {
        console.log("FunctionDeclarationRender: Prepending parameter");
        prependToArray(props.node, "parameterList", createParameter, nodeMap, onEdit, requestFocus);
      },
      insertLast: () => {
        console.log("FunctionDeclarationRender: Appending parameter");
        appendToArray(props.node, "parameterList", createParameter, nodeMap, onEdit, requestFocus);
      },
    },
  });

  const content = (
    <span onKeyDown={handleKeyDown}>
      {TypeSelector({
        node: props.node,
        key: "returnType",
        parentInfo: props.parentInfo,
        className: "token-type",
      })}{" "}
      {EditableField({
        node: props.node,
        key: "identifier",
        parentInfo: props.parentInfo,
        className: "token-function",
        placeholder: "function_name",
      })}
      <span className="token-delimiter">{"("}</span>
      {props.node.parameterList.map((param, i) => (
        <React.Fragment key={param.id}>
          {i > 0 && ", "}
          <NodeRender
            node={param}
            parentInfo={childInfo(props.node, "parameterList", i)}
            callbacks={createArrayFieldCallbacks(
              props.node,
              "parameterList",
              i,
              createParameter,
              nodeMap,
              onEdit,
              requestFocus
            )}
            display="inline"
          />
        </React.Fragment>
      ))}
      <span className="token-delimiter">{")"}</span>
    </span>
  );

  return <Object {...props}>{content}</Object>;
}

function FunctionDefinitionRender(
  props: XRenderProps<objects.FunctionDefinition>
): React.ReactNode {
  const { nodeMap, onEdit, requestFocus, mode } = useLineContext();
  nodeMap.set(props.node.id, props.node);

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insertFirst: () => {
        console.log("FunctionDefinitionRender: Prepending parameter");
        prependToArray(props.node, "parameterList", createParameter, nodeMap, onEdit, requestFocus);
      },
      insertLast: () => {
        console.log("FunctionDefinitionRender: Appending parameter");
        appendToArray(props.node, "parameterList", createParameter, nodeMap, onEdit, requestFocus);
      },
    },
  });

  const content = (
    <span onKeyDown={handleKeyDown}>
      {TypeSelector({
        node: props.node,
        key: "returnType",
        parentInfo: props.parentInfo,
        className: "token-type",
      })}{" "}
      {EditableField({
        node: props.node,
        key: "identifier",
        parentInfo: props.parentInfo,
        className: "token-function",
        placeholder: "function_name",
      })}
      <span className="token-delimiter">{"("}</span>
      {props.node.parameterList.map((param, i) => (
        <React.Fragment key={param.id}>
          {i > 0 && ", "}
          <NodeRender
            node={param}
            parentInfo={childInfo(props.node, "parameterList", i)}
            display="inline"
            callbacks={createArrayFieldCallbacks(
              props.node,
              "parameterList",
              i,
              createParameter,
              nodeMap,
              onEdit,
              requestFocus
            )}
          />
        </React.Fragment>
      ))}
      <span className="token-delimiter">{")"}</span>
      {props.node.compoundStatement && (
        <NodeRender
          node={props.node.compoundStatement}
          parentInfo={childInfo(props.node, "compoundStatement")}
          // callbacks={} TODO: transform into FunctionDeclaration on delete
        />
      )}
    </span>
  );

  return <Object {...props}>{content}</Object>;
}

function DeclarationRender(props: XRenderProps<objects.Declaration>): React.ReactNode {
  const { nodeMap, onEdit, mode, requestFocus } = useLineContext();
  nodeMap.set(props.node.id, props.node);

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insertFirst: () => {
        if (!props.node.value) {
          console.log("DeclarationRender: Inserting unknown node as value");
          insertUnknownIntoField(props.node, "value", nodeMap, onEdit, requestFocus);
        }
      },
    },
  });

  const content = (
    <span onKeyDown={handleKeyDown}>
      {TypeSelector({
        node: props.node,
        key: "primitiveType",
        parentInfo: props.parentInfo,
        className: "token-type",
      })}{" "}
      {EditableField({
        node: props.node,
        key: "identifier",
        parentInfo: props.parentInfo,
        className: "token-variable",
        placeholder: "name",
      })}
      {props.node.value && (
        <>
          {" "}
          {"="}{" "}
          <NodeRender
            node={props.node.value}
            display="inline"
            parentInfo={childInfo(props.node, "value")}
            callbacks={createOptionalFieldCallbacks(
              props.node,
              "value",
              nodeMap,
              onEdit,
              requestFocus
            )}
          />
        </>
      )}
      {";"}
    </span>
  );

  return <Object {...props}>{content}</Object>;
}

function FunctionParameterRender(props: XRenderProps<objects.FunctionParameter>): React.ReactNode {
  const { nodeMap } = useLineContext();
  nodeMap.set(props.node.id, props.node);

  const content = (
    <>
      {TypeSelector({
        node: props.node,
        key: "paramType",
        parentInfo: props.parentInfo,
        className: "token-type",
      })}{" "}
      {EditableField({
        node: props.node,
        key: "identifier",
        parentInfo: props.parentInfo,
        className: "token-variable",
        placeholder: "name",
      })}
    </>
  );

  return <Object {...props}>{content}</Object>;
}

export function SourceFileRender(props: { node: objects.SourceFile }): React.ReactNode {
  const { nodeMap, onEdit, mode, requestFocus } = useLineContext();
  const nodeRef = useFocusStructuralNode(props.node.id);

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insertFirst: () => {
        console.log("SourceFileRender: Inserting unknown node");
        prependToArray(props.node, "code", createUnknown, nodeMap, onEdit, requestFocus);
      },
    },
  });

  const content = (
    <span ref={nodeRef as React.RefObject<HTMLSpanElement>} onKeyDown={handleKeyDown} tabIndex={0}>
      {props.node.code.length === 0 ? (
        <UnknownRender
          node={{
            id: crypto.randomUUID(),
            type: "unknown",
            content: "",
          }}
          parentInfo={childInfo(props.node, "code")}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {props.node.code.map((node, i) => (
            <NodeRender
              key={node.id}
              node={node}
              parentInfo={childInfo(props.node, "code", i)}
              callbacks={createArrayFieldCallbacks(
                props.node,
                "code",
                i,
                createUnknown,
                nodeMap,
                onEdit,
                requestFocus
              )}
            />
          ))}
        </div>
      )}
    </span>
  );

  return content;
}

function CompoundStatementRender(props: XRenderProps<objects.CompoundStatement>): React.ReactNode {
  const { onEdit, nodeMap, mode, requestFocus } = useLineContext();
  const nodeRef = useFocusStructuralNode(props.node.id);

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insertFirst: () => {
        console.log("CompoundStatementRender: Inserting unknown node");
        prependToArray(props.node, "codeBlock", createUnknown, nodeMap, onEdit, requestFocus);
      },
      insertLast: () => {
        console.log("CompoundStatementRender: Appending unknown node");
        appendToArray(props.node, "codeBlock", createUnknown, nodeMap, onEdit, requestFocus);
      },
    },
  });

  const content = (
    <span ref={nodeRef as React.RefObject<HTMLSpanElement>} onKeyDown={handleKeyDown} tabIndex={0}>
      <span className="token-delimiter">{"{"}</span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          paddingLeft: "20px",
        }}
      >
        {props.node.codeBlock.map((node, i) => (
          <NodeRender
            key={node.id}
            node={node}
            parentInfo={childInfo(props.node, "codeBlock", i)}
            callbacks={createArrayFieldCallbacks(
              props.node,
              "codeBlock",
              i,
              createUnknown,
              nodeMap,
              onEdit,
              requestFocus
            )}
          />
        ))}
      </div>
      <span className="token-delimiter">{"}"}</span>
    </span>
  );

  return <Object {...props}>{content}</Object>;
}

function IfStatementRender(props: XRenderProps<objects.IfStatement>): React.ReactNode {
  const { mode, onEdit, nodeMap, requestFocus } = useLineContext();
  const nodeRef = useFocusStructuralNode(props.node.id);

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insertFirst: () => {
        if (!props.node.elseStatement) {
          console.log("IfStatementRender: Inserting else clause");
          const newElseClause: objects.ElseClause = {
            id: crypto.randomUUID(),
            type: "elseClause",
            body: {
              id: crypto.randomUUID(),
              type: "compoundStatement",
              codeBlock: [],
            },
          };
          props.node.elseStatement = newElseClause;
          nodeMap.set(newElseClause.id, newElseClause);
          nodeMap.set(newElseClause.body.id, newElseClause.body);
          onEdit(props.node, "elseStatement");
          // Focus the newly created else clause
          requestFocus(newElseClause.id, "");
        }
      },
    },
  });

  const elseRender =
    props.node.elseStatement &&
    (props.node.elseStatement.type === "elseClause" ? (
      <NodeRender
        node={props.node.elseStatement}
        parentInfo={childInfo(props.node, "elseStatement")}
        display="inline"
        callbacks={createOptionalFieldCallbacks(
          props.node,
          "elseStatement",
          nodeMap,
          onEdit,
          requestFocus
        )}
      />
    ) : (
      (() => {
        const ifStatement = props.node.elseStatement;
        const elseClauseCallbacks = {
          onDelete: (node: objects.LanguageObject) => {
            console.log("Converting if else to else: ", node.id);
            // Replace the ifStatement with the elseStatement body
            const newElseClause: objects.ElseClause = {
              id: crypto.randomUUID(),
              type: "elseClause",
              body: ifStatement.body,
            };
            props.node.elseStatement = newElseClause;
            nodeMap.set(newElseClause.id, newElseClause);
            nodeMap.delete(ifStatement.id);
            onEdit(props.node, "elseStatement");
          },
        };
        return (
          <>
            {" "}
            <Object
              display="inline"
              node={ifStatement}
              parentInfo={childInfo(props.node, "elseStatement")}
              callbacks={createOptionalFieldCallbacks(
                props.node,
                "elseStatement",
                nodeMap,
                onEdit,
                requestFocus
              )}
            >
              <span className="token-keyword" tabIndex={0}>
                else
              </span>
            </Object>{" "}
            <NodeRender
              node={ifStatement}
              parentInfo={childInfo(props.node, "elseStatement")}
              display="inline"
              callbacks={elseClauseCallbacks}
            />
          </>
        );
      })()
    ));
  const content = (
    <span>
      <span
        ref={nodeRef as React.RefObject<HTMLSpanElement>}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <span className="token-keyword">if</span> <span className="token-keyword">{"("}</span>
        <NodeRender
          node={props.node.condition}
          parentInfo={childInfo(props.node, "condition")}
          display="inline"
        />
        <span className="token-keyword">{")"}</span>{" "}
      </span>
      <NodeRender
        node={props.node.body}
        parentInfo={childInfo(props.node, "body")}
        display="inline"
      />
      {elseRender}
    </span>
  );

  return <Object {...props}>{content}</Object>;
}

function ElseClauseRender(props: XRenderProps<objects.ElseClause>): React.ReactNode {
  // handle enter to convert to ifStatement
  const { mode, onEdit, nodeMap, parentNodeInfo, requestFocus } = useLineContext();
  const nodeRef = useFocusStructuralNode(props.node.id);

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insertFirst: () => {
        console.log("ElseClauseRender: Converting to ifStatement");
        // Convert to ifStatement
        const newIfStatement: objects.IfStatement = {
          id: crypto.randomUUID(),
          type: "ifStatement",
          condition: {
            id: crypto.randomUUID(),
            type: "unknown",
            content: "",
          },
          body: props.node.body,
        };
        nodeMap.set(newIfStatement.id, newIfStatement);
        nodeMap.set(newIfStatement.condition.id, newIfStatement.condition);

        if (!parentNodeInfo) {
          console.error("Parent node info is undefined for else clause:", props.node.id);
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (parentNodeInfo.parent as any)[parentNodeInfo.key] = newIfStatement;
        onEdit(parentNodeInfo.parent, parentNodeInfo.key);
        // Focus the condition (unknown node)
        requestFocus(newIfStatement.condition.id, "content");
      },
    },
  });

  // Special callback for body - replaces with empty compound statement instead of null
  const bodyCallbacks: NodeCallbacks = {
    onDelete: (node: objects.LanguageObject) => {
      console.log("Deleting else clause body:", node.id);
      const emptyBody: objects.CompoundStatement = {
        id: crypto.randomUUID(),
        type: "compoundStatement",
        codeBlock: [],
      };
      props.node.body = emptyBody;
      nodeMap.delete(node.id);
      nodeMap.set(emptyBody.id, emptyBody);
      onEdit(props.node, "body");
    },
  };

  const content = (
    <>
      <span
        ref={nodeRef as React.RefObject<HTMLSpanElement>}
        className="token-keyword"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {" else "}
      </span>
      {/* <Object // TODO wrapp in 
        node={props.node.body}
        parentInfo={childInfo(props.node, "body")}
        display="inline"
        callbacks={bodyCallbacks}
      > */}
      <NodeRender
        node={props.node.body}
        parentInfo={childInfo(props.node, "body")}
        display="inline"
        callbacks={bodyCallbacks}
      />
      {/* </Object> */}
    </>
  );

  return <Object {...props}>{content}</Object>;
}

function ReturnStatementRender(props: XRenderProps<objects.ReturnStatement>): React.ReactNode {
  const { nodeMap, onEdit, mode, requestFocus } = useLineContext();
  const nodeRef = useFocusStructuralNode(props.node.id);

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insertFirst: () => {
        if (!props.node.value) {
          console.log("ReturnStatementRender: Inserting unknown node as return value");
          insertUnknownIntoField(props.node, "value", nodeMap, onEdit, requestFocus);
        }
      },
    },
  });

  const content = (
    <div ref={nodeRef as React.RefObject<HTMLDivElement>} tabIndex={0} onKeyDown={handleKeyDown}>
      <span className="token-keyword">return</span>
      {props.node.value && (
        <>
          {" "}
          <NodeRender
            node={props.node.value}
            parentInfo={childInfo(props.node, "value")}
            display="inline"
            callbacks={createOptionalFieldCallbacks(
              props.node,
              "value",
              nodeMap,
              onEdit,
              requestFocus
            )}
          />
        </>
      )}
      {";"}
    </div>
  );

  return (
    <Object {...props} display="inline">
      {content}
    </Object>
  );
}

function CallExpressionRender(props: XRenderProps<objects.CallExpression>): React.ReactNode {
  const { nodeMap, onEdit, requestFocus, mode } = useLineContext();

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insertFirst: () => {
        console.log("CallExpressionRender: Appending argument");
        appendToArray(props.node, "argumentList", createUnknown, nodeMap, onEdit, requestFocus);
      },
    },
  });

  const content = (
    <span onKeyDown={handleKeyDown}>
      {EditableField({
        node: props.node,
        key: "identifier",
        parentInfo: props.parentInfo,
        className: "token-function",
        placeholder: "function_name",
      })}
      <span className="token-delimiter">{"("}</span>
      {props.node.argumentList.map((arg, i) => (
        <React.Fragment key={arg.id}>
          {i > 0 && ", "}
          <NodeRender
            node={arg}
            parentInfo={childInfo(props.node, "argumentList", i)}
            display="inline"
            callbacks={createArrayFieldCallbacks(
              props.node,
              "argumentList",
              i,
              createUnknown,
              nodeMap,
              onEdit,
              requestFocus
            )}
          />
        </React.Fragment>
      ))}
      <span className="token-delimiter">{")"}</span>
      {";"}
    </span>
  );

  return <Object {...props}>{content}</Object>;
}

function ReferenceRender(props: XRenderProps<objects.Reference>): React.ReactNode {
  const content = (
    <ReferenceSelector
      node={props.node}
      parentInfo={props.parentInfo}
      className="token-variable"
      callbacks={props.callbacks}
    />
  );

  return <Object {...props}>{content}</Object>;
}

function AssignmentExpressionRender(
  props: XRenderProps<objects.AssignmentExpression>
): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();
  const targetNode = nodeMap.get(props.node.idDeclaration);

  if (!targetNode || !("identifier" in targetNode)) {
    return <>{props.node.idDeclaration}</>;
  }

  const content = (
    <>
      <span className="token-variable">{String(targetNode.identifier)}</span> {"="}{" "}
      <NodeRender
        node={props.node.value}
        parentInfo={childInfo(props.node, "value")}
        display="inline"
        callbacks={createRequiredFieldCallbacks(props.node, "value", nodeMap, onEdit, requestFocus)}
      />
    </>
  );

  return <Object {...props}>{content}</Object>;
}

function NumberLiteralRender(props: XRenderProps<objects.NumberLiteral>): React.ReactNode {
  const content = (
    <>
      {EditableField({
        node: props.node,
        key: "value",
        parentInfo: props.parentInfo,
        className: "token-number",
        placeholder: "0",
      })}
    </>
  );

  return <Object {...props}>{content}</Object>;
}

function StringLiteralRender(props: XRenderProps<objects.StringLiteral>): React.ReactNode {
  const content = (
    <>
      <span className="token-string">{'"'}</span>
      {EditableField({
        node: props.node,
        key: "value",
        parentInfo: props.parentInfo,
        className: "token-string",
        placeholder: "text",
      })}
      <span className="token-string">{'"'}</span>
    </>
  );

  return <Object {...props}>{content}</Object>;
}

function BinaryExpressionRender(props: XRenderProps<objects.BinaryExpression>): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();

  const content = (
    <>
      <NodeRender
        node={props.node.left}
        parentInfo={childInfo(props.node, "left")}
        display="inline"
        callbacks={createRequiredFieldCallbacks(props.node, "left", nodeMap, onEdit, requestFocus)}
      />{" "}
      {EditableField({
        node: props.node,
        key: "operator",
        parentInfo: props.parentInfo,
        placeholder: "op",
      })}{" "}
      <NodeRender
        node={props.node.right}
        parentInfo={childInfo(props.node, "right")}
        display="inline"
        callbacks={createRequiredFieldCallbacks(props.node, "right", nodeMap, onEdit, requestFocus)}
      />
    </>
  );

  return <Object {...props}>{content}</Object>;
}

function CommentRender(props: XRenderProps<objects.Comment>): React.ReactNode {
  const content = (
    <>
      <span className="token-comment">{"//"}</span>{" "}
      {EditableField({
        node: props.node,
        key: "content",
        parentInfo: props.parentInfo,
        className: "token-comment",
        placeholder: "comment",
      })}
    </>
  );

  return <Object {...props}>{content}</Object>;
}
