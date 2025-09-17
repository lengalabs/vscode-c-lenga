import { createContext, useContext, useMemo } from "react";
import * as nodes from "../../../../src/nodes/cNodes";

export interface ParentInfo {
  parent: nodes.Node | null;
  key: string;
  index: number;
}

export interface LineContextType {
  onEdit: (node: nodes.Node) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string) => void;
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
      case "FuncDecl": {
        const funcDecl = node as nodes.FuncDecl;
        funcDecl.params.forEach((p, i) => traverse(p, funcDecl, "params", i));
        if (funcDecl.body) traverse(funcDecl.body, node, "body", 0);
        break;
      }
      case "CompStmt": {
        const compStmt = node as nodes.CompStmt;
        compStmt.statements.forEach((stmt, i) => traverse(stmt, node, "statements", i));
        break;
      }
      case "VarDecl": {
        const varDecl = node as nodes.VarDecl;
        if (varDecl.initializer) traverse(varDecl.initializer, varDecl, "initializer", 0);
        break;
      }
      case "ReturnStmt": {
        const returnStmt = node as nodes.ReturnStmt;
        if (returnStmt.expression) traverse(returnStmt.expression, returnStmt, "expression", 0);
        break;
      }
      case "CallExpr": {
        const callExpr = node as nodes.CallExpr;
        traverse(callExpr.calle, callExpr, "calle", 0);
        callExpr.args.forEach((arg, i) => traverse(arg, callExpr, "args", i));
        break;
      }
      case "AssignmentExpr": {
        const assignmentExpr = node as nodes.AssignmentExpr;
        traverse(assignmentExpr.left, node, "left", 0);
        traverse(assignmentExpr.right, node, "right", 0);
        break;
      }
      default:
        break; // leaf nodes
    }
  }

  ast.forEach(node => traverse(node));
  return { nodeMap, parentMap };
}

interface LineProviderProps {
  ast: nodes.Node[];
  onEdit: (node: nodes.Node) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string) => void;
  insertTargetId: string | null;
  setInsertTargetId: (id: string | null) => void;
  children: React.ReactNode;
}

export function LineProvider({
  ast,
  onEdit,
  selectedNodeId,
  setSelectedNodeId,
  insertTargetId,
  setInsertTargetId,
  children,
}: LineProviderProps) {
  const { nodeMap, parentMap } = useMemo(() => buildMaps(ast), [ast]);

  return (
    <LineContext.Provider value={{ onEdit, selectedNodeId, setSelectedNodeId, nodeMap, parentMap, insertTargetId, setInsertTargetId }}>
      {children}
    </LineContext.Provider>
  );
}
