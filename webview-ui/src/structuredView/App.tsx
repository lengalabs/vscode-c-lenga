import { useState, useEffect } from 'react'
import { Line } from './components/line'
import { vscode } from '../vscode'
import * as nodes from '../../../src/nodes/cNodes';

export default function App() {
  const [ast, setAst] = useState<Array<nodes.Node>>([])

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

  const handleEdit = (edit: nodes.Node) => {
    const message = {type: 'nodeEdit', contents: edit}
    console.log("sending message: ", message);
    vscode.postMessage(message)
  }

  return (
    <div>
      {ast.map(node => (
        <Line key={node.id} node={node} indent={0} onEdit={handleEdit} />
      ))}
    </div>
  )
}