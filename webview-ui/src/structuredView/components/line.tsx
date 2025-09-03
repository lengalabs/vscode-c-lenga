import React from 'react';
import * as nodes from '../../../../rpc/generated/nodes';

interface LineProp {
    indent: number
    node: nodes.Node
}

export function Line({ indent, node }: LineProp) {
    return(
        <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{"    ".repeat(indent)}{mapLine(node, indent)}</div>
    )
}

function mapLine(node: nodes.Node, indent: number): React.ReactNode {
    switch (node.node?.$case) {
        case "include":
            return(createInclude(node.node.include))
        case "funcDecl":
            return(createFunction(node.node.funcDecl, indent))
        case "variable":
            return(createVariable(node.node.variable))
        case "literal":
            return(createLiteral(node.node.literal))
        case "return":
            return(createReturn(node.node.return))
        case "funcCall":
            return(createFunctionCall(node.node.funcCall))
        case "compStmt":
            return(createCompoundStatement(node.node.compStmt, indent))
        default: 
            return("WIP")
    }
}

function createInclude(include: nodes.IncludeNode): React.ReactNode {
    return(
        <>#include {include.directive}</>
    )
}

function createFunction(funct: nodes.FunctionDeclarationNode, indent: number): React.ReactNode {
    return(
        <div>
            <div>{funct.returnType} {funct.name} ({funct.arguments.map(arg => `${arg.dataType} ${arg.name}`).join(', ')}) {"{"}</div>
            <>
                {funct.body?.elements.map((node, index) => (
                    <Line key={index} node={node} indent={ indent + 1 }/>
                ))}
            </>
            <div>{"}"}</div>
        </div>
    )
}

function createVariable(variable: nodes.VariableNode): React.ReactNode {
    return(
        <>{variable.dataType} {variable.name} = {variable.initializer ? mapLine(variable.initializer, 0) : ""};</>
    )
}

function createLiteral(literal: nodes.LiteralNode): React.ReactNode {
    return(
        <>{literal.value}</>
    )
}

function createReturn(ret: nodes.ReturnNode): React.ReactNode {
    return(
        <>return {ret.expression ? mapLine(ret.expression, 0) : ""};</>
    )
}

function createFunctionCall(functionCall: nodes.FunctionCallNode): React.ReactNode {
    return(
        <>{functionCall.name}({functionCall.parameters.join(', ')});</>
    )
}

function createCompoundStatement(compStmt: nodes.CompoundStatementNode, indent: number): React.ReactNode {
    return(
        compStmt.elements.map((node, index) => (
            <Line key={index} node={node} indent={ indent }/>
        ))
    )
}