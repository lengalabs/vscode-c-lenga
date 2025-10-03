import { createContext, useContext } from "react";
import * as nodes from "../../../../src/nodes/cNodes";


export interface ParentInfo {
    parent: nodes.Node | null;
    key: string;
    index: number;
}

export interface LineContextType {
    onEdit: <T extends nodes.Node, K extends string & keyof T>(node: T, key: K | null) => void;
    selectedNodeId: string | null;
    selectedKey: string | null;
    setSelectedNodeId: (id: string) => void;
    setSelectedKey: (id: string) => void;
    nodeMap: Map<string, nodes.Node>;
    parentMap: Map<string, ParentInfo>;
    insertTargetId: string | null;
    setInsertTargetId: (id: string | null) => void;
}

export const LineContext = createContext<LineContextType | null>(null);

export function useLineContext(): LineContextType {
    const ctx = useContext(LineContext);
    if (!ctx) throw new Error("LineContext must be used inside a provider");
    return ctx;
}

export function buildMaps(ast: nodes.Node[]): {
    nodeMap: Map<string, nodes.Node>;
    parentMap: Map<string, ParentInfo>;
} {
    const nodeMap = new Map<string, nodes.Node>();
    const parentMap = new Map<string, ParentInfo>();

    return { nodeMap, parentMap };

    function traverse(
        node: nodes.Node | undefined,
        parent: nodes.Node | null = null,
        key = "",
        index = 0
    ) {
        if (!node) return;

        nodeMap.set(node.id, node);

        if (parent) parentMap.set(node.id, { parent, key, index });

        switch (node.type) {
            case "FunctionDeclaration": {
                const funcDecl = node as nodes.FunctionDeclaration;
                funcDecl.params.forEach((p, i) => traverse(p, funcDecl, "params", i));
                break;
            }
            case "FunctionDefinition": {
                const funcDecl = node as nodes.FunctionDefinition;
                funcDecl.params.forEach((p, i) => traverse(p, funcDecl, "params", i));
                traverse(funcDecl.body, node, "body", 0);
                break;
            }
            case "CompoundStatement": {
                const compStmt = node as nodes.CompoundStatement;
                compStmt.statements.forEach((stmt, i) => traverse(stmt, node, "statements", i));
                break;
            }
            case "Declaration": {
                const varDecl = node as nodes.Declaration;
                if (varDecl.initializer) traverse(varDecl.initializer, varDecl, "initializer", 0);
                break;
            }
            case "ReturnStatement": {
                const returnStmt = node as nodes.ReturnStatement;
                if (returnStmt.expression) traverse(returnStmt.expression, returnStmt, "expression", 0);
                break;
            }
            case "CallExpression": {
                const callExpr = node as nodes.CallExpression;
                traverse(callExpr, callExpr, "calle", 0);
                callExpr.args.forEach((arg, i) => traverse(arg, callExpr, "args", i));
                break;
            }
            case "AssignmentExpression": {
                const assignmentExpr = node as nodes.AssignmentExpression;
                traverse(assignmentExpr.value, node, "value", 0);
                break;
            }
            default:
                break; // leaf nodes
        }
    }

    ast.forEach(node => traverse(node));
    return { nodeMap, parentMap };
}
