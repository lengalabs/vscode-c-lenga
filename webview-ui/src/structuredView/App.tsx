import { useState, useEffect } from 'react'
import { Line } from './components/line'
import { vscode } from '../vscode'
import * as nodes from '../../../rpc/generated/nodes';

export default function App() {
  const [ast, setAst] = useState<nodes.Node>({node: undefined})

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


  return (
    <div>
        <Line key={0} node={ast} indent={0}/>
    </div>
  )
}