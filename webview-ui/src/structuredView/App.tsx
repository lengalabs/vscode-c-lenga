import { useState, useEffect, useRef } from "react";
import { SourceFileRender } from "../components/line";
import ModeIndicator from "../components/ModeIndicator";
import KeyboardVisualization from "../components/KeyboardVisualization";

import { vscode } from "../vscode";
import * as objects from "../../../src/language_objects/cNodes";
import { ParentInfo, useLineContext } from "../context/line/lineContext";
import DebugMenu from "../components/DebugMenu";
import DebugProvider from "../context/debug/DebugProvider";
import LineProvider from "../context/line/LineProvider";

const default_theme = "dark";

// Component that handles initial focus request
function InitialFocusHandler({
  sourceFile,
  firstElementCreatorRef: emptyFileRef,
}: {
  sourceFile: objects.SourceFile;
  firstElementCreatorRef: React.RefObject<HTMLElement>;
}) {
  const { requestFocus } = useLineContext();
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (!hasRequestedRef.current)
      if (sourceFile.code.length === 0) {
        console.log("Requesting initial focus on empty file creator");
        emptyFileRef.current?.focus();
        hasRequestedRef.current = true;
      } else {
        const firstNode = sourceFile.code[0];
        console.log("Requesting initial focus on first node:", firstNode.id);
        requestFocus({ nodeId: firstNode.id });
        hasRequestedRef.current = true;
      }
  }, [sourceFile, requestFocus, emptyFileRef]);

  return null;
}

function normalizeTheme(theme: string): "dark" | "light" {
  return theme === "light" ? "light" : "dark";
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
      } else if (message.type === "theme") {
        document.documentElement.dataset.theme = normalizeTheme(message.contents);
      }
    };

    window.addEventListener("message", handleMessage);

    document.documentElement.dataset.theme = default_theme;

    vscode.postMessage({ type: "ready" });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    console.log("SelectedKey updated:", selectedKey);
  }, [selectedKey]);

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

  const firstElementCreatorRef = useRef<HTMLElement>(null);

  return (
    <div style={{ height: "100%" }}>
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
            setSelectedKey={(key) => {
              console.log("setSelectedKey called with key:", key);
              setSelectedKey(key);
            }}
            setParentNodeInfo={setParentNodeInfo}
          >
            <InitialFocusHandler
              sourceFile={sourceFile}
              firstElementCreatorRef={firstElementCreatorRef as React.RefObject<HTMLElement>}
            />
            <ModeIndicator />
            <KeyboardVisualization />
            <SourceFileRender
              node={sourceFile}
              firstElementCreatorRef={firstElementCreatorRef as React.RefObject<HTMLElement>}
            />
            <DebugMenu />
          </LineProvider>
        ) : (
          <p>loading...</p>
        )}
      </DebugProvider>
    </div>
  );
}
