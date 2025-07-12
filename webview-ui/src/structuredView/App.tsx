import { useState } from 'react'
import { Line } from './components/line'
import { AnyNode } from './node'

export default function App() {
  const [nodes, setNodes] = useState<AnyNode[]>([])

  window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data
    setNodes(message.contents)
  })

  return (
    <div>
      {nodes.map((node, index) => (
        <Line key={index} node={node} indent={ 0 }/>
      ))}
    </div>
  )
}