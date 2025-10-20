import { createContext, useContext } from "react";
import * as objects from "../../../../src/language_objects/cNodes";


export interface ParentInfo {
    parent: objects.LanguageObject | null;
    key: string;
    index: number;
}

// Type-safe parent info with generics and defaults
export type ParentInfoV2<
    T extends objects.LanguageObject = objects.LanguageObject,
    K extends string & keyof T = string & keyof T
> = {
    parent: T;
    key: K;
    index: number;
};

// Helper to create type-safe ParentInfoV2
export function createParentInfo<T extends objects.LanguageObject, K extends string & keyof T>(
    parent: T,
    key: K,
    index: number
): ParentInfoV2<T, K> {
    return { parent, key, index };
}

export type EditorMode = 'view' | 'edit';

export interface LineContextType {
    onEdit: <T extends objects.LanguageObject, K extends string & keyof T>(node: T, key: K | null) => void;
    onRequestAvailableInserts: (nodeId: string, nodeKey: string) => void;
    availableInserts: objects.LanguageObject[] | null;
    selectedNodeId: string | null;
    selectedKey: string | null;
    parentNodeInfo: ParentInfoV2 | null;
    setParentNodeInfo: (info: ParentInfoV2 | null) => void;
    setSelectedNodeId: (id: string) => void;
    setSelectedKey: (key: string) => void;
    nodeMap: Map<string, objects.LanguageObject>;
    parentMap: Map<string, ParentInfoV2>;
    focusRequest: { nodeId: string; fieldKey: string } | null;
    requestFocus: (nodeId: string, fieldKey: string) => void;
    clearFocusRequest: () => void;
    mode: EditorMode;
    setMode: (mode: EditorMode) => void;
}

export const LineContext = createContext<LineContextType | null>(null);

export function useLineContext(): LineContextType {
    const ctx = useContext(LineContext);
    if (!ctx) throw new Error("LineContext must be used inside a provider");
    return ctx;
}

export function buildMaps(ast: objects.LanguageObject[]): {
    nodeMap: Map<string, objects.LanguageObject>;
    parentMap: Map<string, ParentInfoV2>;
} {
    const nodeMap = new Map<string, objects.LanguageObject>();
    const parentMap = new Map<string, ParentInfoV2>();

    function traverse(
        node: objects.LanguageObject | undefined,
        parent: objects.LanguageObject | null = null,
        key = "",
        index = 0
    ) {
        if (!node) return;

        nodeMap.set(node.id, node);

        if (parent) parentMap.set(node.id, { parent, key, index } as ParentInfoV2);

        switch (node.type) {
            case "functionDeclaration": {
                const funcDecl = node as objects.FunctionDeclaration;
                funcDecl.parameterList.forEach((p, i) => traverse(p, funcDecl, "parameterList", i));
                break;
            }
            case "functionDefinition": {
                const funcDecl = node as objects.FunctionDefinition;
                funcDecl.parameterList.forEach((p, i) => traverse(p, funcDecl, "parameterList", i));
                traverse(funcDecl.compoundStatement, node, "compoundStatement", 0);
                break;
            }
            case "compoundStatement": {
                const compStmt = node as objects.CompoundStatement;
                compStmt.codeBlock.forEach((stmt, i) => traverse(stmt, node, "codeBlock", i));
                break;
            }
            case "declaration": {
                const varDecl = node as objects.Declaration;
                if (varDecl.value) traverse(varDecl.value, varDecl, "value", 0);
                break;
            }
            case "returnStatement": {
                const returnStmt = node as objects.ReturnStatement;
                if (returnStmt.value) traverse(returnStmt.value, returnStmt, "value", 0);
                break;
            }
            case "callExpression": {
                const callExpr = node as objects.CallExpression;
                // traverse(callExpr.callee, callExpr, "calle", 0);
                callExpr.argumentList.forEach((arg, i) => traverse(arg, callExpr, "argumentList", i));
                break;
            }
            case "assignmentExpression": {
                const assignmentExpr = node as objects.AssignmentExpression;
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
