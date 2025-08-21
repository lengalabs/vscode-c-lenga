import { useState, useEffect } from 'react'
import { vscode } from '../vscode'

export default function App() {
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      setContent(message.contents)
    };

    window.addEventListener('message', handleMessage);

    vscode.postMessage({type: 'ready'});

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

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