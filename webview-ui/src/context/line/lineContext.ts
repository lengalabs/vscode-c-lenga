import { createContext, useContext } from "react";
import * as objects from "../../../../src/language_objects/cNodes";
import { FocusRequest } from "./LineProvider";
import { NodeNavigationCallbacks } from "../../lib/keyBinds";

// Type-safe parent info with generics and defaults
export type ParentInfo<
  T extends objects.LanguageObject = objects.LanguageObject,
  K extends string & keyof T = string & keyof T,
> = {
  parent: T;
  key: K;
  index: number;
};

type EditorMode = "view" | "edit";

export const EditorMode = {
  View: "view" as const,
  Edit: "edit" as const,
};
export type EditorModeType = (typeof EditorMode)[keyof typeof EditorMode];

export interface NodeCallbacks extends NodeEditCallbacks, NodeNavigationCallbacks {}

export interface NodeEditCallbacks {
  // Insertion
  onInsertSibling?: (node: objects.LanguageObject) => void;
  onInsertSiblingBefore?: (node: objects.LanguageObject) => void;
  onDelete?: (node: objects.LanguageObject) => void;
  onReplace?: (oldNode: objects.LanguageObject, newNode: objects.LanguageObject) => void;
  // Edit mode: insert at beginning or end of array
  onInsertChildFirst?: () => void;
  onInsertChildLast?: () => void;
  // Movement
  onMoveUp?: (node: objects.LanguageObject) => void;
  onMoveDown?: (node: objects.LanguageObject) => void;
  onMoveIntoNextSiblingsFirstChild?: (node: objects.LanguageObject) => void;
  onMoveIntoPreviousSiblingsLastChild?: (node: objects.LanguageObject) => void;
}

export interface LineContextType {
  onEdit: <T extends objects.LanguageObject, K extends string & keyof T>(
    node: T,
    key: K | null
  ) => void;
  onRequestAvailableInserts: (nodeId: string, nodeKey: string) => void;
  availableInserts: objects.LanguageObject[] | null;
  selectedNodeId: string | null;
  selectedKey: string | null;
  parentNodeInfo: ParentInfo | null;
  setParentNodeInfo: (info: ParentInfo | null) => void;
  setSelectedNodeId: (id: string) => void;
  setSelectedKey: (key: string) => void;
  nodeMap: Map<string, objects.LanguageObject>;
  parentMap: Map<string, ParentInfo>;
  focusRequest: FocusRequest | null;
  requestFocus: (props: FocusRequest) => void;
  clearFocusRequest: () => void;
  mode: EditorModeType;
  setMode: (mode: EditorModeType) => void;
}

export const LineContext = createContext<LineContextType | null>(null);

export function useLineContext(): LineContextType {
  const ctx = useContext(LineContext);
  if (!ctx) {
    throw new Error("LineContext must be used inside a provider");
  }
  return ctx;
}

export function buildMaps(ast: objects.SourceFile): {
  nodeMap: Map<string, objects.LanguageObject>;
  parentMap: Map<string, ParentInfo>;
} {
  const nodeMap = new Map<string, objects.LanguageObject>();
  const parentMap = new Map<string, ParentInfo>();

  function traverse(
    node: objects.LanguageObject | undefined,
    parent: objects.LanguageObject | null = null,
    key = "",
    index = 0
  ) {
    if (!node) {
      return;
    }

    nodeMap.set(node.id, node);

    if (parent) {
      parentMap.set(node.id, { parent, key, index } as ParentInfo);
    }

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
        if (varDecl.value) {
          traverse(varDecl.value, varDecl, "value", 0);
        }
        break;
      }
      case "returnStatement": {
        const returnStmt = node as objects.ReturnStatement;
        if (returnStmt.value) {
          traverse(returnStmt.value, returnStmt, "value", 0);
        }
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
      case "ifStatement": {
        const ifStmt = node as objects.IfStatement;
        traverse(ifStmt.condition, ifStmt, "condition", 0);
        traverse(ifStmt.body, ifStmt, "body", 0);
        if (ifStmt.elseStatement) {
          traverse(ifStmt.elseStatement, ifStmt, "elseStatement", 0);
        }
        break;
      }
      case "elseClause": {
        const elseClause = node as objects.ElseClause;
        traverse(elseClause.body, elseClause, "body", 0);
        break;
      }
      case "sourceFile": {
        const sourceFile = node as objects.SourceFile;
        sourceFile.code.forEach((stmt, i) => traverse(stmt, sourceFile, "code", i));
        break;
      }
      case "binaryExpression": {
        const binaryExpr = node as objects.BinaryExpression;
        traverse(binaryExpr.left, binaryExpr, "left", 0);
        traverse(binaryExpr.right, binaryExpr, "right", 0);
        break;
      }
      case "preprocInclude":
      case "comment":
      case "functionParameter":
      case "numberLiteral":
      case "reference":
      case "stringLiteral":
      case "unknown":
        break; // leaf nodes
    }
  }

  traverse(ast);
  return { nodeMap, parentMap };
}

export function parentInfoFromChild<T extends objects.LanguageObject, K extends string & keyof T>(
  parent: T,
  key: K,
  index: number = 0
): ParentInfo {
  return { parent, key, index } as unknown as ParentInfo;
}
