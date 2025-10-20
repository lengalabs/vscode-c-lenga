import React from "react";
import { useLineContext, ParentInfoV2 } from "./context";
import * as objects from "../../../../src/language_objects/cNodes";
import "../index.css";
import { childInfo } from "./childInfo";

export function ModeIndicator() {
  const { mode } = useLineContext();
  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        padding: "5px 10px",
        backgroundColor:
          mode === "view"
            ? "var(--vscode-editorInfo-background)"
            : "var(--vscode-editorWarning-background)",
        color:
          mode === "view"
            ? "var(--vscode-editorInfo-foreground)"
            : "var(--vscode-editorWarning-foreground)",
        border:
          "1px solid " +
          (mode === "view"
            ? "var(--vscode-editorInfo-border)"
            : "var(--vscode-editorWarning-border)"),
        borderRadius: "3px",
        fontSize: "12px",
        fontWeight: "bold",
        zIndex: 1000,
      }}
    >
      MODE: {mode.toUpperCase()}
    </div>
  );
}

interface EditableFieldProps<
  T extends objects.LanguageObject,
  K extends string & keyof T
> {
  node: T;
  key: K;
  parentInfo: ParentInfoV2;
  className?: string;
}

function EditableField<
  T extends objects.LanguageObject,
  K extends string & keyof T
>({ node, key, parentInfo, className }: EditableFieldProps<T, K>) {
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
    setMode,
  } = useLineContext();
  const isSelected =
    selectedNodeId == node.id && selectedKey && selectedKey == key;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "i" && mode === "view") {
      e.preventDefault();
      setMode("edit");
    } else if (e.key === "Escape" && mode === "edit") {
      e.preventDefault();
      setMode("view");
    }
  };

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
      onKeyDown={handleKeyDown}
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
  children: React.ReactNode;
  display?: "inline" | "block";
}

export function Object({ node, children, display = "block" }: ObjectProps) {
  const {
    selectedNodeId,
    setSelectedNodeId,
    onEdit,
    nodeMap,
    parentMap,
    requestFocus,
    mode,
  } = useLineContext();
  const isSelected = selectedNodeId === node.id;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSelected) return;

    // Only allow inserting unknown nodes in view mode for block elements
    if (e.key === "Enter" && mode === "view") {
      e.preventDefault();
      insertUnknown();
    } else if (e.key === "Delete" && mode === "view") {
      e.preventDefault();
      deleteNode();
    }
  };

  const deleteNode = () => {
    console.log("Deleting node:", node);
    const parentInfo = parentMap.get(node.id);
    if (!parentInfo) return;
    const { parent, key, index } = parentInfo;
    if (!parent || !(key in parent)) return;

    // Check if it's an array field
    const field = parent[key];
    if (Array.isArray(field)) {
      console.log("Parent field is an array, removing from array");
      // Remove the node from the array
      const newArray = [...field.slice(0, index), ...field.slice(index + 1)];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newArray;

      // Remove from maps
      nodeMap.delete(node.id);
      parentMap.delete(node.id);

      // Update parent indices for nodes that came after this one
      for (let i = 0; i < newArray.length - index; i++) {
        const siblingNode = newArray[index + i];
        if (
          siblingNode &&
          typeof siblingNode === "object" &&
          "id" in siblingNode
        ) {
          parentMap.set((siblingNode as objects.LanguageObject).id, {
            parent,
            key,
            index: index + i,
          } as ParentInfoV2);
        }
      }

      onEdit(parent, key);
      console.log(
        "Deleted node:",
        node.id,
        " from parent:",
        parent,
        " at key:",
        key,
        " index:",
        index
      );
    } else if (typeof field === "object") {
      console.log("Parent field is single-valued, setting to null");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = null;
      nodeMap.delete(node.id);
      parentMap.delete(node.id);
      onEdit(parent, key);
      console.log(
        "Deleted node:",
        node.id,
        " from parent:",
        parent,
        " at key:",
        key
      );
    } else {
      console.error("Parent field is neither array nor object, cannot delete");
    }
  };

  const insertUnknown = () => {
    const newObject: objects.Unknown = {
      id: crypto.randomUUID(),
      type: "unknown",
      content: "",
    };
    // insert logic: e.g., in CompoundStatement
    const parentInfo = parentMap.get(node.id);
    if (!parentInfo) return;
    const { parent, key, index } = parentInfo;
    if (!parent || !(key in parent)) return;

    // Now TypeScript knows key is valid for parent!
    // We need to check if it's an array field
    const field = parent[key];
    if (!Array.isArray(field)) return;

    const newArray = [
      ...field.slice(0, index + 1),
      newObject,
      ...field.slice(index + 1),
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (parent as any)[key] = newArray; // Runtime assignment - type safety maintained by ParentInfoV2

    nodeMap.set(newObject.id, newObject);
    parentMap.set(newObject.id, {
      parent,
      key,
      index: index + 1,
    } as ParentInfoV2);

    onEdit(parent, key);
    console.log(
      "Inserted new unknown node:",
      newObject,
      " in parent:",
      parent,
      " at key:",
      key,
      " index:",
      index
    );

    // Request focus on the new node's content field - React will handle it when rendered
    requestFocus(newObject.id, "content");
  };

  const Element = display === "inline" ? "span" : "div";

  return (
    <Element
      onKeyDown={handleKeyDown}
      className={`object-container object-container-${display} ${
        isSelected ? "object-selected" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNodeId(node.id);
      }}
      tabIndex={0}
    >
      {children}
    </Element>
  );
}

interface NodeRenderProps {
  node: objects.LanguageObject;
  parentInfo: ParentInfoV2;
}

export function NodeRender({
  node,
  parentInfo,
}: NodeRenderProps): React.ReactNode {
  //console.log(node.type);

  switch (node.type) {
    case "preprocInclude":
      return (
        <PreprocIncludeRender
          includeDecl={node as objects.PreprocInclude}
          parentInfo={parentInfo}
        />
      );
    case "functionParameter":
      return (
        <FunctionParameterRender
          paramDecl={node as objects.FunctionParameter}
          parentInfo={parentInfo}
        />
      );
    case "functionDeclaration":
      return (
        <FunctionDeclarationRender
          functionDeclaration={node as objects.FunctionDeclaration}
          parentInfo={parentInfo}
        />
      );
    case "functionDefinition":
      return (
        <FunctionDefinitionRender
          funcDef={node as objects.FunctionDefinition}
          parentInfo={parentInfo}
        />
      );
    case "declaration":
      return (
        <DeclarationRender
          varDecl={node as objects.Declaration}
          parentInfo={parentInfo}
        />
      );
    case "returnStatement":
      return (
        <ReturnStatementRender
          returnStmt={node as objects.ReturnStatement}
          parentInfo={parentInfo}
        />
      );
    case "compoundStatement":
      return (
        <CompoundStatementRender
          compoundStatement={node as objects.CompoundStatement}
          parentInfo={parentInfo}
        />
      );
    case "callExpression":
      return (
        <CallExpressionRender
          callExpr={node as objects.CallExpression}
          parentInfo={parentInfo}
        />
      );
    case "reference":
      return (
        <ReferenceRender
          reference={node as objects.Reference}
          parentInfo={parentInfo}
        />
      );
    case "assignmentExpression":
      return (
        <AssignmentExpressionRender
          assignmentExpr={node as objects.AssignmentExpression}
          parentInfo={parentInfo}
        />
      );
    case "numberLiteral":
      return (
        <NumberLiteralRender
          literalExpr={node as objects.NumberLiteral}
          parentInfo={parentInfo}
        />
      );
    case "stringLiteral":
      return (
        <StringLiteralRender
          literalExpr={node as objects.StringLiteral}
          parentInfo={parentInfo}
        />
      );
    case "binaryExpression":
      return (
        <BinaryExpressionRender
          binaryExpression={node as objects.BinaryExpression}
          parentInfo={parentInfo}
        />
      );
    case "ifStatement":
      return <IfStatementRender ifStatement={node as objects.IfStatement} />;
    case "unknown":
      return (
        <UnknownRender
          unknown={node as objects.Unknown}
          parentInfo={parentInfo}
        />
      );
    default:
      return "WIP";
  }
}

function UnknownRender({
  unknown,
  parentInfo,
}: {
  unknown: objects.Unknown;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  const { mode, onRequestAvailableInserts, availableInserts, onEdit } =
    useLineContext();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLSelectElement>(null);

  // When in edit mode and Enter is pressed, request available inserts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && mode === "edit") {
      e.preventDefault();
      console.log("Requesting available inserts for unknown node:", unknown);
      // Get parent info from the map
      const parent = parentInfo.parent;
      const key = parentInfo.key;
      onRequestAvailableInserts(parent.id, key);
      setShowDropdown(true);
    } else if (e.key === "Escape" && showDropdown) {
      e.preventDefault();
      setShowDropdown(false);
    }
  };

  // Focus the dropdown when it appears and options are loaded
  React.useEffect(() => {
    if (
      showDropdown &&
      availableInserts &&
      availableInserts.length > 0 &&
      dropdownRef.current
    ) {
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
      console.log(
        "Parent before insert:",
        parent,
        " key:",
        key,
        " index:",
        index
      );
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
        console.error(
          "Parent field is neither array nor object, cannot insert"
        );
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
      e.preventDefault();
      setShowDropdown(false);
    }
  };

  const handleDropdownClick = () => {
    // Commit the selection when user clicks on an option
    commitSelection();
  };

  return (
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
}

function PreprocIncludeRender({
  includeDecl,
  parentInfo,
}: {
  includeDecl: objects.PreprocInclude;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  return (
    <>
      <span className="token-keyword">#include</span>
      {" "}
      {EditableField({
        node: includeDecl,
        key: "content",
        parentInfo,
        className: "token-string",
      })}
    </>
  );
}

function FunctionDeclarationRender({
  functionDeclaration,
  parentInfo,
}: {
  functionDeclaration: objects.FunctionDeclaration;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  const { nodeMap } = useLineContext();
  nodeMap.set(functionDeclaration.id, functionDeclaration);

  return (
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
          <FunctionParameterRender
            paramDecl={param}
            parentInfo={childInfo(functionDeclaration, "parameterList", i)}
          />
        </React.Fragment>
      ))}
      <span className="token-delimiter">{")"}</span>
    </>
  );
}

function FunctionDefinitionRender({
  funcDef,
  parentInfo,
}: {
  funcDef: objects.FunctionDefinition;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  const { nodeMap } = useLineContext();
  nodeMap.set(funcDef.id, funcDef);

  return (
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
          <FunctionParameterRender
            paramDecl={param}
            parentInfo={childInfo(funcDef, "parameterList", i)}
          />
        </React.Fragment>
      ))}
      <span className="token-delimiter">{")"}</span>
      {funcDef.compoundStatement && (
        <CompoundStatementRender
          compoundStatement={funcDef.compoundStatement}
          parentInfo={childInfo(funcDef, "compoundStatement")}
        />
      )}
    </>
  );
}

function DeclarationRender({
  varDecl,
  parentInfo,
}: {
  varDecl: objects.Declaration;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  const { nodeMap, onEdit, mode } = useLineContext();
  nodeMap.set(varDecl.id, varDecl);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode !== "edit") return;

    if (e.key === "Enter" && !varDecl.value) {
      e.preventDefault();
      // Insert an unknown node as the value
      const newUnknown: objects.Unknown = {
        id: crypto.randomUUID(),
        type: "unknown",
        content: "",
      };
      varDecl.value = newUnknown;
      nodeMap.set(newUnknown.id, newUnknown);
      onEdit(varDecl, null);
      console.log(
        "Inserted unknown node as value for declaration:",
        varDecl.id
      );
    }
  };

  return (
    <span onKeyDown={handleKeyDown}>
      {EditableField({ node: varDecl, key: "primitiveType", parentInfo, className: "token-type"})}{" "}
      {EditableField({ node: varDecl, key: "identifier", parentInfo, className: "token-variable" })}
      {varDecl.value && (
        <>
          {" "}
          {"="}{" "}
          <Object node={varDecl.value} display="inline">
            <NodeRender
              node={varDecl.value}
              parentInfo={childInfo(varDecl, "value")}
            />
          </Object>
        </>
      )}
      {";"}
    </span>
  );
}

function FunctionParameterRender({
  paramDecl,
  parentInfo,
}: {
  paramDecl: objects.FunctionParameter;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  const { nodeMap } = useLineContext();
  nodeMap.set(paramDecl.id, paramDecl);

  return (
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
}

function CompoundStatementRender({
  compoundStatement: compStmt,
}: {
  compoundStatement: objects.CompoundStatement;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  return (
    <>
      <span className="token-delimiter">{"{"}</span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          paddingLeft: "20px",
        }}
      >
        {compStmt.codeBlock.map((node, i) => (
          <Object key={node.id} node={node}>
            <NodeRender
              node={node}
              parentInfo={childInfo(compStmt, "codeBlock", i)}
            />
          </Object>
        ))}
      </div>
      <span className="token-delimiter">{"}"}</span>
    </>
  );
}

function IfStatementRender({
  ifStatement,
}: {
  ifStatement: objects.IfStatement;
}): React.ReactNode {
  return (
    <>
      <span className="token-keyword">if</span>{" "}
      <span className="token-keyword">{"("}</span>
      {
        <NodeRender
          node={ifStatement.condition}
          parentInfo={childInfo(ifStatement, "condition")}
        />
      }
      <span className="token-keyword">{")"}</span>{" "}
      {
        <CompoundStatementRender
          compoundStatement={
            ifStatement.compoundStatement as objects.CompoundStatement /* TODO: should support different statement expr */
          }
          parentInfo={childInfo(ifStatement, "compoundStatement")}
        />
      }
      {ifStatement.elseClause && (
        <ElseClauseRender elseClause={ifStatement.elseClause} />
      )}
    </>
  );
}

function ElseClauseRender({
  elseClause,
}: {
  elseClause: objects.ElseClause;
}): React.ReactNode {
  return (
    <>
      {" "}
      <span className="token-keyword">else</span>{" "}
      {
        <CompoundStatementRender
          compoundStatement={
            elseClause.compoundStatement as objects.CompoundStatement /* TODO: should support different statement expr */
          }
          parentInfo={childInfo(elseClause, "compoundStatement")}
        />
      }
    </>
  );
}

function ReturnStatementRender({
  returnStmt,
}: {
  returnStmt: objects.ReturnStatement;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  return (
    <>
      <span className="token-keyword">return</span>
      {returnStmt.value && (
        <>
          {" "}
          <NodeRender
            node={returnStmt.value}
            parentInfo={childInfo(returnStmt, "value")}
          />
        </>
      )}
      {";"}
    </>
  );
}

function CallExpressionRender({
  callExpr,
  parentInfo,
}: {
  callExpr: objects.CallExpression;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  return (
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
          />
        </React.Fragment>
      ))}
      <span className="token-delimiter">{")"}</span>
      {";"}
    </>
  );
}

function ReferenceRender({
  reference,
}: {
  reference: objects.Reference;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  const { nodeMap } = useLineContext();
  const targetNode = nodeMap.get(reference.declarationId);

  if (!targetNode || !("identifier" in targetNode)) {
    return <>{reference.declarationId}</>;
  }

  return (
    <span className="token-variable">{String(targetNode.identifier)}</span>
  );
}

function AssignmentExpressionRender({
  assignmentExpr,
}: {
  assignmentExpr: objects.AssignmentExpression;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  const { nodeMap } = useLineContext();
  const targetNode = nodeMap.get(assignmentExpr.idDeclaration);

  if (!targetNode || !("identifier" in targetNode)) {
    return <>{assignmentExpr.idDeclaration}</>;
  }

  return (
    <>
      <span className="token-variable">{String(targetNode.identifier)}</span>{" "}
      {"="}{" "}
      <NodeRender
        node={assignmentExpr.value}
        parentInfo={childInfo(assignmentExpr, "value")}
      />
    </>
  );
}

function NumberLiteralRender({
  literalExpr,
  parentInfo,
}: {
  literalExpr: objects.NumberLiteral;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  return (
    <>
      {EditableField({
        node: literalExpr,
        key: "value",
        parentInfo,
        className: "token-number",
      })}
    </>
  );
}

function StringLiteralRender({
  literalExpr,
  parentInfo,
}: {
  literalExpr: objects.StringLiteral;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  return (
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
}

function BinaryExpressionRender({
  binaryExpression,
  parentInfo,
}: {
  binaryExpression: objects.BinaryExpression;
  parentInfo: ParentInfoV2;
}): React.ReactNode {
  return (
    <>
      <NodeRender
        node={binaryExpression.left}
        parentInfo={childInfo(binaryExpression, "left")}
      />
      {" "}
      {EditableField({ node: binaryExpression, key: "operator", parentInfo })}
      {" "}
      <NodeRender
        node={binaryExpression.right}
        parentInfo={childInfo(binaryExpression, "right")}
      />
    </>
  );
}
