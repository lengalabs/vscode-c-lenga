import React from 'react';
import * as nodes from '../../../../rpc/generated/nodes';

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
    switch (node.node?.$case) {
        case "include":
            return(createInclude(node.node.include, onEdit))
        case "funcDecl":
            return(createFunction(node.node.funcDecl, indent, onEdit))
        case "variable":
            return(createVariable(node.node.variable, onEdit))
        case "literal":
            return(createLiteral(node.node.literal))
        case "return":
            return(createReturn(node.node.return, onEdit))
        case "funcCall":
            return(createFunctionCall(node.node.funcCall))
        case "compStmt":
            return(createCompoundStatement(node.node.compStmt, indent, onEdit))
        default: 
            return("WIP")
    }
}

function createInclude(include: nodes.IncludeNode, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        <>
        #include {" "}
        <input
            defaultValue={include.directive}
            onBlur={(e) => {
                include.directive = e.target.value;
                const updated: nodes.Node = {node: {$case: "include", include: include}};
                console.log("blur");
                onEdit(updated);
            }}
        />
        </>
    )
}

function createFunction(funct: nodes.FunctionDeclarationNode, indent: number, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        <div>
            <div>{funct.returnType} {funct.name} ({funct.arguments.map(arg => `${arg.dataType} ${arg.name}`).join(', ')}) {"{"}</div>
            <>
                {funct.body?.elements.map((node, index) => (
                    <Line key={index} node={node} indent={indent + 1} onEdit={onEdit}/>
                ))}
            </>
            <div>{"}"}</div>
        </div>
    )
}

function createVariable(variable: nodes.VariableNode, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        <>{variable.dataType} {variable.name} = {variable.initializer ? mapLine(variable.initializer, 0, onEdit) : ""};</>
    )
}

function createLiteral(literal: nodes.LiteralNode): React.ReactNode {
    return(
        <>{literal.value}</>
    )
}

function createReturn(ret: nodes.ReturnNode, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        <>return {ret.expression ? mapLine(ret.expression, 0, onEdit) : ""};</>
    )
}

function createFunctionCall(functionCall: nodes.FunctionCallNode): React.ReactNode {
    return(
        <>{functionCall.name}({functionCall.parameters.join(', ')});</>
    )
}

function createCompoundStatement(compStmt: nodes.CompoundStatementNode, indent: number, onEdit: (n: nodes.Node) => void): React.ReactNode {
    return(
        compStmt.elements.map((node, index) => (
            <Line key={index} node={node} indent={indent} onEdit={onEdit}/>
        ))
    )
}