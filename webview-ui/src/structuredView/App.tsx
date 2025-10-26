import { useState, useEffect, useRef } from "react";
import { SourceFileRender } from "../components/line";
import ModeIndicator from "../components/ModeIndicator";
import { LineProvider } from "../components/lineContext";

import { vscode } from "../vscode";
import * as objects from "../../../src/language_objects/cNodes";
import { DebugProvider } from "../components/debugContext";
import { ParentInfo, useLineContext } from "../components/context";
import DebugMenu from "../components/DebugMenu";
import { getFirstEditableField } from "../lib/editionHelpers";

// Component that handles initial focus request
function InitialFocusHandler({ sourceFile }: { sourceFile: objects.SourceFile }) {
  const { requestFocus } = useLineContext();
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (!hasRequestedRef.current && sourceFile.code.length > 0) {
      const firstNode = sourceFile.code[0];
      const firstField = getFirstEditableField(firstNode);
      if (firstField !== null) {
        console.log("Requesting initial focus on first node:", firstNode.id, "field:", firstField);
        requestFocus(firstNode.id, firstField);
        hasRequestedRef.current = true;
      }
    }
  }, [sourceFile, requestFocus]);

  return null;
}

export default function App() {
  const [sourceFile, setSourceFile] = useState<objects.SourceFile | undefined>(undefined);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [parentNodeInfo, setParentNodeInfo] = useState<ParentInfo | null>(null);
  const [availableInserts, setAvailableInserts] = useState<objects.LanguageObject[] | null>(null);
  const [debug, setDebug] = useState<boolean>(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("event:", event);
      const message = event.data;
      console.log("message:", message);

      if (message.type === "update") {
        setSourceFile(message.contents);
      } else if (message.type === "availableInserts") {
        setAvailableInserts(message.contents);
      } else if (message.type === "toggleDebug") {
        console.log("Toggling debug mode");
        setDebug((prev) => !prev);
      }
    };

    window.addEventListener("message", handleMessage);

    vscode.postMessage({ type: "ready" });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const onEdit = <T extends objects.LanguageObject, K extends string & keyof T>(
    node: T,
    key: K | null
  ) => {
    const message = { type: "nodeEdit", contents: node, key: key };
    // Force re-render by creating a new reference to sourceFile
    setSourceFile((prev) => (prev ? { ...prev } : prev));
    console.log("sending message: ", message);
    vscode.postMessage(message);
  };

  const onRequestAvailableInserts = (nodeId: string, nodeKey: string) => {
    const message = { type: "requestAvailableInserts", nodeId, nodeKey };
    console.log("requesting available inserts: ", message);
    vscode.postMessage(message);
  };

  return (
    <>
      <DebugProvider debug={debug}>
        {sourceFile ? (
          <LineProvider
            sourceFile={sourceFile}
            onEdit={onEdit}
            onRequestAvailableInserts={onRequestAvailableInserts}
            availableInserts={availableInserts}
            selectedNodeId={selectedNodeId}
            selectedKey={selectedKey}
            parentNodeInfo={parentNodeInfo}
            setSelectedNodeId={setSelectedNodeId}
            setSelectedKey={setSelectedKey}
            setParentNodeInfo={setParentNodeInfo}
          >
            <InitialFocusHandler sourceFile={sourceFile} />
            <ModeIndicator />
            <SourceFileRender node={sourceFile} />
            <DebugMenu />
          </LineProvider>
        ) : (
          <p>loading...</p>
        )}
      </DebugProvider>
    </>
  );
}
