import { useState, useEffect } from 'react'
import { vscode } from '../vscode'
import * as nodes from '../../../rpc/generated/c/objects';

export default function App() {
  const [content, setContent] = useState<nodes.LanguageObject>()

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      setContent(message.contents)
    };

    window.addEventListener('message', handleMessage);

    vscode.postMessage({ type: 'ready' });

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
      <pre>{JSON.stringify(content, null, 2)}</pre>
    </div>
  )
}