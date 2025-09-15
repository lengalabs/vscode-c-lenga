import React from 'react';
import * as nodes from '../../../../src/nodes/cNodes';

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
    switch (node.type) {
        case "IncludeDecl":
            return(createInclude(node as nodes.IncludeDecl, onEdit))
        case "FuncDecl":
            return(createFunction(node as nodes.FuncDecl, indent, onEdit))
        case "VarDecl":
            return(createVariable(node as nodes.VarDecl, onEdit))
        case "LiteralExpr":
            return(createLiteral(node as nodes.LiteralExpr))
        case "ReturnStmt":
            return(createReturn(node as nodes.ReturnStmt, onEdit))
        case "CallExpr":
            return(createFunctionCall(node as nodes.CallExpr))
        case "CompStmt":
            return(createCompoundStatement(node as nodes.CompStmt, indent, onEdit))
        default:
            return("WIP")
    }
}

function createInclude(include: nodes.IncludeDecl, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        <>
        #include {" "}
        <input
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

function createFunction(funct: nodes.FuncDecl, indent: number, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        <div>
            <div>{funct.return_type} {funct.name} ({funct.params.map(arg => `${arg.data_type} ${arg.name}`).join(', ')}) {"{"}</div>
            <>
                {funct.body ? createCompoundStatement(funct.body, indent + 1, onEdit) : ""}
            </>
            <div>{"}"}</div>
        </div>
    )
}

function createVariable(variable: nodes.VarDecl, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        <>{variable.data_type} {variable.name} = {variable.initializer ? mapLine(variable.initializer, 0, onEdit) : ""};</>
    )
}

function createLiteral(literal: nodes.LiteralExpr): React.ReactNode {
    return(
        <>{literal.value}</>
    )
}

function createReturn(ret: nodes.ReturnStmt, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        <>return {ret.expression ? mapLine(ret.expression, 0, onEdit) : ""};</>
    )
}

function createFunctionCall(functionCall: nodes.CallExpr): React.ReactNode {
    return(
        <>{functionCall.calle}({functionCall.args.join(', ')});</>
    )
}

function createCompoundStatement(compStmt: nodes.CompStmt, indent: number, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        compStmt.statements.map((node, index) => (
            <Line key={index} node={node} indent={indent} onEdit={onEdit}/>
        ))
    )
}