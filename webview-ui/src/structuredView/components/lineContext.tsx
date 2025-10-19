import { useMemo } from "react";
import * as nodes from "../../../../src/nodes/cNodes";
import { buildMaps, LineContext } from "./context";

interface LineProviderProps {
  ast: nodes.Node[];
  onEdit: <T extends nodes.Node, K extends string & keyof T>(node: T, key: K | null) => void;
  selectedNodeId: string | null;
  selectedKey: string | null;
  setSelectedNodeId: (id: string) => void;
  setSelectedKey: (key: string) => void;
  insertTargetId: string | null;
  setInsertTargetId: (id: string | null) => void;
  children: React.ReactNode;
}

export function LineProvider({
  ast,
  onEdit,
  selectedNodeId,
  selectedKey,
  setSelectedNodeId,
  setSelectedKey,
  insertTargetId,
  setInsertTargetId,
  children,
}: LineProviderProps) {
  const { nodeMap, parentMap } = useMemo(() => buildMaps(ast), [ast]);

  return (
    <LineContext.Provider value={{ onEdit, selectedNodeId, selectedKey, setSelectedNodeId, setSelectedKey, nodeMap, parentMap, insertTargetId, setInsertTargetId }}>
      {children}
    </LineContext.Provider>
  );
}
