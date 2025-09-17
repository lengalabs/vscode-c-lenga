import { useState, useEffect } from 'react'
import { NodeRender } from './components/line'
import { LineProvider } from './components/lineContext'
import { vscode } from '../vscode'
import * as nodes from '../../../src/nodes/cNodes';

export default function App() {
  const [ast, setAst] = useState<nodes.Node[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [insertTargetId, setInsertTargetId] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      setAst(message.contents)
    }

    window.addEventListener('message', handleMessage)

    vscode.postMessage({type: 'ready'});

    return () => {
      window.removeEventListener('message', handleMessage)
    }    
  }, [])

  const onEdit = (edit: nodes.Node) => {
    const message = {type: 'nodeEdit', contents: edit}
    setAst((prev) => [...prev]); //Placeholder
    console.log("sending message: ", message);
    //vscode.postMessage(message)
  }

  return (
    <LineProvider ast={ast} onEdit={onEdit} selectedNodeId={selectedNodeId} setSelectedNodeId={setSelectedNodeId} insertTargetId={insertTargetId} setInsertTargetId={setInsertTargetId}>
      <div>
        {ast.map(node => (
          <NodeRender key={node.id} node={node} indent={0} />
        ))}
      </div>
    </LineProvider>
  )
}