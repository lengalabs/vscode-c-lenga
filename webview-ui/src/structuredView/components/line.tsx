//import React from "react"
import { AnyNode, IncludeNode, FunctionNode, VariableNode, LiteralNode, ReturnNode, FunctionCallNode } from "../node"

interface LineProp {
    indent: number
    node: AnyNode
}

export function Line({ indent, node }: LineProp) {
    return(
        <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{"    ".repeat(indent)}{mapLine(node, indent)}</div>
    )
}

function mapLine(node: AnyNode, indent: number): React.ReactNode {
    switch (node.type) {
        case "include":
            return(createInclude(node))
        case "function":
            return(createFunction(node, indent))
        case "variable":
            return(createVariable(node))
        case "literal":
            return(createLiteral(node))
        case "return":
            return(createReturn(node))
        case "function_call":
            return(createFunctionCall(node))
        default: 
            return("WIP")
    }
}

function createInclude(include: IncludeNode): React.ReactNode {
    return(
        <>#include {include.value}</>
    )
}

function createFunction(funct: FunctionNode, indent: number): React.ReactNode {
    return(
        <div>
            <div>{funct.return_type} {funct.name} ({funct.args.map(arg => `${arg.data_type} ${arg.name}`).join(', ')}) {"{"}</div>
            <>
                {funct.body.map((node, index) => (
                    <Line key={index} node={node} indent={ indent + 1 }/>
                ))}
            </>
            <div>{"}"}</div>
        </div>
    )
}

function createVariable(variable: VariableNode): React.ReactNode {
    return(
        <>{variable.data_type} {variable.name} = {mapLine(variable.value, 0)};</>
    )
}

function createLiteral(literal: LiteralNode): React.ReactNode {
    return(
        <>{literal.value}</>
    )
}

function createReturn(ret: ReturnNode): React.ReactNode {
    return(
        <>return {mapLine(ret.value, 0)};</>
    )
}

function createFunctionCall(functionCall: FunctionCallNode): React.ReactNode {
    return(
        <>{functionCall.name}({functionCall.parameters.join(', ')});</>
    )
}