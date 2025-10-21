import { useMemo, useState, useCallback } from "react";
import * as objects from "../../../src/language_objects/cNodes";
import { buildMaps, LineContext, ParentInfoV2, EditorMode } from "./context";

interface LineProviderProps {
  sourceFile: objects.SourceFile;
  onEdit: <T extends objects.LanguageObject, K extends string & keyof T>(
    node: T,
    key: K | null
  ) => void;
  onRequestAvailableInserts: (nodeId: string, nodeKey: string) => void;
  availableInserts: objects.LanguageObject[] | null;
  selectedNodeId: string | null;
  selectedKey: string | null;
  parentNodeInfo: ParentInfoV2 | null;
  setSelectedNodeId: (id: string) => void;
  setSelectedKey: (key: string) => void;
  setParentNodeInfo: (info: ParentInfoV2 | null) => void;
  children: React.ReactNode;
}

export function LineProvider({
  sourceFile,
  onEdit,
  onRequestAvailableInserts,
  availableInserts,
  selectedNodeId,
  selectedKey,
  parentNodeInfo,
  setSelectedNodeId,
  setSelectedKey,
  setParentNodeInfo,
  children,
}: LineProviderProps) {
  const { nodeMap, parentMap } = useMemo(() => buildMaps(sourceFile.code), [sourceFile]);

  // Focus request state - when set, the matching field will focus itself
  const [focusRequest, setFocusRequest] = useState<{ nodeId: string; fieldKey: string } | null>(
    null
  );

  // Mode state - default to 'view' mode
  const [mode, setMode] = useState<EditorMode>("view");

  const requestFocus = useCallback((nodeId: string, fieldKey: string) => {
    setFocusRequest({ nodeId, fieldKey });
  }, []);

  const clearFocusRequest = useCallback(() => {
    setFocusRequest(null);
  }, []);

  return (
    <LineContext.Provider
      value={{
        onEdit,
        onRequestAvailableInserts,
        availableInserts,
        selectedNodeId,
        selectedKey,
        parentNodeInfo,
        setParentNodeInfo,
        setSelectedNodeId,
        setSelectedKey,
        nodeMap,
        parentMap,
        focusRequest,
        requestFocus,
        clearFocusRequest,
        mode,
        setMode,
      }}
    >
      {children}
    </LineContext.Provider>
  );
}
