import React from 'react';
import { useLineContext } from "./context";
import * as nodes from '../../../../src/nodes/cNodes';
import '../index.css';

interface EditableFieldProps<T extends nodes.Node, K extends string & keyof T> {
    node: T;
    field: K;
    className?: string;
}

function EditableField<T extends nodes.Node, K extends string & keyof T>({ 
    node, 
    field, 
    className,
}: EditableFieldProps<T, K>) {
    const { onEdit, setSelectedNodeId, setSelectedKey } = useLineContext();
    const [inputValue, setInputValue] = React.useState(String(node[field] ?? ""));
    
    React.useEffect(() => {
        setInputValue(String(node[field] ?? ""));
    }, [node, field]);
    
    const width = Math.max(1, inputValue.length) + "ch";

    return (
        <input
            className={`inline-editor ${className ?? ""}`}
            style={{ width }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => {
                setSelectedKey(field);
                setSelectedNodeId(node.id);
            }}
            onBlur={() => {
                node[field] = inputValue as T[K];
                onEdit(node, field);
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
    const { selectedNodeId, setSelectedNodeId } = useLineContext();
    const isSelected = selectedNodeId === node.id;

    return (
        <div
            className={`object-container ${isSelected ? 'object-selected' : ''}`}
            style={{ paddingLeft: `${indent * 20}px` }}
            onClick={(e) => {
                e.stopPropagation();
                setSelectedNodeId(node.id)
            }}
            tabIndex={0}
        >
            {children}
        </div>
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
            <span className='token-keyword'>#include</span>
            {" "}
            <span className='token-string'>{"<"}</span>
            <EditableField node={includeDecl} field="directive" className='token-string' />
            <span className='token-string'>{">"}</span>
        </>

    )
}


function FunctionDeclarationRender({ functionDeclaration }: { functionDeclaration: nodes.FunctionDeclaration }): React.ReactNode {
    const { nodeMap } = useLineContext();
    nodeMap.set(functionDeclaration.id, functionDeclaration);

    return (
        <>
            <>
                <EditableField node={functionDeclaration} field="return_type" className='token-type' />
                {" "}
                <EditableField node={functionDeclaration} field="name" className='token-function' />
                <span className='token-delimiter'>{"("}</span>
                {functionDeclaration.params.map((param, i) => (
                    <React.Fragment key={param.id}>
                        {i > 0 && ", "}
                        <ParamDeclRender paramDecl={param} />
                    </React.Fragment>
                ))}
                <span className='token-delimiter'>{")"}</span>
            </>
        </>
    )
}


function FuncDefRender({ funcDef, indent }: { funcDef: nodes.FunctionDefinition, indent: number }): React.ReactNode {
    const { nodeMap } = useLineContext();
    nodeMap.set(funcDef.id, funcDef);

    return (
        <>
            <EditableField node={funcDef} field="return_type" className='token-type' />
            {" "}
            <EditableField node={funcDef} field="name" className='token-function' />
            <span className='token-delimiter'>{"("}</span>
            {funcDef.params.map((param, i) => (
                <React.Fragment key={param.id}>
                    {i > 0 && ", "}
                    <ParamDeclRender paramDecl={param} />
                </React.Fragment>
            ))}
            <span className='token-delimiter'>{")"}</span>
            {funcDef.body && (<CompStmtRender compStmt={funcDef.body} indent={indent} />)}
        </>
    )
}

function VarDeclRender({ varDecl }: { varDecl: nodes.Declaration }): React.ReactNode {
    const { nodeMap } = useLineContext();
    nodeMap.set(varDecl.id, varDecl);

    return (
        <>
            <EditableField node={varDecl} field="data_type" className='token-type' />
            {" "}
            <EditableField node={varDecl} field="name" className='token-variable' />
            {varDecl.initializer && (
                <>
                    {" "}
                    {"="}
                    {" "}
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
            <EditableField node={paramDecl} field="data_type" className='token-type' />
            {" "}
            <EditableField node={paramDecl} field="name" className='token-variable' />
        </>
    )
}

function CompStmtRender({ compStmt, indent }: { compStmt: nodes.CompoundStatement, indent: number }): React.ReactNode {
    return (
        <>
            <span className='token-delimiter'>{"{"}</span>
            {compStmt.statements.map(node => (
                <Object indent={indent+1} node={node}>
                    <NodeRender node={node} indent={indent} />
                </Object>
            ))}
            <span className='token-delimiter'>{"}"}</span>
        </>
    )
}

function IfStatementRender({ifStatement, indent}: { ifStatement: nodes.IfStatement, indent: number }): React.ReactNode {
    return(
        <>
            <span className='token-keyword'>if</span>
            {" "}
            <span className='token-keyword'>{"("}</span>
            {<NodeRender node={ifStatement.condition} indent={0} />}
            <span className='token-keyword'>{")"}</span>
            {" "}
            {<CompStmtRender compStmt={ifStatement.compoundStatement} indent={indent} />}
            {ifStatement.elseClause && (<ElseClauseRender elseClause={ifStatement.elseClause} indent={indent} />)}
        </>
    )
}

function ElseClauseRender({elseClause, indent}: { elseClause: nodes.ElseClause, indent: number }): React.ReactNode {
    return(
        <>
            {" "}
            <span className='token-keyword'>else</span>
            {" "}
            {<CompStmtRender compStmt={elseClause.compoundStatement} indent={indent} />}
        </>
    )
}

function ReturnStmtRender({ returnStmt }: { returnStmt: nodes.ReturnStatement }): React.ReactNode {
    return (
        <>
            <span className='token-keyword'>return</span>
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
            <EditableField node={callExpr} field="identifier" className='token-function' />
            <span className='token-delimiter'>{"("}</span>
            {callExpr.args.map((arg, i) => (
                <React.Fragment key={arg.id}>
                    {i > 0 && ", "}
                    <NodeRender node={arg} indent={0} />
                </React.Fragment>
            ))}
            <span className='token-delimiter'>{")"}</span>
            {";"}
        </>
    )
}

function DeclRefExprRender({ declRefExpr }: { declRefExpr: nodes.Reference }): React.ReactNode {
    const { nodeMap } = useLineContext();
    const targetNode = nodeMap.get(declRefExpr.DeclRefId);

    if (!targetNode || !("name" in targetNode)) {
        return (<>{declRefExpr.DeclRefId}</>)
    }

    return (<span className='token-variable'>{String(targetNode.name)}</span>)
}

function AssignmentExprRender({ assignmentExpr }: { assignmentExpr: nodes.AssignmentExpression }): React.ReactNode {
    const { nodeMap } = useLineContext();
    const targetNode = nodeMap.get(assignmentExpr.id_reference);
    
    if (!targetNode || !("name" in targetNode)) {
        return (<>{assignmentExpr.id_reference}</>)
    }

    return (
        <>
            <span className='token-variable'>{String(targetNode.name)}</span>
            {" "}
            {"="}
            {" "}
            <NodeRender node={assignmentExpr.value} indent={0} />
        </>
    )
}

function NumberLiteralExprRender({ literalExpr }: { literalExpr: nodes.NumberLiteral }): React.ReactNode {
    return (
        <EditableField node={literalExpr} field="value" className='token-number' />
    )
}

function StringLiteralExprRender({ literalExpr }: { literalExpr: nodes.StringLiteral }): React.ReactNode {
    return (
        <>
        <span className='token-string'>{"\""}</span>
        <EditableField node={literalExpr} field="value" className='token-string' />
        <span className='token-string'>{"\""}</span>
        </>
    )
}

function BinaryExpressionRender({ binaryExpression }: {binaryExpression: nodes.BinaryExpression }): React.ReactNode {
    return(
        <>
            <NodeRender node={binaryExpression.left} indent={0} />
            {" "}
            {binaryExpression.operator}
            {" "}
            <NodeRender node={binaryExpression.right} indent={0} />
        </>
    )
}