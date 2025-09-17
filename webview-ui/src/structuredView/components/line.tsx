import React from 'react';
import { useLineContext } from './lineContext';
import * as nodes from '../../../../src/nodes/cNodes';

function EditableField<T extends nodes.Node, K extends keyof T>(node: T, key: K) {
  const { onEdit } = useLineContext();
  const [inputValue, setInputValue] = React.useState(String(node[key] ?? ""));

  // Keep inputValue in sync if node[key] changes externally
  React.useEffect(() => {
    setInputValue(String(node[key] ?? ""));
  }, [node, key]);

  return (
    <input
      className="inline-editor"
      value={inputValue}
      size={Math.max(1, inputValue.length)}
      onChange={(e) => setInputValue(e.target.value)}
      onInput={(e) => {
        const el = e.target as HTMLInputElement;
        el.size = Math.max(1, el.value.length); // dynamically adjust width
      }}
      onBlur={() => {
        node[key] = inputValue as T[K];
        onEdit(node);
      }}
    />
  );
}

interface LineProps {
  indent: number;
  node: nodes.Node;
  children: React.ReactNode;
}

export function Line({ indent, node, children }: LineProps) {
  const { selectedNodeId, setSelectedNodeId, insertTargetId, setInsertTargetId, onEdit, nodeMap, parentMap } = useLineContext();
  const isSelected = selectedNodeId === node.id;
  const showDropdown = insertTargetId === node.id;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSelected) return;

    if (e.key === "Enter") {
      e.preventDefault();
      setInsertTargetId(node.id); // trigger dropdown
    }
  };

  const handleSelect = (type: "VarDecl" | "ReturnStmt") => {
    if (!node) return;
    // create new node based on selection
    let newNode: nodes.Node;
    if (type === "VarDecl") {
      newNode = {
        id: crypto.randomUUID(),
        type: "VarDecl",
        data_type: "",
        name: "",
        initializer: {
            id: crypto.randomUUID(),
            type: "LiteralExpr",
            value: "",
        } as nodes.LiteralExpr,
      } as nodes.VarDecl;
    } else {
      newNode = {
        id: crypto.randomUUID(),
        type: "ReturnStmt",
        expression: undefined
      } as nodes.ReturnStmt;
    }

    // insert logic: e.g., in CompStmt
    const parentInfo = parentMap.get(node.id);
    if (!parentInfo) return;
    const { parent, key, index } = parentInfo;
    if (!parent || !("statements" in parent)) return;

    const field = parent["statements"] as nodes.Node[];
    const newArray = [...field.slice(0, index + 1), newNode, ...field.slice(index + 1)];
    parent["statements"] = newArray;

    nodeMap.set(newNode.id, newNode);
    parentMap.set(newNode.id, { parent, key, index: index + 1 });

    setInsertTargetId(null); // close dropdown
    onEdit(parent);
  };

  return (
    <div 
        tabIndex={0} onClick={() => setSelectedNodeId(node.id)} onKeyDown={handleKeyDown}
        style={{backgroundColor: isSelected ? "rgba(0,120,215,0.2)" : "transparent"}}
    >
      <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
        {"    ".repeat(indent)}
        {children}
      </div>

      {showDropdown && (
        <div style={{ border: "1px solid #ccc", background: "black", position: "absolute" }}>
          <div onClick={() => handleSelect("VarDecl")}>VarDecl</div>
          <div onClick={() => handleSelect("ReturnStmt")}>ReturnStmt</div>
        </div>
      )}
    </div>
  );
}

interface NodeRenderProps {
    node: nodes.Node;
    indent: number;
}

export function NodeRender({ node, indent }: NodeRenderProps): React.ReactNode {
    //console.log(node.type);
    
    switch (node.type) {
        case "IncludeDecl":
            return(<IncludeDeclRender includeDecl={node as nodes.IncludeDecl} indent={indent}/>)
        case "FuncDecl":
            return(<FuncDeclRender funcDecl={node as nodes.FuncDecl} indent={indent}/>)
        case "VarDecl":
            return(<VarDeclRender varDecl={node as nodes.VarDecl} indent={indent}/>)
        case "ParamDecl":
            return(<ParamDeclRender paramDecl={node as nodes.ParamDecl} />)
        case "CompStmt":
            return(<CompStmtRender compStmt={node as nodes.CompStmt} indent={indent}/>)
        case "ReturnStmt":
            return(<ReturnStmtRender returnStmt={node as nodes.ReturnStmt} indent={indent}/>)
        case "CallExpr":
            return(<CallExprRender callExpr={node as nodes.CallExpr}/>)
        case "DeclRefExpr":
            return(<DeclRefExprRender declRefExpr={node as nodes.DeclRefExpr}/>)
        case "AssignmentExpr":
            return(<AssignmentExprRender assignmentExpr={node as nodes.AssignmentExpr}/>)
        case "LiteralExpr":
            return(<LiteralExprRender literalExpr={node as nodes.LiteralExpr}/>)
        case "IdentifierExpr":
            return(<IdentifierExprRender identifierExpr={node as nodes.IdentifierExpr}/>)
        default:
            return("WIP")
    }
}

function IncludeDeclRender({includeDecl, indent}: {includeDecl: nodes.IncludeDecl, indent: number} ): React.ReactNode {
    return(
        <Line indent={indent} node={includeDecl}>
            <>
            {"#include "}
            {"<"}
            {EditableField(includeDecl, "directive")}
            {">"}
            {";"}
            </>
        </Line>
        
    )
}

function FuncDeclRender({funcDecl, indent}: {funcDecl: nodes.FuncDecl, indent: number}): React.ReactNode {
    const { nodeMap } = useLineContext();
    nodeMap.set(funcDecl.id, funcDecl);
    
    return(
        <>
            <Line indent={indent} node={funcDecl}>
                <>
                    {EditableField(funcDecl, "return_type")} 
                    {EditableField(funcDecl, "name")} 
                    {"("}
                    {funcDecl.params.map((param, i) => (
                        <React.Fragment key={param.id}>
                            {i > 0 && ", "}
                            <ParamDeclRender paramDecl={param}/>
                        </React.Fragment>
                    ))}
                    {")"}
                    {"{"}
                </>
            </Line>

            {funcDecl.body && (<CompStmtRender compStmt={funcDecl.body} indent={indent + 1} />)}

            <Line indent={indent} node={funcDecl}>
                {"}"}
            </Line>
        </>
    )
}

function VarDeclRender({varDecl, indent}: {varDecl: nodes.VarDecl, indent: number}): React.ReactNode {
    const { nodeMap } = useLineContext();
    nodeMap.set(varDecl.id, varDecl);

    return(
        <Line indent={indent} node={varDecl}>
            {EditableField(varDecl, "data_type")} 
            {EditableField(varDecl, "name")} 
            {varDecl.initializer && (
                <>
                    {"= "}
                    <NodeRender node={varDecl.initializer} indent={indent}/>
                </>
            )} 
            {";"}
        </Line>
    )
}

function ParamDeclRender({paramDecl}: {paramDecl: nodes.ParamDecl}): React.ReactNode {
    const { nodeMap } = useLineContext();
    nodeMap.set(paramDecl.id, paramDecl);

    return(
        <>
            {EditableField(paramDecl, "data_type")} 
            {EditableField(paramDecl, "name")}
        </>
    )
}

function CompStmtRender({compStmt, indent}: {compStmt: nodes.CompStmt, indent: number}): React.ReactNode {
    return(
        compStmt.statements.map(node => (
            <NodeRender node={node} indent={indent} />
        ))
    )
}

function ReturnStmtRender({returnStmt, indent}: {returnStmt: nodes.ReturnStmt, indent: number}): React.ReactNode {
    return(
        <Line indent={indent} node={returnStmt}>
            {"return"} 
            {returnStmt.expression && (
                <>
                    {" "}
                    <NodeRender node={returnStmt.expression} indent={0}/>
                </>
            )}
            {";"}
        </Line>
    )
}

function CallExprRender({callExpr}: {callExpr: nodes.CallExpr}): React.ReactNode {
    return(
        <>
            <NodeRender node={callExpr.calle} indent={0}/>
            {"("} 
            {callExpr.args.map((arg, i) => (
                <React.Fragment key={arg.id}>
                    {i > 0 && ", "}
                    <NodeRender node={arg} indent={0}/>
                </React.Fragment>
            ))}
            {");"}
        </>
    )
}

function DeclRefExprRender({declRefExpr}: {declRefExpr: nodes.DeclRefExpr}): React.ReactNode {
    const { nodeMap } = useLineContext();
    const targetNode = nodeMap.get(declRefExpr.DeclRefId);

    if (!targetNode || !("name" in targetNode)) {
        return(<>{declRefExpr.DeclRefId}</>)
    }

    return(<>{targetNode.name}</>)
}

function AssignmentExprRender({assignmentExpr}: {assignmentExpr: nodes.AssignmentExpr}): React.ReactNode {
    return(
        <>
            {"TODO assignmentExpr. node id: "} 
            {assignmentExpr.id}
        </> //TODO
    )
}

function LiteralExprRender({literalExpr}: {literalExpr: nodes.LiteralExpr}): React.ReactNode {
    return(
        <>{EditableField(literalExpr, "value")}</>
    )
}

function IdentifierExprRender({identifierExpr}: {identifierExpr: nodes.IdentifierExpr}): React.ReactNode {
    return(
        <>{EditableField(identifierExpr, "identifier")}</>
    )
}