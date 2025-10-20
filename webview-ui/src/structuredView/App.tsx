import { useState, useEffect } from 'react'
import { NodeRender, Object, ModeIndicator } from './components/line'
import { childInfo } from './components/childInfo';
import { LineProvider } from './components/lineContext'
import { vscode } from '../vscode'
import * as objects from '../../../src/language_objects/cNodes';
import { DebugProvider } from './components/debugContext';
import { ParentInfoV2 } from './components/context';

export default function App() {
  const [sourceFile, setSourceFile] = useState<objects.SourceFile | undefined>(undefined)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [parentNodeInfo, setParentNodeInfo] = useState<ParentInfoV2 | null>(null);
  const [availableInserts, setAvailableInserts] = useState<objects.LanguageObject[] | null>(null);
  const [debug, setDebug] = useState<boolean>(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("event:", event)
      const message = event.data;
      console.log("message:", message)
      
      if (message.type === 'update') {
        setSourceFile(message.contents)
      } else if (message.type === 'availableInserts') {
        setAvailableInserts(message.contents)
      } else if (message.type === 'toggleDebug') {
        console.log('Toggling debug mode');
        setDebug((prev) => !prev)
      }
    }

    window.addEventListener('message', handleMessage)

    vscode.postMessage({ type: 'ready' });

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const onEdit = <T extends objects.LanguageObject, K extends string & keyof T>(node: T, key: K | null) => {
    const message = { type: 'nodeEdit', contents: node, key: key }
    // Force re-render by creating a new reference to sourceFile
    setSourceFile((prev) => prev ? { ...prev } : prev);
    console.log("sending message: ", message);
    vscode.postMessage(message)
  }

  const onRequestAvailableInserts = (nodeId: string, nodeKey: string) => {
    const message = { type: 'requestAvailableInserts', nodeId, nodeKey }
    console.log("requesting available inserts: ", message);
    vscode.postMessage(message)
  }

  return (
    <>
      <DebugProvider debug={debug}>
        {
          sourceFile ? <LineProvider
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
            <ModeIndicator />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {sourceFile?.code.map((node, i) => (
                <Object key={node.id} node={node}>
                  <NodeRender node={node} parentInfo={childInfo(sourceFile, "code", i)} />
                </Object>
              ))}
            </div>
          </LineProvider> : <p>loading...</p>
        }
        {debug && <div>
          <h1>Debug Info</h1>
          <p>selectedNodeId: {selectedNodeId}</p>
          <p>selectedKey: {selectedKey}</p>
          <p>parentNodeId: {parentNodeInfo?.parent.id}</p>
          <p>parentKey: {parentNodeInfo?.key}</p>
          <p>parentIndex: {parentNodeInfo?.index}</p>
        </div>}
      </DebugProvider>
    </>
  )
} 