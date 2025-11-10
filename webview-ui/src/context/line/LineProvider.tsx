import { useMemo, useState, useCallback, useEffect } from "react";
import * as objects from "../../../../src/language_objects/cNodes";
import { buildMaps, LineContext, ParentInfo, EditorMode, EditorModeType } from "./lineContext";

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
  parentNodeInfo: ParentInfo | null;
  setSelectedNodeId: (id: string) => void;
  setSelectedKey: (key: string) => void;
  setParentNodeInfo: (info: ParentInfo | null) => void;
  children: React.ReactNode;
}

export interface FocusRequest {
  nodeId: string;
  fieldKey?: string;
}

export default function LineProvider({
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
  const { nodeMap, parentMap } = useMemo(() => buildMaps(sourceFile), [sourceFile]);

  // Focus request state - when set, the matching field will focus itself
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  // Mode state - default to 'view' mode
  const [mode, setMode] = useState<EditorModeType>(EditorMode.View);

  const requestFocus = useCallback((req: FocusRequest) => {
    setFocusRequest(req);
  }, []);

  const clearFocusRequest = useCallback(() => {
    setFocusRequest(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === " " && mode === EditorMode.View) {
        event.preventDefault();
        setMode(EditorMode.Edit);
        if (selectedNodeId && selectedKey) {
          setFocusRequest({ nodeId: selectedNodeId, fieldKey: selectedKey });
        }
        return;
      }

      if (event.key === "Escape" || (event.key === " " && mode === EditorMode.Edit)) {
        event.preventDefault();
        event.stopPropagation();
        setMode(EditorMode.View);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mode, selectedKey, selectedNodeId, setMode]);

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
