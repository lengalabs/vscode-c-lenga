import React from 'react';
import { useLineContext } from "./context";
import * as nodes from '../../../../src/nodes/cNodes';

function EditableField<T extends nodes.Node, K extends string & keyof T>(node: T, key: K) {
    const { selectedNodeId, selectedKey, onEdit, setSelectedNodeId, setSelectedKey } = useLineContext();
    const isSelected = selectedNodeId == node.id && selectedKey && selectedKey == key
    const [inputValue, setInputValue] = React.useState(String(node[key] ?? ""));

    // Keep inputValue in sync if node[key] changes externally
    React.useEffect(() => {
        setInputValue(String(node[key] ?? ""));
    }, [node, key]);

    return (
        <input
            className="inline-editor"
            style={{
                ...(isSelected ? {
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    boxShadow: "inset 0 -1px 0 0 rgba(163, 209, 252, 0.5)"
                } : {})
            }}
            value={inputValue}
            size={Math.max(1, inputValue.length)}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => {
                setSelectedKey(key)
                setSelectedNodeId(node.id)
            }}
            onBlur={() => {
                node[key] = inputValue as T[K];
                onEdit(node, key);
            }}
        />
    );
}

interface ObjectProps {
    indent: number;
    node: nodes.Node;
    children: React.ReactNode;
}

export function Object({ indent, node, children }: ObjectProps) {
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

    const handleSelect = (type: nodes.NodeTypes) => {
        if (!node) return;
        // create new node based on selection
        let newNode: nodes.Node;
        switch (type) {
            case "Declaration": {
                const newLocal: nodes.StringLiteral = {
                    id: crypto.randomUUID(),
                    type: "StringLiteral",
                    value: "",
                };
                const newDeclaration: nodes.Declaration = {
                    id: crypto.randomUUID(),
                    type: "Declaration",
                    data_type: "",
                    name: "",
                    initializer: newLocal as nodes.CExpressionNode,
                };
                newNode = newDeclaration;
                break;
            }
            case "ReturnStatement": {
                const newReturnStatement: nodes.ReturnStatement = {
                    id: crypto.randomUUID(),
                    type: "ReturnStatement",
                    expression: undefined
                };
                newNode = newReturnStatement
                break;
            }
            case 'UnknownNode': {
                const newUnknownNode: nodes.UnknownNode = {
                    id: crypto.randomUUID(),
                    type: 'UnknownNode',
                    contents: ""
                }
                newNode = newUnknownNode;
                break;
            }
            case 'PreprocInclude': {
                const newPreprocInclude: nodes.PreprocInclude = {
                    id: crypto.randomUUID(),
                    type: 'PreprocInclude',
                    directive: ""
                }
                newNode = newPreprocInclude;
                break;
            }
            case 'FunctionParameter': {
                const newFunctionParameter: nodes.FunctionParameter = {
                    id: crypto.randomUUID(),
                    type: 'FunctionParameter',
                    name: "",
                    data_type: "",
                }
                newNode = newFunctionParameter;
                break;
            }
            case 'FunctionDeclaration': {
                const newFunctionDeclaration: nodes.FunctionDeclaration = {
                    id: crypto.randomUUID(),
                    type: 'FunctionDeclaration',
                    name: "",
                    return_type: "",
                    params: []
                }
                newNode = newFunctionDeclaration;
                break;
            }
            case 'FunctionDefinition': {
                const newFunctionDefinition: nodes.FunctionDefinition = {
                    id: crypto.randomUUID(),
                    type: 'FunctionDefinition',
                    name: "",
                    return_type: "",
                    params: [],
                    body: { id: crypto.randomUUID(), type: "CompoundStatement", statements: [] }
                }
                newNode = newFunctionDefinition;
                break;
            }
            case 'CompoundStatement': {
                const newCompoundStatement: nodes.CompoundStatement = {
                    id: crypto.randomUUID(),
                    type: 'CompoundStatement',
                    statements: []
                }
                newNode = newCompoundStatement;
                break;
            }
            case 'CallExpression': {
                const newCallExpression: nodes.CallExpression = {
                    id: crypto.randomUUID(),
                    type: 'CallExpression',
                    identifier: '',
                    idDeclaration: '',
                    args: []
                }
                newNode = newCallExpression;
                break;
            }
            case 'Reference': {
                const newReference: nodes.Reference = {
                    id: crypto.randomUUID(),
                    type: 'Reference',
                    DeclRefId: ''
                }
                newNode = newReference;
                break;
            }
            case 'AssignmentExpression': {
                const newAssignmentExpression: nodes.AssignmentExpression = {
                    id: crypto.randomUUID(),
                    type: 'AssignmentExpression',
                    id_reference: '',
                    value: { id: crypto.randomUUID(), type: "StringLiteral", value: '' }
                }
                newNode = newAssignmentExpression;
                break;
            }
            case 'NumberLiteral': {
                const newNumberLiteral: nodes.NumberLiteral = {
                    id: crypto.randomUUID(),
                    type: 'NumberLiteral',
                    value: ''
                }
                newNode = newNumberLiteral;
                break;
            }
            case 'StringLiteral': {
                const newStringLiteral: nodes.StringLiteral = {
                    id: crypto.randomUUID(),
                    type: 'StringLiteral',
                    value: ''
                }
                newNode = newStringLiteral;
                break;
            }
            default: {
                throw new Error("Unimplemented")
            }
        }

        // insert logic: e.g., in CompoundStatement
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
        onEdit(parent, null);
    };

    return (
        <div
            tabIndex={0} onClick={() => setSelectedNodeId(node.id)} onKeyDown={handleKeyDown}
            style={{ backgroundColor: isSelected ? "rgba(116, 116, 116, 0.05)" : "transparent" }}
        >
            <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", paddingLeft: `${indent * 34}px`}}>
                {children}
            </div>

            {
                showDropdown && (
                    <div style={{ border: "1px solid #ccc", background: "black", position: "absolute" }}>
                        <div onClick={() => handleSelect("Declaration")}>Declaration</div>
                        <div onClick={() => handleSelect("ReturnStatement")}>ReturnStatement</div>
                    </div>
                )
            }
        </div >
    );
}

interface NodeRenderProps {
    node: nodes.Node;
    indent: number;
}

export function NodeRender({ node, indent }: NodeRenderProps): React.ReactNode {
    switch (node.type) {
        case "PreprocInclude":
            return (<IncludeDeclRender includeDecl={node as nodes.PreprocInclude} />)
        case "FunctionParameter":
            return (<ParamDeclRender paramDecl={node as nodes.FunctionParameter} />)
        case "FunctionDeclaration":
            return (<FunctionDeclarationRender functionDeclaration={node as nodes.FunctionDeclaration} />)
        case "FunctionDefinition":
            return (<FuncDefRender funcDef={node as nodes.FunctionDefinition} indent={indent} />)
        case "Declaration":
            return (<VarDeclRender varDecl={node as nodes.Declaration} />)
        case "ReturnStatement":
            return (<ReturnStmtRender returnStmt={node as nodes.ReturnStatement} />)
        case "CompoundStatement":
            return (<CompStmtRender compStmt={node as nodes.CompoundStatement} indent={indent} />)
        case "IfStatement":
            return (<IfStatementRender ifStatement={node as nodes.IfStatement} indent={indent}/>)
        case "ElseClause":
            return (<ElseClauseRender elseClause={node as nodes.ElseClause} indent={indent}/>)
        case "CallExpression":
            return (<CallExprRender callExpr={node as nodes.CallExpression} />)
        case "Reference":
            return (<DeclRefExprRender declRefExpr={node as nodes.Reference} />)
        case "AssignmentExpression":
            return (<AssignmentExprRender assignmentExpr={node as nodes.AssignmentExpression} />)
        case "NumberLiteral":
            return (<NumberLiteralExprRender literalExpr={node as nodes.NumberLiteral} />)
        case "StringLiteral":
            return (<StringLiteralExprRender literalExpr={node as nodes.StringLiteral} />)
        case "BinaryExpression":
            return (<BinaryExpressionRender binaryExpression={node as nodes.BinaryExpression} />)
        default:
            return ("WIP")
    }
}

function IncludeDeclRender({ includeDecl }: { includeDecl: nodes.PreprocInclude }): React.ReactNode {
    return (
        <>
            {"#include "}
            {"<"}
            {EditableField(includeDecl, "directive")}
            {">"}
            {";"}
        </>

    )
}


function FunctionDeclarationRender({ functionDeclaration }: { functionDeclaration: nodes.FunctionDeclaration }): React.ReactNode {
    const { nodeMap } = useLineContext();
    nodeMap.set(functionDeclaration.id, functionDeclaration);

    return (
        <>
            <>
                {EditableField(functionDeclaration, "return_type")}
                {EditableField(functionDeclaration, "name")}
                {"("}
                {functionDeclaration.params.map((param, i) => (
                    <React.Fragment key={param.id}>
                        {i > 0 && ", "}
                        <ParamDeclRender paramDecl={param} />
                    </React.Fragment>
                ))}
                {")"}
            </>
        </>
    )
}


function FuncDefRender({ funcDef, indent }: { funcDef: nodes.FunctionDefinition, indent: number }): React.ReactNode {
    const { nodeMap } = useLineContext();
    nodeMap.set(funcDef.id, funcDef);

    return (
        <>
            {EditableField(funcDef, "return_type")}
            {EditableField(funcDef, "name")}
            {"("}
            {funcDef.params.map((param, i) => (
                <React.Fragment key={param.id}>
                    {i > 0 && ", "}
                    <ParamDeclRender paramDecl={param} />
                </React.Fragment>
            ))}
            {")"}

            {funcDef.body && (<CompStmtRender compStmt={funcDef.body} indent={indent} />)}
        </>
    )
}

function VarDeclRender({ varDecl }: { varDecl: nodes.Declaration }): React.ReactNode {
    const { nodeMap } = useLineContext();
    nodeMap.set(varDecl.id, varDecl);

    return (
        <>
            {EditableField(varDecl, "data_type")}
            {EditableField(varDecl, "name")}
            {varDecl.initializer && (
                <>
                    {"= "}
                    <NodeRender node={varDecl.initializer} indent={0} />
                </>
            )}
            {";"}
        </>
    )
}

function ParamDeclRender({ paramDecl }: { paramDecl: nodes.FunctionParameter }): React.ReactNode {
    const { nodeMap } = useLineContext();
    nodeMap.set(paramDecl.id, paramDecl);

    return (
        <>
            {EditableField(paramDecl, "data_type")}
            {EditableField(paramDecl, "name")}
        </>
    )
}

function CompStmtRender({ compStmt, indent }: { compStmt: nodes.CompoundStatement, indent: number }): React.ReactNode {
    return (
        <>
            {"{"}
            {compStmt.statements.map(node => (
                <Object indent={indent+1} node={node}>
                    <NodeRender node={node} indent={indent} />
                </Object>
            ))}
            {"}"}
        </>
    )
}

function IfStatementRender({ifStatement, indent}: { ifStatement: nodes.IfStatement, indent: number }): React.ReactNode {
    return(
        <>
            {"if"}
            {" ("}
            {<NodeRender node={ifStatement.condition} indent={0} />}
            {") "}
            {<CompStmtRender compStmt={ifStatement.compoundStatement} indent={indent} />}
            {ifStatement.elseClause && (<ElseClauseRender elseClause={ifStatement.elseClause} indent={indent} />)}
        </>
    )
}

function ElseClauseRender({elseClause, indent}: { elseClause: nodes.ElseClause, indent: number }): React.ReactNode {
    return(
        <>
            {"else"}
            {" "}
            {<CompStmtRender compStmt={elseClause.compoundStatement} indent={indent} />}
        </>
    )
}

function ReturnStmtRender({ returnStmt }: { returnStmt: nodes.ReturnStatement }): React.ReactNode {
    return (
        <>
            {"return"}
            {returnStmt.expression && (
                <>
                    {" "}
                    <NodeRender node={returnStmt.expression} indent={0} />
                </>
            )}
            {";"}
        </>
    )
}

function CallExprRender({ callExpr }: { callExpr: nodes.CallExpression }): React.ReactNode {
    return (
        <>
            {EditableField(callExpr, "identifier")}
            {"("}
            {callExpr.args.map((arg, i) => (
                <React.Fragment key={arg.id}>
                    {i > 0 && ", "}
                    <NodeRender node={arg} indent={0} />
                </React.Fragment>
            ))}
            {");"}
        </>
    )
}

function DeclRefExprRender({ declRefExpr }: { declRefExpr: nodes.Reference }): React.ReactNode {
    const { nodeMap } = useLineContext();
    const targetNode = nodeMap.get(declRefExpr.DeclRefId);

    if (!targetNode || !("name" in targetNode)) {
        return (<>{declRefExpr.DeclRefId}</>)
    }

    return (<>{targetNode.name}</>)
}

function AssignmentExprRender({ assignmentExpr }: { assignmentExpr: nodes.AssignmentExpression }): React.ReactNode {
    const { nodeMap } = useLineContext();
    const targetNode = nodeMap.get(assignmentExpr.id_reference);
    
    if (!targetNode || !("name" in targetNode)) {
        return (<>{assignmentExpr.id_reference}</>)
    }

    return (
        <>
            {targetNode.name}
            {" = "}
            <NodeRender node={assignmentExpr.value} indent={0} />
        </>
    )
}

function NumberLiteralExprRender({ literalExpr }: { literalExpr: nodes.NumberLiteral }): React.ReactNode {
    return (
        <>{EditableField(literalExpr, "value")}</>
    )
}

function StringLiteralExprRender({ literalExpr }: { literalExpr: nodes.StringLiteral }): React.ReactNode {
    return (
        <>{EditableField(literalExpr, "value")}</>
    )
}

function BinaryExpressionRender({ binaryExpression }: {binaryExpression: nodes.BinaryExpression }): React.ReactNode {
    return(
        <>
            <NodeRender node={binaryExpression.left} indent={0} />
            {binaryExpression.operator}
            <NodeRender node={binaryExpression.right} indent={0} />
        </>
    )
}