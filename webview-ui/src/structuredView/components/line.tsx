import React from 'react';
import * as nodes from '../../../../src/nodes/cNodes';

const nodeMap: Map<string, nodes.VarDecl | nodes.ParamDecl | nodes.FuncDecl> = new Map();

interface LineProp {
    indent: number;
    node: nodes.Node;
    onEdit: (edit: nodes.Node) => void;
}

export function Line({ indent, node, onEdit }: LineProp) {
    return(
        <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{"    ".repeat(indent)}{mapLine(node, indent, onEdit)}</div>
    )
}

function mapLine(node: nodes.Node, indent: number, onEdit: (n: nodes.Node) => void): React.ReactNode {
    console.log(node.type);
    
    switch (node.type) {
        case "IncludeDecl":
            return(createIncludeDecl(node as nodes.IncludeDecl, onEdit))
        case "FuncDecl":
            return(createFuncDecl(node as nodes.FuncDecl, indent, onEdit))
        case "VarDecl":
            return(createVarDecl(node as nodes.VarDecl, onEdit))
        case "ParamDecl":
            return(createParamDecl(node as nodes.ParamDecl))
        case "CompStmt":
            return(createCompStmt(node as nodes.CompStmt, indent, onEdit))
        case "ReturnStmt":
            return(createReturnStmt(node as nodes.ReturnStmt, onEdit))
        case "CallExpr":
            return(createCallExpr(node as nodes.CallExpr, onEdit))
        case "DeclRefExpr":
            return(createDeclRefExpr(node as nodes.DeclRefExpr))
        case "AssignmentExpr":
            return(createAssignmentExpr(nodes as nodes.AssignmentExpr))
        case "LiteralExpr":
            return(createLiteralExpr(node as nodes.LiteralExpr))
        case "IdentifierExpr":
            return(createIdentifierExpr(node as nodes.IdentifierExpr))
        default:
            return("WIP")
    }
}

function createIncludeDecl(include: nodes.IncludeDecl, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        <>
        #include {" "}
        <input
            className="inline-editor"
            defaultValue={include.directive}
            onBlur={(e) => {
                include.directive = e.target.value;
                console.log("blur");
                onEdit(include);
            }}
        />
        </>
    )
}

function createFuncDecl(funcDecl: nodes.FuncDecl, indent: number, onEdit: (n: nodes.Node) => void): React.ReactNode {
    nodeMap.set(funcDecl.id, funcDecl);
    
    return(
        <div>
            <div>{funcDecl.return_type} {funcDecl.name} ({funcDecl.params.map(arg => `${arg.data_type} ${arg.name}`).join(', ')}) {"{"}</div>
            <>
                {funcDecl.body ? createCompStmt(funcDecl.body, indent + 1, onEdit) : ""}
            </>
            <div>{"}"}</div>
        </div>
    )
}

function createVarDecl(varDecl: nodes.VarDecl, onEdit: (n: nodes.Node) => void): React.ReactNode {
    nodeMap.set(varDecl.id, varDecl);

    return(
        <>{varDecl.data_type} {varDecl.name} {varDecl.initializer && (
            <>
                {"= "}
                {mapLine(varDecl.initializer, 0, onEdit)}
            </>
        )} 
        {";"}</>
    )
}

function createParamDecl(paramDecl: nodes.ParamDecl): React.ReactNode {
    nodeMap.set(paramDecl.id, paramDecl);

    return(
        <>{paramDecl.data_type} {paramDecl.name}</>
    )
}

function createCompStmt(compStmt: nodes.CompStmt, indent: number, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        compStmt.statements.map((node, index) => (
            <Line key={index} node={node} indent={indent} onEdit={onEdit}/>
        ))
    )
}

function createReturnStmt(ret: nodes.ReturnStmt, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        <>return {ret.expression ? mapLine(ret.expression, 0, onEdit) : ""};</>
    )
}

function createCallExpr(callExpr: nodes.CallExpr, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        <>
            {mapLine(callExpr.calle, 0, onEdit)} 
            {"("} 
            {callExpr.args.map((arg, i) => (
                <React.Fragment key={arg.id}>
                    {i > 0 && ", "}
                    {mapLine(arg, 0, onEdit)}
                </React.Fragment>
            ))}
            {");"}
        </>
    )
}

function createDeclRefExpr(declRefExpr: nodes.DeclRefExpr): React.ReactNode {
    const targetNode = nodeMap.get(declRefExpr.DeclRefId);

    if (!targetNode) {
        return <>{declRefExpr.DeclRefId}</>
    }

    return(
        <>{targetNode.name}</>
    )
}

function createAssignmentExpr(assignmentExpr: nodes.AssignmentExpr): React.ReactNode {
    return(
        <>{"TODO assignmentExpr. node id: "} {assignmentExpr.id}</>
    )
}

function createLiteralExpr(literalExpr: nodes.LiteralExpr): React.ReactNode {
    return(
        <>{literalExpr.value}</>
    )
}

function createIdentifierExpr(identifierExpr: nodes.IdentifierExpr): React.ReactNode {
    return(
        <>{identifierExpr.identifier}</>
    )
}