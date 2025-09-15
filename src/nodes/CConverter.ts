import * as nodes from "../../rpc/generated/nodes";
import { Ast } from "../../rpc/generated/saturn";
import * as cNode from "./cNodes";

const typeMap: Record<string, string> = {
    unknown_node: "UnknownNode",
    include_decl: "IncludeDecl",
    func_decl: "FuncDecl",
    var_decl: "VarDecl",
    param_decl: "ParamDecl",
    comp_stmt: "CompStmt",
    return_stmt: "ReturnStmt",
    call_expr: "CallExpr",
    decl_ref_expr: "DeclRefExpr",
    assignment_expr: "AssignmentExpr",
    literal_expr: "LiteralExpr",
    identifier_expr: "IdentifierExpr"
};

const fieldRenameMap: Record<string, string> = {
    decl_ref_id: "DeclRefId" // DeclRefExpr
};

export class CConverter {
    public fromProto(protoAst: Ast): cNode.Node[] {
        return protoAst.nodes.map(convertProtoNodeToTs);
    }

    public toProto(TsAst: cNode.Node[]): Ast {
        return { nodes: TsAst.map(convertTsNodeToProto) };
    }
}

function convertProtoNodeToTs(protoNode: nodes.Node): cNode.Node {
    if (!protoNode || !protoNode.node) {
        return undefined as any;
    }

    const node = protoNode.node;
    switch (node.$case) {
        case "declNode":
            return convertProtoDeclToTs(node.declNode);
        case "stmtNode":
            return convertProtoStmtToTs(node.stmtNode);
        case "exprNode":
            return convertProtoExprToTs(node.exprNode);
        case "unknownNode":
            const uNode = node.unknownNode;
            return { id: uNode.id, type: "UnknownNode", contents: uNode.contents } as cNode.UnknownNode;
        default:
            throw new Error(`Unknown Type: ${(node as any).$case}`);
    }
}

function convertProtoDeclToTs(declaration: nodes.DeclNode): cNode.CDeclarationNode {
    if (!declaration || !declaration.declaration) {
        return undefined as any;
    }

    const decl = declaration.declaration;
    switch (decl.$case) {
        case "includeDecl":
            return { id: decl.includeDecl.id, type: "IncludeDecl", directive: decl.includeDecl.directive };
        case "funcDecl":
            return {
                id: decl.funcDecl.id,
                type: "FuncDecl",
                name: decl.funcDecl.name,
                return_type: decl.funcDecl.returnType,
                params: decl.funcDecl.params.map((p: nodes.ParamDecl) => convertProtoDeclToTs({declaration: { $case: "paramDecl", paramDecl: p }}) as cNode.ParamDecl),
                body: decl.funcDecl.body ? convertProtoStmtToTs({statement: { $case: "compStmt", compStmt: decl.funcDecl.body }}) as cNode.CompStmt : undefined,
            };
        case "paramDecl":
            return { id: decl.paramDecl.id, type: "ParamDecl", name: decl.paramDecl.name, data_type: decl.paramDecl.dataType };
        case "varDecl":
            const init = decl.varDecl.initializer ? convertProtoExprToTs(decl.varDecl.initializer) : undefined;
            if (init && init.type === "UnknownNode") {
                throw new Error("varDecl node with unknown initializer");
            }

            return {
                id: decl.varDecl.id,
                type: "VarDecl",
                name: decl.varDecl.name,
                data_type: decl.varDecl.dataType,
                initializer: init,
            };
        default:
            throw new Error(`Unknown Type: ${(decl as any).$case}`);
    }
}

function convertProtoStmtToTs(statement: nodes.StmtNode): cNode.CStatementNode | cNode.UnknownNode {
    if (!statement || !statement.statement) {
        return undefined as any;
    }

    const stmt = statement.statement;
    switch (stmt.$case) {
        case "compStmt":
            return {
                id: stmt.compStmt.id,
                type: "CompStmt",
                statements: stmt.compStmt.statements.map(convertProtoNodeToTs),
            };
        case "returnStmt":
            const expr = stmt.returnStmt.expression ? convertProtoExprToTs(stmt.returnStmt.expression) : undefined;
            if (expr && expr.type === "UnknownNode") {
                throw new Error("returnStmt node with unknown expression");
            }

            return {
                id: stmt.returnStmt.id,
                type: "ReturnStmt",
                expression: expr,
            };
        default:
            throw new Error(`Unknown Type: ${(stmt as any).$case}`);
    }
}

function convertProtoExprToTs(expression: nodes.ExprNode): cNode.CExpressionNode | cNode.UnknownNode {
    if (!expression || !expression.expression) {
        return undefined as any;
    }

    const expr = expression.expression;
    switch (expr.$case) {
        case "callExpr":
            const calle = expr.callExpr.calle ? convertProtoExprToTs(expr.callExpr.calle) : undefined;
            if (!calle || calle.type === "UnknownNode") {
                throw new Error("callExpr node with undefined calle");
            }

            const args = expr.callExpr.args.map( arg => {
                const conv = convertProtoExprToTs(arg);
                if (conv.type === "UnknownNode") {
                    throw new Error("callExpr node with unknown arg");
                }
                return conv;
            });

            return {
                id: expr.callExpr.id,
                type: "CallExpr",
                calle: calle,
                args: args,
            };
        case "declRefExpr":
            return {
                id: expr.declRefExpr.id,
                type: "DeclRefExpr",
                DeclRefId: expr.declRefExpr.declRefId,
            };
        case "assignmentExpr":
            const left = expr.assignmentExpr.left ? convertProtoExprToTs(expr.assignmentExpr.left) : undefined;
            if (!left || !(left.type === "DeclRefExpr" || left.type === "IdentifierExpr")) {
                throw new Error("assignmentExpr node with invalid left side");
            }

            const right = expr.assignmentExpr.right ? convertProtoExprToTs(expr.assignmentExpr.right) : undefined;
            if (!right || right.type === "UnknownNode") {
                throw new Error("assignmentExpr node with unknown right side");
            }

            return {
                id: expr.assignmentExpr.id,
                type: "AssignmentExpr",
                left: left,
                right: right,
                op: expr.assignmentExpr.op as cNode.AssignmentOp,
            };
        case "literalExpr":
            return {
                id: expr.literalExpr.id,
                type: "LiteralExpr",
                data_type: expr.literalExpr.dataType,
                value: expr.literalExpr.value,
            };
        case "identifierExpr":
            return {
                id: expr.identifierExpr.id,
                type: "IdentifierExpr",
                identifier: expr.identifierExpr.identifier,
            };
        default:
            throw new Error(`Unknown Type: ${(expr as any).$case}`);
    }
}



function convertTsNodeToProto(node: cNode.Node): nodes.Node {
    if (!node) {
        return {} as nodes.Node;
    }

    switch (node.type) {
        case "UnknownNode": {
            const unk = node as cNode.UnknownNode;
            return { unknown_node: { id: unk.id, contents: unk.contents } } as nodes.Node;
        }

        case "IncludeDecl": {
            const incl = node as cNode.IncludeDecl;
            return { decl_node: { include_decl: { id: incl.id, directive: incl.directive } } } as nodes.Node;
        }

        case "ParamDecl": {
            const param = node as cNode.ParamDecl;
            return { decl_node: { param_decl: { id: param.id, name: param.name, data_type: param.data_type } } } as nodes.Node;
        }

        case "FuncDecl": {
            const func = node as cNode.FuncDecl;
            return {
                decl_node: {
                    func_decl: {
                        id: func.id,
                        name: func.name,
                        return_type: func.return_type,
                        params: func.params.map(n => {
                            const protoNode = convertTsNodeToProto(n) as nodes.Node & { decl_node: { param_decl: nodes.ParamDecl } };
                            return protoNode.decl_node.param_decl;
                        }) as nodes.ParamDecl[],
                        body: func.body
                            ? (convertTsNodeToProto(func.body) as nodes.Node & { stmt_node: { comp_stmt: nodes.CompStmt } }).stmt_node.comp_stmt
                            : undefined
                    }
                }
            } as nodes.Node;
        }

        case "VarDecl": {
            const v = node as cNode.VarDecl;
            const initializerProto = convertTsNodeToProto(v.initializer as cNode.Node) as nodes.Node & { expr_node: any };
            return {
                decl_node: {
                    var_decl: {
                        id: v.id,
                        name: v.name,
                        data_type: v.data_type,
                        initializer: initializerProto.expr_node
                    }
                }
            } as nodes.Node;
        }

        case "CompStmt": {
            const comp = node as cNode.CompStmt;
            return {
                stmt_node: {
                    comp_stmt: {
                        id: comp.id,
                        statements: comp.statements.map(n => convertTsNodeToProto(n)) as nodes.Node[]
                    }
                }
            } as nodes.Node;
        }

        case "ReturnStmt": {
            const ret = node as cNode.ReturnStmt;
            return {
                stmt_node: {
                    return_stmt: {
                        id: ret.id,
                        expression: ret.expression
                            ? (convertTsNodeToProto(ret.expression) as nodes.Node & { expr_node: { expression: any } }).expr_node
                            : undefined
                    }
                }
            } as nodes.Node;
        }

        case "CallExpr": {
            const call = node as cNode.CallExpr;
            return {
                expr_node: {
                    call_expr: {
                        id: call.id,
                        calle: (convertTsNodeToProto(call.calle) as nodes.Node & { expr_node: { call_expr: nodes.CallExpr } }).expr_node,
                        args: call.args.map(n => (convertTsNodeToProto(n) as nodes.Node & { expr_node: any }).expr_node)
                    }
                }
            } as nodes.Node;
        }

        case "DeclRefExpr": {
            const declRef = node as cNode.DeclRefExpr;
            return { expr_node: { decl_ref_expr: { id: declRef.id, decl_ref_id: declRef.DeclRefId } } } as nodes.Node;
        }

        case "AssignmentExpr": {
            const assign = node as cNode.AssignmentExpr;
            return {
                expr_node: {
                    assignment_expr: {
                        id: assign.id,
                        left: (convertTsNodeToProto(assign.left) as nodes.Node & { expr_node: any }).expr_node,
                        right: (convertTsNodeToProto(assign.right) as nodes.Node & { expr_node: any }).expr_node,
                        op: assign.op
                    }
                }
            } as nodes.Node;
        }

        case "LiteralExpr": {
            const lit = node as cNode.LiteralExpr;
            return { expr_node: { literal_expr: { id: lit.id, data_type: lit.data_type, value: lit.value } } } as nodes.Node;
        }

        case "IdentifierExpr": {
            const idExpr = node as cNode.IdentifierExpr;
            return { expr_node: { identifier_expr: { id: idExpr.id, identifier: idExpr.identifier } } } as nodes.Node;
        }

        default:
            return { unknown_node: { id: node.id, contents: JSON.stringify(node) } } as nodes.Node;
    }
}
