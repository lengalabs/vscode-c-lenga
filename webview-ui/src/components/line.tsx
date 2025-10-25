import React from "react";
import { useLineContext, ParentInfoV2, NodeCallbacks } from "./context";
import * as objects from "../../../src/language_objects/cNodes";
import "./index.css";
import { childInfo } from "./childInfo";

// Helper to create callbacks for array fields (supports insert & delete)
function createArrayFieldCallbacks<T extends objects.LanguageObject, K extends string & keyof T>(
  parent: T,
  key: K,
  index: number,
  nodeMap: Map<string, objects.LanguageObject>, // Should there be a single callback to update the map and notify server onEdit?
  onEdit: (node: T, key: K) => void,
  requestFocus: (nodeId: string, fieldKey: string) => void
): NodeCallbacks {
  return {
    onInsertSibling: (node: objects.LanguageObject) => {
      console.log("Inserting sibling after node:", node.id, " at index:", index);
      const field = parent[key] as unknown as objects.LanguageObject[];
      const newUnknown: objects.Unknown = {
        id: crypto.randomUUID(),
        type: "unknown",
        content: "",
      };
      const newArray = [...field.slice(0, index + 1), newUnknown, ...field.slice(index + 1)];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newArray;
      nodeMap.set(newUnknown.id, newUnknown);
      onEdit(parent, key);
      requestFocus(newUnknown.id, "content");
    },
    onDelete: (node: objects.LanguageObject) => {
      console.log("Deleting node:", node.id, " at index:", index);
      const field = parent[key] as unknown as objects.LanguageObject[];
      const newArray = [...field.slice(0, index), ...field.slice(index + 1)];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newArray;
      nodeMap.delete(node.id);
      onEdit(parent, key);
    },
  };
}

// Helper to create callbacks for optional single-value fields (delete sets to null)
function createOptionalFieldCallbacks<T extends objects.LanguageObject, K extends string & keyof T>(
  parent: T,
  key: K,
  nodeMap: Map<string, objects.LanguageObject>,
  onEdit: (node: T, key: K) => void
): NodeCallbacks {
  return {
    onDelete: (node: objects.LanguageObject) => {
      console.log("Deleting optional field:", key, " node:", node.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = null;
      nodeMap.delete(node.id);
      onEdit(parent, key);
    },
  };
}

// Helper to create callbacks for required single-value fields (delete replaces with unknown)
function createRequiredFieldCallbacks<T extends objects.LanguageObject, K extends string & keyof T>(
  parent: T,
  key: K,
  nodeMap: Map<string, objects.LanguageObject>,
  onEdit: (node: T, key: K) => void,
  requestFocus: (nodeId: string, fieldKey: string) => void
): NodeCallbacks {
  return {
    onDelete: (node: objects.LanguageObject) => {
      console.log("Replacing required field:", key, " node:", node.id, " with unknown");
      const newUnknown: objects.Unknown = {
        id: crypto.randomUUID(),
        type: "unknown",
        content: "",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newUnknown;
      nodeMap.delete(node.id);
      nodeMap.set(newUnknown.id, newUnknown);
      onEdit(parent, key);
      requestFocus(newUnknown.id, "content");
    },
  };
}

interface EditableFieldProps<T extends objects.LanguageObject, K extends string & keyof T> {
  node: T;
  key: K;
  parentInfo: ParentInfoV2;
  className?: string;
}

function EditableField<T extends objects.LanguageObject, K extends string & keyof T>({
  node,
  key,
  parentInfo,
  className,
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
  const width = Math.max(1, inputValue.length) + "ch";

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
  parentInfo: ParentInfoV2;
  children: React.ReactNode;
  display?: "inline" | "block";
  callbacks?: NodeCallbacks;
}

export function Object({ node, parentInfo, children, display = "block", callbacks }: ObjectProps) {
  const { selectedNodeId, setSelectedNodeId, setParentNodeInfo, setSelectedKey, mode } =
    useLineContext();
  const isSelected = selectedNodeId === node.id;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log("Object ", node.type, " handleKeyDown:", e.key);
    if (!isSelected) {
      return;
    }

    // Only allow inserting/deleting nodes in view mode via callbacks
    if (e.key === "Enter" && mode === "view" && callbacks?.onInsertSibling) {
      e.preventDefault();
      e.stopPropagation();
      callbacks.onInsertSibling(node);
    } else if (e.key === "Delete" && mode === "view" && callbacks?.onDelete) {
      console.log("Delete key pressed on node:", node);
      e.preventDefault();
      e.stopPropagation();
      callbacks.onDelete(node);
    }
  };

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
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}

export function NodeRender({
  node,
  parentInfo,
  callbacks,
  display = "block",
}: NodeRenderProps): React.ReactNode {
  switch (node.type) {
    case "preprocInclude":
      return (
        <PreprocIncludeRender
          includeDecl={node as objects.PreprocInclude}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "functionParameter":
      return (
        <FunctionParameterRender
          paramDecl={node as objects.FunctionParameter}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "functionDeclaration":
      return (
        <FunctionDeclarationRender
          functionDeclaration={node as objects.FunctionDeclaration}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "functionDefinition":
      return (
        <FunctionDefinitionRender
          funcDef={node as objects.FunctionDefinition}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "declaration":
      return (
        <DeclarationRender
          varDecl={node as objects.Declaration}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "returnStatement":
      return (
        <ReturnStatementRender
          returnStmt={node as objects.ReturnStatement}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "compoundStatement":
      return (
        <CompoundStatementRender
          compoundStatement={node as objects.CompoundStatement}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "callExpression":
      return (
        <CallExpressionRender
          callExpr={node as objects.CallExpression}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "reference":
      return (
        <ReferenceRender
          reference={node as objects.Reference}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "assignmentExpression":
      return (
        <AssignmentExpressionRender
          assignmentExpr={node as objects.AssignmentExpression}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "numberLiteral":
      return (
        <NumberLiteralRender
          literalExpr={node as objects.NumberLiteral}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "stringLiteral":
      return (
        <StringLiteralRender
          literalExpr={node as objects.StringLiteral}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "binaryExpression":
      return (
        <BinaryExpressionRender
          binaryExpression={node as objects.BinaryExpression}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "ifStatement":
      return (
        <IfStatementRender
          ifStatement={node as objects.IfStatement}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "elseClause":
      return (
        <ElseClauseRender
          elseClause={node as objects.ElseClause}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    case "unknown":
      return (
        <UnknownRender
          unknown={node as objects.Unknown}
          parentInfo={parentInfo}
          callbacks={callbacks}
          display={display}
        />
      );
    default:
      return "WIP";
  }
}

function UnknownRender({
  unknown,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  unknown: objects.Unknown;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const { mode, onRequestAvailableInserts, availableInserts, onEdit } = useLineContext();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLSelectElement>(null);

  // When in edit mode and Enter is pressed, request available inserts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log("Unknown handleKeyDown:", e.key);
    if (e.key === "Enter" && mode === "edit") {
      e.stopPropagation();
      e.preventDefault();
      console.log("Requesting available inserts for unknown node:", unknown);
      // Get parent info from the map
      const parent = parentInfo.parent;
      const key = parentInfo.key;
      onRequestAvailableInserts(parent.id, key);
      setShowDropdown(true);
    } else if (e.key === "Escape" && showDropdown) {
      e.stopPropagation();
      e.preventDefault();
      setShowDropdown(false);
    }
  };

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

      // Replace the unknown node with the selected option
      const parent = parentInfo.parent;
      const key = parentInfo.key;
      const index = parentInfo.index;
      console.log("Parent before insert:", parent, " key:", key, " index:", index);
      console.log("Selected option to insert:", selectedOption);

      if (Array.isArray(parent[key])) {
        console.log("Inserting into array field");
        const field = parent[key] as objects.LanguageObject[];
        const newArray = [...field];
        newArray[index] = selectedOption;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (parent as any)[key] = newArray;
        console.log("Parent after insert:", parent);
        // Notify of the edit
        onEdit(parent, key);
      } else if (typeof parent[key] === "object") {
        console.log("Parent field is single-valued, replacing directly");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (parent as any)[key] = selectedOption;
        console.log("Parent after insert:", parent);
        onEdit(parent, key);
      } else {
        console.error("Parent field is neither array nor object, cannot insert");
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
      {EditableField({ node: unknown, key: "content", parentInfo })}
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

  return (
    <Object node={unknown} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function PreprocIncludeRender({
  includeDecl,
  parentInfo,
  callbacks,
  display = "block",
}: {
  includeDecl: objects.PreprocInclude;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const content = (
    <>
      <span className="token-keyword">#include</span>{" "}
      {EditableField({
        node: includeDecl,
        key: "content",
        parentInfo,
        className: "token-string",
      })}
    </>
  );

  return (
    <Object node={includeDecl} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function FunctionDeclarationRender({
  functionDeclaration,
  parentInfo,
  callbacks,
  display = "block",
}: {
  functionDeclaration: objects.FunctionDeclaration;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();
  nodeMap.set(functionDeclaration.id, functionDeclaration);

  const content = (
    <>
      {EditableField({
        node: functionDeclaration,
        key: "returnType",
        parentInfo,
        className: "token-type",
      })}
      {EditableField({
        node: functionDeclaration,
        key: "identifier",
        parentInfo,
        className: "token-function",
      })}
      <span className="token-delimiter">{"("}</span>

      {functionDeclaration.parameterList.map((param, i) => (
        <React.Fragment key={param.id}>
          {i > 0 && ", "}
          <NodeRender
            node={param}
            parentInfo={childInfo(functionDeclaration, "parameterList", i)}
            callbacks={createArrayFieldCallbacks(
              functionDeclaration,
              "parameterList",
              i,
              nodeMap,
              onEdit,
              requestFocus
            )}
            display="inline"
          />
        </React.Fragment>
      ))}
      <span className="token-delimiter">{")"}</span>
    </>
  );

  return (
    <Object
      node={functionDeclaration}
      parentInfo={parentInfo}
      callbacks={callbacks}
      display={display}
    >
      {content}
    </Object>
  );
}

function FunctionDefinitionRender({
  funcDef,
  parentInfo,
  callbacks,
  display = "block",
}: {
  funcDef: objects.FunctionDefinition;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();
  nodeMap.set(funcDef.id, funcDef);

  const content = (
    <>
      {EditableField({
        node: funcDef,
        key: "returnType",
        parentInfo,
        className: "token-type",
      })}{" "}
      {EditableField({ node: funcDef, key: "identifier", parentInfo, className: "token-function" })}
      <span className="token-delimiter">{"("}</span>
      {funcDef.parameterList.map((param, i) => (
        <React.Fragment key={param.id}>
          {i > 0 && ", "}
          <NodeRender
            node={param}
            parentInfo={childInfo(funcDef, "parameterList", i)}
            display="inline"
            callbacks={createArrayFieldCallbacks(
              funcDef,
              "parameterList",
              i,
              nodeMap,
              onEdit,
              requestFocus
            )}
          />
        </React.Fragment>
      ))}
      <span className="token-delimiter">{")"}</span>
      {funcDef.compoundStatement && (
        <NodeRender
          node={funcDef.compoundStatement}
          parentInfo={childInfo(funcDef, "compoundStatement")}
          callbacks={createOptionalFieldCallbacks(funcDef, "compoundStatement", nodeMap, onEdit)}
        />
      )}
    </>
  );

  return (
    <Object node={funcDef} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function DeclarationRender({
  varDecl,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  varDecl: objects.Declaration;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const { nodeMap, onEdit, mode, requestFocus } = useLineContext();
  nodeMap.set(varDecl.id, varDecl);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log("DeclarationRender handleKeyDown:", e.key);

    if (mode !== "edit") {
      return;
    }

    if (e.key === "Enter" && !varDecl.value) {
      e.preventDefault();
      e.stopPropagation();
      // Insert an unknown node as the value
      const newUnknown: objects.Unknown = {
        id: crypto.randomUUID(),
        type: "unknown",
        content: "",
      };
      varDecl.value = newUnknown;
      nodeMap.set(newUnknown.id, newUnknown);
      onEdit(varDecl, null);
      requestFocus(newUnknown.id, "content");
      console.log("Inserted unknown node as value for declaration:", varDecl.id);
    }
  };

  const content = (
    <span onKeyDown={handleKeyDown}>
      {EditableField({ node: varDecl, key: "primitiveType", parentInfo, className: "token-type" })}{" "}
      {EditableField({ node: varDecl, key: "identifier", parentInfo, className: "token-variable" })}
      {varDecl.value && (
        <>
          {" "}
          {"="}{" "}
          <NodeRender
            node={varDecl.value}
            display="inline"
            parentInfo={childInfo(varDecl, "value")}
            callbacks={createOptionalFieldCallbacks(varDecl, "value", nodeMap, onEdit)}
          />
        </>
      )}
      {";"}
    </span>
  );

  return (
    <Object node={varDecl} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function FunctionParameterRender({
  paramDecl,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  paramDecl: objects.FunctionParameter;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const { nodeMap } = useLineContext();
  nodeMap.set(paramDecl.id, paramDecl);

  const content = (
    <>
      {EditableField({
        node: paramDecl,
        key: "paramType",
        parentInfo,
        className: "token-type",
      })}{" "}
      {EditableField({
        node: paramDecl,
        key: "identifier",
        parentInfo,
        className: "token-variable",
      })}
    </>
  );

  return (
    <Object node={paramDecl} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function CompoundStatementRender({
  compoundStatement,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  compoundStatement: objects.CompoundStatement;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const { onEdit, nodeMap, mode, selectedNodeId, requestFocus } = useLineContext();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log("CompoundStatementRender handleKeyDown:", e.key);
    if (e.key === "Enter" && mode === "edit" && selectedNodeId === compoundStatement.id) {
      e.stopPropagation();
      e.preventDefault();

      // Insert unknown node in compound statement
      const newUnknown: objects.Unknown = {
        id: crypto.randomUUID(),
        type: "unknown",
        content: "",
      };
      compoundStatement.codeBlock.unshift(newUnknown);
      nodeMap.set(newUnknown.id, newUnknown);
      // Notify of the edit
      onEdit(compoundStatement, "codeBlock");
    }
  };

  const content = (
    <span onKeyDown={handleKeyDown} tabIndex={0}>
      <span className="token-delimiter">{"{"}</span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          paddingLeft: "20px",
        }}
      >
        {compoundStatement.codeBlock.map((node, i) => (
          <NodeRender
            key={node.id}
            node={node}
            parentInfo={childInfo(compoundStatement, "codeBlock", i)}
            callbacks={createArrayFieldCallbacks(
              compoundStatement,
              "codeBlock",
              i,
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

  return (
    <Object
      node={compoundStatement}
      parentInfo={parentInfo}
      callbacks={callbacks}
      display={display}
    >
      {content}
    </Object>
  );
}

function IfStatementRender({
  ifStatement,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  ifStatement: objects.IfStatement;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const { mode, onEdit, nodeMap, selectedNodeId } = useLineContext();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log("IfStatementRender handleKeyDown:", e.key);
    // Enter on edit mode should insert else clause if not present
    if (e.key === "Enter" && mode === "edit" && selectedNodeId === ifStatement.id) {
      e.stopPropagation();
      e.preventDefault();

      if (!ifStatement.elseStatement) {
        const newElseClause: objects.ElseClause = {
          id: crypto.randomUUID(),
          type: "elseClause",
          body: {
            id: crypto.randomUUID(),
            type: "compoundStatement",
            codeBlock: [],
          },
        };
        ifStatement.elseStatement = newElseClause;
        nodeMap.set(newElseClause.id, newElseClause);
        nodeMap.set(newElseClause.body.id, newElseClause.body);
        // Notify of the edit
        onEdit(ifStatement, "elseStatement");
        console.log("Inserted else clause for if statement:", ifStatement.id);
      }
    }
  };

  const content = (
    <span tabIndex={0} onKeyDown={handleKeyDown}>
      <span className="token-keyword">if</span> <span className="token-keyword">{"("}</span>
      <NodeRender node={ifStatement.condition} parentInfo={childInfo(ifStatement, "condition")} />
      <span className="token-keyword">{")"}</span>{" "}
      <Object node={ifStatement.body} parentInfo={childInfo(ifStatement, "body")} display="inline">
        {compoundStatementObjectRender(ifStatement.body, childInfo(ifStatement, "body"))}
      </Object>
      {ifStatement.elseStatement &&
        (ifStatement.elseStatement.type === "elseClause" ? (
          <NodeRender
            node={ifStatement.elseStatement}
            parentInfo={childInfo(ifStatement, "elseStatement")}
            display="inline"
            callbacks={createOptionalFieldCallbacks(ifStatement, "elseStatement", nodeMap, onEdit)}
          />
        ) : (
          <>
            <span className="token-keyword"> else </span>
            <NodeRender
              node={ifStatement.elseStatement}
              parentInfo={childInfo(ifStatement, "elseStatement")}
              display="inline"
              callbacks={createOptionalFieldCallbacks(
                ifStatement,
                "elseStatement",
                nodeMap,
                onEdit
              )}
            />
          </>
        ))}
    </span>
  );

  return (
    <Object node={ifStatement} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function compoundStatementObjectRender(
  compoundStatementObject: objects.CompoundStatementObject,
  parentInfo: ParentInfoV2
) {
  switch (compoundStatementObject.type) {
    case "compoundStatement":
      return (
        <CompoundStatementRender
          compoundStatement={compoundStatementObject}
          parentInfo={parentInfo}
        />
      );
    case "declaration":
      return <DeclarationRender varDecl={compoundStatementObject} parentInfo={parentInfo} />;
    case "assignmentExpression":
      return (
        <AssignmentExpressionRender
          assignmentExpr={compoundStatementObject}
          parentInfo={parentInfo}
        />
      );
    case "binaryExpression":
      return (
        <BinaryExpressionRender
          binaryExpression={compoundStatementObject}
          parentInfo={parentInfo}
        />
      );
    case "callExpression":
      return <CallExpressionRender callExpr={compoundStatementObject} parentInfo={parentInfo} />;
    case "ifStatement":
      return <IfStatementRender ifStatement={compoundStatementObject} parentInfo={parentInfo} />;
    case "numberLiteral":
      return <NumberLiteralRender literalExpr={compoundStatementObject} parentInfo={parentInfo} />;
    case "reference":
      return <ReferenceRender reference={compoundStatementObject} parentInfo={parentInfo} />;
    case "stringLiteral":
      return <StringLiteralRender literalExpr={compoundStatementObject} parentInfo={parentInfo} />;
    case "returnStatement":
      return <ReturnStatementRender returnStmt={compoundStatementObject} parentInfo={parentInfo} />;
    case "comment":
      return <CommentRender comment={compoundStatementObject} parentInfo={parentInfo} />;
    case "unknown":
      return <UnknownRender unknown={compoundStatementObject} parentInfo={parentInfo} />;
  }
}

function ElseClauseRender({
  elseClause,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  elseClause: objects.ElseClause;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  // handle enter to convert to ifStatement
  const { mode, onEdit, nodeMap, selectedNodeId, parentNodeInfo } = useLineContext();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log("ElseClauseRender handleKeyDown:", e.key);
    if (e.key === "Enter" && mode === "edit" && selectedNodeId === elseClause.id) {
      e.stopPropagation();
      e.preventDefault();

      // Convert to ifStatement
      const newIfStatement: objects.IfStatement = {
        id: crypto.randomUUID(),
        type: "ifStatement",
        condition: {
          id: crypto.randomUUID(),
          type: "unknown",
          content: "",
        },
        body: elseClause.body,
      };
      nodeMap.set(newIfStatement.id, newIfStatement);
      nodeMap.set(newIfStatement.condition.id, newIfStatement.condition);

      if (!parentNodeInfo) {
        console.error("Parent node info is undefined for else clause:", elseClause.id);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parentNodeInfo.parent as any)[parentNodeInfo.key] = newIfStatement;
      onEdit(parentNodeInfo.parent, parentNodeInfo.key);
    }
  };

  // Special callback for body - replaces with empty compound statement instead of null
  const bodyCallbacks: NodeCallbacks = {
    onDelete: (node: objects.LanguageObject) => {
      console.log("Deleting else clause body:", node.id);
      const emptyBody: objects.CompoundStatement = {
        id: crypto.randomUUID(),
        type: "compoundStatement",
        codeBlock: [],
      };
      elseClause.body = emptyBody;
      nodeMap.delete(node.id);
      nodeMap.set(emptyBody.id, emptyBody);
      onEdit(elseClause, "body");
    },
  };

  const content = (
    <>
      <span className="token-keyword" onKeyDown={handleKeyDown} tabIndex={0}>
        {" else "}
      </span>
      <Object
        node={elseClause.body}
        parentInfo={childInfo(elseClause, "body")}
        display="inline"
        callbacks={bodyCallbacks}
      >
        {compoundStatementObjectRender(elseClause.body, childInfo(elseClause, "body"))}
      </Object>
    </>
  );

  return (
    <Object node={elseClause} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function ReturnStatementRender({
  returnStmt,
  parentInfo,
  callbacks,
  display = "block",
}: {
  returnStmt: objects.ReturnStatement;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const { nodeMap, onEdit } = useLineContext();

  const content = (
    <div tabIndex={0}>
      <span className="token-keyword">return</span>
      {returnStmt.value && (
        <>
          {" "}
          <NodeRender
            node={returnStmt.value}
            parentInfo={childInfo(returnStmt, "value")}
            display="inline"
            callbacks={createOptionalFieldCallbacks(returnStmt, "value", nodeMap, onEdit)}
          />
        </>
      )}
      {";"}
    </div>
  );

  return (
    <Object node={returnStmt} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function CallExpressionRender({
  callExpr,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  callExpr: objects.CallExpression;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();

  const content = (
    <>
      {EditableField({
        node: callExpr,
        key: "identifier",
        parentInfo,
        className: "token-function",
      })}
      <span className="token-delimiter">{"("}</span>
      {callExpr.argumentList.map((arg, i) => (
        <React.Fragment key={arg.id}>
          {i > 0 && ", "}
          <NodeRender
            node={arg}
            parentInfo={childInfo(callExpr, "argumentList", i)}
            display="inline"
            callbacks={createArrayFieldCallbacks(
              callExpr,
              "argumentList",
              i,
              nodeMap,
              onEdit,
              requestFocus
            )}
          />
        </React.Fragment>
      ))}
      <span className="token-delimiter">{")"}</span>
      {";"}
    </>
  );

  return (
    <Object node={callExpr} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function ReferenceRender({
  reference,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  reference: objects.Reference;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const { nodeMap } = useLineContext();
  const targetNode = nodeMap.get(reference.declarationId);

  if (!targetNode || !("identifier" in targetNode)) {
    return <>{reference.declarationId}</>;
  }

  const content = <span className="token-variable">{String(targetNode.identifier)}</span>;

  return (
    <Object node={reference} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function AssignmentExpressionRender({
  assignmentExpr,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  assignmentExpr: objects.AssignmentExpression;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();
  const targetNode = nodeMap.get(assignmentExpr.idDeclaration);

  if (!targetNode || !("identifier" in targetNode)) {
    return <>{assignmentExpr.idDeclaration}</>;
  }

  const content = (
    <>
      <span className="token-variable">{String(targetNode.identifier)}</span> {"="}{" "}
      <NodeRender
        node={assignmentExpr.value}
        parentInfo={childInfo(assignmentExpr, "value")}
        display="inline"
        callbacks={createRequiredFieldCallbacks(
          assignmentExpr,
          "value",
          nodeMap,
          onEdit,
          requestFocus
        )}
      />
    </>
  );

  return (
    <Object node={assignmentExpr} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function NumberLiteralRender({
  literalExpr,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  literalExpr: objects.NumberLiteral;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const content = (
    <>
      {EditableField({
        node: literalExpr,
        key: "value",
        parentInfo,
        className: "token-number",
      })}
    </>
  );

  return (
    <Object node={literalExpr} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function StringLiteralRender({
  literalExpr,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  literalExpr: objects.StringLiteral;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const content = (
    <>
      <span className="token-string">{'"'}</span>
      {EditableField({
        node: literalExpr,
        key: "value",
        parentInfo,
        className: "token-string",
      })}
      <span className="token-string">{'"'}</span>
    </>
  );

  return (
    <Object node={literalExpr} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function BinaryExpressionRender({
  binaryExpression,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  binaryExpression: objects.BinaryExpression;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();

  const content = (
    <>
      <NodeRender
        node={binaryExpression.left}
        parentInfo={childInfo(binaryExpression, "left")}
        display="inline"
        callbacks={createRequiredFieldCallbacks(
          binaryExpression,
          "left",
          nodeMap,
          onEdit,
          requestFocus
        )}
      />{" "}
      {EditableField({ node: binaryExpression, key: "operator", parentInfo })}{" "}
      <NodeRender
        node={binaryExpression.right}
        parentInfo={childInfo(binaryExpression, "right")}
        display="inline"
        callbacks={createRequiredFieldCallbacks(
          binaryExpression,
          "right",
          nodeMap,
          onEdit,
          requestFocus
        )}
      />
    </>
  );

  return (
    <Object node={binaryExpression} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}

function CommentRender({
  comment,
  parentInfo,
  callbacks,
  display = "inline",
}: {
  comment: objects.Comment;
  parentInfo: ParentInfoV2;
  callbacks?: NodeCallbacks;
  display?: "inline" | "block";
}): React.ReactNode {
  const content = (
    <>
      <span className="token-comment">{"//"}</span>{" "}
      {EditableField({ node: comment, key: "content", parentInfo, className: "token-comment" })}
    </>
  );

  return (
    <Object node={comment} parentInfo={parentInfo} callbacks={callbacks} display={display}>
      {content}
    </Object>
  );
}
