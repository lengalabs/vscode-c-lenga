import React, { RefObject } from "react";
import {
  useLineContext,
  ParentInfo,
  NodeCallbacks,
  parentInfoFromChild,
} from "../context/line/lineContext";
import * as objects from "../../../src/language_objects/cNodes";
import "./index.css";
import {
  createArrayFieldCallbacks,
  createOptionalFieldCallbacks,
  createRequiredFieldCallbacks,
  createParameter,
  appendToArray,
  createUnknown,
  prependToArray,
  createKeyDownHandler,
  createParentArrayFieldEditCallbacks,
  createParentOptionalFieldCallbacks,
} from "../lib/editionHelpers";
import * as Autocomplete from "./selectors/Autocomplete";
import CallExpressionSelector from "./selectors/CallExpressionSelector";
import AssignmentSelector from "./selectors/AssignmentSelector";
import ReferenceSelector from "./selectors/ReferenceSelector";
import EditableField from "./EditableField";
import TypeSelector from "./selectors/TypeSelector";
import { FocusRequest } from "../context/line/LineProvider";
import {
  ChildRefs,
  createChildNavigationCallbacks,
  createParentNavigationCallbacks,
  ParentRefs,
} from "../lib/navigationHelpers";
import { NodeEditCallbacks, NodeNavigationCallbacks } from "../lib/keyBinds";

// Hook to handle focus requests for structural nodes (nodes with tabIndex={0})
function useFocusStructuralNode(nodeId: string, nodeRef: RefObject<HTMLElement>) {
  const { focusRequest, clearFocusRequest } = useLineContext();
  const hasFocusedRef = React.useRef(false);

  React.useEffect(() => {
    if (
      focusRequest &&
      focusRequest.nodeId === nodeId &&
      focusRequest.fieldKey === undefined && // Empty string means focus the node itself
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
  }, [focusRequest, nodeId, clearFocusRequest, nodeRef]);
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
    insertSibling: () => {
      if (callbacks?.onInsertSibling) {
        console.log("Object: Inserting sibling for", node.type);
        callbacks.onInsertSibling(node);
      }
    },
    insertSiblingBefore: () => {
      if (callbacks?.onInsertSiblingBefore) {
        console.log("Object: Inserting sibling before", node.type);
        callbacks.onInsertSiblingBefore(node);
      }
    },
    delete: () => {
      if (callbacks?.onDelete) {
        console.log("Object: Deleting", node.type);
        callbacks.onDelete(node);
      }
    },
    insertChildFirst: () => {
      console.log("insertChildFirst: callbacks:", callbacks);
      if (callbacks?.onInsertChildFirst) {
        console.log("Object: Inserting at beginning for", node.type);
        callbacks.onInsertChildFirst();
      }
    },
    insertChildLast: () => {
      console.log("insertChildLast: callbacks:", callbacks);
      if (callbacks?.onInsertChildLast) {
        console.log("Object: Inserting at end for", node.type);
        callbacks.onInsertChildLast();
      }
    },
    navigateToPreviousSibling: () => {
      if (callbacks?.onNavigateToPreviousSibling) {
        console.log("Object: navigateToPreviousSibling", node.type);
        callbacks.onNavigateToPreviousSibling();
      }
    },
    navigateToNextSibling: () => {
      if (callbacks?.onNavigateToNextSibling) {
        console.log("Object: navigateToNextSibling", node.type);
        callbacks.onNavigateToNextSibling();
      }
    },
    navigateToParent: () => {
      if (callbacks?.onNavigateToParent) {
        console.log("Object: navigateToParentNode", node.type);
        callbacks.onNavigateToParent();
      }
    },
    navigateToFirstChild: () => {
      if (callbacks?.onNavigateToFirstChild) {
        console.log("Object: navigateToFirstChild", node.type);
        callbacks.onNavigateToFirstChild();
      }
    },
    navigateToLastChild: () => {
      if (callbacks?.onNavigateToLastChild) {
        console.log("Object: navigateToLastChild", node.type);
        callbacks.onNavigateToLastChild();
      }
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
  ref: React.RefObject<HTMLElement>;
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

type ItemRenderProps<KT extends objects.LanguageObject> = {
  item: KT;
  idx: number;
  nodeRender: React.ReactNode;
};

function ListFieldRender<
  T extends objects.LanguageObject, // Object
  K extends string & keyof T, // Key
  KT extends objects.LanguageObject, // Value Type
>(
  parent: XRenderProps<T>,
  key: K,
  callbacks: {
    insertConstructor: (requestFocus?: (props: FocusRequest) => void) => objects.LanguageObject;
  },
  render: (props: ItemRenderProps<KT>) => React.ReactNode
): { listRender: React.ReactNode; childRefs: ChildRefs } {
  const list: KT[] = parent.node[key] as unknown as KT[];

  // Create refs for all items at the top level
  const itemRefs = React.useRef<Map<string, React.RefObject<HTMLElement>>>(new Map());

  // Create/get refs synchronously during render (not in useEffect)
  // to avoid race conditions
  const currentIds = new Set(list.map((item) => item.id));

  // Clean up refs for removed items
  Array.from(itemRefs.current.keys()).forEach((id) => {
    if (!currentIds.has(id)) {
      itemRefs.current.delete(id);
    }
  });

  // Create refs for new items
  list.forEach((item) => {
    if (!itemRefs.current.has(item.id)) {
      itemRefs.current.set(item.id, React.createRef<HTMLElement>() as RefObject<HTMLElement>);
    }
  });

  return {
    childRefs: {
      firstChild: list.length > 0 ? itemRefs.current.get(list[0].id)! : undefined,
      lastChild: list.length > 0 ? itemRefs.current.get(list[list.length - 1].id)! : undefined,
    },
    listRender: (
      <>
        {list.map((item, i) => {
          const currentRef = itemRefs.current.get(item.id)!;
          const previousSibling = i > 0 ? itemRefs.current.get(list[i - 1].id) : undefined;
          const nextSibling =
            i < list.length - 1 ? itemRefs.current.get(list[i + 1].id) : undefined;

          return ListItem<T, K, KT>(parent, key, i, callbacks, item, render, currentRef, {
            parent: parent.ref,
            previousSibling,
            nextSibling,
          });
        })}
      </>
    ),
  };
}

function ListItem<
  T extends objects.LanguageObject, // Object
  K extends string & keyof T, // Key
  KT extends objects.LanguageObject,
>(
  parent: XRenderProps<T>,
  key: K,
  i: number,
  callbacks: {
    insertConstructor: (requestFocus?: (props: FocusRequest) => void) => objects.LanguageObject;
  },
  item: KT,
  render: (props: ItemRenderProps<KT>) => React.ReactNode,
  nodeRef: React.RefObject<HTMLElement>,
  refs: ParentRefs
) {
  const { nodeMap, onEdit, requestFocus } = useLineContext();

  const arrayFieldCallbacks = createArrayFieldCallbacks(
    parent.node,
    key,
    i,
    callbacks.insertConstructor,
    nodeMap,
    onEdit,
    requestFocus
  );
  const parentNavigationCallbacks = createParentNavigationCallbacks(refs);
  const itemCallbacks: NodeEditCallbacks & NodeNavigationCallbacks = {
    ...arrayFieldCallbacks,
    ...parentNavigationCallbacks,
  };
  return (
    <React.Fragment key={item.id}>
      {render({
        item: item,
        idx: i,
        nodeRender: (
          <NodeRender
            ref={nodeRef as React.RefObject<HTMLSpanElement>}
            node={item}
            display={"inline"}
            parentInfo={parentInfoFromChild(parent.node, key, i)}
            callbacks={itemCallbacks}
          />
        ),
      })}
    </React.Fragment>
  );
}

function UnknownRender(props: XRenderProps<objects.Unknown>): React.ReactNode {
  const {
    onRequestAvailableInserts,
    availableInserts,
    setSelectedNodeId,
    setSelectedKey,
    setParentNodeInfo,
  } = useLineContext();

  // Convert availableInserts to AutocompleteOptions
  const options: Autocomplete.Option<objects.LanguageObject>[] = React.useMemo(() => {
    if (!availableInserts) return [];
    return availableInserts.map((insert, idx) => ({
      value: insert,
      label: insert.type,
      key: `${insert.type}-${idx}`,
      description: (
        <NodeRender
          ref={undefined as unknown as React.RefObject<HTMLSpanElement>} // TODO this will probably break
          node={insert}
          parentInfo={props.parentInfo}
        />
      ),
      onSelect: (selectedInsert: objects.LanguageObject) => {
        console.log("Selected option to insert:", selectedInsert);
        // Use the replace callback if provided
        if (props.callbacks?.onReplace) {
          props.callbacks.onReplace(props.node, selectedInsert);
        } else {
          console.warn("No onReplace callback provided for UnknownRender");
        }
      },
    }));
  }, [availableInserts, props.callbacks, props.node, props.parentInfo]);

  function handleOnFocus() {
    onRequestAvailableInserts(props.parentInfo.parent.id, props.parentInfo.key);
    setSelectedKey("content");
    setSelectedNodeId(props.node.id);
    setParentNodeInfo(props.parentInfo);
  }

  return (
    <Object {...props}>
      {
        <Autocomplete.Field
          ref={props.ref as React.RefObject<HTMLInputElement>}
          firstField={true}
          currentValue={""}
          placeholder="Select type..."
          options={options}
          onFocus={handleOnFocus}
          nodeId={props.node.id}
          fieldKey="content"
        />
      }
    </Object>
  );
}

function PreprocIncludeRender(props: XRenderProps<objects.PreprocInclude>): React.ReactNode {
  const contentRef = React.useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  return (
    <Object {...props}>
      {
        <>
          <span className="token-keyword">#include</span>{" "}
          {EditableField({
            node: props.node,
            key: "content",
            parentInfo: props.parentInfo,
            firstField: true,
            className: "token-string",
            placeholder: "file.h",
            ref: contentRef,
          })}
        </>
      }
    </Object>
  );
}

function FunctionDeclarationRender(
  props: XRenderProps<objects.FunctionDeclaration>
): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();
  nodeMap.set(props.node.id, props.node);

  const insertChildCallbacks = {
    insertChildFirst: () => {
      prependToArray(props.node, "parameterList", createParameter, nodeMap, onEdit, requestFocus);
    },
    insertChildLast: () => {
      appendToArray(props.node, "parameterList", createParameter, nodeMap, onEdit, requestFocus);
    },
  };

  const returnTypeRef = props.ref;
  const identifierRef = React.useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

  const { listRender, childRefs } = ListFieldRender(
    props,
    "parameterList",
    { insertConstructor: createParameter },
    ({ idx, nodeRender }) => (
      <span>
        {idx > 0 && ", "}
        {nodeRender}
      </span>
    )
  );

  const movementCallbacks = createChildNavigationCallbacks(childRefs);
  return (
    <Object
      {...props}
      callbacks={{ ...props.callbacks, ...insertChildCallbacks, ...movementCallbacks }}
    >
      {TypeSelector({
        ref: returnTypeRef,
        node: props.node,
        key: "returnType",
        parentInfo: props.parentInfo,
        firstField: true,
        className: "token-type",
      })}{" "}
      {EditableField({
        ref: identifierRef,
        node: props.node,
        key: "identifier",
        parentInfo: props.parentInfo,
        className: "token-function",
        placeholder: "function_name",
      })}
      <span className="token-delimiter">{"("}</span>
      {listRender}
      <span className="token-delimiter">{")"}</span>
    </Object>
  );
}

function FunctionDefinitionRender(
  props: XRenderProps<objects.FunctionDefinition>
): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();
  nodeMap.set(props.node.id, props.node);

  const compoundStatementRef = React.useRef<HTMLElement>(null);

  const childCallbacks = createParentArrayFieldEditCallbacks(
    props.node,
    "parameterList",
    createParameter,
    nodeMap,
    onEdit,
    requestFocus
  );

  const returnTypeRef = props.ref;
  const identifierRef = React.useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

  const { listRender, childRefs } = ListFieldRender(
    props,
    "parameterList",
    { insertConstructor: createParameter },
    ({ idx, nodeRender }) => (
      <span>
        {idx > 0 && ", "}
        {nodeRender}
      </span>
    )
  );

  const movementCallbacks = createChildNavigationCallbacks(childRefs);

  const compoundStatementCallbacks = createParentNavigationCallbacks({
    parent: props.ref,
    previousSibling: undefined,
    nextSibling: undefined,
  });
  return (
    <Object {...props} callbacks={{ ...props.callbacks, ...childCallbacks, ...movementCallbacks }}>
      {TypeSelector({
        node: props.node,
        key: "returnType",
        ref: returnTypeRef,
        parentInfo: props.parentInfo,
        firstField: true,
        className: "token-type",
      })}{" "}
      {EditableField({
        node: props.node,
        key: "identifier",
        ref: identifierRef,
        parentInfo: props.parentInfo,
        className: "token-function",
        placeholder: "function_name",
      })}
      <span className="token-delimiter">{"("}</span>
      {listRender}
      <span className="token-delimiter">{")"}</span>
      <NodeRender
        ref={compoundStatementRef as React.RefObject<HTMLSpanElement>}
        node={props.node.compoundStatement}
        parentInfo={parentInfoFromChild(props.node, "compoundStatement")}
        callbacks={compoundStatementCallbacks}
      />
    </Object>
  );
}

function DeclarationRender(props: XRenderProps<objects.Declaration>): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();

  const returnTypeRef = props.ref;
  const identifierRef = React.useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  const valueRef = React.useRef<HTMLElement>(null);

  nodeMap.set(props.node.id, props.node);

  const childCallbacks = {
    ...createParentOptionalFieldCallbacks(
      props.node,
      "value",
      createUnknown,
      nodeMap,
      onEdit,
      requestFocus
    ),
    ...createChildNavigationCallbacks({
      firstChild: props.node.value && (valueRef as React.RefObject<HTMLElement>),
      lastChild: props.node.value && (valueRef as React.RefObject<HTMLElement>),
    }),
  };

  return (
    <Object {...props} callbacks={{ ...props.callbacks, ...childCallbacks }}>
      {TypeSelector({
        node: props.node,
        key: "primitiveType",
        ref: returnTypeRef,
        parentInfo: props.parentInfo,
        firstField: true,
        className: "token-type",
      })}{" "}
      {EditableField({
        node: props.node,
        key: "identifier",
        ref: identifierRef,
        parentInfo: props.parentInfo,
        className: "token-variable",
        placeholder: "name",
      })}
      {props.node.value && (
        <>
          {" "}
          {"="}{" "}
          <NodeRender
            ref={valueRef as React.RefObject<HTMLSpanElement>}
            node={props.node.value}
            display="inline"
            parentInfo={parentInfoFromChild(props.node, "value")}
            callbacks={{
              ...createOptionalFieldCallbacks(props.node, "value", nodeMap, onEdit, requestFocus),
              ...createParentNavigationCallbacks({
                parent: props.ref,
              }),
            }}
          />
        </>
      )}
    </Object>
  );
}

function FunctionParameterRender(props: XRenderProps<objects.FunctionParameter>): React.ReactNode {
  const { nodeMap } = useLineContext();
  nodeMap.set(props.node.id, props.node);

  const returnTypeRef = props.ref;
  const identifierRef = React.useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  return (
    <Object {...props} callbacks={{ ...props.callbacks }}>
      {
        <>
          {TypeSelector({
            node: props.node,
            key: "paramType",
            ref: returnTypeRef,
            parentInfo: props.parentInfo,
            firstField: true,
            className: "token-type",
          })}{" "}
          {EditableField({
            node: props.node,
            key: "identifier",
            ref: identifierRef,
            parentInfo: props.parentInfo,
            className: "token-variable",
            placeholder: "name",
          })}
        </>
      }
    </Object>
  );
}

export function SourceFileRender(props: { node: objects.SourceFile }): React.ReactNode {
  const { nodeMap, onEdit, mode, requestFocus } = useLineContext();
  const nodeRef = React.useRef<HTMLElement>(null);
  useFocusStructuralNode(props.node.id, nodeRef as React.RefObject<HTMLElement>);

  const emptyFileRef = React.useRef<HTMLElement>(null);

  const { listRender, childRefs } = ListFieldRender(
    {
      node: props.node,
      ref: nodeRef as React.RefObject<HTMLSpanElement>,
      parentInfo: parentInfoFromChild(props.node, "code"),
    },
    "code",
    { insertConstructor: createUnknown },
    ({ item, nodeRender }) => (
      <div>
        {nodeRender} {leadingSemicolon(item) && ";"}
      </div>
    )
  );

  const movementCallbacks = createChildNavigationCallbacks(childRefs);

  const handleKeyDown = createKeyDownHandler(mode, {
    insertChildFirst: () => {
      console.log("SourceFileRender: Inserting unknown node");
      prependToArray(props.node, "code", createUnknown, nodeMap, onEdit, requestFocus);
    },
    insertChildLast: () => {
      console.log("SourceFileRender: Inserting unknown node");
      appendToArray(props.node, "code", createUnknown, nodeMap, onEdit, requestFocus);
    },
    navigateToPreviousSibling: () => {},
    navigateToNextSibling: () => {},
    navigateToParent: () => {},
    navigateToFirstChild: movementCallbacks.onNavigateToFirstChild
      ? movementCallbacks.onNavigateToFirstChild
      : () => {},
    navigateToLastChild: movementCallbacks.onNavigateToLastChild
      ? movementCallbacks.onNavigateToLastChild
      : () => {},
  });

  const content = (
    <span ref={nodeRef as React.RefObject<HTMLSpanElement>} onKeyDown={handleKeyDown} tabIndex={0}>
      {props.node.code.length === 0 ? (
        <UnknownRender
          ref={emptyFileRef as React.RefObject<HTMLSpanElement>}
          node={{
            id: crypto.randomUUID(),
            type: "unknown",
            content: "",
          }}
          parentInfo={parentInfoFromChild(props.node, "code")}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {listRender}
        </div>
      )}
    </span>
  );

  return content;
}

function CompoundStatementRender(props: XRenderProps<objects.CompoundStatement>): React.ReactNode {
  const { onEdit, nodeMap, requestFocus } = useLineContext();
  useFocusStructuralNode(props.node.id, props.ref);

  const childCallbacks = createParentArrayFieldEditCallbacks(
    props.node,
    "codeBlock",
    createUnknown,
    nodeMap,
    onEdit,
    requestFocus
  );
  const { listRender, childRefs } = ListFieldRender(
    props,
    "codeBlock",
    { insertConstructor: createUnknown },
    ({ item, nodeRender }) => (
      <div>
        {nodeRender} {leadingSemicolon(item) && ";"}
      </div>
    )
  );
  const movementCallbacks = createChildNavigationCallbacks(childRefs);

  return (
    <Object {...props} callbacks={{ ...props.callbacks, ...childCallbacks, ...movementCallbacks }}>
      {
        <span ref={props.ref} tabIndex={0}>
          <span className="token-delimiter">{"{"}</span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              paddingLeft: "20px",
            }}
          >
            {listRender}
          </div>
          <span className="token-delimiter">{"}"}</span>
        </span>
      }
    </Object>
  );
}

function leadingSemicolon(node: objects.LanguageObject): boolean {
  // Determine if a semicolon should be added after this node when in a compound statement
  switch (node.type) {
    case "declaration":
    case "assignmentExpression":
    case "callExpression":
    case "binaryExpression":
    case "numberLiteral":
    case "stringLiteral":
    case "unknown":
    case "returnStatement":
      return true;
    default:
      return false;
  }
}

function IfStatementRender(props: XRenderProps<objects.IfStatement>): React.ReactNode {
  const { onEdit, nodeMap, requestFocus } = useLineContext();

  const callbacks = {
    onInsertChildFirst: () => {
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
        requestFocus({ nodeId: newElseClause.id });
      }
    },
  };

  const elseIfRef = React.useRef<HTMLElement>(null);
  const conditionRef = React.useRef<HTMLElement>(null);
  const bodyRef = React.useRef<HTMLElement>(null);
  useFocusStructuralNode(props.node.id, props.ref);
  const elseRef = React.useRef<HTMLElement>(null);

  const ifCallbacks = createChildNavigationCallbacks({
    firstChild: conditionRef as React.RefObject<HTMLElement>,
    lastChild: elseRef as React.RefObject<HTMLElement>,
  });

  const conditionCallbacks = {
    ...createRequiredFieldCallbacks(props.node, "condition", nodeMap, onEdit, requestFocus),
    ...createParentNavigationCallbacks({
      parent: props.ref as React.RefObject<HTMLElement>,
      previousSibling: props.ref as React.RefObject<HTMLElement>,
      nextSibling: bodyRef as React.RefObject<HTMLElement>,
    }),
  };

  const bodyCallbacks = {
    ...createRequiredFieldCallbacks(props.node, "body", nodeMap, onEdit, requestFocus),
    ...createParentNavigationCallbacks({
      parent: props.ref as React.RefObject<HTMLElement>,
      previousSibling: conditionRef as React.RefObject<HTMLElement>,
      nextSibling: elseRef as React.RefObject<HTMLElement>,
    }),
  };

  const elseRender =
    props.node.elseStatement &&
    (props.node.elseStatement.type === "elseClause"
      ? (() => {
          const elseCallbacks = createParentNavigationCallbacks({
            parent: props.ref as React.RefObject<HTMLElement>,
            previousSibling: conditionRef as React.RefObject<HTMLElement>,
            nextSibling: undefined,
          });
          return (
            <NodeRender
              ref={elseRef as React.RefObject<HTMLSpanElement>}
              node={props.node.elseStatement}
              parentInfo={parentInfoFromChild(props.node, "elseStatement")}
              display="inline"
              callbacks={{
                ...createOptionalFieldCallbacks(
                  props.node,
                  "elseStatement",
                  nodeMap,
                  onEdit,
                  requestFocus
                ),
                ...elseCallbacks,
              }}
            />
          );
        })()
      : (() => {
          const elseMovementCallbacks = createParentNavigationCallbacks({
            parent: elseRef as React.RefObject<HTMLElement>,
            previousSibling: elseRef as React.RefObject<HTMLElement>,
            nextSibling: undefined,
          });
          const ifElseCallbacks = {
            ...createParentNavigationCallbacks({
              parent: props.ref as React.RefObject<HTMLElement>,
              previousSibling: conditionRef as React.RefObject<HTMLElement>,
              nextSibling: elseIfRef as React.RefObject<HTMLElement>,
            }),
            ...createChildNavigationCallbacks({
              firstChild: elseIfRef as React.RefObject<HTMLElement>,
              lastChild: elseIfRef as React.RefObject<HTMLElement>,
            }),
          };
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
                parentInfo={parentInfoFromChild(props.node, "elseStatement")}
                callbacks={{
                  ...createOptionalFieldCallbacks(
                    props.node,
                    "elseStatement",
                    nodeMap,
                    onEdit,
                    requestFocus
                  ),
                  ...ifElseCallbacks,
                }}
              >
                <span
                  className="token-keyword"
                  tabIndex={0}
                  ref={elseRef as React.RefObject<HTMLElement>}
                >
                  else
                </span>
              </Object>{" "}
              <NodeRender
                ref={elseIfRef as React.RefObject<HTMLSpanElement>}
                node={ifStatement}
                parentInfo={parentInfoFromChild(props.node, "elseStatement")}
                display="inline"
                callbacks={{ ...elseClauseCallbacks, ...elseMovementCallbacks }}
              />
            </>
          );
        })());

  return (
    <Object {...props} callbacks={{ ...props.callbacks, ...callbacks, ...ifCallbacks }}>
      <span ref={props.ref} tabIndex={0}>
        <span className="token-keyword">if</span> <span className="token-keyword">{"("}</span>
        <NodeRender
          ref={conditionRef as React.RefObject<HTMLSpanElement>}
          node={props.node.condition}
          parentInfo={parentInfoFromChild(props.node, "condition")}
          display="inline"
          callbacks={conditionCallbacks}
        />
        <span className="token-keyword">{")"}</span>{" "}
      </span>
      <NodeRender
        ref={bodyRef as React.RefObject<HTMLSpanElement>}
        node={props.node.body}
        parentInfo={parentInfoFromChild(props.node, "body")}
        display="inline"
        callbacks={bodyCallbacks}
      />
      {elseRender}
    </Object>
  );
}

function ElseClauseRender(props: XRenderProps<objects.ElseClause>): React.ReactNode {
  // handle enter to convert to ifStatement
  const { onEdit, nodeMap, parentNodeInfo, requestFocus } = useLineContext();
  useFocusStructuralNode(props.node.id, props.ref);

  const callbacks = {
    onInsertChildFirst: () => {
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
      requestFocus({ nodeId: newIfStatement.condition.id });
    },
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
      props.node.body = emptyBody;
      nodeMap.delete(node.id);
      nodeMap.set(emptyBody.id, emptyBody);
      onEdit(props.node, "body");
    },
  };

  const bodyRef = React.useRef<HTMLElement>(null);

  return (
    <Object {...props} callbacks={{ ...props.callbacks, ...callbacks }}>
      <span
        ref={props.ref as React.RefObject<HTMLSpanElement>}
        className="token-keyword"
        tabIndex={0}
      >
        {" else "}
      </span>
      <NodeRender
        node={props.node.body}
        ref={bodyRef as React.RefObject<HTMLSpanElement>}
        parentInfo={parentInfoFromChild(props.node, "body")}
        display="inline"
        callbacks={bodyCallbacks}
      />
    </Object>
  );
}

function ReturnStatementRender(props: XRenderProps<objects.ReturnStatement>): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();
  useFocusStructuralNode(props.node.id, props.ref);

  const valueRef = React.useRef<HTMLElement>(null);
  const editingCallbacks = createParentOptionalFieldCallbacks(
    props.node,
    "value",
    createUnknown,
    nodeMap,
    onEdit,
    requestFocus
  );
  const movementCallbacks = createChildNavigationCallbacks({
    firstChild: valueRef as React.RefObject<HTMLElement>,
    lastChild: valueRef as React.RefObject<HTMLElement>,
  });

  const valueCallbacks = {
    ...createOptionalFieldCallbacks(props.node, "value", nodeMap, onEdit, requestFocus),
    ...createParentNavigationCallbacks({
      parent: props.ref,
    }),
  };
  return (
    <Object
      {...props}
      callbacks={{ ...props.callbacks, ...editingCallbacks, ...movementCallbacks }}
      display="inline"
    >
      {
        <span ref={props.ref as React.RefObject<HTMLSpanElement>} tabIndex={0}>
          <span className="token-keyword">return</span>
          {props.node.value && (
            <>
              {" "}
              <NodeRender
                ref={valueRef as React.RefObject<HTMLSpanElement>}
                node={props.node.value}
                parentInfo={parentInfoFromChild(props.node, "value")}
                display="inline"
                callbacks={valueCallbacks}
              />
            </>
          )}
        </span>
      }
    </Object>
  );
}

function CallExpressionRender(props: XRenderProps<objects.CallExpression>): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();

  const callbacks = createParentArrayFieldEditCallbacks(
    props.node,
    "argumentList",
    createUnknown,
    nodeMap,
    onEdit,
    requestFocus
  );

  const { listRender, childRefs } = ListFieldRender(
    props,
    "argumentList",
    { insertConstructor: createUnknown },
    ({ idx, nodeRender }) => (
      <span>
        {idx > 0 && ", "}
        {nodeRender}
      </span>
    )
  );
  const movementCallbacks = createChildNavigationCallbacks(childRefs);
  return (
    <Object {...props} callbacks={{ ...props.callbacks, ...callbacks, ...movementCallbacks }}>
      <CallExpressionSelector
        node={props.node}
        ref={props.ref}
        parentInfo={props.parentInfo}
        firstField={true}
        className="token-function"
      />
      <span className="token-delimiter">{"("}</span>
      {listRender}
      <span className="token-delimiter">{")"}</span>
    </Object>
  );
}

function ReferenceRender(props: XRenderProps<objects.Reference>): React.ReactNode {
  return (
    <Object {...props}>
      {
        <ReferenceSelector
          node={props.node}
          ref={props.ref}
          parentInfo={props.parentInfo}
          firstField={true}
          className="token-variable"
          callbacks={props.callbacks}
        />
      }
    </Object>
  );
}

function AssignmentExpressionRender(
  props: XRenderProps<objects.AssignmentExpression>
): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();
  const valueRef = React.useRef<HTMLElement>(null);

  return (
    <Object {...props}>
      <span className="token-variable">
        {
          <AssignmentSelector
            node={props.node}
            ref={props.ref}
            parentInfo={props.parentInfo}
            firstField={true}
            className="token-variable"
          />
        }
      </span>{" "}
      {"="}{" "}
      <NodeRender
        ref={valueRef as React.RefObject<HTMLSpanElement>}
        node={props.node.value}
        parentInfo={parentInfoFromChild(props.node, "value")}
        display="inline"
        callbacks={createRequiredFieldCallbacks(props.node, "value", nodeMap, onEdit, requestFocus)}
      />
    </Object>
  );
}

function NumberLiteralRender(props: XRenderProps<objects.NumberLiteral>): React.ReactNode {
  return (
    <Object {...props}>
      {EditableField({
        node: props.node,
        key: "value",
        ref: props.ref as React.RefObject<HTMLInputElement>,
        parentInfo: props.parentInfo,
        firstField: true,
        className: "token-number",
        placeholder: "0",
      })}
    </Object>
  );
}

function StringLiteralRender(props: XRenderProps<objects.StringLiteral>): React.ReactNode {
  return (
    <Object {...props}>
      <span className="token-string">{'"'}</span>
      {EditableField({
        node: props.node,
        key: "value",
        ref: props.ref as React.RefObject<HTMLInputElement>,
        parentInfo: props.parentInfo,
        firstField: true,
        className: "token-string",
        placeholder: "text",
      })}
      <span className="token-string">{'"'}</span>
    </Object>
  );
}

function BinaryExpressionRender(props: XRenderProps<objects.BinaryExpression>): React.ReactNode {
  const { nodeMap, onEdit, requestFocus } = useLineContext();

  const leftRef = React.useRef<HTMLElement>(null);
  const rightRef = React.useRef<HTMLElement>(null);

  return (
    <Object {...props}>
      <NodeRender
        ref={leftRef as React.RefObject<HTMLSpanElement>}
        node={props.node.left}
        parentInfo={parentInfoFromChild(props.node, "left")}
        display="inline"
        callbacks={createRequiredFieldCallbacks(props.node, "left", nodeMap, onEdit, requestFocus)}
      />{" "}
      {EditableField({
        node: props.node,
        key: "operator",
        ref: props.ref as React.RefObject<HTMLInputElement>,
        parentInfo: props.parentInfo,
        firstField: true,
        placeholder: "op",
      })}{" "}
      <NodeRender
        ref={rightRef as React.RefObject<HTMLSpanElement>}
        node={props.node.right}
        parentInfo={parentInfoFromChild(props.node, "right")}
        display="inline"
        callbacks={createRequiredFieldCallbacks(props.node, "right", nodeMap, onEdit, requestFocus)}
      />
    </Object>
  );
}

function CommentRender(props: XRenderProps<objects.Comment>): React.ReactNode {
  return (
    <Object {...props}>
      <span className="token-comment">{"//"}</span>{" "}
      {EditableField({
        node: props.node,
        key: "content",
        ref: props.ref as React.RefObject<HTMLInputElement>,
        parentInfo: props.parentInfo,
        firstField: true,
        className: "token-comment",
        placeholder: "comment",
      })}
    </Object>
  );
}
