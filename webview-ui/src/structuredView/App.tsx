import { useState, useEffect } from 'react'
import { Line } from './components/line'
import { AnyNode } from './node'
import { vscode } from '../vscode'

export default function App() {
  const [nodes, setNodes] = useState<AnyNode[]>([])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log("typeof contents:", typeof message.contents);
      console.log("contents value:", message.contents);

      try {
        const parsed = typeof message.contents === 'string' ? JSON.parse(message.contents): message.contents
        setNodes(Array.isArray(parsed)? parsed: [])
      } catch (e) {
        console.error("Failed to parse message.contents:", e);
        setNodes([])
      }
    }

    window.addEventListener('message', handleMessage)

    vscode.postMessage({type: 'ready'});


    return () => {
      window.removeEventListener('message', handleMessage)
    }    
  }, [])


  return (
    <div>
      {nodes.map((node, index) => (
        <Line key={index} node={node} indent={0}/>
      ))}
    </div>
  )
}