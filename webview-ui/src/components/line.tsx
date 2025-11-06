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
  insertUnknownIntoField,
  createRequiredFieldCallbacks,
  createParameter,
  appendToArray,
  createUnknown,
  prependToArray,
  createKeyDownHandler,
} from "../lib/editionHelpers";
import * as Autocomplete from "./selectors/Autocomplete";
import CallExpressionSelector from "./selectors/CallExpressionSelector";
import AssignmentSelector from "./selectors/AssignmentSelector";
import ReferenceSelector from "./selectors/ReferenceSelector";
import EditableField from "./EditableField";
import TypeSelector from "./selectors/TypeSelector";
import { FocusRequest } from "../context/line/LineProvider";
import { createParentNativationCallbacks, ParentRefs } from "../lib/navigationHelpers";
import { NodeEditCallbacks, NodeNavigationCallbacks } from "../lib/keyBinds";

// Hook to handle focus requests for structural nodes (nodes with tabIndex={0})
function useFocusStructuralNode(nodeId: string) {
  const { focusRequest, clearFocusRequest } = useLineContext();
  const nodeRef = React.useRef<HTMLElement>(null);
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
  }, [focusRequest, nodeId, clearFocusRequest]);

  return nodeRef;
}

function useFocusStructuralNode2(nodeId: string, nodeRef: RefObject<HTMLElement>) {
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
    insertChildFirst: () => {
      if (isSelected && callbacks?.onInsertChildFirst) {
        console.log("Object: Inserting at beginning for", node.type);
        callbacks.onInsertChildFirst();
      }
    },
    insertChildLast: () => {
      if (isSelected && callbacks?.onInsertChildLast) {
        console.log("Object: Inserting at end for", node.type);
        callbacks.onInsertChildLast();
      }
    },
    navigateToPreviousSibling: () => {
      if (isSelected && callbacks?.onNavigateToPreviousSibling) {
        console.log("Object: navigateToPreviousSibling", node.type);
        callbacks.onNavigateToPreviousSibling();
      }
    },
    navigateToNextSibling: () => {
      if (isSelected && callbacks?.onNavigateToNextSibling) {
        console.log("Object: navigateToNextSibling", node.type);
        callbacks.onNavigateToNextSibling();
      }
    },
    navigateToParent: () => {
      if (isSelected && callbacks?.onNavigateToParent) {
        console.log("Object: navigateToParentNode", node.type);
        callbacks.onNavigateToParent();
      }
    },
    navigateToFirstChild: () => {
      if (isSelected && callbacks?.onNavigateToFirstChild) {
        console.log("Object: navigateToFirstChild", node.type);
        callbacks.onNavigateToFirstChild();
      }
    },
    navigateToLastChild: () => {
      if (isSelected && callbacks?.onNavigateToLastChild) {
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
): React.ReactNode {
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

  return (
    <>
      {list.map((item, i) => {
        const currentRef = itemRefs.current.get(item.id)!;
        const previousSibling = i > 0 ? itemRefs.current.get(list[i - 1].id) : undefined;
        const nextSibling = i < list.length - 1 ? itemRefs.current.get(list[i + 1].id) : undefined;
        console.log(
          "Rendering ListItem for item:",
          item.id,
          " with refs:",
          parent.ref,
          previousSibling,
          nextSibling
        );
        return ListItem<T, K, KT>(parent, key, i, callbacks, item, render, currentRef, {
          parent: parent.ref,
          previousSibling,
          nextSibling,
        });
      })}
    </>
  );
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
  const parentNavigationCallbacks = createParentNativationCallbacks(refs);
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

  const content = (
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
  );

  return <Object {...props}>{content}</Object>;
}

function PreprocIncludeRender(props: XRenderProps<objects.PreprocInclude>): React.ReactNode {
  const content = (
    <>
      <span className="token-keyword">#include</span>{" "}
      {EditableField({
        node: props.node,
        key: "content",
        parentInfo: props.parentInfo,
        firstField: true,
        className: "token-string",
        placeholder: "file.h",
      })}
    </>
  );

  return <Object {...props}>{content}</Object>;
}

function FunctionDeclarationRender(
  props: XRenderProps<objects.FunctionDeclaration>
): React.ReactNode {
  const { nodeMap, onEdit, requestFocus, mode } = useLineContext();
  nodeMap.set(props.node.id, props.node);

  const handleKeyDown = createKeyDownHandler(mode, {
    insertChildFirst: () => {
      console.log("FunctionDeclarationRender: Prepending parameter");
      prependToArray(props.node, "parameterList", createParameter, nodeMap, onEdit, requestFocus);
    },
    insertChildLast: () => {
      console.log("FunctionDeclarationRender: Appending parameter");
      appendToArray(props.node, "parameterList", createParameter, nodeMap, onEdit, requestFocus);
    },
    navigateToPreviousSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToNextSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToParent: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToFirstChild: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToLastChild: function (): void {
      throw new Error("Function not implemented.");
    },
  });

  const content = (
    <span onKeyDown={handleKeyDown}>
      {TypeSelector({
        node: props.node,
        key: "returnType",
        parentInfo: props.parentInfo,
        firstField: true,
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
      {ListFieldRender(
        props,
        "parameterList",
        { insertConstructor: createParameter },
        ({ idx, nodeRender }) => (
          <span>
            {idx > 0 && ", "}
            {nodeRender}
          </span>
        )
      )}
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

  const compoundStatementRef = React.useRef<HTMLElement>(null);

  const handleKeyDown = createKeyDownHandler(mode, {
    insertChildFirst: () => {
      console.log("FunctionDefinitionRender: Prepending parameter");
      prependToArray(props.node, "parameterList", createParameter, nodeMap, onEdit, requestFocus);
    },
    insertChildLast: () => {
      console.log("FunctionDefinitionRender: Appending parameter");
      appendToArray(props.node, "parameterList", createParameter, nodeMap, onEdit, requestFocus);
    },
    navigateToPreviousSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToNextSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToParent: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToFirstChild: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToLastChild: function (): void {
      throw new Error("Function not implemented.");
    },
  });

  const content = (
    <span onKeyDown={handleKeyDown}>
      {TypeSelector({
        node: props.node,
        key: "returnType",
        parentInfo: props.parentInfo,
        firstField: true,
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
      {ListFieldRender(
        props,
        "parameterList",
        { insertConstructor: createParameter },
        ({ idx, nodeRender }) => (
          <span>
            {idx > 0 && ", "}
            {nodeRender}
          </span>
        )
      )}
      <span className="token-delimiter">{")"}</span>
      <NodeRender
        ref={compoundStatementRef as React.RefObject<HTMLSpanElement>}
        node={props.node.compoundStatement}
        parentInfo={parentInfoFromChild(props.node, "compoundStatement")}
        // callbacks={} TODO: transform into FunctionDeclaration on delete
      />
    </span>
  );

  return <Object {...props}>{content}</Object>;
}

function DeclarationRender(props: XRenderProps<objects.Declaration>): React.ReactNode {
  const { nodeMap, onEdit, mode, requestFocus } = useLineContext();
  nodeMap.set(props.node.id, props.node);

  const handleKeyDown = createKeyDownHandler(mode, {
    insertChildFirst: () => {
      if (!props.node.value) {
        console.log("DeclarationRender: Inserting unknown node as value");
        insertUnknownIntoField(props.node, "value", nodeMap, onEdit, requestFocus);
      }
    },
    navigateToPreviousSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToNextSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToParent: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToFirstChild: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToLastChild: function (): void {
      throw new Error("Function not implemented.");
    },
  });

  const valueRef = React.useRef<HTMLElement>(null);
  const content = (
    <span onKeyDown={handleKeyDown}>
      {TypeSelector({
        node: props.node,
        key: "primitiveType",
        parentInfo: props.parentInfo,
        firstField: true,
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
            ref={valueRef as React.RefObject<HTMLSpanElement>}
            node={props.node.value}
            display="inline"
            parentInfo={parentInfoFromChild(props.node, "value")}
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
        firstField: true,
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
    insertChildFirst: () => {
      console.log("SourceFileRender: Inserting unknown node");
      prependToArray(props.node, "code", createUnknown, nodeMap, onEdit, requestFocus);
    },
    navigateToPreviousSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToNextSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToParent: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToFirstChild: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToLastChild: function (): void {
      throw new Error("Function not implemented.");
    },
  });

  const emptyFileRef = React.useRef<HTMLElement>(null);

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
          {ListFieldRender(
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
          )}
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
    insertChildFirst: () => {
      console.log("CompoundStatementRender: Inserting unknown node");
      prependToArray(props.node, "codeBlock", createUnknown, nodeMap, onEdit, requestFocus);
    },
    insertChildLast: () => {
      console.log("CompoundStatementRender: Appending unknown node");
      appendToArray(props.node, "codeBlock", createUnknown, nodeMap, onEdit, requestFocus);
    },
    navigateToPreviousSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToNextSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToParent: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToFirstChild: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToLastChild: function (): void {
      throw new Error("Function not implemented.");
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
        {ListFieldRender(
          props,
          "codeBlock",
          { insertConstructor: createUnknown },
          ({ item, nodeRender }) => (
            <div>
              {nodeRender} {leadingSemicolon(item) && ";"}
            </div>
          )
        )}
      </div>
      <span className="token-delimiter">{"}"}</span>
    </span>
  );

  return <Object {...props}>{content}</Object>;
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
  const { mode, onEdit, nodeMap, requestFocus } = useLineContext();

  const handleKeyDown = createKeyDownHandler(mode, {
    insertChildFirst: () => {
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
    navigateToPreviousSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToNextSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToParent: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToFirstChild: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToLastChild: function (): void {
      throw new Error("Function not implemented.");
    },
  });

  useFocusStructuralNode2(props.node.id, props.ref);
  const elseRef = React.useRef<HTMLElement>(null);
  const elseRender =
    props.node.elseStatement &&
    (props.node.elseStatement.type === "elseClause" ? (
      <NodeRender
        ref={elseRef as React.RefObject<HTMLSpanElement>}
        node={props.node.elseStatement}
        parentInfo={parentInfoFromChild(props.node, "elseStatement")}
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
              parentInfo={parentInfoFromChild(props.node, "elseStatement")}
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
              ref={elseRef as React.RefObject<HTMLSpanElement>}
              node={ifStatement}
              parentInfo={parentInfoFromChild(props.node, "elseStatement")}
              display="inline"
              callbacks={elseClauseCallbacks}
            />
          </>
        );
      })()
    ));
  const conditionRef = React.useRef<HTMLElement>(null);
  const bodyRef = React.useRef<HTMLElement>(null);
  const content = (
    <span>
      <span ref={props.ref} tabIndex={0} onKeyDown={handleKeyDown}>
        <span className="token-keyword">if</span> <span className="token-keyword">{"("}</span>
        <NodeRender
          ref={conditionRef as React.RefObject<HTMLSpanElement>}
          node={props.node.condition}
          parentInfo={parentInfoFromChild(props.node, "condition")}
          display="inline"
        />
        <span className="token-keyword">{")"}</span>{" "}
      </span>
      <NodeRender
        ref={bodyRef as React.RefObject<HTMLSpanElement>}
        node={props.node.body}
        parentInfo={parentInfoFromChild(props.node, "body")}
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
  useFocusStructuralNode2(props.node.id, props.ref);

  const handleKeyDown = createKeyDownHandler(mode, {
    insertChildFirst: () => {
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
    navigateToPreviousSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToNextSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToParent: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToFirstChild: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToLastChild: function (): void {
      throw new Error("Function not implemented.");
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

  const bodyRef = React.useRef<HTMLElement>(null);
  const content = (
    <>
      <span
        ref={props.ref as React.RefObject<HTMLSpanElement>}
        className="token-keyword"
        onKeyDown={handleKeyDown}
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
      {/* </Object> */}
    </>
  );

  return <Object {...props}>{content}</Object>;
}

function ReturnStatementRender(props: XRenderProps<objects.ReturnStatement>): React.ReactNode {
  const { nodeMap, onEdit, mode, requestFocus } = useLineContext();
  useFocusStructuralNode2(props.node.id, props.ref);

  const handleKeyDown = createKeyDownHandler(mode, {
    insertChildFirst: () => {
      if (!props.node.value) {
        console.log("ReturnStatementRender: Inserting unknown node as return value");
        insertUnknownIntoField(props.node, "value", nodeMap, onEdit, requestFocus);
      }
    },
    navigateToPreviousSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToNextSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToParent: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToFirstChild: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToLastChild: function (): void {
      throw new Error("Function not implemented.");
    },
  });

  const valueRef = React.useRef<HTMLElement>(null);
  const content = (
    <span
      ref={props.ref as React.RefObject<HTMLSpanElement>}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <span className="token-keyword">return</span>
      {props.node.value && (
        <>
          {" "}
          <NodeRender
            ref={valueRef as React.RefObject<HTMLSpanElement>}
            node={props.node.value}
            parentInfo={parentInfoFromChild(props.node, "value")}
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
    </span>
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
    insertChildFirst: () => {
      console.log("CallExpressionRender: Appending argument");
      appendToArray(props.node, "argumentList", createUnknown, nodeMap, onEdit, requestFocus);
    },
    navigateToPreviousSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToNextSibling: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToParent: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToFirstChild: function (): void {
      throw new Error("Function not implemented.");
    },
    navigateToLastChild: function (): void {
      throw new Error("Function not implemented.");
    },
  });

  const content = (
    <span onKeyDown={handleKeyDown}>
      <CallExpressionSelector
        node={props.node}
        parentInfo={props.parentInfo}
        firstField={true}
        className="token-function"
      />
      <span className="token-delimiter">{"("}</span>
      {ListFieldRender(
        props,
        "argumentList",
        { insertConstructor: createUnknown },
        ({ idx, nodeRender }) => (
          <span>
            {idx > 0 && ", "}
            {nodeRender}
          </span>
        )
      )}
      <span className="token-delimiter">{")"}</span>
    </span>
  );

  return <Object {...props}>{content}</Object>;
}

function ReferenceRender(props: XRenderProps<objects.Reference>): React.ReactNode {
  const content = (
    <ReferenceSelector
      node={props.node}
      parentInfo={props.parentInfo}
      firstField={true}
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
  const valueRef = React.useRef<HTMLElement>(null);
  const content = (
    <>
      <span className="token-variable">
        {
          <AssignmentSelector
            node={props.node}
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
        firstField: true,
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
        firstField: true,
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

  const leftRef = React.useRef<HTMLElement>(null);
  const rightRef = React.useRef<HTMLElement>(null);
  const content = (
    <>
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
        firstField: true,
        className: "token-comment",
        placeholder: "comment",
      })}
    </>
  );

  return <Object {...props}>{content}</Object>;
}
