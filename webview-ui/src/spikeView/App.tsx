import { useState } from 'react'
import { vscode } from '../vscode'

export default function App() {
  const [content, setContent] = useState<string>('')

  window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data
    setContent(message.content)
  })

  function onEditClick() {
    vscode.postMessage({ type: 'edit', data: 'Good Bye' })
  }

  return (
    <div>
      <button onClick={onEditClick}>Edit</button>
      <div>{content}</div>
    </div>
  )
}