import React from "react";
import { useLineContext, ParentInfoV2, NodeCallbacks } from "./context";
import * as objects from "../../../src/language_objects/cNodes";
import "./index.css";
import { childInfo } from "./childInfo";
import { createKeyDownHandler } from "../lib/keyBinds";
import {
  createArrayFieldCallbacks,
  createOptionalFieldCallbacks,
  insertUnknownIntoField,
  prependUnknownToArray,
  createRequiredFieldCallbacks,
  createParameter,
  appendToArray,
  createUnknown,
} from "../lib/editionHelpers";

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

  const handleKeyDown = createKeyDownHandler(mode, {
    view: {
      insertSibling: () => {
        if (isSelected && callbacks?.onInsertSibling) {
          console.log("Object: Inserting sibling for", node.type);
          callbacks.onInsertSibling(node);
        }
      },
      delete: () => {
        if (isSelected && callbacks?.onDelete) {
          console.log("Object: Deleting", node.type);
          callbacks.onDelete(node);
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
  parentInfo: ParentInfoV2;
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
      insert: () => {
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
      {EditableField({ node: props.node, key: "content", parentInfo: props.parentInfo })}
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
  const { nodeMap, onEdit, requestFocus, mode, selectedNodeId } = useLineContext();
  nodeMap.set(props.node.id, props.node);

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insert: () => {
        if (selectedNodeId === props.node.id) {
          console.log("FunctionDeclarationRender: Appending parameter");
          appendToArray(
            props.node,
            "parameterList",
            createParameter,
            nodeMap,
            onEdit,
            requestFocus
          );
        }
      },
    },
  });

  const content = (
    <span onKeyDown={handleKeyDown}>
      {EditableField({
        node: props.node,
        key: "returnType",
        parentInfo: props.parentInfo,
        className: "token-type",
      })}
      {EditableField({
        node: props.node,
        key: "identifier",
        parentInfo: props.parentInfo,
        className: "token-function",
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
  const { nodeMap, onEdit, requestFocus, mode, selectedNodeId } = useLineContext();
  nodeMap.set(props.node.id, props.node);

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insert: () => {
        if (selectedNodeId === props.node.id) {
          console.log("FunctionDefinitionRender: Appending parameter");
          appendToArray(
            props.node,
            "parameterList",
            createParameter,
            nodeMap,
            onEdit,
            requestFocus
          );
        }
      },
    },
  });

  // TODO why not Object?
  const content = (
    <span onKeyDown={handleKeyDown}>
      {EditableField({
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
          callbacks={createOptionalFieldCallbacks(props.node, "compoundStatement", nodeMap, onEdit)}
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
      insert: () => {
        if (!props.node.value) {
          console.log("DeclarationRender: Inserting unknown node as value");
          insertUnknownIntoField(props.node, "value", nodeMap, onEdit, requestFocus);
        }
      },
    },
  });

  const content = (
    <span onKeyDown={handleKeyDown}>
      {EditableField({
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
      })}
      {props.node.value && (
        <>
          {" "}
          {"="}{" "}
          <NodeRender
            node={props.node.value}
            display="inline"
            parentInfo={childInfo(props.node, "value")}
            callbacks={createOptionalFieldCallbacks(props.node, "value", nodeMap, onEdit)}
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
      {EditableField({
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
      })}
    </>
  );

  return <Object {...props}>{content}</Object>;
}

{
  /* <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {sourceFile?.code.map((node, i) => (
                <NodeRender
                  key={node.id}
                  node={node}
                  parentInfo={childInfo(sourceFile, "code", i)}
                />
              ))}
            </div> */
}

export function SourceFileRender(props: { node: objects.SourceFile }): React.ReactNode {
  const { onEdit, nodeMap, mode, selectedNodeId, requestFocus } = useLineContext();

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insert: () => {
        if (selectedNodeId === props.node.id) {
          console.log("CompoundStatementRender: Inserting unknown node");
          prependUnknownToArray(props.node, "code", nodeMap, onEdit);
        }
      },
    },
  });

  const content = (
    <span onKeyDown={handleKeyDown} tabIndex={0}>
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
  const { onEdit, nodeMap, mode, selectedNodeId, requestFocus } = useLineContext();

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insert: () => {
        if (selectedNodeId === props.node.id) {
          console.log("CompoundStatementRender: Inserting unknown node");
          prependUnknownToArray(props.node, "codeBlock", nodeMap, onEdit);
        }
      },
    },
  });

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
  const { mode, onEdit, nodeMap, selectedNodeId } = useLineContext();

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insert: () => {
        if (selectedNodeId === props.node.id && !props.node.elseStatement) {
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
        callbacks={createOptionalFieldCallbacks(props.node, "elseStatement", nodeMap, onEdit)}
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
              callbacks={createOptionalFieldCallbacks(props.node, "elseStatement", nodeMap, onEdit)}
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
      <span tabIndex={0} onKeyDown={handleKeyDown}>
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
  const { mode, onEdit, nodeMap, selectedNodeId, parentNodeInfo } = useLineContext();

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insert: () => {
        if (selectedNodeId === props.node.id) {
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
        }
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
      <span className="token-keyword" onKeyDown={handleKeyDown} tabIndex={0}>
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
  const { nodeMap, onEdit, mode } = useLineContext();

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insert: () => {
        if (!props.node.value) {
          console.log("ReturnStatementRender: Inserting unknown node as return value");
          insertUnknownIntoField(props.node, "value", nodeMap, onEdit);
        }
      },
    },
  });

  const content = (
    <div tabIndex={0} onKeyDown={handleKeyDown}>
      <span className="token-keyword">return</span>
      {props.node.value && (
        <>
          {" "}
          <NodeRender
            node={props.node.value}
            parentInfo={childInfo(props.node, "value")}
            display="inline"
            callbacks={createOptionalFieldCallbacks(props.node, "value", nodeMap, onEdit)}
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
  const { nodeMap, onEdit, requestFocus, mode, selectedNodeId } = useLineContext();

  const handleKeyDown = createKeyDownHandler(mode, {
    edit: {
      insert: () => {
        if (selectedNodeId === props.node.id) {
          console.log("CallExpressionRender: Appending argument");
          appendToArray(props.node, "argumentList", createUnknown, nodeMap, onEdit, requestFocus);
        }
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
  const { nodeMap } = useLineContext();
  const targetNode = nodeMap.get(props.node.declarationId);

  if (!targetNode || !("identifier" in targetNode)) {
    return <>{props.node.declarationId}</>;
  }

  const content = <span className="token-variable">{String(targetNode.identifier)}</span>;

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
      {EditableField({ node: props.node, key: "operator", parentInfo: props.parentInfo })}{" "}
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
      })}
    </>
  );

  return <Object {...props}>{content}</Object>;
}
